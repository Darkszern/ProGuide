import { AlertCircle } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase'

/** Hinweisleiste, solange kein Supabase-Backend verbunden ist. */
export function DemoBanner() {
  if (isSupabaseConfigured) return null
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center gap-2 text-sm text-amber-800">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>
          <strong>Demo-Modus:</strong> Kein Backend verbunden. Trage Supabase-Zugangsdaten in
          {' '}
          <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">.env</code> ein, um echte Daten
          zu speichern.
        </span>
      </div>
    </div>
  )
}
