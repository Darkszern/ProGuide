import { useState } from 'react'
import { FileText, Download } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/StatusBadge'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { PHASES } from '@/lib/iperka'

export function Templates() {
  const [busy, setBusy] = useState<string | null>(null)

  async function download(name: string) {
    setBusy(name)
    try {
      const mod = await import('@/lib/templates')
      await mod.downloadTemplate(name)
    } finally {
      setBusy(null)
    }
  }

  // Eindeutige Vorlagen über alle Phasen, mit zugehoeriger Phase.
  const seen = new Set<string>()
  const entries = PHASES.flatMap((phase) =>
    phase.vorlagen
      .filter((v) => (seen.has(v) ? false : (seen.add(v), true)))
      .map((v) => ({ name: v, phase })),
  )

  return (
    <>
      <PageHeader title="Vorlagen" subtitle="Vorlagen passend zu jeder IPERKA-Phase – als Word-Dokument herunterladen." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(({ name, phase }) => (
          <Card key={name} className="flex items-center gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${phase.accent}`}>
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">{name}</p>
              <Badge tone="gray" className="mt-1">{phase.title}</Badge>
            </div>
            <button
              className="btn-ghost px-2 disabled:opacity-50"
              onClick={() => download(name)}
              disabled={busy !== null}
              title="Als Word herunterladen"
            >
              {busy === name ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            </button>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-sm text-ink-muted">
        Die Vorlagen werden als bearbeitbare .docx-Datei erzeugt – ideal als Startpunkt für deine Dokumente.
      </p>
    </>
  )
}
