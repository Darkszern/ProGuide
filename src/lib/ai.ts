import { supabase } from './supabase'
import { isSupabaseConfigured } from './supabase'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AskAIOptions {
  /** Erwarte eine JSON-Antwort (Edge Function setzt response_format). */
  json?: boolean
  /** Maximale Tokens der Antwort. */
  maxTokens?: number
  /** Temperatur (Kreativitaet). */
  temperature?: number
}

export interface AIResult {
  text: string
  provider: 'anthropic' | 'groq' | 'gemini' | 'demo'
  model: string
}

/**
 * Zentrale KI-Funktion. Sendet die Anfrage an die serverseitige
 * Supabase Edge Function "ai", die zuerst Groq und bei Fehler/Limit
 * automatisch Gemini nutzt. API-Keys liegen ausschliesslich serverseitig.
 */
export async function askAI(
  messages: AIMessage[],
  options: AskAIOptions = {},
): Promise<AIResult> {
  if (!isSupabaseConfigured) {
    return {
      text:
        'Demo-Modus: Es ist noch kein Backend verbunden. Sobald Supabase und die ' +
        'KI-Keys konfiguriert sind, antwortet hier die echte KI (Groq mit Gemini-Fallback).',
      provider: 'demo',
      model: 'demo',
    }
  }

  const { data, error } = await supabase.functions.invoke('ai', {
    body: {
      messages,
      json: options.json ?? false,
      maxTokens: options.maxTokens ?? 1024,
      temperature: options.temperature ?? 0.4,
    },
  })

  if (error) {
    throw new Error(`KI-Anfrage fehlgeschlagen: ${error.message}`)
  }

  return data as AIResult
}

/** Bequemer Helfer fuer eine einfache Frage mit System-Kontext. */
export async function askAISimple(
  system: string,
  user: string,
  options?: AskAIOptions,
): Promise<AIResult> {
  return askAI(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    options,
  )
}
