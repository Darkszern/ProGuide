import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padded?: boolean
}

export function Card({ children, className, padded = true, ...rest }: CardProps) {
  return (
    <div className={cn('card', padded && 'p-5', className)} {...rest}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3 mb-4', className)}>
      <div>
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {subtitle && <p className="text-sm text-ink-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
