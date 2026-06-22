import { Link } from 'react-router-dom'
import {
  FolderKanban,
  CircleDot,
  CheckCircle2,
  CalendarClock,
  Plus,
  UserPlus,
  Calendar,
  FileDown,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ProgressDonut, DonutLegend, type DonutSegment } from '@/components/ui/ProgressDonut'
import { TrafficDot } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingScreen, ErrorState } from '@/components/ui/Spinner'
import { getPhase } from '@/lib/iperka'
import { daysUntil, deadlineLabel, timeAgo } from '@/lib/utils'
import { activityText } from '@/lib/activity'
import { api } from '@/data/api'
import { useAsync } from '@/hooks/useAsync'
import type { DashboardData, ProjectListItem } from '@/data/types'

function trafficTone(progress: number, deadline: string | null): 'green' | 'amber' | 'red' {
  if (!deadline) return 'green'
  const d = daysUntil(deadline)
  if (d < 0) return 'red'
  if (d <= 3 && progress < 80) return 'red'
  if (d <= 7 && progress < 60) return 'amber'
  return 'green'
}

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number | string
  accent: string
}
function StatCard({ icon: Icon, label, value, accent }: StatCardProps) {
  return (
    <Card className="flex items-center gap-4">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${accent}`}>
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-2xl font-bold leading-none text-ink">{value}</p>
        <p className="mt-1 text-sm text-ink-muted">{label}</p>
      </div>
    </Card>
  )
}

export function Dashboard() {
  const { data, loading, error, reload } = useAsync(() => api.getDashboard(), [])

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Dein Ueberblick ueber alle Projekte und Aufgaben." />

      {loading && <LoadingScreen />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && !loading && (
        <DashboardContent data={data} />
      )}
    </>
  )
}

function DashboardContent({ data }: { data: DashboardData }) {
  const overall: DonutSegment[] = [
    { label: 'Abgeschlossen', value: data.overall.done, color: '#10b981' },
    { label: 'In Bearbeitung', value: data.overall.in_progress, color: '#6d5ef6' },
    { label: 'Noch offen', value: data.overall.open, color: '#cbd0dc' },
  ]
  const overallSum = data.overall.done + data.overall.in_progress + data.overall.open
  const overallPct = overallSum ? Math.round((data.overall.done / overallSum) * 100) : 0

  const tasks: DonutSegment[] = [
    { label: 'Erledigt', value: data.tasksByStatus.done, color: '#10b981' },
    { label: 'In Bearbeitung', value: data.tasksByStatus.in_progress, color: '#6d5ef6' },
    { label: 'Review', value: data.tasksByStatus.review, color: '#f59e0b' },
    { label: 'Offen', value: data.tasksByStatus.open, color: '#cbd0dc' },
  ]
  const taskSum = Object.values(data.tasksByStatus).reduce((a, b) => a + b, 0)

  const upcoming = [...data.projects]
    .filter((p) => p.deadline)
    .sort((a, b) => daysUntil(a.deadline!) - daysUntil(b.deadline!))
  const critical = upcoming.filter((p) => daysUntil(p.deadline!) <= 3)

  return (
    <>
      {critical.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <CalendarClock className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            <strong>Zeitplan-Warnung:</strong> {critical.length} Projekt
            {critical.length === 1 ? '' : 'e'} mit kritischer Deadline in den naechsten Tagen –{' '}
            {critical.map((p) => p.title).join(', ')}.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FolderKanban} label="Aktive Projekte" value={data.stats.activeProjects} accent="bg-brand-50 text-brand-600" />
        <StatCard icon={CircleDot} label="Offene Aufgaben" value={data.stats.openTasks} accent="bg-amber-50 text-amber-600" />
        <StatCard icon={CheckCircle2} label="Erledigte Aufgaben" value={data.stats.doneTasks} accent="bg-emerald-50 text-emerald-600" />
        <StatCard icon={CalendarClock} label="Faellige Deadlines" value={data.stats.dueDeadlines} accent="bg-rose-50 text-rose-600" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Gesamtfortschritt" subtitle="Phasen" />
          <ProgressDonut segments={overall} centerValue={`${overallPct}%`} centerLabel="erledigt" />
          <div className="mt-4"><DonutLegend segments={overall} /></div>
        </Card>

        <Card>
          <CardHeader title="Aufgaben-Uebersicht" subtitle="Nach Status" />
          <ProgressDonut segments={tasks} centerValue={String(taskSum)} centerLabel="Aufgaben" />
          <div className="mt-4"><DonutLegend segments={tasks} /></div>
        </Card>

        <Card>
          <CardHeader title="Naechste Deadlines" />
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">Keine Deadlines.</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((p) => {
                const overdue = daysUntil(p.deadline!) < 0
                return (
                  <li key={p.id} className="flex items-center gap-3">
                    <TrafficDot tone={trafficTone(p.progress, p.deadline)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{p.title}</p>
                      <p className="text-xs text-ink-muted">{p.subject}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${overdue ? 'bg-rose-50 text-rose-600' : 'bg-black/[0.05] text-ink-soft'}`}>
                      {deadlineLabel(p.deadline)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Meine Projekte"
            action={
              <Link to="/projekte" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
                Alle ansehen <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          {data.projects.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">Noch keine Projekte.</p>
          ) : (
            <div className="space-y-4">
              {data.projects.map((p: ProjectListItem) => (
                <Link key={p.id} to={`/projekte/${p.id}`} className="block rounded-xl border border-black/[0.05] p-4 transition-colors hover:bg-black/[0.02]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{p.title}</p>
                      <p className="text-xs text-ink-muted">
                        Phase: {getPhase(p.current_phase).title} · {deadlineLabel(p.deadline)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-ink">{p.progress}%</span>
                  </div>
                  <ProgressBar className="mt-3" value={p.progress} tone={trafficTone(p.progress, p.deadline)} />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Aktivitaetsverlauf" />
          {data.activities.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">Noch keine Aktivitaeten.</p>
          ) : (
            <ul className="space-y-4">
              {data.activities.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <Avatar name={a.actor_name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm text-ink">
                      <span className="font-medium">{a.actor_name}</span> {activityText(a)}
                    </p>
                    <p className="text-xs text-ink-muted">{timeAgo(a.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Schnellaktionen" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <QuickAction to="/projekt/neu" icon={Plus} label="Neues Projekt" />
          <QuickAction to="/aufgaben" icon={CircleDot} label="Neue Aufgabe" />
          <QuickAction to="/team" icon={UserPlus} label="Team einladen" />
          <QuickAction to="/kalender" icon={Calendar} label="Kalender" />
          <QuickAction to="/projekte" icon={FileDown} label="Export PDF" />
          <QuickAction to="/projekte" icon={FileDown} label="Export Word" />
        </div>
      </Card>
    </>
  )
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: LucideIcon; label: string }) {
  return (
    <Link to={to} className="flex flex-col items-center justify-center gap-2 rounded-xl border border-black/[0.05] px-3 py-4 text-center transition-colors hover:bg-brand-50 hover:text-brand-600">
      <Icon className="h-5 w-5 text-brand-500" />
      <span className="text-xs font-medium text-ink-soft">{label}</span>
    </Link>
  )
}
