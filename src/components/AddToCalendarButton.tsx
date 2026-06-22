import { useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { addToCalendar, isDesktop } from '@/lib/calendar'
import type { CalendarEvent } from '@/lib/ics'

interface Props {
  events: CalendarEvent[]
  filename: string
  className?: string
  label?: string
}

export function AddToCalendarButton({ events, filename, className, label }: Props) {
  const [busy, setBusy] = useState(false)
  const desktop = isDesktop()
  const text = label ?? (desktop ? 'Zu Outlook hinzufügen' : 'In Kalender (.ics)')

  async function run() {
    if (events.length === 0) return
    setBusy(true)
    try {
      await addToCalendar(filename, events)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      className={className ?? 'btn-outline'}
      onClick={run}
      disabled={busy || events.length === 0}
      title={desktop ? 'Termine direkt in Outlook öffnen' : 'Kalenderdatei herunterladen (Outlook/Google/Apple)'}
    >
      {busy ? <Spinner className="h-4 w-4" /> : <CalendarPlus className="h-4 w-4" />}
      {text}
    </button>
  )
}
