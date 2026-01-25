/**
 * API Finance - Wrapper pour les appels API du module finance
 * Compatible avec le pattern api('/endpoint', options) du repo quelyos-finance
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8069'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Fonction API callable pour le module finance
 * Usage: api('/endpoint') ou api('/endpoint', { method: 'POST', body: {...} })
 */
export async function api<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const token = localStorage.getItem('odoo_session_token')

  const { method = 'GET', body, headers = {} } = options

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  }

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/finance${endpoint}`, fetchOptions)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `API Error: ${response.status}`)
    }

    const data = await response.json()
    return data as T
  } catch (error) {
    console.error('Finance API Error:', error)
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
  getCategories: () => api<Category[]>('/categories'),
  createCategory: (data: Partial<Category>) => api<Category>('/categories', { method: 'POST', body: data }),

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
}
