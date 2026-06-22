import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { PHASES } from '@/lib/iperka'
import { cn } from '@/lib/utils'
import type { PhaseKey, PhaseStatus } from '@/types/db'

interface PhaseStepperProps {
  projectId: string
  current: PhaseKey
  /** Status je Phase (optional). */
  statusByKey?: Partial<Record<PhaseKey, PhaseStatus>>
}

export function PhaseStepper({ projectId, current, statusByKey }: PhaseStepperProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PHASES.map((p) => {
        const status = statusByKey?.[p.key] ?? (p.key === current ? 'in_progress' : 'open')
        const isCurrent = p.key === current
        const done = status === 'done'
        return (
          <Link
            key={p.key}
            to={`/projekte/${projectId}/phase/${p.key}`}
            className={cn(
              'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors',
              isCurrent
                ? 'border-brand-300 bg-brand-50 text-brand-700'
                : done
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-black/[0.06] text-ink-soft hover:bg-black/[0.03]',
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold',
                done
                  ? 'bg-emerald-500 text-white'
                  : isCurrent
                    ? 'bg-brand-500 text-white'
                    : 'bg-black/[0.06] text-ink-soft',
              )}
            >
              {done ? <Check className="h-3 w-3" /> : p.order}
            </span>
            <span className="hidden sm:inline">{p.title}</span>
          </Link>
        )
      })}
    </div>
  )
}
