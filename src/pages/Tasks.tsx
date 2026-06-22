import { useEffect, useState } from 'react'
import { Plus, CheckSquare, Trash2, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingScreen, ErrorState, Spinner } from '@/components/ui/Spinner'
import { TaskDetailModal } from '@/components/TaskDetailModal'
import { PHASES } from '@/lib/iperka'
import { formatDateShort, daysUntil } from '@/lib/utils'
import { api } from '@/data/api'
import { useAsync } from '@/hooks/useAsync'
import type { MemberView, ProjectListItem, TaskView } from '@/data/types'
import type { TaskStatus } from '@/types/db'

const STATUSES: TaskStatus[] = ['open', 'in_progress', 'review', 'done']
const statusLabel: Record<TaskStatus, string> = {
  open: 'Offen',
  in_progress: 'In Bearbeitung',
  review: 'Review',
  done: 'Erledigt',
}

export function Tasks() {
  const { data, loading, error, reload } = useAsync(() => api.listTasks(), [])
  const projects = useAsync(() => api.listProjects(), [])
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const tasks = data ?? []
  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)
  const selectedTask: TaskView | null = tasks.find((t) => t.id === selectedId) ?? null

  async function changeStatus(id: string, status: TaskStatus) {
    await api.updateTask(id, { status })
    reload()
  }
  async function remove(id: string) {
    await api.deleteTask(id)
    reload()
  }

  return (
    <>
      <PageHeader
        title="Aufgaben"
        subtitle="Alle Aufgaben aus deinen Projekten."
        action={
          <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /> Neue Aufgabe
          </button>
        }
      />

      {showForm && (
        <NewTaskForm
          projects={projects.data ?? []}
          onCreated={() => {
            setShowForm(false)
            reload()
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
          Alle ({tasks.length})
        </FilterChip>
        {STATUSES.map((s) => (
          <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
            {statusLabel[s]} ({tasks.filter((t) => t.status === s).length})
          </FilterChip>
        ))}
      </div>

      {loading && <LoadingScreen />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && filtered.length === 0 && (
        <EmptyState icon={CheckSquare} title="Keine Aufgaben" description="Lege eine neue Aufgabe an oder aendere den Filter." />
      )}

      {filtered.length > 0 && (
        <Card padded={false} className="divide-y divide-black/[0.05]">
          {filtered.map((t) => {
            const overdue = t.due_date && t.status !== 'done' && daysUntil(t.due_date) < 0
            return (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <button className="min-w-0 flex-1 text-left" onClick={() => setSelectedId(t.id)}>
                  <p className={`truncate text-sm font-medium hover:text-brand-600 ${t.status === 'done' ? 'text-ink-muted line-through' : 'text-ink'}`}>
                    {t.title}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                    <Badge tone="violet">{t.project_title}</Badge>
                    {t.due_date && (
                      <span className={`flex items-center gap-1 ${overdue ? 'font-medium text-rose-600' : ''}`}>
                        <Calendar className="h-3 w-3" /> {formatDateShort(t.due_date)}
                      </span>
                    )}
                  </div>
                </button>
                {t.assignee_name && <Avatar name={t.assignee_name} size="sm" />}
                <select
                  value={t.status}
                  onChange={(e) => changeStatus(t.id, e.target.value as TaskStatus)}
                  className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{statusLabel[s]}</option>
                  ))}
                </select>
                <button className="text-ink-muted hover:text-rose-500" onClick={() => remove(t.id)} aria-label="Loeschen">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </Card>
      )}

      <TaskDetailModal
        task={selectedTask}
        open={selectedTask !== null}
        onClose={() => setSelectedId(null)}
        onChanged={reload}
      />
    </>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-brand-500 text-white' : 'bg-surface text-ink-soft hover:bg-black/[0.04] border border-black/[0.06]'
      }`}
    >
      {children}
    </button>
  )
}

function NewTaskForm({
  projects,
  onCreated,
  onCancel,
}: {
  projects: ProjectListItem[]
  onCreated: () => void
  onCancel: () => void
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [phaseKey, setPhaseKey] = useState('')
  const [assignee, setAssignee] = useState('')
  const [due, setDue] = useState('')
  const [members, setMembers] = useState<MemberView[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!projectId) {
      setMembers([])
      return
    }
    let active = true
    api.getMembers(projectId).then((m) => active && setMembers(m))
    return () => {
      active = false
    }
  }, [projectId])

  // Phasen-Auswahl braucht die Phasen-IDs des Projekts.
  const [phaseOptions, setPhaseOptions] = useState<Array<{ id: string; key: string }>>([])
  useEffect(() => {
    if (!projectId) return
    let active = true
    api.getProject(projectId).then((p) => {
      if (active && p) setPhaseOptions(p.phases.map((ph) => ({ id: ph.phase.id, key: ph.phase.key })))
    })
    return () => {
      active = false
    }
  }, [projectId])

  async function submit() {
    if (!projectId || !title.trim()) return
    setSaving(true)
    try {
      await api.createTask({
        project_id: projectId,
        phase_id: phaseKey || null,
        title: title.trim(),
        assignee_id: assignee || null,
        due_date: due || null,
      })
      onCreated()
    } finally {
      setSaving(false)
    }
  }

  if (projects.length === 0) {
    return (
      <Card className="mb-6">
        <p className="text-sm text-ink-muted">Lege zuerst ein Projekt an, um Aufgaben zu erstellen.</p>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <h3 className="mb-4 font-semibold text-ink">Neue Aufgabe</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Titel</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Was ist zu tun?" />
        </div>
        <div>
          <label className="label">Projekt</label>
          <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Phase (optional)</label>
          <select className="input" value={phaseKey} onChange={(e) => setPhaseKey(e.target.value)}>
            <option value="">– keine –</option>
            {phaseOptions.map((ph) => (
              <option key={ph.id} value={ph.id}>{PHASES.find((x) => x.key === ph.key)?.title ?? ph.key}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Zustaendig (optional)</label>
          <select className="input" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">– niemand –</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Faellig (optional)</label>
          <input type="date" className="input" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onCancel} disabled={saving}>Abbrechen</button>
        <button className="btn-primary" onClick={submit} disabled={saving || !title.trim()}>
          {saving ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : <Plus className="h-4 w-4" />}
          Erstellen
        </button>
      </div>
    </Card>
  )
}
