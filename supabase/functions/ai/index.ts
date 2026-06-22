// Supabase Edge Function: "ai"
// Serverseitiger KI-Proxy. Ruft zuerst Groq auf und fällt bei Fehler oder
// Limit (HTTP 429/5xx) automatisch auf Google Gemini zurück.
// API-Keys liegen ausschliesslich hier als Function Secrets – nie im Frontend.
//
// Deno-Runtime. Lokal testen:  supabase functions serve ai
// Deploy:                      supabase functions deploy ai
// Secrets setzen:              supabase secrets set GROQ_API_KEY=... GEMINI_API_KEY=...

// Deno.serve ist in der Supabase Edge Runtime eingebaut – kein Import noetig.

interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface RequestBody {
  messages: AIMessage[]
  json?: boolean
  maxTokens?: number
  temperature?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env = (globalThis as any).Deno?.env

const ANTHROPIC_API_KEY = env?.get('ANTHROPIC_API_KEY') ?? ''
const GROQ_API_KEY = env?.get('GROQ_API_KEY') ?? ''
const GEMINI_API_KEY = env?.get('GEMINI_API_KEY') ?? ''
const ANTHROPIC_MODEL = env?.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-4-6'
const GROQ_MODEL = env?.get('GROQ_MODEL') ?? 'llama-3.3-70b-versatile'
const GEMINI_MODEL = env?.get('GEMINI_MODEL') ?? 'gemini-2.0-flash'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ---- Anthropic / Claude ----------------------------------------------------
async function callClaude(body: RequestBody): Promise<string> {
  const systemText = body.messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n')

  const messages = body.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }))

  // Hinweis: Claude-4-Modelle unterstützen kein Assistant-Prefill. JSON wird
  // über die System-Anweisung angefordert und unten robust extrahiert.
  const system = body.json
    ? `${systemText}\n\nWichtig: Antworte ausschliesslich mit einem einzigen gültigen JSON-Objekt, ohne Markdown-Codefences und ohne weiteren Text.`
    : systemText

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: body.maxTokens ?? 1024,
      temperature: body.temperature ?? 0.4,
      ...(system ? { system } : {}),
      messages,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    const err = new Error(`Anthropic ${res.status}: ${text}`)
    ;(err as Error & { retryable?: boolean }).retryable = res.status === 429 || res.status >= 500
    throw err
  }

  const data = await res.json()
  let text: string =
    (data.content ?? [])
      .map((c: { text?: string }) => c.text ?? '')
      .join('') ?? ''
  // Bei JSON-Modus das JSON-Objekt robust extrahieren (entfernt evtl.
  // Codefences oder umgebenden Text).
  if (body.json) {
    const first = text.indexOf('{')
    const last = text.lastIndexOf('}')
    if (first !== -1 && last > first) text = text.slice(first, last + 1)
  }
  return text
}

// ---- Groq (OpenAI-kompatibel) ---------------------------------------------
async function callGroq(body: RequestBody): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: body.messages,
      temperature: body.temperature ?? 0.4,
      max_tokens: body.maxTokens ?? 1024,
      ...(body.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    const err = new Error(`Groq ${res.status}: ${text}`)
    // Markiere wiederholbare Fehler für den Fallback.
    ;(err as Error & { retryable?: boolean }).retryable =
      res.status === 429 || res.status >= 500
    throw err
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

// ---- Gemini ----------------------------------------------------------------
async function callGemini(body: RequestBody): Promise<string> {
  const systemText = body.messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n')

  const contents = body.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent` +
    `?key=${GEMINI_API_KEY}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(systemText ? { systemInstruction: { parts: [{ text: systemText }] } } : {}),
      contents,
      generationConfig: {
        temperature: body.temperature ?? 0.4,
        maxOutputTokens: body.maxTokens ?? 1024,
        ...(body.json ? { responseMimeType: 'application/json' } : {}),
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gemini ${res.status}: ${text}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

// ---- Handler ---------------------------------------------------------------
// @ts-ignore - Deno global nur zur Laufzeit in der Edge Runtime
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Ungültiger JSON-Body' }, 400)
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return json({ error: 'messages ist erforderlich' }, 400)
  }

  // 1) Anthropic / Claude versuchen (primaer)
  if (ANTHROPIC_API_KEY) {
    try {
      const text = await callClaude(body)
      return json({ text, provider: 'anthropic', model: ANTHROPIC_MODEL })
    } catch (err) {
      console.error('Anthropic fehlgeschlagen:', (err as Error).message)
    }
  }

  // 2) Groq versuchen
  if (GROQ_API_KEY) {
    try {
      const text = await callGroq(body)
      return json({ text, provider: 'groq', model: GROQ_MODEL })
    } catch (err) {
      console.error('Groq fehlgeschlagen:', (err as Error).message)
      // Bei nicht-wiederholbaren Fehlern trotzdem Gemini versuchen.
    }
  }

  // 3) Fallback auf Gemini
  if (GEMINI_API_KEY) {
    try {
      const text = await callGemini(body)
      return json({ text, provider: 'gemini', model: GEMINI_MODEL })
    } catch (err) {
      console.error('Gemini fehlgeschlagen:', (err as Error).message)
      return json({ error: 'Beide KI-Anbieter sind aktuell nicht erreichbar.' }, 502)
    }
  }

  return json(
    { error: 'Keine KI-Keys konfiguriert (ANTHROPIC_API_KEY / GROQ_API_KEY / GEMINI_API_KEY).' },
    500,
  )
})
