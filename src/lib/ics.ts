// Erzeugt iCalendar-(.ics)-Inhalte. Standardformat, das Outlook, Google
// Kalender und Apple Kalender importieren koennen.

export interface CalendarEvent {
  uid: string
  title: string
  date: string // YYYY-MM-DD (ganztaegig)
  description?: string
  /** Erinnerung X Tage vorher (Standard 1). */
  reminderDays?: number
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toICSDate(date: string): string {
  // YYYY-MM-DD -> YYYYMMDD
  return date.replace(/-/g, '')
}

function nextDay(date: string): string {
  const d = new Date(date)
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
}

function stamp(): string {
  const d = new Date()
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  )
}

/** Escapen gemaess RFC 5545. */
function esc(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function buildICS(events: CalendarEvent[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ProGuide//IPERKA//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const ev of events) {
    const reminder = ev.reminderDays ?? 1
    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.uid}@projectguide`,
      `DTSTAMP:${stamp()}`,
      `DTSTART;VALUE=DATE:${toICSDate(ev.date)}`,
      `DTEND;VALUE=DATE:${nextDay(ev.date)}`,
      `SUMMARY:${esc(ev.title)}`,
    )
    if (ev.description) lines.push(`DESCRIPTION:${esc(ev.description)}`)
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(ev.title)}`,
      `TRIGGER:-P${reminder}D`,
      'END:VALARM',
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')
  // CRLF gemaess Spezifikation.
  return lines.join('\r\n')
}
