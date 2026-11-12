import { useCallback, useEffect, useRef, useState } from 'react'

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncDataResult<T> {
  data: T | null
  status: AsyncStatus
  error: unknown
  reload: () => void
  setData: (next: T | null) => void
}

export function useAsyncData<T>(loader: () => Promise<T>, key: string | number = ''): AsyncDataResult<T> {
  const loaderRef = useRef(loader)
  loaderRef.current = loader
  const [data, setData] = useState<T | null>(null)
  const [status, setStatus] = useState<AsyncStatus>('loading')
  const [error, setError] = useState<unknown>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setError(null)
    loaderRef
      .current()
      .then((result) => {
        if (cancelled) return
        setData(result)
        setStatus('success')
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setError(cause)
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [key, tick])

  const reload = useCallback(() => setTick((value) => value + 1), [])

  return { data, status, error, reload, setData }
}

export function useInterval(callback: () => void, delay: number, enabled = true) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return
    const timer = window.setInterval(() => callbackRef.current(), delay)
    return () => window.clearInterval(timer)
  }, [delay, enabled])
}

export function useReducedMotionLocal() {
  const [reduced, setReduced] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = () => setReduced(media.matches)
    handler()
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])

  return reduced
}
