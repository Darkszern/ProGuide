import { saveAs } from 'file-saver'
import { buildICS, type CalendarEvent } from './ics'
import { buildSchedule } from './schedule'
import { getPhase } from './iperka'
import type { ProjectFull, ProjectListItem } from '@/data/types'

/** Laeuft die App als installierte Desktop-App (Electron)? */
export function isDesktop(): boolean {
  return typeof window !== 'undefined' && !!window.desktop
}

/**
 * Fuegt Termine zum Kalender hinzu. In der Desktop-App oeffnet sich die
 * .ics-Datei direkt in Outlook (bzw. der Standard-Kalender-App); im Browser
 * wird sie heruntergeladen und kann per Doppelklick importiert werden.
 */
export async function addToCalendar(filename: string, events: CalendarEvent[]): Promise<void> {
  const ics = buildICS(events)
  if (isDesktop() && window.desktop) {
    const res = await window.desktop.openIcs(filename, ics)
    if (res.ok) return
    // Bei Problemen: Fallback auf Download.
  }
  saveAs(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), filename)
}

/** Termine eines einzelnen Projekts (Abgabe + Phasen-Meilensteine). */
export function projectEvents(full: ProjectFull): CalendarEvent[] {
  const { project, phases } = full
  const events: CalendarEvent[] = []
  if (project.deadline) {
    events.push({
      uid: `proj-${project.id}-deadline`,
      title: `Abgabe: ${project.title}`,
      date: project.deadline,
      description: 'Projektabgabe (ProGuide)',
      reminderDays: 2,
    })
  }
  for (const pv of phases) {
    if (pv.phase.end_date) {
      const name = getPhase(pv.phase.key).title
      events.push({
        uid: `proj-${project.id}-phase-${pv.phase.key}`,
        title: `${name} fertig – ${project.title}`,
        date: pv.phase.end_date,
        description: `Phase "${name}" sollte abgeschlossen sein.`,
        reminderDays: 1,
      })
    }
  }
  return events
}

/** Termine aller Projekte (für den Kalender-Gesamtexport). */
export function eventsFromProjects(projects: ProjectListItem[]): CalendarEvent[] {
  const events: CalendarEvent[] = []
  for (const p of projects) {
    if (!p.deadline) continue
    events.push({
      uid: `proj-${p.id}-deadline`,
      title: `Abgabe: ${p.title}`,
      date: p.deadline,
      reminderDays: 2,
    })
    for (const s of buildSchedule(p.deadline)) {
      events.push({
        uid: `proj-${p.id}-phase-${s.key}`,
        title: `${getPhase(s.key).title} fertig – ${p.title}`,
        date: s.end,
        reminderDays: 1,
      })
    }
  }
  return events
}
