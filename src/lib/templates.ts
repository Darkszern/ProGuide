// Generiert Vorlagen-Dokumente (.docx) client-seitig. Wird per dynamischem
// Import geladen, damit die docx-Bibliothek nicht im Haupt-Bundle landet.
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx'
import { saveAs } from 'file-saver'

type Block =
  | { kind: 'p'; text: string }
  | { kind: 'h'; text: string }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'fields'; items: string[] }
  | { kind: 'table'; head: string[]; rows: number }

interface TemplateSpec {
  title: string
  intro?: string
  blocks: Block[]
}

const TEMPLATES: Record<string, TemplateSpec> = {
  Auftragsanalyse: {
    title: 'Auftragsanalyse',
    blocks: [
      { kind: 'fields', items: ['Projekttitel', 'Auftraggeber/Lehrperson', 'Datum'] },
      { kind: 'h', text: 'Ausgangslage' },
      { kind: 'p', text: '' },
      { kind: 'h', text: 'Ziel (in einem Satz)' },
      { kind: 'p', text: '' },
      { kind: 'h', text: 'Rahmenbedingungen' },
      { kind: 'bullets', items: ['Umfang:', 'Abgabeform:', 'Bewertungskriterien:', 'Mittel/Ressourcen:'] },
      { kind: 'h', text: 'Offene Fragen' },
      { kind: 'bullets', items: ['', '', ''] },
    ],
  },
  Quellenliste: {
    title: 'Quellenliste',
    blocks: [
      { kind: 'p', text: 'Notiere jede Quelle sofort mit vollstaendiger Angabe.' },
      { kind: 'table', head: ['Nr.', 'Quelle / Titel', 'Autor', 'Link / Fundstelle', 'Datum'], rows: 8 },
    ],
  },
  Disposition: {
    title: 'Disposition',
    blocks: [
      { kind: 'fields', items: ['Projekttitel', 'Name(n)', 'Klasse', 'Datum'] },
      { kind: 'h', text: '1. Thema und Ziel' },
      { kind: 'p', text: '' },
      { kind: 'h', text: '2. Ausgangslage / Problemstellung' },
      { kind: 'p', text: '' },
      { kind: 'h', text: '3. Vorgehen (IPERKA)' },
      { kind: 'bullets', items: ['Informieren', 'Planen', 'Entscheiden', 'Realisieren', 'Kontrollieren', 'Auswerten'] },
      { kind: 'h', text: '4. Zeitplan (Grob)' },
      { kind: 'p', text: '' },
      { kind: 'h', text: '5. Erwartetes Ergebnis' },
      { kind: 'p', text: '' },
    ],
  },
  'Zeitplan-Tabelle': {
    title: 'Zeitplan',
    blocks: [
      { kind: 'table', head: ['Phase / Arbeitsschritt', 'Von', 'Bis', 'Verantwortlich', 'Status'], rows: 10 },
    ],
  },
  Entscheidungsmatrix: {
    title: 'Entscheidungsmatrix',
    blocks: [
      { kind: 'p', text: 'Bewerte jede Variante pro Kriterium (z.B. 1–5). Hoechste Summe gewinnt.' },
      { kind: 'table', head: ['Kriterium', 'Gewicht', 'Variante A', 'Variante B', 'Variante C'], rows: 6 },
      { kind: 'h', text: 'Begruendung der Entscheidung' },
      { kind: 'p', text: '' },
    ],
  },
  Arbeitsprotokoll: {
    title: 'Arbeitsprotokoll',
    blocks: [
      { kind: 'table', head: ['Datum', 'Taetigkeit', 'Dauer', 'Bemerkung / Probleme'], rows: 10 },
    ],
  },
  'Foto-/Ergebnisdokumentation': {
    title: 'Ergebnisdokumentation',
    blocks: [
      { kind: 'fields', items: ['Projekttitel', 'Datum'] },
      { kind: 'h', text: 'Beschreibung des Ergebnisses' },
      { kind: 'p', text: '' },
      { kind: 'h', text: 'Bilder / Belege' },
      { kind: 'p', text: '(Fotos hier einfuegen, jeweils mit kurzer Bildunterschrift)' },
    ],
  },
  'Test-/Pruefprotokoll': {
    title: 'Pruefprotokoll',
    blocks: [
      { kind: 'table', head: ['Was wird geprueft?', 'Erwartet', 'Ergebnis', 'OK?', 'Massnahme'], rows: 10 },
    ],
  },
  'Abgabe-Checkliste': {
    title: 'Abgabe-Checkliste',
    blocks: [
      { kind: 'bullets', items: ['Dokument vollstaendig (Titelblatt, Inhalt, Quellen)', 'Rechtschreibung geprueft', 'Formatvorgaben eingehalten', 'Alle Anhaenge dabei', 'Abgabeform korrekt (Druck/PDF)', 'Termin eingehalten'] },
    ],
  },
  Reflexionsbogen: {
    title: 'Reflexionsbogen',
    blocks: [
      { kind: 'h', text: 'Was lief gut?' },
      { kind: 'p', text: '' },
      { kind: 'h', text: 'Was war schwierig?' },
      { kind: 'p', text: '' },
      { kind: 'h', text: 'Was wuerde ich beim naechsten Mal anders machen?' },
      { kind: 'p', text: '' },
      { kind: 'h', text: 'Fazit (Bezug zum Ziel)' },
      { kind: 'p', text: '' },
    ],
  },
  'Praesentations-Leitfaden': {
    title: 'Praesentations-Leitfaden',
    blocks: [
      { kind: 'bullets', items: ['Einstieg / Aufhaenger', 'Ziel des Projekts', 'Vorgehen (IPERKA kurz)', 'Ergebnis zeigen', 'Schwierigkeiten & Loesungen', 'Fazit & Ausblick', 'Fragen'] },
      { kind: 'h', text: 'Notizen / Stichworte' },
      { kind: 'p', text: '' },
    ],
  },
}

function genericSpec(name: string): TemplateSpec {
  return {
    title: name,
    blocks: [
      { kind: 'fields', items: ['Projekttitel', 'Name(n)', 'Datum'] },
      { kind: 'h', text: 'Inhalt' },
      { kind: 'p', text: '' },
    ],
  }
}

function renderBlocks(blocks: Block[]): Array<Paragraph | Table> {
  const out: Array<Paragraph | Table> = []
  for (const b of blocks) {
    if (b.kind === 'h') {
      out.push(new Paragraph({ text: b.text, heading: HeadingLevel.HEADING_1 }))
    } else if (b.kind === 'p') {
      out.push(new Paragraph({ text: b.text || ' ' }))
    } else if (b.kind === 'bullets') {
      b.items.forEach((it) => out.push(new Paragraph({ text: it || ' ', bullet: { level: 0 } })))
    } else if (b.kind === 'fields') {
      b.items.forEach((label) =>
        out.push(new Paragraph({ children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun('________________________')] })),
      )
    } else if (b.kind === 'table') {
      out.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: b.head.map(
                (h) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] }),
              ),
            }),
            ...Array.from({ length: b.rows }, () =>
              new TableRow({
                children: b.head.map(() => new TableCell({ children: [new Paragraph({ text: ' ' })] })),
              }),
            ),
          ],
        }),
      )
    }
  }
  return out
}

export async function downloadTemplate(name: string): Promise<void> {
  const spec = TEMPLATES[name] ?? genericSpec(name)
  const children: Array<Paragraph | Table> = [
    new Paragraph({ text: spec.title, heading: HeadingLevel.TITLE }),
  ]
  if (spec.intro) children.push(new Paragraph({ text: spec.intro }))
  children.push(new Paragraph({ text: ' ' }), ...renderBlocks(spec.blocks))

  const doc = new Document({ sections: [{ children }] })
  const blob = await Packer.toBlob(doc)
  const safe = name.replace(/[^\w\d-]+/g, '_')
  saveAs(blob, `vorlage-${safe}.docx`)
}
