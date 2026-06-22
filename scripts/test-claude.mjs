// Testet einen Anthropic/Claude-API-Key direkt.
// Aufruf:  $env:ANTHROPIC_KEY="..."; node scripts/test-claude.mjs
const key = process.env.ANTHROPIC_KEY
const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'
if (!key) {
  console.error('ANTHROPIC_KEY fehlt')
  process.exit(1)
}
try {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 64,
      messages: [{ role: 'user', content: 'Antworte mit genau einem Wort: Hallo' }],
    }),
  })
  console.log('HTTP', res.status)
  console.log((await res.text()).slice(0, 700))
} catch (e) {
  console.log('NETZWERKFEHLER:', e.message)
}
