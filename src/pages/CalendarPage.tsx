import { Link } from 'react-router-dom'
import { Calendar, Flag, CircleDot } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingScreen, ErrorState } from '@/components/ui/Spinner'
import { buildSchedule } from '@/lib/schedule'
import { getPhase } from '@/lib/iperka'
import { formatDate, daysUntil, deadlineLabel } from '@/lib/utils'
import { api } from '@/data/api'
import { useAsync } from '@/hooks/useAsync'
import { AddToCalendarButton } from '@/components/AddToCalendarButton'
import { eventsFromProjects } from '@/lib/calendar'

interface CalEvent {
  date: string
  kind: 'deadline' | 'phase'
  label: string
  projectTitle: string
  projectId: string
}

export function CalendarPage() {
  const { data, loading, error, reload } = useAsync(() => api.listProjects(), [])

  const events: CalEvent[] = []
  for (const p of data ?? []) {
    if (!p.deadline) continue
    events.push({ date: p.deadline, kind: 'deadline', label: 'Abgabe', projectTitle: p.title, projectId: p.id })
    for (const s of buildSchedule(p.deadline)) {
      events.push({
        date: s.end,
        kind: 'phase',
        label: `Phase „${getPhase(s.key).title}" endet`,
        projectTitle: p.title,
        projectId: p.id,
      })
    }
  }
  const upcoming = events
    .filter((e) => daysUntil(e.date) >= -7)
    .sort((a, b) => daysUntil(a.date) - daysUntil(b.date))

  return (
    <>
      <PageHeader
        title="Kalender"
        subtitle="Anstehende Deadlines und Phasen-Meilensteine."
        action={
          data && data.some((p) => p.deadline) ? (
            <AddToCalendarButton
              events={eventsFromProjects(data)}
              filename="projectguide-termine.ics"
            />
          ) : undefined
        }
      />

      {loading && <LoadingScreen />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && upcoming.length === 0 && (
        <EmptyState icon={Calendar} title="Keine anstehenden Termine" description="Projekte mit Abgabetermin erscheinen hier." />
      )}

      {upcoming.length > 0 && (
        <Card padded={false} className="divide-y divide-black/[0.05]">
          {upcoming.map((e, i) => {
            const d = daysUntil(e.date)
            const overdue = d < 0
            const isDeadline = e.kind === 'deadline'
            return (
              <Link
                key={i}
                to={`/projekte/${e.projectId}`}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-black/[0.02]"
              >
                <div className="flex w-16 shrink-0 flex-col items-center">
                  <span className="text-xs uppercase text-ink-muted">
                    {new Date(e.date).toLocaleDateString('de-CH', { month: 'short' })}
                  </span>
                  <span className="text-xl font-bold text-ink">{new Date(e.date).getDate()}</span>
                </div>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    isDeadline ? 'bg-rose-50 text-rose-500' : 'bg-brand-50 text-brand-500'
                  }`}
                >
                  {isDeadline ? <Flag className="h-4 w-4" /> : <CircleDot className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{e.label}</p>
                  <p className="truncate text-xs text-ink-muted">{e.projectTitle}</p>
                </div>
                <span className={`shrink-0 text-xs font-medium ${overdue ? 'text-rose-600' : 'text-ink-soft'}`}>
                  {formatDate(e.date).replace(/ \d{4}$/, '')} · {deadlineLabel(e.date)}
                </span>
              </Link>
            )
          })}
        </Card>
      )}
    </>
  )
}
