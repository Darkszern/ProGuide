// Testet einen Gemini-API-Key direkt gegen die Google-API.
// Aufruf:  $env:GEMINI_KEY="..."; node scripts/test-gemini.mjs
const key = process.env.GEMINI_KEY
const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
const base = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
const body = JSON.stringify({ contents: [{ parts: [{ text: 'Antworte mit genau einem Wort: Hallo' }] }] })

if (!key) {
  console.error('GEMINI_KEY fehlt')
  process.exit(1)
}

async function tryReq(label, url, headers) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body,
    })
    const t = await res.text()
    console.log(`\n[${label}] HTTP ${res.status}`)
    console.log(t.slice(0, 600))
    return res.ok
  } catch (e) {
    console.log(`\n[${label}] NETZWERKFEHLER: ${e.message}`)
    return false
  }
}

const okQuery = await tryReq('?key=', `${base}?key=${encodeURIComponent(key)}`, {})
if (!okQuery) {
  await tryReq('Bearer', base, { Authorization: `Bearer ${key}` })
}
