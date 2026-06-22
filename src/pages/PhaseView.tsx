import { useEffect, useState } from 'react'
import { Link, useParams, Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Info,
  Lightbulb,
  AlertTriangle,
  FileText,
  ClipboardCheck,
  CheckCircle2,
  Plus,
} from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { LoadingScreen, ErrorState, Spinner } from '@/components/ui/Spinner'
import { PhaseStepper } from '@/components/PhaseStepper'
import { AIChatPanel } from '@/components/AIChatPanel'
import { PHASES, getPhase, PHASE_KEYS } from '@/lib/iperka'
import { cn } from '@/lib/utils'
import { api } from '@/data/api'
import { useAsync } from '@/hooks/useAsync'
import type { ChecklistItem, PhaseKey } from '@/types/db'

export function PhaseView() {
  const { projectId = '', phaseKey = '' } = useParams()
  const navigate = useNavigate()

  const valid = PHASE_KEYS.includes(phaseKey as PhaseKey)
  const { data, loading, error, reload } = useAsync(
    () => (valid ? api.getPhase(projectId, phaseKey as PhaseKey) : Promise.resolve(null)),
    [projectId, phaseKey],
  )

  const [items, setItems] = useState<ChecklistItem[]>([])
  const [newLabel, setNewLabel] = useState('')
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    if (data) setItems(data.view.checklist)
  }, [data])

  if (!valid) return <Navigate to={`/projekte/${projectId}/phase/informieren`} replace />
  if (loading) return <LoadingScreen />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return <ErrorState message="Phase nicht gefunden." />

  const phase = getPhase(phaseKey as PhaseKey)
  const allDone = items.length > 0 && items.every((i) => i.is_done)
  const doneCount = items.filter((i) => i.is_done).length
  const nextPhase = PHASES.find((p) => p.order === phase.order + 1)
  const isDone = data.view.phase.status === 'done'

  async function toggle(item: ChecklistItem) {
    const next = !item.is_done
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_done: next } : i)))
    await api.toggleChecklistItem(item.id, next)
  }

  async function addItem() {
    const label = newLabel.trim()
    if (!label) return
    setNewLabel('')
    await api.addChecklistItem(data!.view.phase.id, label)
    reload()
  }

  async function complete() {
    setCompleting(true)
    try {
      await api.completePhase(projectId, phaseKey as PhaseKey)
      if (nextPhase) navigate(`/projekte/${projectId}/phase/${nextPhase.key}`)
      else navigate(`/projekte/${projectId}`)
    } finally {
      setCompleting(false)
    }
  }

  const systemContext =
    `Du bist ein hilfreicher Coach für Berufsschüler bei einer Projektarbeit nach IPERKA. ` +
    `Projekt: "${data.projectTitle}". Aktuelle Phase: "${phase.title}" (${phase.short}). ` +
    `Antworte praezise, auf Deutsch, mit konkreten, umsetzbaren Tipps.`
  const quickQuestions = [
    `Was muss ich in der Phase "${phase.title}" konkret tun?`,
    'Welche typischen Fehler soll ich vermeiden?',
    'Gib mir ein Beispiel.',
  ]

  return (
    <>
      <Link to={`/projekte/${projectId}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Zurück zum Projekt
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <p className="text-sm font-medium text-brand-600">Schritt {phase.order} von 6</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">{phase.title}</h1>
            <p className="mt-1 text-ink-soft">{phase.short}</p>
          </div>

          <div className="flex gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
            <div>
              <p className="text-sm font-semibold text-brand-800">Warum dieser Schritt wichtig ist</p>
              <p className="mt-1 text-sm text-ink-soft">{phase.why}</p>
            </div>
          </div>

          <Card>
            <CardHeader title="Checkliste" subtitle={`${doneCount} von ${items.length} erledigt`} />
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 hover:bg-black/[0.02]">
                    <input
                      type="checkbox"
                      checked={item.is_done}
                      onChange={() => toggle(item)}
                      className="mt-0.5 h-5 w-5 rounded-md border-black/20 text-brand-500 focus:ring-brand-400"
                    />
                    <span className={cn('text-sm', item.is_done ? 'text-ink-muted line-through' : 'text-ink')}>
                      {item.label}
                    </span>
                  </label>
                </li>
              ))}
            </ul>

            <div className="mt-2 flex items-center gap-2">
              <input
                className="input"
                placeholder="Eigenen Punkt hinzufügen …"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
              />
              <button className="btn-outline px-3" onClick={addItem} disabled={!newLabel.trim()}>
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {isDone ? (
              <div className="btn mt-4 w-full cursor-default bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Phase abgeschlossen
              </div>
            ) : (
              <button
                className={cn('btn mt-4 w-full', allDone ? 'btn-primary' : 'btn-outline')}
                disabled={!allDone || completing}
                onClick={complete}
              >
                {completing ? <Spinner className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                {allDone ? 'Phase als erledigt markieren' : 'Alle Punkte abhaken zum Abschliessen'}
              </button>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GuideBlock icon={Lightbulb} tone="amber" title="Tipps" items={phase.tipps} />
            <GuideBlock icon={AlertTriangle} tone="rose" title="Haeufige Fehler" items={phase.fehler} />
            <GuideBlock icon={FileText} tone="violet" title="Passende Vorlagen" items={phase.vorlagen} />
            <GuideBlock icon={ClipboardCheck} tone="emerald" title="Lehrercheck-Vorbereitung" items={phase.lehrercheck} />
          </div>

          <Card>
            <p className="mb-3 text-sm font-medium text-ink-soft">Alle Phasen</p>
            <PhaseStepper projectId={projectId} current={phase.key} />
            {nextPhase && (
              <Link to={`/projekte/${projectId}/phase/${nextPhase.key}`} className="btn-ghost mt-3 w-full justify-center text-brand-600">
                Nächste Phase: {nextPhase.title} →
              </Link>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="lg:sticky lg:top-20">
            <AIChatPanel systemContext={systemContext} quickQuestions={quickQuestions} />
          </Card>
        </div>
      </div>
    </>
  )
}

const toneMap = {
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  violet: 'bg-brand-50 text-brand-600',
  emerald: 'bg-emerald-50 text-emerald-600',
}

function GuideBlock({
  icon: Icon,
  tone,
  title,
  items,
}: {
  icon: typeof Info
  tone: keyof typeof toneMap
  title: string
  items: string[]
}) {
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${toneMap[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-sm font-semibold text-ink">{title}</p>
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-ink-soft">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-muted" />
            {it}
          </li>
        ))}
      </ul>
    </Card>
  )
}
