/**
 * API Base - Utilitaires pour les appels API
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8069'

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Utiliser session_id (auth principale) ou backend_session_token (legacy)
  const token = localStorage.getItem('session_id') || localStorage.getItem('backend_session_token')

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }

  return response.json()
}

export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}
