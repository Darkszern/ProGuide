import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Spinner } from '@/components/ui/Spinner'
import { AuthShell } from './Login'

export function Register() {
  const { signUp, session, configured } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!configured || session) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error, session: newSession } = await signUp(email, password, displayName)
    setLoading(false)
    if (error) setError(error)
    else if (newSession) navigate('/dashboard') // Bestaetigung deaktiviert -> direkt eingeloggt
    else setDone(true) // Bestaetigung aktiv -> E-Mail-Hinweis zeigen
  }

  if (done) {
    return (
      <AuthShell>
        <h1 className="text-2xl font-bold text-ink">Fast geschafft!</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Wir haben dir eine Bestaetigungs-E-Mail geschickt. Bestaetige deine Adresse und melde dich
          anschliessend an.
        </p>
        <Link to="/login" className="btn-primary mt-6 w-full">
          Zur Anmeldung
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold text-ink">Konto erstellen</h1>
      <p className="mt-1 text-sm text-ink-muted">Starte deine erste Projektarbeit.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="name">Anzeigename</label>
          <input
            id="name"
            type="text"
            required
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Max Muster"
          />
        </div>
        <div>
          <label className="label" htmlFor="email">E-Mail</label>
          <input
            id="email"
            type="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@schule.ch"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">Passwort</label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mindestens 6 Zeichen"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Registrieren'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Schon ein Konto?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Anmelden
        </Link>
      </p>
    </AuthShell>
  )
}
