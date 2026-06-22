import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { LoadingScreen, ErrorState, Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/data/api'
import { useAsync } from '@/hooks/useAsync'
import { isSupabaseConfigured } from '@/lib/supabase'

export function Settings() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useAsync(() => api.getMyProfile(), [])

  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (data) setName(data.display_name)
  }, [data])

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    setSaved(false)
    setSaveError(null)
    try {
      await api.updateMyProfile(name.trim())
      setSaved(true)
      reload()
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.')
    } finally {
      setSaving(false)
    }
  }

  const dirty = data ? name.trim() !== data.display_name : false

  return (
    <>
      <PageHeader title="Einstellungen" subtitle="Profil und App-Einstellungen." />

      {loading && <LoadingScreen />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && (
        <Card className="max-w-2xl">
          <CardHeader title="Profil" />
          <div className="flex items-center gap-4">
            <Avatar name={name || data.display_name} size="lg" />
            <div>
              <p className="font-medium text-ink">{name || data.display_name}</p>
              <p className="text-sm text-ink-muted">{user?.email ?? 'Demo-Modus (nicht angemeldet)'}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="display_name">Anzeigename</label>
              <input
                id="display_name"
                className="input max-w-md"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dein Name"
              />
            </div>

            {saveError && <p className="text-sm text-rose-600">{saveError}</p>}

            <div className="flex items-center gap-3">
              <button className="btn-primary" onClick={save} disabled={saving || !dirty || !name.trim()}>
                {saving ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : <Check className="h-4 w-4" />}
                Speichern
              </button>
              {saved && <span className="text-sm font-medium text-emerald-600">Gespeichert ✓</span>}
            </div>
          </div>
        </Card>
      )}

      <Card className="mt-6 max-w-2xl">
        <CardHeader title="App-Info" />
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Modus</dt>
            <dd className="font-medium text-ink">{isSupabaseConfigured ? 'Mit Backend (Supabase)' : 'Demo-Modus'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Version</dt>
            <dd className="font-medium text-ink">0.1.0</dd>
          </div>
        </dl>
      </Card>
    </>
  )
}
