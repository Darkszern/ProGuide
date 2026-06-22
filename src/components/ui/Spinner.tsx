import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Laedt"
      className={cn(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500',
        className,
      )}
    />
  )
}

export function LoadingScreen({ label = 'Wird geladen …' }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[40vh] w-full flex-col items-center justify-center gap-3 text-ink-muted">
      <Spinner className="h-7 w-7" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
      <p className="text-sm text-rose-700">{message}</p>
      {onRetry && (
        <button className="btn-outline" onClick={onRetry}>
          Erneut versuchen
        </button>
      )}
    </div>
  )
}
