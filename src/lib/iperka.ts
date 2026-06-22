import type { PhaseKey } from '@/types/db'

export interface PhaseGuide {
  key: PhaseKey
  order: number // 1..6
  title: string
  short: string // Kurzbeschreibung
  why: string // "Warum dieser Schritt wichtig ist"
  weight: number // Anteil am Zeitplan (Summe = 1)
  accent: string // Tailwind-Farbklasse für Icon-Kreis
  defaultChecklist: string[]
  tipps: string[]
  fehler: string[]
  vorlagen: string[]
  lehrercheck: string[]
}

/**
 * Die 6 IPERKA-Phasen mit fachunabhaengigen Standard-Inhalten.
 * Dienen als Fallback, wenn keine KI verfügbar ist, und als
 * Basis-Checklisten beim Anlegen eines Projekts.
 */
export const PHASES: PhaseGuide[] = [
  {
    key: 'informieren',
    order: 1,
    title: 'Informieren',
    short: 'Thema verstehen, Auftrag klaeren, Informationen sammeln.',
    why: 'Ein klar verstandener Auftrag und gute Recherche sind das Fundament. Wer hier sauber arbeitet, vermeidet später teure Kurskorrekturen.',
    weight: 0.15,
    accent: 'bg-blue-100 text-blue-600',
    defaultChecklist: [
      'Auftrag und Ziel in eigenen Worten formuliert',
      'Rahmenbedingungen geklaert (Umfang, Abgabeform, Bewertung)',
      'Wichtigste Quellen recherchiert und notiert',
      'Offene Fragen an die Lehrperson gesammelt',
    ],
    tipps: [
      'Formuliere das Ziel als einen einzigen klaren Satz.',
      'Notiere Quellen sofort mit Link/Seitenzahl für das Quellenverzeichnis.',
    ],
    fehler: [
      'Sofort loslegen, ohne den Auftrag genau zu lesen.',
      'Zu breit recherchieren und sich verzetteln.',
    ],
    vorlagen: ['Auftragsanalyse', 'Quellenliste'],
    lehrercheck: ['Zielsatz', 'Liste der wichtigsten Quellen', 'Offene Fragen'],
  },
  {
    key: 'planen',
    order: 2,
    title: 'Planen',
    short: 'Vorgehen, Zeitplan und benoetigte Mittel festlegen.',
    why: 'Ein realistischer Plan macht den Aufwand sichtbar und zeigt frühzeitig, ob die Zeit reicht. Er ist auch deine Grundlage für den Lehrercheck.',
    weight: 0.15,
    accent: 'bg-violet-100 text-violet-600',
    defaultChecklist: [
      'Arbeitsschritte in Teilaufgaben zerlegt',
      'Zeitplan mit Meilensteinen erstellt',
      'Benoetigte Materialien/Werkzeuge aufgelistet',
      'Bei Gruppenarbeit: Aufgaben verteilt',
    ],
    tipps: [
      'Plane Pufferzeit für Unvorhergesehenes ein.',
      'Setze pro Phase einen konkreten Meilenstein mit Datum.',
    ],
    fehler: ['Zu optimistisch planen.', 'Abhängigkeiten zwischen Aufgaben übersehen.'],
    vorlagen: ['Disposition', 'Zeitplan-Tabelle'],
    lehrercheck: ['Disposition', 'Zeitplan mit Meilensteinen', 'Aufgabenverteilung'],
  },
  {
    key: 'entscheiden',
    order: 3,
    title: 'Entscheiden',
    short: 'Aus Varianten die beste Lösung begründet auswählen.',
    why: 'Eine nachvollziehbar begründete Entscheidung zeigt dein Urteilsvermoegen und ist ein zentrales Bewertungskriterium.',
    weight: 0.1,
    accent: 'bg-amber-100 text-amber-600',
    defaultChecklist: [
      'Mögliche Lösungsvarianten gesammelt',
      'Varianten nach Kriterien bewertet',
      'Entscheidung getroffen und begründet',
      'Entscheidung mit Lehrperson/Team abgestimmt',
    ],
    tipps: [
      'Nutze eine einfache Bewertungstabelle (Kriterien x Varianten).',
      'Halte fest, WARUM du dich entschieden hast.',
    ],
    fehler: ['Nur eine Variante betrachten.', 'Entscheidung nicht dokumentieren.'],
    vorlagen: ['Entscheidungsmatrix'],
    lehrercheck: ['Variantenvergleich', 'Begruendete Entscheidung'],
  },
  {
    key: 'realisieren',
    order: 4,
    title: 'Realisieren',
    short: 'Die geplante Lösung umsetzen und dokumentieren.',
    why: 'Hier entsteht das eigentliche Produkt. Laufende Dokumentation spart dir am Ende viel Zeit beim Bericht.',
    weight: 0.35,
    accent: 'bg-emerald-100 text-emerald-600',
    defaultChecklist: [
      'Umsetzung gemaess Plan begonnen',
      'Zwischenstand laufend dokumentiert (Fotos/Notizen)',
      'Abweichungen vom Plan festgehalten',
      'Produkt/Ergebnis fertiggestellt',
    ],
    tipps: [
      'Dokumentiere waehrend der Arbeit, nicht erst danach.',
      'Halte dich an den Zeitplan und passe ihn bei Bedarf an.',
    ],
    fehler: ['Dokumentation auf den Schluss verschieben.', 'Vom Plan abweichen ohne Notiz.'],
    vorlagen: ['Arbeitsprotokoll', 'Foto-/Ergebnisdokumentation'],
    lehrercheck: ['Aktueller Arbeitsstand', 'Arbeitsprotokoll', 'Notizen zu Abweichungen'],
  },
  {
    key: 'kontrollieren',
    order: 5,
    title: 'Kontrollieren',
    short: 'Ergebnis prüfen: Ziele erreicht? Qualität stimmt?',
    why: 'Die Kontrolle stellt sicher, dass dein Ergebnis den Anforderungen entspricht – und du Fehler vor der Abgabe findest, nicht die Lehrperson.',
    weight: 0.15,
    accent: 'bg-rose-100 text-rose-600',
    defaultChecklist: [
      'Ergebnis mit den Zielen aus Phase 1 verglichen',
      'Funktion/Qualität getestet',
      'Maengel behoben oder dokumentiert',
      'Vollständigkeit der Abgabe geprüft',
    ],
    tipps: [
      'Pruefe gegen deinen urspruenglichen Zielsatz.',
      'Lass jemanden gegenlesen/gegentesten.',
    ],
    fehler: ['Nur das eigene Werk bewundern.', 'Abgabeanforderungen nicht abhaken.'],
    vorlagen: ['Test-/Pruefprotokoll', 'Abgabe-Checkliste'],
    lehrercheck: ['Pruefprotokoll', 'Soll-Ist-Vergleich'],
  },
  {
    key: 'auswerten',
    order: 6,
    title: 'Auswerten',
    short: 'Prozess reflektieren, Fazit ziehen, Praesentation vorbereiten.',
    why: 'Die Reflexion zeigt, was du gelernt hast. Eine ehrliche Auswertung ist oft das, was eine gute von einer sehr guten Arbeit unterscheidet.',
    weight: 0.1,
    accent: 'bg-indigo-100 text-indigo-600',
    defaultChecklist: [
      'Vorgehen und Ergebnis kritisch reflektiert',
      'Was lief gut / was würde ich anders machen?',
      'Fazit formuliert',
      'Praesentation / Abgabe vorbereitet',
    ],
    tipps: [
      'Sei ehrlich – auch über Schwierigkeiten.',
      'Verbinde dein Fazit mit dem Ziel aus Phase 1.',
    ],
    fehler: ['Reflexion auf "war gut" verkuerzen.', 'Praesentation erst am Vortag vorbereiten.'],
    vorlagen: ['Reflexionsbogen', 'Praesentations-Leitfaden'],
    lehrercheck: ['Reflexion', 'Fazit', 'Praesentationsunterlagen'],
  },
]

export const PHASE_KEYS = PHASES.map((p) => p.key)

export function getPhase(key: PhaseKey): PhaseGuide {
  const p = PHASES.find((x) => x.key === key)
  if (!p) throw new Error(`Unbekannte Phase: ${key}`)
  return p
}

export function phaseOrder(key: PhaseKey): number {
  return getPhase(key).order
}
