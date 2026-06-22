import type { Activity } from '@/types/db'
import { getPhase } from './iperka'
import type { PhaseKey } from '@/types/db'

/** Wandelt einen Aktivitaetseintrag in einen lesbaren deutschen Satz (ohne Akteur). */
export function activityText(a: Pick<Activity, 'type' | 'payload'>): string {
  const p = a.payload as Record<string, unknown>
  const title = typeof p.title === 'string' ? `„${p.title}“` : ''
  switch (a.type) {
    case 'task_done':
      return `hat die Aufgabe ${title} erledigt`
    case 'task_created':
      return `hat die Aufgabe ${title} erstellt`
    case 'comment_added':
      return 'hat einen Kommentar geschrieben'
    case 'file_uploaded':
      return `hat die Datei ${title} hochgeladen`
    case 'phase_done': {
      const key = p.phase as PhaseKey | undefined
      const name = key ? getPhase(key).title : ''
      return `hat die Phase „${name}“ abgeschlossen`
    }
    case 'project_created':
      return `hat das Projekt ${title} erstellt`
    case 'member_joined':
      return 'ist dem Projekt beigetreten'
    default:
      return 'hat eine Aktion ausgefuehrt'
  }
}
