import { logger } from '@quelyos/logger'

// En développement, utiliser le proxy Vite (pas de CORS)
// En production, utiliser l'URL complète
const API_URL = import.meta.env.VITE_API_URL || ''

interface BackendRpcResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Fonction générique pour appeler l'API backend via JSON-RPC
 * @param endpoint - L'endpoint de l'API (ex: '/api/ecommerce/pricelists')
 * @param params - Les paramètres à passer à l'API
 * @returns La réponse de l'API
 */
export async function backendRpc<T = unknown>(
  endpoint: string,
  params?: Record<string, any> | object
): Promise<BackendRpcResponse<T>> {
  const url = `${API_URL}${endpoint}`

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  // Ajouter le session_id si disponible
  // Utiliser Authorization au lieu de X-Session-Id pour compatibilité CORS
  const sessionId = localStorage.getItem('session_id')
  if (sessionId && sessionId !== 'null' && sessionId !== 'undefined') {
    headers['Authorization'] = `Bearer ${sessionId}`
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'omit',
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: params || {},
        id: Math.random(),
      }),
    })

    if (!response.ok) {
      if (response.status === 401 && !import.meta.env.DEV) {
        // Session expirée, nettoyer et rediriger (seulement en production)
        localStorage.removeItem('session_id')
        localStorage.removeItem('user')
        window.location.href = '/login'
        throw new Error('Session expirée')
      }
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
      }
    }

    const json = await response.json()

    if (json.error) {
      const errorMessage = json.error.data?.message || json.error.message || 'API Error'
      if (!import.meta.env.DEV && (errorMessage.toLowerCase().includes('session') || errorMessage.toLowerCase().includes('authentication'))) {
        // Rediriger vers login seulement en production
        localStorage.removeItem('session_id')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
      return {
        success: false,
        error: errorMessage,
      }
    }

    return {
      success: true,
      data: json.result,
    }
  } catch (error) {
    // Log technique (masqué en production pour sécurité)
    logger.error('[backendRpc] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
