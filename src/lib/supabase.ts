import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || 'https://rynnrvkgoldxqjqaovuf.supabase.co'
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_tNZrwRZhzC4TUQ9vbugf6Q_BLiUT_uw'

/**
 * Ist Supabase konfiguriert? Solange keine .env-Werte gesetzt sind,
 * laeuft die App im "Demo-/Vorschau-Modus" (UI sichtbar, keine echten
 * Daten). So kann das Grundgeruest auch ohne Backend gestartet werden.
 */
export const isSupabaseConfigured =
  Boolean(url) &&
  Boolean(anonKey) &&
  !url.includes('DEIN-PROJEKT') &&
  anonKey !== 'dein-anon-key'

if (!isSupabaseConfigured) {
  // Nur ein Hinweis – kein harter Fehler, damit das UI startet.
  console.warn(
    '[ProjectGuide] Supabase ist noch nicht konfiguriert. ' +
      'Trage VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in .env ein.',
  )
}

// Fallback-Werte verhindern einen Crash beim Erstellen des Clients.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
