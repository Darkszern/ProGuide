import { useRef, useState } from 'react'
import { FolderOpen, Upload, Download, Trash2, FileText } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingScreen, ErrorState, Spinner } from '@/components/ui/Spinner'
import { Avatar } from '@/components/ui/Avatar'
import { api } from '@/data/api'
import { useAsync } from '@/hooks/useAsync'
import { formatBytes, timeAgo } from '@/lib/utils'

export function Files() {
  const projects = useAsync(() => api.listProjects(), [])
  const [projectId, setProjectId] = useState<string>('')

  const activeProjectId = projectId || projects.data?.[0]?.id || ''

  return (
    <>
      <PageHeader title="Dateien" subtitle="Dokumente und Materialien zu deinen Projekten." />

      {projects.loading && <LoadingScreen />}
      {projects.error && <ErrorState message={projects.error} onRetry={projects.reload} />}

      {projects.data && projects.data.length === 0 && (
        <EmptyState icon={FolderOpen} title="Noch keine Projekte" description="Lege zuerst ein Projekt an, um Dateien hochzuladen." />
      )}

      {projects.data && projects.data.length > 0 && (
        <>
          <div className="mb-5 max-w-sm">
            <label className="label">Projekt</label>
            <select className="input" value={activeProjectId} onChange={(e) => setProjectId(e.target.value)}>
              {projects.data.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          {activeProjectId && <FileList projectId={activeProjectId} />}
        </>
      )}
    </>
  )
}

function FileList({ projectId }: { projectId: string }) {
  const { data, loading, error, reload } = useAsync(() => api.listFiles(projectId), [projectId])
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        await api.uploadFile(projectId, file)
      }
      reload()
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function download(url: string | null, name: string) {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
  }

  return (
    <Card>
      <CardHeader title="Dateien" subtitle={data ? `${data.length} Datei${data.length === 1 ? '' : 'en'}` : undefined} />

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          upload(e.dataTransfer.files)
        }}
        className={`mb-5 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          dragOver ? 'border-brand-400 bg-brand-50' : 'border-black/10'
        }`}
      >
        <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
          {uploading ? <Spinner className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
        </span>
        <p className="text-sm text-ink-soft">Dateien hierher ziehen oder</p>
        <button className="btn-outline mt-2" onClick={() => inputRef.current?.click()} disabled={uploading}>
          Datei auswaehlen
        </button>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
      </div>

      {loading && <Spinner className="h-5 w-5" />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && data.length === 0 && !loading && (
        <p className="py-4 text-center text-sm text-ink-muted">Noch keine Dateien hochgeladen.</p>
      )}

      {data && data.length > 0 && (
        <ul className="divide-y divide-black/[0.05]">
          {data.map((f) => (
            <li key={f.id} className="flex items-center gap-3 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] text-ink-soft">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{f.name}</p>
                <p className="flex items-center gap-2 text-xs text-ink-muted">
                  {f.size > 0 && <span>{formatBytes(f.size)}</span>}
                  <span>· {timeAgo(f.created_at)}</span>
                </p>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <Avatar name={f.uploader_name} size="sm" />
              </div>
              <button
                className="text-ink-muted hover:text-brand-600 disabled:opacity-30"
                onClick={() => download(f.url, f.name)}
                disabled={!f.url}
                title={f.url ? 'Herunterladen' : 'Im Demo-Modus nach Reload nicht verfuegbar'}
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                className="text-ink-muted hover:text-rose-500"
                onClick={async () => {
                  await api.deleteFile(f.id)
                  reload()
                }}
                title="Loeschen"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
