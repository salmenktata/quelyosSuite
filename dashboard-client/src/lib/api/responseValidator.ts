/**
 * API Response Validator - Éviter duplication code validation
 *
 * Pattern répété 50+ fois dans api.ts :
 * ```ts
 * if (response.result?.success === false) {
 *   throw new Error(response.result.error || 'Erreur')
 * }
 * ```
 *
 * Ce helper centralise la logique et ajoute un typage strict.
 */

import type { APIResponse } from '@/types'
import { logger } from '@quelyos/logger'

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Valide une réponse API et extrait les données typées
 *
 * @throws {ApiError} Si réponse invalide ou success=false
 *
 * @example
 * ```ts
 * const response = await fetch('/api/products')
 * const products = validateApiResponse<Product[]>(await response.json())
 * ```
 */
export function validateApiResponse<T>(response: unknown): T {
  // Vérifier structure JSON-RPC
  if (!response || typeof response !== 'object') {
    logger.error('[API] Invalid response:', response)
    throw new ApiError('Réponse API invalide', 'INVALID_RESPONSE')
  }

  const apiResponse = response as Partial<APIResponse<T>>

  // Vérifier erreur JSON-RPC
  if ('error' in apiResponse && apiResponse.error) {
    const errorData = apiResponse.error as { message?: string; data?: { message?: string } }
    const errorMessage = errorData.data?.message || errorData.message || 'Erreur API'
    logger.error('[API] JSON-RPC error:', errorMessage)
    throw new ApiError(errorMessage, 'JSONRPC_ERROR')
  }

  // Vérifier présence result
  if (!('result' in apiResponse) || !apiResponse.result) {
    logger.error('[API] Missing result:', response)
    throw new ApiError('Réponse API invalide', 'MISSING_RESULT')
  }

  const result = apiResponse.result as APIResponse<T>

  // Vérifier success=false
  if ('success' in result && result.success === false) {
    const error = result.error || 'Erreur inconnue'
    const errorCode = (result as { error_code?: string }).error_code
    logger.error('[API] API returned error:', error, errorCode)
    throw new ApiError(error, errorCode)
  }

  // Extraire data si présent
  if ('data' in result && result.data !== undefined) {
    return result.data as T
  }

  // Sinon retourner result complet
  return result as T
}

/**
 * Valide une réponse API et retourne l'objet APIResponse complet
 * (sans extraire .data)
 *
 * @example
 * ```ts
 * const response = await fetch('/api/orders')
 * const apiResponse = validateApiResponseFull<Order[]>(await response.json())
 * console.log(apiResponse.success, apiResponse.data)
 * ```
 */
export function validateApiResponseFull<T>(response: unknown): APIResponse<T> {
  if (!response || typeof response !== 'object') {
    throw new ApiError('Réponse API invalide', 'INVALID_RESPONSE')
  }

  const apiResponse = response as Partial<APIResponse<T>>

  if ('error' in apiResponse && apiResponse.error) {
    const errorData = apiResponse.error as { message?: string; data?: { message?: string } }
    const errorMessage = errorData.data?.message || errorData.message || 'Erreur API'
    throw new ApiError(errorMessage, 'JSONRPC_ERROR')
  }

  if (!('result' in apiResponse) || !apiResponse.result) {
    throw new ApiError('Réponse API invalide', 'MISSING_RESULT')
  }

  const result = apiResponse.result as APIResponse<T>

  if (result.success === false) {
    const error = result.error || 'Erreur inconnue'
    const errorCode = (result as { error_code?: string }).error_code
    throw new ApiError(error, errorCode)
  }

  return result
}

/**
 * Wrapper try/catch pour appels API avec gestion erreurs uniforme
 *
 * @example
 * ```ts
 * const products = await withApiErrorHandling(
 *   () => api.getProducts({ limit: 10 }),
 *   { context: 'Chargement produits' }
 * )
 * ```
 */
export async function withApiErrorHandling<T>(
  apiCall: () => Promise<T>,
  options?: {
    context?: string
    fallback?: T
    onError?: (error: ApiError) => void
  }
): Promise<T> {
  try {
    return await apiCall()
  } catch (error) {
    const apiError = error instanceof ApiError
      ? error
      : new ApiError(
          error instanceof Error ? error.message : 'Erreur inconnue',
          'UNKNOWN_ERROR'
        )

    if (options?.context) {
      logger.error(`[API] ${options.context} - Error:`, apiError.message, apiError.code)
    }

    if (options?.onError) {
      options.onError(apiError)
    }

    if (options?.fallback !== undefined) {
      return options.fallback
    }

    throw apiError
  }
}

/**
 * Vérifie si une erreur est une ApiError avec un code spécifique
 */
export function isApiError(error: unknown, code?: string): error is ApiError {
  if (!(error instanceof ApiError)) return false
  if (code && error.code !== code) return false
  return true
}
