import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { EmptyState } from './EmptyState'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/** Platzhalterseite mit konsistentem Look für noch nicht gebaute Bereiche. */
export function PlaceholderPage({
  title,
  subtitle,
  icon,
  note,
}: {
  title: string
  subtitle?: string
  icon: LucideIcon
  note?: string
}) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <EmptyState
        icon={icon}
        title="Dieser Bereich wird gerade gebaut"
        description={
          note ?? 'Hier entsteht die Funktion in einem der nächsten Schritte. Das Grundgerüst steht bereits.'
        }
      />
    </>
  )
}
