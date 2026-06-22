import { Link } from 'react-router-dom'
import { Plus, Users, User, ArrowRight, FolderKanban } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/StatusBadge'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingScreen, ErrorState } from '@/components/ui/Spinner'
import { getPhase } from '@/lib/iperka'
import { deadlineLabel, daysUntil, formatDate } from '@/lib/utils'
import { api } from '@/data/api'
import { useAsync } from '@/hooks/useAsync'

export function Projects() {
  const { data, loading, error, reload } = useAsync(() => api.listProjects(), [])

  return (
    <>
      <PageHeader
        title="Projekte"
        subtitle="Alle deine Projektarbeiten auf einen Blick."
        action={
          <Link to="/projekt/neu" className="btn-primary">
            <Plus className="h-4 w-4" /> Neues Projekt
          </Link>
        }
      />

      {loading && <LoadingScreen />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && !loading && data.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title="Noch keine Projekte"
          description="Lege dein erstes Projekt an – die KI hilft dir beim Strukturieren."
          action={<Link to="/projekt/neu" className="btn-primary"><Plus className="h-4 w-4" /> Neues Projekt</Link>}
        />
      )}

      {data && data.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((p) => {
            const overdue = p.deadline ? daysUntil(p.deadline) < 0 : false
            return (
              <Card key={p.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <Badge tone="violet">{getPhase(p.current_phase).title}</Badge>
                  <Badge tone="gray">
                    {p.project_type === 'team' ? (
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Gruppe</span>
                    ) : (
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> Einzel</span>
                    )}
                  </Badge>
                </div>

                <h3 className="mt-3 text-base font-semibold text-ink">{p.title}</h3>
                <p className="text-sm text-ink-muted">{p.subject || 'Kein Fach'}</p>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-ink-soft">
                    <span>Fortschritt</span>
                    <span className="font-medium">{p.progress}%</span>
                  </div>
                  <ProgressBar value={p.progress} />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-black/[0.05] pt-3">
                  <span className={`text-xs ${overdue ? 'font-medium text-rose-600' : 'text-ink-muted'}`}>
                    {p.deadline ? `${formatDate(p.deadline)} · ${deadlineLabel(p.deadline)}` : 'Keine Deadline'}
                  </span>
                  <Link to={`/projekte/${p.id}`} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
                    Oeffnen <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
