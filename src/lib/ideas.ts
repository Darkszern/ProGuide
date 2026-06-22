import type { PhaseKey, ProjectType } from '@/types/db'

export interface SavedIdea {
  id: string
  title: string
  goal: string
  constraints: string
  deadline: string | null
  type: ProjectType
  subject: string
  checklistByPhase: Record<PhaseKey, string[]>
  source: 'ai' | 'fallback'
  createdAt: string
}

const STORAGE_KEY = 'proguide-ideas'

function loadAll(): SavedIdea[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveAll(ideas: SavedIdea[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas))
}

export function saveIdea(
  answers: { title: string; goal: string; constraints: string; deadline: string | null; type: ProjectType; subject: string },
  checklistByPhase: Record<PhaseKey, string[]>,
  source: 'ai' | 'fallback',
): SavedIdea {
  const idea: SavedIdea = {
    id: crypto.randomUUID(),
    ...answers,
    checklistByPhase,
    source,
    createdAt: new Date().toISOString(),
  }
  const all = loadAll()
  all.unshift(idea)
  saveAll(all)
  return idea
}

export function listIdeas(): SavedIdea[] {
  return loadAll()
}

export function getIdea(id: string): SavedIdea | undefined {
  return loadAll().find((i) => i.id === id)
}

export function deleteIdea(id: string) {
  saveAll(loadAll().filter((i) => i.id !== id))
}
