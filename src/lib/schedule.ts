import type { PhaseKey } from '@/types/db'
import { PHASES } from './iperka'

export interface PhaseSchedule {
  key: PhaseKey
  start: string // YYYY-MM-DD
  end: string // YYYY-MM-DD
  workdays: number
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Oster-Sonntag (Gauss/Anonymous Gregorian algorithm). */
function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + days)
  return r
}

/**
 * Wichtigste Schweizer Feiertage (national + verbreitet regional) eines
 * Jahres als Set von 'YYYY-MM-DD'. Bewusst "grob" gemaess Auftrag.
 */
export function swissHolidays(year: number): Set<string> {
  const easter = easterSunday(year)
  const days: Date[] = [
    new Date(year, 0, 1), // Neujahr
    new Date(year, 0, 2), // Berchtoldstag
    addDays(easter, -2), // Karfreitag
    addDays(easter, 1), // Ostermontag
    new Date(year, 4, 1), // Tag der Arbeit
    addDays(easter, 39), // Auffahrt
    addDays(easter, 50), // Pfingstmontag
    new Date(year, 7, 1), // Bundesfeier
    new Date(year, 11, 25), // Weihnachten
    new Date(year, 11, 26), // Stephanstag
  ]
  return new Set(days.map(toISODate))
}

function isWeekend(d: Date): boolean {
  const day = d.getDay()
  return day === 0 || day === 6
}

/** Zaehlt Arbeitstage (ohne WE/Feiertage) zwischen zwei Daten, inklusive. */
function countWorkdays(start: Date, end: Date): number {
  let count = 0
  const cur = new Date(start)
  const holidayCache = new Map<number, Set<string>>()
  while (cur <= end) {
    const y = cur.getFullYear()
    if (!holidayCache.has(y)) holidayCache.set(y, swissHolidays(y))
    if (!isWeekend(cur) && !holidayCache.get(y)!.has(toISODate(cur))) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

/**
 * Verteilt die 6 IPERKA-Phasen über den Zeitraum von heute bis zur
 * Deadline – gewichtet nach Phasen-Aufwand, Wochenenden und Schweizer
 * Feiertage werden grob berücksichtigt.
 */
export function buildSchedule(deadline: string, from?: Date): PhaseSchedule[] {
  const start = from ? new Date(from) : new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(deadline)
  end.setHours(0, 0, 0, 0)

  // Liste aller verfügbaren Arbeitstage (als Date-Objekte).
  const workdays: Date[] = []
  const cur = new Date(start)
  const holidayCache = new Map<number, Set<string>>()
  while (cur <= end) {
    const y = cur.getFullYear()
    if (!holidayCache.has(y)) holidayCache.set(y, swissHolidays(y))
    if (!isWeekend(cur) && !holidayCache.get(y)!.has(toISODate(cur))) {
      workdays.push(new Date(cur))
    }
    cur.setDate(cur.getDate() + 1)
  }

  const total = workdays.length
  const result: PhaseSchedule[] = []

  // Fallback: zu wenig Zeit -> jede Phase bekommt mind. einen Tag,
  // über den verfügbaren Zeitraum gleichmäßig verteilt.
  if (total < PHASES.length) {
    const span = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000))
    const per = span / PHASES.length
    PHASES.forEach((p, idx) => {
      const s = addDays(start, Math.round(idx * per))
      const e = addDays(start, Math.round((idx + 1) * per) - 1)
      result.push({
        key: p.key,
        start: toISODate(s),
        end: toISODate(e < s ? s : e),
        workdays: 1,
      })
    })
    return result
  }

  let cursor = 0
  PHASES.forEach((p, idx) => {
    const isLast = idx === PHASES.length - 1
    let days = Math.max(1, Math.round(total * p.weight))
    if (isLast) days = Math.max(1, total - cursor) // Rest der letzten Phase
    const startIdx = Math.min(cursor, total - 1)
    const endIdx = Math.min(cursor + days - 1, total - 1)
    result.push({
      key: p.key,
      start: toISODate(workdays[startIdx]),
      end: toISODate(workdays[endIdx]),
      workdays: endIdx - startIdx + 1,
    })
    cursor = endIdx + 1
  })

  return result
}

export { countWorkdays, toISODate }
