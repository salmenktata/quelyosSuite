/**
 * API Finance - Wrapper pour les appels API du module finance
 * Utilise l'API ecommerce du backend via le proxy Vite
 */

import { logger } from '@/lib/logger'
import { tokenService } from '@/lib/tokenService'

// Utiliser URLs relatives en dev et prod pour profiter du proxy Vite/Next.js
// Le proxy Vite gère /api/ecommerce -> http://localhost:8069/api/ecommerce
const API_BASE_URL = ''

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

interface _ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Fonction API callable pour le module finance
 * Usage: api('/endpoint') ou api('/endpoint', { method: 'POST', body: {...} })
 */
// Custom error for authentication issues
export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export async function api<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const accessToken = tokenService.getAccessToken()

  const { method = 'GET', body, headers = {} } = options

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      ...headers,
    },
    credentials: 'include',
  }

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body)
  }

  const fullUrl = `${API_BASE_URL}/api/ecommerce${endpoint}`
  logger.debug('Finance API (via ecommerce) Calling:', { fullUrl, method, API_BASE_URL, endpoint })

  try {
    const response = await fetch(fullUrl, fetchOptions)
    logger.debug('Finance API (via ecommerce) Response:', { status: response.status, ok: response.ok, url: fullUrl })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || errorData.message || `API Error: ${response.status}`
      // Convert auth errors from backend to AuthenticationError
      if (response.status === 401 || errorMessage.includes('Authentication required')) {
        throw new AuthenticationError(errorMessage)
      }
      throw new Error(errorMessage)
    }

    const json = await response.json()

    // Gérer le format de réponse backend
    // Les endpoints HTTP retournent {success, data} directement
    // Les endpoints JSON-RPC retournent {result: {success, data}}
    if (json.result !== undefined) {
      // Format JSON-RPC
      if (json.result.success === false) {
        const errorMessage = json.result.error || 'API Error'
        if (errorMessage.includes('Authentication required')) {
          throw new AuthenticationError(errorMessage)
        }
        throw new Error(errorMessage)
      }
      return (json.result.data ?? json.result) as T
    }

    // Format HTTP direct
    if (json.success === false) {
      const errorMessage = json.error || 'API Error'
      if (errorMessage.includes('Authentication required')) {
        throw new AuthenticationError(errorMessage)
      }
      throw new Error(errorMessage)
    }
    return (json.data ?? json) as T
  } catch (error) {
    logger.error('Finance API (via ecommerce) Error:', {
      url: fullUrl,
      endpoint,
      error: error instanceof Error ? error.message : error,
      type: error?.constructor?.name
    })
    throw error
  }
}

// Export par défaut pour permettre import { api } from '@/lib/finance/api'
export default api

// Types utilitaires pour les réponses API
export interface Account {
  id: number
  name: string
  type: string
  balance: number
  currency: string
  institution?: string
  accountNumber?: string
  isArchived?: boolean
  portfolioId?: number
}

export interface Transaction {
  id: number
  date: string
  description: string
  amount: number
  type: 'income' | 'expense' | 'transfer'
  categoryId?: number
  accountId: number
  notes?: string
  tags?: string[]
}

export interface Budget {
  id: number
  name: string
  amount: number
  spent: number
  remaining: number
  period: 'monthly' | 'quarterly' | 'yearly'
  categoryId?: number
  startDate: string
  endDate: string
}

export interface Category {
  id: number
  name: string
  type: 'income' | 'expense'
  color?: string
  icon?: string
  parentId?: number
}

export interface Supplier {
  id: number
  name: string
  email?: string
  phone?: string
  address?: string
  taxId?: string
  paymentTerms?: number
  notes?: string
}

export interface Alert {
  id: number
  type: string
  message: string
  severity: 'info' | 'warning' | 'error'
  isRead: boolean
  createdAt: string
}

export interface Portfolio {
  id: number
  name: string
  description?: string
  accounts: Account[]
  totalBalance: number
}

// Fonctions helpers pour les appels courants
export const financeApi = {
  // Accounts
  getAccounts: () => api<Account[]>('/accounts'),
  getAccount: (id: number) => api<Account>(`/accounts/${id}`),
  createAccount: (data: Partial<Account>) => api<Account>('/accounts', { method: 'POST', body: data }),
  updateAccount: (id: number, data: Partial<Account>) => api<Account>(`/accounts/${id}`, { method: 'PUT', body: data }),
  deleteAccount: (id: number) => api(`/accounts/${id}`, { method: 'DELETE' }),

  // Transactions
  getTransactions: (params?: Record<string, unknown>) => {
    const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return api<Transaction[]>(`/transactions${query}`)
  },
  getTransaction: (id: number) => api<Transaction>(`/transactions/${id}`),
  createTransaction: (data: Partial<Transaction>) => api<Transaction>('/transactions', { method: 'POST', body: data }),
  updateTransaction: (id: number, data: Partial<Transaction>) => api<Transaction>(`/transactions/${id}`, { method: 'PUT', body: data }),
  deleteTransaction: (id: number) => api(`/transactions/${id}`, { method: 'DELETE' }),

  // Budgets
  getBudgets: () => api<Budget[]>('/budgets'),
  getBudget: (id: number) => api<Budget>(`/budgets/${id}`),
  createBudget: (data: Partial<Budget>) => api<Budget>('/budgets', { method: 'POST', body: data }),
  updateBudget: (id: number, data: Partial<Budget>) => api<Budget>(`/budgets/${id}`, { method: 'PUT', body: data }),
  deleteBudget: (id: number) => api(`/budgets/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => api<Category[]>('/finance/categories'),
  createCategory: (data: Partial<Category>) => api<Category>('/finance/categories', { method: 'POST', body: data }),

  // Suppliers
  getSuppliers: () => api<Supplier[]>('/suppliers'),
  getSupplier: (id: number) => api<Supplier>(`/suppliers/${id}`),
  createSupplier: (data: Partial<Supplier>) => api<Supplier>('/suppliers', { method: 'POST', body: data }),
  updateSupplier: (id: number, data: Partial<Supplier>) => api<Supplier>(`/suppliers/${id}`, { method: 'PUT', body: data }),
  deleteSupplier: (id: number) => api(`/suppliers/${id}`, { method: 'DELETE' }),

  // Alerts
  getAlerts: () => api<Alert[]>('/alerts'),
  markAlertRead: (id: number) => api(`/alerts/${id}/read`, { method: 'POST' }),

  // Portfolios
  getPortfolios: () => api<Portfolio[]>('/portfolios'),
  getPortfolio: (id: number) => api<Portfolio>(`/portfolios/${id}`),

  // Dashboard
  getDashboardData: () => api('/dashboard'),
  getDashboardStats: (period: string) => api(`/dashboard/stats?period=${period}`),

  // Reporting
  getReportingData: (type: string, params?: Record<string, unknown>) => {
    const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return api(`/reporting/${type}${query}`)
  },

  // Stock Analytics
  getStockValuation: (params?: { warehouse_id?: number; category_id?: number; date?: string }) => {
    const query = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)])
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})
    ).toString() : ''
    return api(`/finance/stock/valuation${query}`)
  },

  getStockTurnover: (params?: {
    start_date?: string
    end_date?: string
    category_id?: number
    status_filter?: string
    limit?: number
    offset?: number
  }) => {
    const query = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)])
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})
    ).toString() : ''
    return api(`/finance/stock/turnover${query}`)
  },
}
