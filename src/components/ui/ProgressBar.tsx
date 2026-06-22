import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number // 0..100
  className?: string
  /** Farbe je nach Ampel automatisch waehlen. */
  tone?: 'brand' | 'green' | 'amber' | 'red'
  showLabel?: boolean
}

const toneClass: Record<NonNullable<ProgressBarProps['tone']>, string> = {
  brand: 'bg-brand-500',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-rose-500',
}

export function ProgressBar({
  value,
  className,
  tone = 'brand',
  showLabel = false,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
        <div
          className={cn('h-full rounded-full transition-all duration-500', toneClass[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-10 shrink-0 text-right text-xs font-medium text-ink-soft">{pct}%</span>
      )}
    </div>
  )
}
