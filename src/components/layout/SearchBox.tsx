import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FolderKanban, CheckSquare } from 'lucide-react'
import { api } from '@/data/api'
import type { ProjectListItem, TaskView } from '@/data/types'

export function SearchBox() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [tasks, setTasks] = useState<TaskView[]>([])
  const [loaded, setLoaded] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  // Datenbestand beim ersten Fokus laden.
  async function ensureLoaded() {
    if (loaded) return
    const [p, t] = await Promise.all([api.listProjects(), api.listTasks()])
    setProjects(p)
    setTasks(t)
    setLoaded(true)
  }

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const q = query.trim().toLowerCase()
  const projectHits = q ? projects.filter((p) => p.title.toLowerCase().includes(q) || (p.subject ?? '').toLowerCase().includes(q)).slice(0, 5) : []
  const taskHits = q ? tasks.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 5) : []
  const hasResults = projectHits.length > 0 || taskHits.length > 0

  function go(path: string) {
    setOpen(false)
    setQuery('')
    navigate(path)
  }

  return (
    <div ref={boxRef} className="relative hidden max-w-sm flex-1 sm:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
      <input
        type="search"
        placeholder="Projekte & Aufgaben suchen …"
        className="input pl-9"
        aria-label="Suchen"
        value={query}
        onFocus={() => {
          ensureLoaded()
          setOpen(true)
        }}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      />

      {open && q.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-xl border border-black/[0.06] bg-surface p-1.5 shadow-card">
          {!hasResults && <p className="px-3 py-3 text-sm text-ink-muted">Keine Treffer.</p>}

          {projectHits.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase text-ink-muted">Projekte</p>
              {projectHits.map((p) => (
                <button key={p.id} onClick={() => go(`/projekte/${p.id}`)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-black/[0.04]">
                  <FolderKanban className="h-4 w-4 shrink-0 text-brand-500" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{p.title}</span>
                    {p.subject && <span className="block truncate text-xs text-ink-muted">{p.subject}</span>}
                  </span>
                </button>
              ))}
            </>
          )}

          {taskHits.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase text-ink-muted">Aufgaben</p>
              {taskHits.map((t) => (
                <button key={t.id} onClick={() => go(`/projekte/${t.project_id}`)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-black/[0.04]">
                  <CheckSquare className="h-4 w-4 shrink-0 text-brand-500" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{t.title}</span>
                    <span className="block truncate text-xs text-ink-muted">{t.project_title}</span>
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
