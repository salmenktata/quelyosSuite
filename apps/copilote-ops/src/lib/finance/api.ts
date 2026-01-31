/**
 * API client for stock/finance operations
 */
import { API_BASE_URL } from '@/lib/api-base'
import { tokenService } from '@quelyos/auth'

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = tokenService.getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}

export const financeApi = {
  getStockValuation: () => fetchWithAuth('/api/stock/valuation'),
  getStockTurnover: (params?: { days?: number }) =>
    fetchWithAuth(`/api/stock/turnover${params?.days ? `?days=${params.days}` : ''}`),
  getReorderingRules: () => fetchWithAuth('/api/stock/reordering-rules'),
}
