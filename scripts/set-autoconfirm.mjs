// Schaltet die E-Mail-Bestaetigung aus (mailer_autoconfirm = true).
const token = process.env.SUPABASE_ACCESS_TOKEN
const ref = process.env.PROJECT_REF || 'rynnrvkgoldxqjqaovuf'
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
  body: JSON.stringify({ mailer_autoconfirm: true }),
})
console.log('HTTP', res.status)
const c = await res.json()
console.log('mailer_autoconfirm jetzt:', c.mailer_autoconfirm)
