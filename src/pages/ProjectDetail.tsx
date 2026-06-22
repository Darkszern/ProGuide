import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Users, User, KeyRound } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge, PhaseStatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { LoadingScreen, ErrorState } from '@/components/ui/Spinner'
import { PhaseStepper } from '@/components/PhaseStepper'
import { Comments } from '@/components/Comments'
import { ProjectExportMenu } from '@/components/ProjectExportMenu'
import { AddToCalendarButton } from '@/components/AddToCalendarButton'
import { projectEvents } from '@/lib/calendar'
import { PHASES } from '@/lib/iperka'
import { formatDate, deadlineLabel } from '@/lib/utils'
import { api } from '@/data/api'
import { useAsync } from '@/hooks/useAsync'
import type { PhaseKey, PhaseStatus } from '@/types/db'

export function ProjectDetail() {
  const { projectId = '' } = useParams()
  const { data, loading, error, reload } = useAsync(() => api.getProject(projectId), [projectId])

  if (loading) return <LoadingScreen />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return <ErrorState message="Projekt nicht gefunden." />

  const { project, members, phases, progress } = data
  const statusByKey: Partial<Record<PhaseKey, PhaseStatus>> = {}
  phases.forEach((p) => (statusByKey[p.phase.key] = p.phase.status))

  return (
    <>
      <Link to="/projekte" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Zurück zu Projekte
      </Link>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone="violet">{project.subject || 'Projekt'}</Badge>
            <Badge tone="gray">
              {project.project_type === 'team' ? (
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Gruppe</span>
              ) : (
                <span className="flex items-center gap-1"><User className="h-3 w-3" /> Einzel</span>
              )}
            </Badge>
            {project.project_type === 'team' && project.join_code && (
              <Badge tone="blue">
                <span className="flex items-center gap-1">
                  <KeyRound className="h-3 w-3" /> Code: {project.join_code}
                </span>
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{project.title}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
            <Calendar className="h-4 w-4" /> Abgabe: {formatDate(project.deadline)} · {deadlineLabel(project.deadline)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <AddToCalendarButton
            events={projectEvents(data)}
            filename={`${project.title}.ics`}
          />
          <ProjectExportMenu projectId={project.id} />
        </div>
      </div>

      <Card className="mb-6">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="font-medium text-ink">Gesamtfortschritt</span>
          <span className="font-semibold text-ink">{progress}%</span>
        </div>
        <ProgressBar value={progress} />
        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-ink-soft">IPERKA-Phasen</p>
          <PhaseStepper projectId={project.id} current={project.current_phase} statusByKey={statusByKey} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CardHeader title="Phasenübersicht" subtitle="Klicke auf eine Phase, um die Schritt-für-Schritt-Führung zu öffnen." />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PHASES.map((def) => {
              const pv = phases.find((p) => p.phase.key === def.key)
              const status = pv?.phase.status ?? 'open'
              return (
                <Link key={def.key} to={`/projekte/${project.id}/phase/${def.key}`}>
                  <Card className="h-full transition-colors hover:bg-black/[0.02]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${def.accent} text-sm font-bold`}>
                          {def.order}
                        </span>
                        <div>
                          <p className="font-semibold text-ink">{def.title}</p>
                          <p className="text-xs text-ink-muted">
                            {pv ? `${pv.doneCount}/${pv.total} erledigt` : `Schritt ${def.order} von 6`}
                          </p>
                        </div>
                      </div>
                      <PhaseStatusBadge status={status} />
                    </div>
                    <p className="mt-3 text-sm text-ink-soft">{def.short}</p>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Team" subtitle={`${members.length} Mitglied${members.length === 1 ? '' : 'er'}`} />
            <ul className="space-y-3">
              {members.map((m) => (
                <li key={m.user_id} className="flex items-center gap-3">
                  <Avatar name={m.display_name} size="sm" />
                  <span className="flex-1 text-sm text-ink">{m.display_name}</span>
                  <Badge tone={m.role === 'leader' ? 'violet' : 'gray'}>
                    {m.role === 'leader' ? 'Leitung' : 'Mitglied'}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Kommentare" />
            <Comments projectId={project.id} />
          </Card>
        </div>
      </div>
    </>
  )
}
