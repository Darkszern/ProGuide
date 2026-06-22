import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { PHASES } from '@/lib/iperka'

export function Help() {
  return (
    <>
      <PageHeader
        title="Hilfe"
        subtitle="So funktioniert ProjectGuide und die IPERKA-Methode."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Was ist IPERKA?" />
          <p className="text-sm leading-relaxed text-ink-soft">
            IPERKA ist eine Methode, um Projekte strukturiert zu bearbeiten. Die sechs Buchstaben
            stehen fuer die sechs Phasen, die du nacheinander durchlaeufst. ProjectGuide fuehrt dich
            Schritt fuer Schritt durch jede Phase – mit Checklisten, Vorlagen und einem
            KI-Assistenten.
          </p>
          <ol className="mt-5 space-y-3">
            {PHASES.map((p) => (
              <li key={p.key} className="flex gap-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${p.accent} text-sm font-bold`}>
                  {p.order}
                </span>
                <div>
                  <p className="font-medium text-ink">{p.title}</p>
                  <p className="text-sm text-ink-muted">{p.short}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Schnellstart" />
            <ol className="list-decimal space-y-2 pl-4 text-sm text-ink-soft">
              <li>Lege ein neues Projekt an und beantworte die KI-Fragen.</li>
              <li>Die KI erstellt deinen Phasenplan und Zeitplan.</li>
              <li>Arbeite die Phasen der Reihe nach ab.</li>
              <li>Exportiere am Ende als Word oder PDF.</li>
            </ol>
          </Card>
          <Card>
            <CardHeader title="Hinweis zur KI" />
            <p className="text-sm text-ink-soft">
              Der KI-Assistent hilft dir beim Denken, ersetzt aber nicht dein eigenes Urteil. KI kann
              Fehler machen – ueberpruefe wichtige Informationen.
            </p>
          </Card>
        </div>
      </div>
    </>
  )
}
