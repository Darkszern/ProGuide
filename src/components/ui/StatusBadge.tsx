import { cn } from '@/lib/utils'
import type { PhaseStatus, TaskStatus } from '@/types/db'

type Tone = 'gray' | 'blue' | 'amber' | 'green' | 'red' | 'violet'

const toneClass: Record<Tone, string> = {
  gray: 'bg-black/[0.05] text-ink-soft',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  green: 'bg-emerald-50 text-emerald-600',
  red: 'bg-rose-50 text-rose-600',
  violet: 'bg-brand-50 text-brand-600',
}

export function Badge({
  children,
  tone = 'gray',
  className,
}: {
  children: React.ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

const taskStatusMap: Record<TaskStatus, { label: string; tone: Tone }> = {
  open: { label: 'Offen', tone: 'gray' },
  in_progress: { label: 'In Bearbeitung', tone: 'blue' },
  review: { label: 'Review', tone: 'amber' },
  done: { label: 'Erledigt', tone: 'green' },
}

const phaseStatusMap: Record<PhaseStatus, { label: string; tone: Tone }> = {
  open: { label: 'Offen', tone: 'gray' },
  in_progress: { label: 'In Bearbeitung', tone: 'blue' },
  done: { label: 'Abgeschlossen', tone: 'green' },
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const m = taskStatusMap[status]
  return <Badge tone={m.tone}>{m.label}</Badge>
}

export function PhaseStatusBadge({ status }: { status: PhaseStatus }) {
  const m = phaseStatusMap[status]
  return <Badge tone={m.tone}>{m.label}</Badge>
}

/** Ampel-Punkt fuer Projekt-Status. */
export function TrafficDot({ tone }: { tone: 'green' | 'amber' | 'red' }) {
  const color = tone === 'green' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
  return <span className={cn('inline-block h-2.5 w-2.5 rounded-full', color)} />
}
