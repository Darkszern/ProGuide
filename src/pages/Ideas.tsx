import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lightbulb, Trash2, Plus, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/StatusBadge'
import { listIdeas, deleteIdea, type SavedIdea } from '@/lib/ideas'
import { getPhase } from '@/lib/iperka'
import { formatDate } from '@/lib/utils'

export function Ideas() {
  const [ideas, setIdeas] = useState(listIdeas)
  const navigate = useNavigate()

  function remove(id: string) {
    deleteIdea(id)
    setIdeas(listIdeas())
  }

  return (
    <>
      <PageHeader
        title="Gespeicherte Ideen"
        subtitle="Alle von der KI generierten Projektpläne – auch wenn du sie noch nicht als Projekt erstellt hast."
        action={
          <Link to="/projekt/neu" className="btn-primary">
            <Plus className="h-4 w-4" /> Neue Idee
          </Link>
        }
      />

      {ideas.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="Keine gespeicherten Ideen"
          description="Wenn du einen Projektplan generierst, wird er automatisch hier gespeichert."
        />
      ) : (
        <div className="space-y-4">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} onDelete={() => remove(idea.id)} onUse={() => navigate(`/projekt/neu?idea=${idea.id}`)} />
          ))}
        </div>
      )}
    </>
  )
}

function IdeaCard({ idea, onDelete, onUse }: { idea: SavedIdea; onDelete: () => void; onUse: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const totalItems = Object.values(idea.checklistByPhase).reduce((s, a) => s + a.length, 0)

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <button onClick={() => setExpanded(!expanded)} className="text-left">
            <h3 className="text-base font-semibold text-ink">{idea.title}</h3>
            <p className="mt-0.5 text-sm text-ink-muted">
              {idea.subject && `${idea.subject} · `}
              {idea.type === 'team' ? 'Gruppenarbeit' : 'Einzelarbeit'}
              {idea.deadline && ` · Abgabe ${formatDate(idea.deadline)}`}
              {` · ${totalItems} Checkpunkte`}
            </p>
          </button>
          {idea.goal && <p className="mt-1 text-sm text-ink-soft">{idea.goal}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge tone={idea.source === 'ai' ? 'violet' : 'gray'}>
            {idea.source === 'ai' ? 'KI' : 'Standard'}
          </Badge>
          <span className="text-xs text-ink-muted">{formatDate(idea.createdAt)}</span>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-black/5 pt-4">
          {Object.entries(idea.checklistByPhase).map(([key, items]) => (
            <div key={key}>
              <p className="text-sm font-medium text-ink">{getPhase(key as keyof typeof idea.checklistByPhase).title}</p>
              <ul className="mt-1 space-y-0.5">
                {items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-ink-soft">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button onClick={onUse} className="btn-primary text-sm">
          <Sparkles className="h-3.5 w-3.5" /> Als Projekt erstellen
        </button>
        <button onClick={() => setExpanded(!expanded)} className="btn-outline text-sm">
          {expanded ? 'Einklappen' : 'Details anzeigen'}
        </button>
        <button onClick={onDelete} className="btn-ghost text-sm text-rose-500 hover:text-rose-600" title="Löschen">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </Card>
  )
}
