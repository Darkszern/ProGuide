import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, KeyRound, LogIn, Copy, Check } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingScreen, ErrorState, Spinner } from '@/components/ui/Spinner'
import { api } from '@/data/api'
import { useAsync } from '@/hooks/useAsync'

export function Team() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(() => api.getDashboard(), [])
  const [code, setCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  async function join() {
    if (!code.trim()) return
    setJoining(true)
    setJoinError(null)
    try {
      const projectId = await api.joinByCode(code.trim())
      navigate(`/projekte/${projectId}`)
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : 'Beitritt fehlgeschlagen.')
    } finally {
      setJoining(false)
    }
  }

  return (
    <>
      <PageHeader title="Team" subtitle="Gruppenmitglieder verwalten und ueber den Beitritts-Code einladen." />

      <Card className="mb-6 max-w-xl">
        <CardHeader title="Projekt beitreten" subtitle="Gib den Code ein, den du von deiner Gruppe erhalten hast." />
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              className="input pl-9 uppercase tracking-widest"
              placeholder="z.B. K7M2QX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={8}
            />
          </div>
          <button className="btn-primary" onClick={join} disabled={joining || !code.trim()}>
            {joining ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : <LogIn className="h-4 w-4" />}
            Beitreten
          </button>
        </div>
        {joinError && <p className="mt-2 text-sm text-rose-600">{joinError}</p>}
      </Card>

      {loading && <LoadingScreen />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {data.projects.map((p) => (
            <TeamProjectCard key={p.id} projectId={p.id} title={p.title} type={p.project_type} />
          ))}
        </div>
      )}
    </>
  )
}

function TeamProjectCard({
  projectId,
  title,
  type,
}: {
  projectId: string
  title: string
  type: 'single' | 'team'
}) {
  const { data } = useAsync(() => api.getProject(projectId), [projectId])
  const [copied, setCopied] = useState(false)
  const joinCode = data?.project.join_code

  function copy() {
    if (!joinCode) return
    navigator.clipboard?.writeText(joinCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-ink">{title}</h3>
        <Badge tone={type === 'team' ? 'violet' : 'gray'}>{type === 'team' ? 'Gruppe' : 'Einzel'}</Badge>
      </div>

      {type === 'team' && joinCode && (
        <button
          onClick={copy}
          className="mb-4 flex w-full items-center justify-between rounded-xl border border-dashed border-brand-200 bg-brand-50/50 px-3 py-2 text-sm transition-colors hover:bg-brand-50"
        >
          <span className="flex items-center gap-2 text-ink-soft">
            <KeyRound className="h-4 w-4 text-brand-500" /> Beitritts-Code:
            <span className="font-semibold tracking-widest text-brand-700">{joinCode}</span>
          </span>
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-ink-muted" />}
        </button>
      )}

      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
        <Users className="h-3.5 w-3.5" /> {data?.members.length ?? '…'} Mitglied
        {data?.members.length === 1 ? '' : 'er'}
      </p>
      <ul className="space-y-2">
        {data?.members.map((m) => (
          <li key={m.user_id} className="flex items-center gap-2.5">
            <Avatar name={m.display_name} size="sm" />
            <span className="flex-1 text-sm text-ink">{m.display_name}</span>
            {m.role === 'leader' && <Badge tone="violet">Leitung</Badge>}
          </li>
        ))}
      </ul>
    </Card>
  )
}
