import { useState, type FormEvent } from 'react'
import { Send, MessageSquare } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { api } from '@/data/api'
import { useAsync } from '@/hooks/useAsync'
import { timeAgo } from '@/lib/utils'

interface CommentsProps {
  projectId: string
  taskId?: string
}

export function Comments({ projectId, taskId }: CommentsProps) {
  const { data, loading, reload } = useAsync(
    () => api.listComments(projectId, taskId),
    [projectId, taskId],
  )
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!body.trim() || sending) return
    setSending(true)
    try {
      await api.addComment(projectId, body.trim(), taskId)
      setBody('')
      reload()
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      {loading && <Spinner className="h-5 w-5" />}
      {data && data.length === 0 && !loading && (
        <div className="flex items-center gap-2 py-2 text-sm text-ink-muted">
          <MessageSquare className="h-4 w-4" /> Noch keine Kommentare.
        </div>
      )}
      {data && data.length > 0 && (
        <ul className="mb-4 space-y-4">
          {data.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar name={c.author_name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-ink">{c.author_name}</span>
                  <span className="text-xs text-ink-muted">{timeAgo(c.created_at)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-ink-soft">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form className="flex items-center gap-2" onSubmit={submit}>
        <input
          className="input"
          placeholder="Kommentar schreiben …"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button type="submit" className="btn-primary px-3" disabled={sending || !body.trim()}>
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
