// Eigenes Export-Modul: Word (.docx), PDF, Praesentations-Zusammenfassung
// und Protokoll-Vorlage. Aufbereitung der Projektdaten an einer Stelle.
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
  AlignmentType,
} from 'docx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { saveAs } from 'file-saver'
import { PHASES } from './iperka'
import { formatDate } from './utils'
import type { ProjectFull, TaskView } from '@/data/types'
import type { PhaseStatus, TaskStatus } from '@/types/db'

export interface ExportData {
  title: string
  subject: string
  description: string
  type: string
  deadline: string
  members: string[]
  phases: Array<{
    title: string
    status: PhaseStatus
    start: string | null
    end: string | null
    checklist: Array<{ label: string; done: boolean }>
  }>
  tasks: Array<{ title: string; status: string; assignee: string; due: string }>
}

const phaseStatusLabel: Record<PhaseStatus, string> = {
  open: 'Offen',
  in_progress: 'In Bearbeitung',
  done: 'Abgeschlossen',
}
const taskStatusLabel: Record<TaskStatus, string> = {
  open: 'Offen',
  in_progress: 'In Bearbeitung',
  review: 'Review',
  done: 'Erledigt',
}

export function buildExportData(full: ProjectFull, tasks: TaskView[]): ExportData {
  const { project } = full
  return {
    title: project.title,
    subject: project.subject || '–',
    description: project.description || '–',
    type: project.project_type === 'team' ? 'Gruppenarbeit' : 'Einzelarbeit',
    deadline: project.deadline ? formatDate(project.deadline) : '–',
    members: full.members.map((m) => m.display_name),
    phases: PHASES.map((def) => {
      const pv = full.phases.find((p) => p.phase.key === def.key)
      return {
        title: def.title,
        status: pv?.phase.status ?? 'open',
        start: pv?.phase.start_date ?? null,
        end: pv?.phase.end_date ?? null,
        checklist: (pv?.checklist ?? []).map((c) => ({ label: c.label, done: c.is_done })),
      }
    }),
    tasks: tasks.map((t) => ({
      title: t.title,
      status: taskStatusLabel[t.status],
      assignee: t.assignee_name ?? '–',
      due: t.due_date ? formatDate(t.due_date) : '–',
    })),
  }
}

// ============================================================================
// Word (.docx)
// ============================================================================
export async function exportWord(data: ExportData): Promise<void> {
  const children: Paragraph[] = []

  children.push(
    new Paragraph({ text: data.title, heading: HeadingLevel.TITLE }),
    new Paragraph({
      children: [new TextRun({ text: `${data.type} · Fach: ${data.subject}`, italics: true, color: '6D5EF6' })],
    }),
    new Paragraph({ text: `Abgabe: ${data.deadline}` }),
    new Paragraph({ text: `Team: ${data.members.join(', ') || '–'}` }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: 'Ziel / Beschreibung', heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: data.description }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: 'IPERKA-Phasen', heading: HeadingLevel.HEADING_1 }),
  )

  data.phases.forEach((ph, i) => {
    children.push(
      new Paragraph({
        text: `${i + 1}. ${ph.title} – ${phaseStatusLabel[ph.status]}`,
        heading: HeadingLevel.HEADING_2,
      }),
    )
    if (ph.checklist.length === 0) {
      children.push(new Paragraph({ text: 'Keine Checklistenpunkte.', bullet: { level: 0 } }))
    }
    ph.checklist.forEach((c) =>
      children.push(
        new Paragraph({
          text: `${c.done ? '☑' : '☐'} ${c.label}`,
          bullet: { level: 0 },
        }),
      ),
    )
  })

  children.push(new Paragraph({ text: '' }), new Paragraph({ text: 'Aufgaben', heading: HeadingLevel.HEADING_1 }))

  const taskTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: ['Aufgabe', 'Status', 'Zustaendig', 'Faellig'].map(
          (h) =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
            }),
        ),
      }),
      ...data.tasks.map(
        (t) =>
          new TableRow({
            children: [t.title, t.status, t.assignee, t.due].map(
              (v) => new TableCell({ children: [new Paragraph({ text: v })] }),
            ),
          }),
      ),
    ],
  })

  children.push(new Paragraph({ text: '' }))

  children.push(new Paragraph({ text: '' }), new Paragraph({ text: 'Zeitplan', heading: HeadingLevel.HEADING_1 }))
  const scheduleTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: ['Phase', 'Von', 'Bis'].map(
          (h) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] }),
        ),
      }),
      ...data.phases.map(
        (p) =>
          new TableRow({
            children: [p.title, p.start ? formatDate(p.start) : '–', p.end ? formatDate(p.end) : '–'].map(
              (v) => new TableCell({ children: [new Paragraph({ text: v })] }),
            ),
          }),
      ),
    ],
  })

  const doc = new Document({
    sections: [{ children: [...children, taskTable, new Paragraph({ text: '' }), scheduleTable] }],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${safeName(data.title)}.docx`)
}

// ============================================================================
// PDF
// ============================================================================
export function exportPdf(data: ExportData): void {
  const doc = new jsPDF()
  const margin = 14
  let y = 20

  doc.setFontSize(20)
  doc.setTextColor('#1f2430')
  doc.text(data.title, margin, y)
  y += 8
  doc.setFontSize(11)
  doc.setTextColor('#6d5ef6')
  doc.text(`${data.type} · Fach: ${data.subject}`, margin, y)
  y += 6
  doc.setTextColor('#5b6172')
  doc.text(`Abgabe: ${data.deadline}    Team: ${data.members.join(', ') || '–'}`, margin, y)
  y += 10

  doc.setFontSize(13)
  doc.setTextColor('#1f2430')
  doc.text('Ziel / Beschreibung', margin, y)
  y += 6
  doc.setFontSize(10)
  doc.setTextColor('#5b6172')
  const desc = doc.splitTextToSize(data.description, 180)
  doc.text(desc, margin, y)
  y += desc.length * 5 + 6

  data.phases.forEach((ph, i) => {
    if (y > 250) {
      doc.addPage()
      y = 20
    }
    doc.setFontSize(12)
    doc.setTextColor('#1f2430')
    doc.text(`${i + 1}. ${ph.title} – ${phaseStatusLabel[ph.status]}`, margin, y)
    y += 5
    doc.setFontSize(9)
    doc.setTextColor('#5b6172')
    ph.checklist.forEach((c) => {
      if (y > 280) {
        doc.addPage()
        y = 20
      }
      doc.text(`${c.done ? '[x]' : '[ ]'} ${c.label}`, margin + 4, y)
      y += 5
    })
    y += 3
  })

  autoTable(doc, {
    startY: y > 250 ? 20 : y,
    head: [['Aufgabe', 'Status', 'Zustaendig', 'Faellig']],
    body: data.tasks.map((t) => [t.title, t.status, t.assignee, t.due]),
    headStyles: { fillColor: [109, 94, 246] },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  })

  autoTable(doc, {
    head: [['Phase', 'Von', 'Bis']],
    body: data.phases.map((p) => [p.title, p.start ? formatDate(p.start) : '–', p.end ? formatDate(p.end) : '–']),
    headStyles: { fillColor: [109, 94, 246] },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  })

  doc.save(`${safeName(data.title)}.pdf`)
}

// ============================================================================
// Praesentations-Zusammenfassung (kompakte Stichpunkte als PDF)
// ============================================================================
export function exportPresentation(data: ExportData): void {
  const doc = new jsPDF()
  const margin = 16
  let y = 24

  doc.setFontSize(22)
  doc.setTextColor('#1f2430')
  doc.text(data.title, margin, y)
  y += 9
  doc.setFontSize(12)
  doc.setTextColor('#6d5ef6')
  doc.text(`${data.type} · ${data.subject}`, margin, y)
  y += 14

  const bullet = (text: string, indent = 0) => {
    if (y > 275) {
      doc.addPage()
      y = 24
    }
    doc.setFontSize(11)
    doc.setTextColor('#1f2430')
    doc.text(`•  ${text}`, margin + indent, y)
    y += 8
  }
  const heading = (text: string) => {
    if (y > 265) {
      doc.addPage()
      y = 24
    }
    y += 2
    doc.setFontSize(14)
    doc.setTextColor('#4a37c8')
    doc.text(text, margin, y)
    y += 9
  }

  heading('Worum geht es?')
  doc.setFontSize(11)
  doc.setTextColor('#1f2430')
  const desc = doc.splitTextToSize(data.description, 175)
  doc.text(desc, margin, y)
  y += desc.length * 6 + 4

  heading('Vorgehen (IPERKA)')
  data.phases.forEach((p) => bullet(`${p.title}: ${phaseStatusLabel[p.status]}`))

  heading('Ergebnis & Stand')
  const total = data.phases.reduce((s, p) => s + p.checklist.length, 0)
  const done = data.phases.reduce((s, p) => s + p.checklist.filter((c) => c.done).length, 0)
  bullet(`${done} von ${total} Checklistenpunkten erledigt`)
  bullet(`Abgabe: ${data.deadline}`)
  if (data.members.length) bullet(`Team: ${data.members.join(', ')}`)

  doc.save(`${safeName(data.title)}-praesentation.pdf`)
}

// ============================================================================
// Protokoll-Vorlage (.docx)
// ============================================================================
export async function exportProtocol(data: ExportData): Promise<void> {
  const today = formatDate(new Date())
  const line = (label: string) =>
    new Paragraph({ children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun({ text: '' })] })

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: 'Sitzungsprotokoll', heading: HeadingLevel.TITLE }),
          new Paragraph({
            children: [new TextRun({ text: data.title, italics: true, color: '6D5EF6' })],
          }),
          new Paragraph({ text: '' }),
          line(`Datum (Vorlage: ${today})`),
          line('Anwesend'),
          line('Protokoll'),
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Traktanden', heading: HeadingLevel.HEADING_1 }),
          ...[1, 2, 3, 4].map(
            (n) => new Paragraph({ text: `${n}. `, bullet: { level: 0 } }),
          ),
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Beschluesse / Pendenzen', heading: HeadingLevel.HEADING_1 }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: ['Was', 'Wer', 'Bis wann'].map(
                  (h) =>
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
                    }),
                ),
              }),
              ...[0, 1, 2, 3].map(
                () =>
                  new TableRow({
                    children: ['', '', ''].map(
                      () => new TableCell({ children: [new Paragraph({ text: '' })] }),
                    ),
                  }),
              ),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [new TextRun({ text: 'Naechste Sitzung: ', bold: true })],
            alignment: AlignmentType.LEFT,
          }),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${safeName(data.title)}-protokoll.docx`)
}

function safeName(name: string): string {
  return name.replace(/[^\w\d-]+/g, '_').slice(0, 60) || 'projekt'
}
