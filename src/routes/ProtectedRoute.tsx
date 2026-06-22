import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { LoadingScreen } from '@/components/ui/Spinner'

/**
 * Schuetzt App-Routen. Im Demo-Modus (kein Supabase) ist die App frei
 * zugaenglich, damit das Grundgeruest auch ohne Backend sichtbar ist.
 */
export function ProtectedRoute() {
  const { session, loading, configured } = useAuth()
  const location = useLocation()

  if (!configured) return <Outlet />
  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />

  return <Outlet />
}
