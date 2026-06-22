import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white">
        <Compass className="h-7 w-7" />
      </span>
      <h1 className="mt-6 text-4xl font-bold text-ink">404</h1>
      <p className="mt-2 text-ink-muted">Diese Seite gibt es nicht.</p>
      <Link to="/dashboard" className="btn-primary mt-6">
        Zurück zum Dashboard
      </Link>
    </div>
  )
}
