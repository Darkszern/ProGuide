// Liest die Auth-Konfiguration des Supabase-Projekts (Diagnose).
const token = process.env.SUPABASE_ACCESS_TOKEN
const ref = process.env.PROJECT_REF || 'rynnrvkgoldxqjqaovuf'
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  headers: { Authorization: `Bearer ${token}` },
})
console.log('HTTP', res.status)
const c = await res.json()
console.log(
  JSON.stringify(
    {
      mailer_autoconfirm: c.mailer_autoconfirm,
      external_email_enabled: c.external_email_enabled,
      disable_signup: c.disable_signup,
    },
    null,
    2,
  ),
)
