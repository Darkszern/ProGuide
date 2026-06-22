import { cn } from '@/lib/utils'
import { initials } from '@/lib/utils'

interface AvatarProps {
  name?: string | null
  url?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClass = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
}

export function Avatar({ name, url, size = 'md', className }: AvatarProps) {
  if (url) {
    return (
      <img
        src={url}
        alt={name ?? 'Avatar'}
        className={cn('rounded-full object-cover', sizeClass[size], className)}
      />
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-brand-gradient font-semibold text-white',
        sizeClass[size],
        className,
      )}
      title={name ?? undefined}
    >
      {initials(name)}
    </span>
  )
}
