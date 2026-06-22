import { useState, type FormEvent } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Compass, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Spinner } from '@/components/ui/Spinner'

export function Login() {
  const { signIn, session, configured } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Im Demo-Modus oder wenn schon eingeloggt: direkt ins Dashboard.
  if (!configured || session) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) setError(error)
    else navigate('/dashboard')
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold text-ink">Willkommen zurück</h1>
      <p className="mt-1 text-sm text-ink-muted">Melde dich an, um deine Projekte zu sehen.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Anmelden'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Noch kein Konto?{' '}
        <Link to="/registrieren" className="font-medium text-brand-600 hover:underline">
          Jetzt registrieren
        </Link>
      </p>
    </AuthShell>
  )
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Markenpanel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-gradient p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Compass className="h-6 w-6" />
          </span>
          <span className="text-xl font-bold">ProGuide</span>
        </div>
        <div>
          <h2 className="max-w-md text-3xl font-bold leading-tight">
            Von der ersten Idee bis zur Abgabe – Schritt für Schritt.
          </h2>
          <p className="mt-4 max-w-md text-white/80">
            Strukturiert nach der IPERKA-Methode. Mit KI-Unterstützung, Zeitplan und Team-Funktionen.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {['Informieren', 'Planen', 'Entscheiden', 'Realisieren', 'Kontrollieren', 'Auswerten'].map(
              (p) => (
                <span key={p} className="rounded-full bg-white/15 px-3 py-1 text-sm">
                  {p}
                </span>
              ),
            )}
          </div>
        </div>
        <p className="flex items-center gap-1.5 text-sm text-white/70">
          <Sparkles className="h-4 w-4" /> KI-gestützt – mit Claude AI
        </p>
      </div>

      {/* Formularseite */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white">
              <Compass className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold text-ink">ProGuide</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
