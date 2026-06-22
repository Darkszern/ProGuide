import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 max-h-[90vh] w-full max-w-lg animate-fade-in overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-pop sm:rounded-2xl',
          className,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">{title}</div>
          <button className="rounded-lg p-1.5 text-ink-muted hover:bg-black/[0.04]" onClick={onClose} aria-label="Schliessen">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
