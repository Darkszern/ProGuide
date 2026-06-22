import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingScreen, ErrorState } from '@/components/ui/Spinner'
import { CalendarRange } from 'lucide-react'
import { buildSchedule } from '@/lib/schedule'
import { getPhase } from '@/lib/iperka'
import { formatDate, deadlineLabel } from '@/lib/utils'
import { api } from '@/data/api'
import { useAsync } from '@/hooks/useAsync'
import type { ProjectListItem } from '@/data/types'

export function SchedulePage() {
  const { data, loading, error, reload } = useAsync(() => api.listProjects(), [])
  const withDeadline = (data ?? []).filter((p) => p.deadline)

  return (
    <>
      <PageHeader
        title="Zeitplan"
        subtitle="Automatisch aus der Deadline berechnet – Wochenenden und Schweizer Feiertage werden grob beruecksichtigt."
      />

      {loading && <LoadingScreen />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && withDeadline.length === 0 && (
        <EmptyState icon={CalendarRange} title="Keine terminierten Projekte" description="Projekte mit Abgabetermin erscheinen hier mit automatischem Zeitplan." />
      )}

      <div className="space-y-6">
        {withDeadline.map((p) => (
          <ProjectSchedule key={p.id} project={p} />
        ))}
      </div>
    </>
  )
}

function ProjectSchedule({ project }: { project: ProjectListItem }) {
  const schedule = buildSchedule(project.deadline!)
  const max = Math.max(...schedule.map((s) => s.workdays), 1)
  return (
    <Card>
      <CardHeader
        title={project.title}
        subtitle={`Abgabe: ${formatDate(project.deadline)} · ${deadlineLabel(project.deadline)}`}
        action={<Badge tone="violet">{getPhase(project.current_phase).title}</Badge>}
      />
      <div className="space-y-3">
        {schedule.map((s) => {
          const phase = getPhase(s.key)
          const isCurrent = s.key === project.current_phase
          return (
            <div key={s.key} className="flex items-center gap-4">
              <div className="w-28 shrink-0">
                <p className="text-sm font-medium text-ink">{phase.title}</p>
                <p className="text-xs text-ink-muted">{s.workdays} Arbeitstage</p>
              </div>
              <div className="flex-1">
                <div className="h-7 overflow-hidden rounded-lg bg-black/[0.04]">
                  <div
                    className={`flex h-full items-center rounded-lg px-2.5 text-[11px] font-medium text-white ${isCurrent ? 'bg-brand-gradient ring-2 ring-brand-300' : 'bg-brand-400'}`}
                    style={{ width: `${Math.max(12, (s.workdays / max) * 100)}%` }}
                  >
                    {formatDate(s.start).replace(/ \d{4}$/, '')} – {formatDate(s.end).replace(/ \d{4}$/, '')}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
