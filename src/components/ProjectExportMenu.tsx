import { useState } from 'react'
import { FileDown, FileText, FileType, Presentation, ClipboardList, ChevronDown } from 'lucide-react'
import { api } from '@/data/api'
import { Spinner } from '@/components/ui/Spinner'

type Kind = 'pdf' | 'word' | 'presentation' | 'protocol'

export function ProjectExportMenu({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<Kind | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(kind: Kind) {
    setBusy(kind)
    setError(null)
    try {
      // Export-Bibliotheken (docx/jsPDF) erst bei Bedarf laden – haelt das
      // Haupt-Bundle klein.
      const xp = await import('@/lib/export')
      const full = await api.getProject(projectId)
      if (!full) throw new Error('Projekt nicht gefunden.')
      const tasks = await api.listProjectTasks(projectId)
      const data = xp.buildExportData(full, tasks)
      if (kind === 'pdf') xp.exportPdf(data)
      else if (kind === 'word') await xp.exportWord(data)
      else if (kind === 'presentation') xp.exportPresentation(data)
      else await xp.exportProtocol(data)
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export fehlgeschlagen')
    } finally {
      setBusy(null)
    }
  }

  const items: Array<{ kind: Kind; label: string; icon: typeof FileText }> = [
    { kind: 'pdf', label: 'Als PDF', icon: FileType },
    { kind: 'word', label: 'Als Word (.docx)', icon: FileText },
    { kind: 'presentation', label: 'Praesentations-Zusammenfassung', icon: Presentation },
    { kind: 'protocol', label: 'Protokoll-Vorlage', icon: ClipboardList },
  ]

  return (
    <div className="relative">
      <button className="btn-outline" onClick={() => setOpen((v) => !v)}>
        <FileDown className="h-4 w-4" /> Exportieren <ChevronDown className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-64 animate-fade-in rounded-xl border border-black/[0.06] bg-surface p-1.5 shadow-card">
            {items.map((it) => (
              <button
                key={it.kind}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-black/[0.04] disabled:opacity-50"
                onClick={() => run(it.kind)}
                disabled={busy !== null}
              >
                {busy === it.kind ? <Spinner className="h-4 w-4" /> : <it.icon className="h-4 w-4 text-brand-500" />}
                {it.label}
              </button>
            ))}
            {error && <p className="px-3 py-2 text-xs text-rose-600">{error}</p>}
          </div>
        </>
      )}
    </div>
  )
}
