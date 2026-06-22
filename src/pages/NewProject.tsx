import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, Wand2, X, Plus, Check } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { AIDisclaimer } from '@/components/ui/AIDisclaimer'
import { Badge } from '@/components/ui/StatusBadge'
import { Spinner } from '@/components/ui/Spinner'
import { PHASES, getPhase } from '@/lib/iperka'
import { buildSchedule } from '@/lib/schedule'
import { formatDate } from '@/lib/utils'
import { generatePlan, type OnboardingAnswers } from '@/lib/onboarding'
import { api } from '@/data/api'
import type { PhaseKey, ProjectType } from '@/types/db'

type Step = 'form' | 'review'

export function NewProject() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('form')
  const [generating, setGenerating] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [answers, setAnswers] = useState<OnboardingAnswers>({
    title: '',
    goal: '',
    constraints: '',
    deadline: '',
    type: 'single',
    subject: '',
  })
  const [plan, setPlan] = useState<Record<PhaseKey, string[]> | null>(null)
  const [source, setSource] = useState<'ai' | 'fallback'>('fallback')

  function update<K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) {
    setAnswers((a) => ({ ...a, [key]: value }))
  }

  async function handleGenerate(e: FormEvent) {
    e.preventDefault()
    setGenerating(true)
    setError(null)
    try {
      const res = await generatePlan({ ...answers, deadline: answers.deadline || null })
      setPlan(res.checklistByPhase)
      setSource(res.source)
      setStep('review')
    } catch {
      setError('Plan konnte nicht erstellt werden. Bitte erneut versuchen.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleCreate() {
    if (!plan) return
    setCreating(true)
    setError(null)
    try {
      const id = await api.createProject({
        title: answers.title,
        subject: answers.subject || undefined,
        description: answers.goal,
        project_type: answers.type,
        deadline: answers.deadline || null,
        checklistByPhase: plan,
      })
      navigate(`/projekte/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Projekt konnte nicht erstellt werden.')
      setCreating(false)
    }
  }

  return (
    <>
      <Link to="/projekte" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Link>
      <PageHeader
        title="Neues Projekt"
        subtitle="Beantworte ein paar kurze Fragen – die KI erstellt daraus deinen IPERKA-Projektplan."
      />

      {step === 'form' && (
        <Card className="mx-auto max-w-2xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient text-white">
              <Wand2 className="h-6 w-6" />
            </span>
            <div>
              <h3 className="font-semibold text-ink">KI-geführtes Onboarding</h3>
              <p className="text-sm text-ink-muted">6 Fragen – danach generiert die KI deinen Plan.</p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <Field label="1. Wie lautet das Thema deines Projekts?">
              <input className="input" required value={answers.title} onChange={(e) => update('title', e.target.value)} placeholder="z.B. Webshop für den Schulkiosk" />
            </Field>
            <Field label="2. Was ist das konkrete Ziel?">
              <textarea className="input min-h-[80px]" required value={answers.goal} onChange={(e) => update('goal', e.target.value)} placeholder="Was soll am Ende vorliegen?" />
            </Field>
            <Field label="3. Welche Rahmenbedingungen gibt es? (optional)">
              <textarea className="input min-h-[60px]" value={answers.constraints} onChange={(e) => update('constraints', e.target.value)} placeholder="Umfang, Vorgaben, Mittel …" />
            </Field>
            <Field label="4. Abgabetermin">
              <input type="date" className="input max-w-xs" value={answers.deadline ?? ''} onChange={(e) => update('deadline', e.target.value)} />
            </Field>
            <Field label="5. Einzel- oder Gruppenarbeit?">
              <div className="grid grid-cols-2 gap-3">
                {(['single', 'team'] as ProjectType[]).map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => update('type', t)}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                      answers.type === t ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-black/10 text-ink-soft hover:bg-black/[0.03]'
                    }`}
                  >
                    {t === 'single' ? 'Einzelarbeit' : 'Gruppenarbeit'}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="6. Fach (optional)">
              <input className="input max-w-xs" value={answers.subject} onChange={(e) => update('subject', e.target.value)} placeholder="z.B. Informatik" />
            </Field>

            {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

            <button type="submit" className="btn-primary w-full" disabled={generating}>
              {generating ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : <Sparkles className="h-4 w-4" />}
              {generating ? 'KI erstellt deinen Plan …' : 'Plan generieren'}
            </button>
            <AIDisclaimer className="justify-center" />
          </form>
        </Card>
      )}

      {step === 'review' && plan && (
        <div className="mx-auto max-w-3xl space-y-6">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-ink">{answers.title}</h3>
                <p className="text-sm text-ink-muted">
                  {answers.type === 'team' ? 'Gruppenarbeit' : 'Einzelarbeit'}
                  {answers.subject ? ` · ${answers.subject}` : ''}
                  {answers.deadline ? ` · Abgabe ${formatDate(answers.deadline)}` : ''}
                </p>
              </div>
              <Badge tone={source === 'ai' ? 'violet' : 'gray'}>
                {source === 'ai' ? 'KI-Plan' : 'Standard-Plan'}
              </Badge>
            </div>
            {source === 'fallback' && (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Ohne verbundene KI wurde ein bewährter Standard-Plan verwendet. Du kannst ihn unten anpassen.
              </p>
            )}
          </Card>

          {answers.deadline && (
            <Card>
              <CardHeader title="Vorgeschlagener Zeitplan" subtitle="Wochenenden und Schweizer Feiertage grob berücksichtigt" />
              <SchedulePreview deadline={answers.deadline} />
            </Card>
          )}

          {PHASES.map((p) => (
            <PhasePlanEditor
              key={p.key}
              phaseKey={p.key}
              items={plan[p.key]}
              onChange={(items) => setPlan((prev) => (prev ? { ...prev, [p.key]: items } : prev))}
            />
          ))}

          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button className="btn-ghost" onClick={() => setStep('form')} disabled={creating}>
              ← Antworten anpassen
            </button>
            <button className="btn-primary" onClick={handleCreate} disabled={creating}>
              {creating ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : <Check className="h-4 w-4" />}
              Projekt erstellen
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

function SchedulePreview({ deadline }: { deadline: string }) {
  const schedule = buildSchedule(deadline)
  const max = Math.max(...schedule.map((s) => s.workdays), 1)
  return (
    <div className="space-y-2">
      {schedule.map((s) => (
        <div key={s.key} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-sm font-medium text-ink">{getPhase(s.key).title}</span>
          <div className="h-6 flex-1 overflow-hidden rounded-lg bg-black/[0.04]">
            <div
              className="flex h-full items-center rounded-lg bg-brand-gradient px-2 text-[11px] font-medium text-white"
              style={{ width: `${Math.max(14, (s.workdays / max) * 100)}%` }}
            >
              {formatDate(s.start).replace(/ \d{4}$/, '')} – {formatDate(s.end).replace(/ \d{4}$/, '')}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PhasePlanEditor({
  phaseKey,
  items,
  onChange,
}: {
  phaseKey: PhaseKey
  items: string[]
  onChange: (items: string[]) => void
}) {
  const phase = getPhase(phaseKey)
  const [newItem, setNewItem] = useState('')
  return (
    <Card>
      <div className="mb-3 flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-2xl ${phase.accent} text-sm font-bold`}>
          {phase.order}
        </span>
        <div>
          <p className="font-semibold text-ink">{phase.title}</p>
          <p className="text-xs text-ink-muted">{phase.short}</p>
        </div>
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-black/[0.02]">
            <span className="mt-0 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
            <span className="flex-1 text-sm text-ink-soft">{it}</span>
            <button className="text-ink-muted hover:text-rose-500" onClick={() => onChange(items.filter((_, idx) => idx !== i))} aria-label="Entfernen">
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center gap-2">
        <input
          className="input"
          placeholder="Aufgabe hinzufügen …"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (newItem.trim()) {
                onChange([...items, newItem.trim()])
                setNewItem('')
              }
            }
          }}
        />
        <button
          className="btn-outline px-3"
          onClick={() => {
            if (newItem.trim()) {
              onChange([...items, newItem.trim()])
              setNewItem('')
            }
          }}
          disabled={!newItem.trim()}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </Card>
  )
}
