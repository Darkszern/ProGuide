// Testet die deployte Edge Function "ai" end-to-end.
// Holt den anon-JWT (gueltig fuer verify_jwt) ueber die Management-API und
// ruft die Funktion auf.  Aufruf: $env:SUPABASE_ACCESS_TOKEN=...; node scripts/test-function.mjs
const token = process.env.SUPABASE_ACCESS_TOKEN
const ref = process.env.PROJECT_REF || 'rynnrvkgoldxqjqaovuf'

const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys?reveal=true`, {
  headers: { Authorization: `Bearer ${token}` },
})
console.log('api-keys HTTP', r.status)
const keys = await r.json()
const anon = Array.isArray(keys) ? keys.find((k) => k.name === 'anon')?.api_key : null
if (!anon) {
  console.log('Kein anon-JWT gefunden:', JSON.stringify(keys).slice(0, 300))
  process.exit(1)
}

const f = await fetch(`https://${ref}.supabase.co/functions/v1/ai`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${anon}`, apikey: anon, 'content-type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Antworte in genau einem kurzen Satz: Was ist die IPERKA-Methode?' }],
    maxTokens: 150,
  }),
})
console.log('function HTTP', f.status)
console.log(await f.text())
