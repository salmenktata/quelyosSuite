/**
 * Hook useApiRequest - Centralisation fetch + error handling + retry
 *
 * Remplace les fetch directs par une approche unifiée utilisant API Gateway.
 * Gère automatiquement :
 * - Circuit breaker
 * - Retry avec exponential backoff
 * - Error handling
 * - Loading states
 * - Cache
 * - AbortController cleanup
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { gateway, type GatewayRequest } from '@/lib/api/gateway'
import { logger } from '@quelyos/logger'

export interface UseApiRequestOptions<T> {
  /** Endpoint URL (ex: '/api/products') */
  url: string
  /** Méthode HTTP */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Body de la requête */
  body?: unknown
  /** Query params */
  params?: Record<string, string | number | boolean | undefined>
  /** Headers additionnels */
  headers?: Record<string, string>
  /** Activer retry automatique */
  retry?: boolean
  /** Activer cache */
  cache?: boolean | number
  /** Callback succès */
  onSuccess?: (data: T) => void
  /** Callback erreur */
  onError?: (error: Error) => void
  /** Exécuter automatiquement au mount */
  immediate?: boolean
  /** Dépendances pour re-fetch */
  deps?: unknown[]
}

export interface UseApiRequestResult<T> {
  /** Données retournées */
  data: T | null
  /** État de chargement */
  loading: boolean
  /** Erreur si échec */
  error: Error | null
  /** Fonction pour déclencher la requête */
  execute: () => Promise<T | null>
  /** Fonction pour reset l'état */
  reset: () => void
  /** Fonction pour annuler la requête en cours */
  cancel: () => void
  /** Indique si la requête est annulée */
  cancelled: boolean
}

/**
 * Hook pour requêtes API avec gestion complète
 *
 * @example
 * // Fetch automatique au mount
 * const { data, loading, error } = useApiRequest<Product[]>({
 *   url: '/api/products',
 *   immediate: true
 * })
 *
 * @example
 * // Fetch manuel avec params
 * const { data, execute, loading } = useApiRequest<Product>({
 *   url: '/api/products',
 *   method: 'POST',
 *   body: { name: 'Product 1' }
 * })
 *
 * const handleSubmit = async () => {
 *   await execute()
 * }
 *
 * @example
 * // Avec cache et retry
 * const { data } = useApiRequest<Order[]>({
 *   url: '/api/orders',
 *   cache: 60000, // 1 minute
 *   retry: true,
 *   immediate: true,
 *   deps: [customerId] // Re-fetch si customerId change
 * })
 */
export function useApiRequest<T = unknown>(
  options: UseApiRequestOptions<T>
): UseApiRequestResult<T> {
  const {
    url,
    method = 'GET',
    body,
    params,
    headers,
    retry = true,
    cache = false,
    onSuccess,
    onError,
    immediate = false,
    deps = [],
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState<Error | null>(null)
  const [cancelled, setCancelled] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const executingRef = useRef(false)

  // Fonction pour annuler la requête en cours
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setCancelled(true)
      setLoading(false)
      logger.debug('[useApiRequest] Request cancelled:', url)
    }
  }, [url])

  // Fonction pour reset l'état
  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
    setCancelled(false)
  }, [])

  // Fonction principale pour exécuter la requête
  const execute = useCallback(async (): Promise<T | null> => {
    // Éviter les requêtes concurrentes
    if (executingRef.current) {
      logger.warn('[useApiRequest] Request already in progress:', url)
      return null
    }

    // Reset état
    setError(null)
    setLoading(true)
    setCancelled(false)
    executingRef.current = true

    // Créer AbortController
    abortControllerRef.current = new AbortController()

    try {
      // Construire la requête Gateway
      const request: GatewayRequest = {
        method,
        path: url,
        body,
        params,
        headers,
        retry,
        cache,
        signal: abortControllerRef.current.signal,
      }

      // Exécuter via API Gateway
      const response = await gateway.request<T>(request)

      // Vérifier si annulée
      if (abortControllerRef.current?.signal.aborted) {
        return null
      }

      // Succès
      setData(response.data)
      setError(null)
      onSuccess?.(response.data)

      logger.debug('[useApiRequest] Success:', url, response)

      return response.data
    } catch (_err) {
      // Vérifier si annulée
      if (abortControllerRef.current?.signal.aborted) {
        return null
      }

      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      setData(null)
      onError?.(error)

      logger.error('[useApiRequest] Error:', url, error)

      return null
    } finally {
      setLoading(false)
      executingRef.current = false
      abortControllerRef.current = null
    }
  }, [url, method, body, params, headers, retry, cache, onSuccess, onError])

  // Auto-fetch si immediate = true
  useEffect(() => {
    if (immediate) {
      execute()
    }

    // Cleanup : annuler la requête au unmount
    return () => {
      cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...deps])

  return {
    data,
    loading,
    error,
    execute,
    reset,
    cancel,
    cancelled,
  }
}

/**
 * Hook simplifié pour GET requests
 *
 * @example
 * const { data, loading, error, refetch } = useApiGet<Product[]>('/api/products')
 */
export function useApiGet<T = unknown>(
  url: string,
  options?: Omit<UseApiRequestOptions<T>, 'url' | 'method'>
) {
  const result = useApiRequest<T>({
    url,
    method: 'GET',
    immediate: true,
    ...options,
  })

  return {
    ...result,
    refetch: result.execute,
  }
}

/**
 * Hook simplifié pour POST requests
 *
 * @example
 * const { execute: createProduct, loading } = useApiPost<Product>('/api/products', { body: { name: 'Product 1' } })
 * await createProduct()
 */
export function useApiPost<T = unknown>(
  url: string,
  options?: Omit<UseApiRequestOptions<T>, 'url' | 'method'>
) {
  return useApiRequest<T>({
    url,
    method: 'POST',
    ...options,
  })
}

/**
 * Hook simplifié pour PUT requests
 */
export function useApiPut<T = unknown>(
  url: string,
  options?: Omit<UseApiRequestOptions<T>, 'url' | 'method'>
) {
  return useApiRequest<T>({
    url,
    method: 'PUT',
    ...options,
  })
}

/**
 * Hook simplifié pour DELETE requests
 */
export function useApiDelete<T = unknown>(
  url: string,
  options?: Omit<UseApiRequestOptions<T>, 'url' | 'method'>
) {
  return useApiRequest<T>({
    url,
    method: 'DELETE',
    ...options,
  })
}
