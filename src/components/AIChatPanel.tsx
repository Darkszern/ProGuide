import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send } from 'lucide-react'
import { askAI, type AIMessage } from '@/lib/ai'
import { AIDisclaimer } from '@/components/ui/AIDisclaimer'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'

interface AIChatPanelProps {
  /** System-Kontext (Projekt + aktuelle Phase). */
  systemContext: string
  /** Vorgeschlagene Schnellfragen. */
  quickQuestions?: string[]
}

interface ChatItem {
  role: 'user' | 'assistant'
  content: string
}

export function AIChatPanel({ systemContext, quickQuestions = [] }: AIChatPanelProps) {
  const [items, setItems] = useState<ChatItem[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [items, loading])

  async function send(question: string) {
    const text = question.trim()
    if (!text || loading) return
    setInput('')
    const next: ChatItem[] = [...items, { role: 'user', content: text }]
    setItems(next)
    setLoading(true)
    try {
      const history: AIMessage[] = [
        { role: 'system', content: systemContext },
        ...next.map((i) => ({ role: i.role, content: i.content }) as AIMessage),
      ]
      const res = await askAI(history, { temperature: 0.5, maxTokens: 700 })
      setItems((prev) => [...prev, { role: 'assistant', content: res.text }])
    } catch (err) {
      setItems((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Entschuldigung, die KI ist gerade nicht erreichbar. Bitte versuche es später erneut.',
        },
      ])
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gradient text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">KI-Assistent</p>
          <p className="text-xs text-ink-muted">Fragen zur aktuellen Phase</p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="min-h-[180px] flex-1 space-y-3 overflow-y-auto rounded-xl bg-black/[0.02] p-3"
      >
        {items.length === 0 && !loading && (
          <p className="px-1 py-6 text-center text-sm text-ink-muted">
            Stelle eine Frage oder waehle eine Schnellfrage unten.
          </p>
        )}
        {items.map((item, i) => (
          <div
            key={i}
            className={cn('flex', item.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm',
                item.role === 'user'
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface text-ink shadow-soft',
              )}
            >
              {item.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <Spinner className="h-4 w-4" /> KI denkt nach …
          </div>
        )}
      </div>

      {quickQuestions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              disabled={loading}
              className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <input
          className="input"
          placeholder="Frage stellen …"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn-primary px-3" disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </button>
      </form>

      <AIDisclaimer className="mt-2" />
    </div>
  )
}
