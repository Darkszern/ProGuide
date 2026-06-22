import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/StatusBadge'
import { Comments } from '@/components/Comments'
import { api } from '@/data/api'
import { formatDateShort } from '@/lib/utils'
import type { MemberView, TaskView } from '@/data/types'
import type { TaskStatus } from '@/types/db'

const STATUSES: TaskStatus[] = ['open', 'in_progress', 'review', 'done']
const statusLabel: Record<TaskStatus, string> = {
  open: 'Offen',
  in_progress: 'In Bearbeitung',
  review: 'Review',
  done: 'Erledigt',
}

export function TaskDetailModal({
  task,
  open,
  onClose,
  onChanged,
}: {
  task: TaskView | null
  open: boolean
  onClose: () => void
  onChanged: () => void
}) {
  const [members, setMembers] = useState<MemberView[]>([])
  const [desc, setDesc] = useState('')
  const [descDirty, setDescDirty] = useState(false)

  useEffect(() => {
    if (!task) return
    setDesc(task.description ?? '')
    setDescDirty(false)
    let active = true
    api.getMembers(task.project_id).then((m) => active && setMembers(m))
    return () => {
      active = false
    }
  }, [task])

  if (!task) return null

  async function patch(p: Parameters<typeof api.updateTask>[1]) {
    await api.updateTask(task!.id, p)
    onChanged()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div>
          <Badge tone="violet">{task.project_title}</Badge>
          <h3 className="mt-2 text-lg font-semibold text-ink">{task.title}</h3>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Status</label>
          <select
            className="input"
            value={task.status}
            onChange={(e) => patch({ status: e.target.value as TaskStatus })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{statusLabel[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Zustaendig</label>
          <select
            className="input"
            value={task.assignee_id ?? ''}
            onChange={(e) => patch({ assignee_id: e.target.value || null })}
          >
            <option value="">– niemand –</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3">
        <label className="label">Faellig</label>
        <input
          type="date"
          className="input max-w-[200px]"
          value={task.due_date ?? ''}
          onChange={(e) => patch({ due_date: e.target.value || null })}
        />
      </div>

      <div className="mt-3">
        <label className="label">Beschreibung</label>
        <textarea
          className="input min-h-[80px]"
          value={desc}
          onChange={(e) => {
            setDesc(e.target.value)
            setDescDirty(true)
          }}
          placeholder="Details zur Aufgabe …"
        />
        {descDirty && (
          <button
            className="btn-outline mt-2"
            onClick={async () => {
              await patch({ description: desc })
              setDescDirty(false)
            }}
          >
            Beschreibung speichern
          </button>
        )}
      </div>

      <div className="mt-5 border-t border-black/[0.06] pt-4">
        <p className="mb-3 text-sm font-semibold text-ink">Kommentare</p>
        <Comments projectId={task.project_id} taskId={task.id} />
      </div>

      <p className="mt-4 text-xs text-ink-muted">Erstellt am {formatDateShort(task.created_at)}</p>
    </Modal>
  )
}
