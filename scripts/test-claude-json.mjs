// Testet JSON-Erzeugung (wie in der Edge Function): System-Anweisung + User,
// Antwort endet beim User, JSON wird robust extrahiert.
const key = process.env.ANTHROPIC_KEY
const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'
const system =
  'Du bist eine Lehrperson und erstellst IPERKA-Checklisten. ' +
  'Antworte ausschliesslich mit einem einzigen gueltigen JSON-Objekt, ohne Markdown-Codefences und ohne weiteren Text.'
const user =
  'Thema: Solaranlage fuers Schuldach. Erstelle fuer jede der 6 IPERKA-Phasen 3 konkrete Checklisten-Aufgaben. ' +
  'Format genau: {"informieren":["..."],"planen":["..."],"entscheiden":["..."],"realisieren":["..."],"kontrollieren":["..."],"auswerten":["..."]}'

const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
  body: JSON.stringify({
    model,
    max_tokens: 1200,
    temperature: 0.5,
    system,
    messages: [{ role: 'user', content: user }],
  }),
})

console.log('HTTP', res.status)
const raw = await res.text()
if (!res.ok) {
  console.log('FEHLER-BODY:', raw)
  process.exit(1)
}
const data = JSON.parse(raw)
let text = (data.content ?? []).map((c) => c.text ?? '').join('')
const first = text.indexOf('{')
const last = text.lastIndexOf('}')
if (first !== -1 && last > first) text = text.slice(first, last + 1)
try {
  const obj = JSON.parse(text)
  console.log('✓ JSON gueltig. Phasen:', Object.keys(obj).join(', '))
  console.log('Beispiel "informieren":', JSON.stringify(obj.informieren))
} catch (e) {
  console.log('✗ JSON-Parse fehlgeschlagen:', e.message)
  console.log(text.slice(0, 400))
}
