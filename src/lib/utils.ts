import { clsx, type ClassValue } from 'clsx'

/** Tailwind-Klassen bedingt zusammenfuehren. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

/** Tage bis zu einem Datum (negativ = überfällig). */
export function daysUntil(date: string | Date): number {
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

/** Deutsches Datum, z.B. "5. Juni 2026". */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '–'
  return new Date(date).toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Kurzes Datum, z.B. "05.06.26". */
export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return '–'
  return new Date(date).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

/** Relative Zeitangabe, z.B. "vor 3 Std.". */
export function timeAgo(date: string | Date): string {
  const d = new Date(date).getTime()
  const diff = Date.now() - d
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'gerade eben'
  if (min < 60) return `vor ${min} Min.`
  const h = Math.floor(min / 60)
  if (h < 24) return `vor ${h} Std.`
  const days = Math.floor(h / 24)
  if (days < 7) return `vor ${days} Tag${days === 1 ? '' : 'en'}`
  return formatDateShort(date)
}

/** Countdown-Text für Deadlines. */
export function deadlineLabel(date: string | null | undefined): string {
  if (!date) return 'Keine Deadline'
  const d = daysUntil(date)
  if (d < 0) return `${Math.abs(d)} Tag${Math.abs(d) === 1 ? '' : 'e'} überfällig`
  if (d === 0) return 'Heute faellig'
  if (d === 1) return 'Morgen faellig'
  return `in ${d} Tagen`
}

/** Kurzer, gut lesbarer Beitritts-Code (ohne verwechselbare Zeichen). */
export function generateJoinCode(length = 6): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

/** Dateigröße lesbar, z.B. "184 KB". */
export function formatBytes(bytes: number): string {
  if (!bytes) return '–'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/** Initialen aus einem Namen, z.B. "Max Muster" -> "MM". */
export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}
