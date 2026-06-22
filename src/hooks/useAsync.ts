import { useCallback, useEffect, useState } from 'react'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
}

/** Lädt asynchrone Daten mit Lade-/Fehlerzustand und Reload-Möglichkeit. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoFn = useCallback(fn, deps)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    memoFn()
      .then((res) => {
        if (active) setData(res)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [memoFn, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, reload }
}
