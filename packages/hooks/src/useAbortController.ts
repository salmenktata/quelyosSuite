/**
 * useAbortController - Éviter race conditions dans les requêtes fetch
 *
 * Annule automatiquement les requêtes en cours si :
 * - Le composant unmount
 * - Les dépendances changent
 * - Une nouvelle requête démarre
 *
 * Résout le problème : réponses out-of-order quand deps changent rapidement
 */

import { useEffect, useRef } from 'react'

export interface UseAbortControllerReturn {
  /**
   * AbortSignal à passer au fetch()
   */
  signal: AbortSignal

  /**
   * Annuler manuellement la requête en cours
   */
  abort: () => void

  /**
   * Vérifier si la requête a été annulée
   */
  isAborted: () => boolean
}

/**
 * Hook pour gérer l'annulation automatique des requêtes fetch
 *
 * @example
 * ```tsx
 * function ProductList({ searchQuery }) {
 *   const [products, setProducts] = useState([])
 *   const { signal } = useAbortController()
 *
 *   useEffect(() => {
 *     async function loadProducts() {
 *       const response = await fetch('/api/products?q=' + searchQuery, { signal })
 *       const data = await response.json()
 *       setProducts(data)
 *     }
 *     loadProducts()
 *   }, [searchQuery, signal])
 *
 *   return <div>{products.map(...)}</div>
 * }
 * ```
 */
export function useAbortController(): UseAbortControllerReturn {
  const controllerRef = useRef<AbortController | null>(null)

  // Créer un nouveau controller à chaque render
  if (!controllerRef.current || controllerRef.current.signal.aborted) {
    controllerRef.current = new AbortController()
  }

  const currentController = controllerRef.current

  // Cleanup : annuler au unmount ou avant le prochain render
  useEffect(() => {
    const controller = currentController

    return () => {
      controller.abort()
    }
  }, [currentController])

  return {
    signal: currentController.signal,
    abort: () => currentController.abort(),
    isAborted: () => currentController.signal.aborted,
  }
}

/**
 * Hook pour exécuter une fonction async avec abort automatique
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }) {
 *   const [user, setUser] = useState(null)
 *   const { execute, isLoading, error } = useAbortableFetch()
 *
 *   useEffect(() => {
 *     execute(async (signal) => {
 *       const res = await fetch(`/api/users/${userId}`, { signal })
 *       const data = await res.json()
 *       setUser(data)
 *     })
 *   }, [userId, execute])
 *
 *   if (isLoading) return <Spinner />
 *   if (error) return <Error message={error.message} />
 *   return <div>{user?.name}</div>
 * }
 * ```
 */
export function useAbortableFetch<T = unknown>() {
  const { signal, abort } = useAbortController()
  const isLoadingRef = useRef(false)
  const errorRef = useRef<Error | null>(null)

  async function execute(
    fetchFn: (signal: AbortSignal) => Promise<T>
  ): Promise<T | null> {
    // Annuler la requête précédente si en cours
    if (isLoadingRef.current) {
      abort()
    }

    isLoadingRef.current = true
    errorRef.current = null

    try {
      const result = await fetchFn(signal)
      isLoadingRef.current = false
      return result
    } catch (error) {
      // Ignorer les erreurs d'annulation (AbortError)
      if (error instanceof Error && error.name === 'AbortError') {
        isLoadingRef.current = false
        return null
      }

      // Autres erreurs
      isLoadingRef.current = false
      errorRef.current = error instanceof Error ? error : new Error(String(error))
      throw errorRef.current
    }
  }

  return {
    execute,
    signal,
    abort,
    isLoading: isLoadingRef.current,
    error: errorRef.current,
  }
}

/**
 * Wrapper fetch avec AbortController intégré
 *
 * @example
 * ```tsx
 * function ProductSearch({ query }) {
 *   const [products, setProducts] = useState([])
 *   const abortableFetch = useAbortableFetch()
 *
 *   useEffect(() => {
 *     abortableFetch(
 *       (signal) => fetch('/api/products?q=' + query, { signal })
 *     ).then(res => res?.json()).then(setProducts)
 *   }, [query])
 *
 *   return ...
 * }
 * ```
 */
export function createAbortableFetch() {
  const controller = new AbortController()

  return {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      fetch(input, { ...init, signal: controller.signal }),
    abort: () => controller.abort(),
    signal: controller.signal,
  }
}

/**
 * Hook pour debounce avec abort automatique
 * Combine debounce + AbortController pour optimiser les recherches
 *
 * @example
 * ```tsx
 * function SearchBar() {
 *   const [results, setResults] = useState([])
 *   const { debouncedExecute } = useDebouncedAbortFetch(300)
 *
 *   function handleSearch(query: string) {
 *     debouncedExecute(async (signal) => {
 *       const res = await fetch('/api/search?q=' + query, { signal })
 *       const data = await res.json()
 *       setResults(data)
 *     })
 *   }
 *
 *   return <input onChange={(e) => handleSearch(e.target.value)} />
 * }
 * ```
 */
export function useDebouncedAbortFetch<T = unknown>(delayMs: number = 300) {
  const { execute, ...rest } = useAbortableFetch<T>()
  const timeoutRef = useRef<NodeJS.Timeout>()

  function debouncedExecute(fetchFn: (signal: AbortSignal) => Promise<T>) {
    // Annuler le timeout précédent
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    return new Promise<T | null>((resolve, reject) => {
      timeoutRef.current = setTimeout(() => {
        execute(fetchFn).then(resolve).catch(reject)
      }, delayMs)
    })
  }

  // Cleanup timeout au unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    debouncedExecute,
    execute,
    ...rest,
  }
}
