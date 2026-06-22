import { askAI } from './ai'
import { PHASES, PHASE_KEYS, getPhase } from './iperka'
import type { PhaseKey, ProjectType } from '@/types/db'

export interface OnboardingAnswers {
  title: string
  goal: string
  constraints: string
  deadline: string | null
  type: ProjectType
  subject: string
}

export interface GeneratedPlan {
  checklistByPhase: Record<PhaseKey, string[]>
  source: 'ai' | 'fallback'
}

/** Standard-Checklisten als Fallback (ohne KI). */
function fallbackPlan(): Record<PhaseKey, string[]> {
  const result = {} as Record<PhaseKey, string[]>
  for (const key of PHASE_KEYS) {
    result[key] = [...getPhase(key).defaultChecklist]
  }
  return result
}

/**
 * Erzeugt anhand der Onboarding-Antworten einen IPERKA-Plan mit Checklisten
 * pro Phase. Nutzt die KI (Claude AI über Edge Function); fällt bei
 * Fehler oder im Demo-Modus auf sinnvolle Standard-Checklisten zurück.
 */
export async function generatePlan(answers: OnboardingAnswers): Promise<GeneratedPlan> {
  const fallback = fallbackPlan()

  const phaseList = PHASES.map((p) => `- ${p.key} (${p.title}): ${p.short}`).join('\n')
  const system =
    'Du bist eine erfahrene Lehrperson und Projektcoach an einer Berufsschule. ' +
    'Du erstellst fachlich passende, konkrete Checklisten für eine Projektarbeit nach der ' +
    'IPERKA-Methode. Antworte AUSSCHLIESSLICH mit gültigem JSON, ohne Erklärung.'
  const user =
    `Projekt-Thema: ${answers.title}\n` +
    `Ziel: ${answers.goal}\n` +
    `Rahmenbedingungen: ${answers.constraints || '–'}\n` +
    `Fach: ${answers.subject || '–'}\n` +
    `Art: ${answers.type === 'team' ? 'Gruppenarbeit' : 'Einzelarbeit'}\n` +
    `Abgabetermin: ${answers.deadline || 'offen'}\n\n` +
    `Erstelle für jede der 6 IPERKA-Phasen 3 bis 5 konkrete, auf das Thema zugeschnittene ` +
    `Checklisten-Aufgaben (kurze Imperativ-Sätze, Deutsch).\n` +
    `Phasen (Schlüssel verwenden):\n${phaseList}\n\n` +
    `Antwortformat (genau diese Schlüssel):\n` +
    `{"informieren":["..."],"planen":["..."],"entscheiden":["..."],` +
    `"realisieren":["..."],"kontrollieren":["..."],"auswerten":["..."]}`

  try {
    const res = await askAI(
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      { json: true, maxTokens: 1600, temperature: 0.5 },
    )
    if (res.provider === 'demo') {
      return { checklistByPhase: fallback, source: 'fallback' }
    }
    const parsed = JSON.parse(res.text) as Record<string, unknown>
    const result = {} as Record<PhaseKey, string[]>
    for (const key of PHASE_KEYS) {
      const arr = parsed[key]
      result[key] =
        Array.isArray(arr) && arr.length > 0
          ? arr.map((x) => String(x)).filter(Boolean).slice(0, 6)
          : fallback[key]
    }
    return { checklistByPhase: result, source: 'ai' }
  } catch {
    return { checklistByPhase: fallback, source: 'fallback' }
  }
}
