import { cn } from '@/lib/utils'

export interface DonutSegment {
  label: string
  value: number
  color: string // CSS-Farbe
}

interface ProgressDonutProps {
  segments: DonutSegment[]
  size?: number
  thickness?: number
  /** Grosse Zahl in der Mitte (z.B. Prozent). Wenn nicht gesetzt, wird der
   *  Anteil des ersten Segments als Prozent angezeigt. */
  centerValue?: string
  centerLabel?: string
  className?: string
}

export function ProgressDonut({
  segments,
  size = 160,
  thickness = 18,
  centerValue,
  centerLabel,
  className,
}: ProgressDonutProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  let offset = 0
  const arcs = segments.map((seg) => {
    const fraction = total > 0 ? seg.value / total : 0
    const dash = fraction * circumference
    const arc = {
      color: seg.color,
      dasharray: `${dash} ${circumference - dash}`,
      dashoffset: -offset,
    }
    offset += dash
    return arc
  })

  const firstPct = total > 0 ? Math.round((segments[0].value / total) * 100) : 0
  const mainValue = centerValue ?? `${firstPct}%`

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth={thickness}
          />
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={thickness}
              strokeDasharray={arc.dasharray}
              strokeDashoffset={arc.dashoffset}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-ink">{mainValue}</span>
          {centerLabel && <span className="text-xs text-ink-muted">{centerLabel}</span>}
        </div>
      </div>
    </div>
  )
}

export function DonutLegend({ segments }: { segments: DonutSegment[] }) {
  return (
    <ul className="space-y-2">
      {segments.map((seg) => (
        <li key={seg.label} className="flex items-center gap-2 text-sm">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: seg.color }}
          />
          <span className="text-ink-soft">{seg.label}</span>
          <span className="ml-auto font-medium text-ink">{seg.value}</span>
        </li>
      ))}
    </ul>
  )
}
