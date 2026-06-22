import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Dezenter Hinweis gemaess Auftrag. */
export function AIDisclaimer({ className }: { className?: string }) {
  return (
    <p className={cn('flex items-center gap-1.5 text-xs text-ink-muted', className)}>
      <Sparkles className="h-3.5 w-3.5 shrink-0 text-brand-400" />
      KI kann Fehler machen. Überpruefe wichtige Informationen.
    </p>
  )
}
