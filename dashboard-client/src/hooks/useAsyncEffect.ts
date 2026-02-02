import { useEffect, useRef, type DependencyList } from 'react'

/**
 * useEffect wrapper for async operations with automatic AbortController cleanup.
 * Prevents race conditions and state updates on unmounted components.
 *
 * @example
 * useAsyncEffect(async (signal) => {
 *   const data = await fetch('/api/data', { signal })
 *   if (!signal.aborted) setData(await data.json())
 * }, [deps])
 */
export function useAsyncEffect(
  effect: (signal: AbortSignal) => Promise<void>,
  deps: DependencyList,
) {
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    const controller = new AbortController()

    effect(controller.signal).catch((err) => {
      if (err instanceof DOMException && err.name === 'AbortError') return
      if (!mountedRef.current) return
      throw err
    })

    return () => {
      mountedRef.current = false
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
