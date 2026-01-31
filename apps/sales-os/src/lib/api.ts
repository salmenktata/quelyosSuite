import { tokenService } from '@quelyos/auth'

const API_URL = import.meta.env.VITE_API_URL || ''

interface APIResponse<T = any> {
  data: T
}

/* eslint-disable @typescript-eslint/no-explicit-any */
class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const token = tokenService.getAccessToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
    return headers
  }

  async request<T = unknown>(url: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    const fetchOptions: RequestInit = {
      ...options,
      headers: { ...this.getHeaders(), ...(options.headers as Record<string, string>) },
      credentials: 'include',
    }
    if (data && !options.method) {
      fetchOptions.method = 'POST'
      fetchOptions.body = JSON.stringify(data)
    } else if (data) {
      fetchOptions.body = JSON.stringify(data)
    }
    const res = await fetch(`${this.baseUrl}${url}`, fetchOptions)
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `API error: ${res.status}`)
    }
    return res.json()
  }

  async get<T = any>(url: string): Promise<APIResponse<T>> {
    const result = await this.request<T>(url)
    return { data: result }
  }

  async post<T = any>(url: string, data?: unknown): Promise<APIResponse<T>> {
    const result = await this.request<T>(url, data, { method: 'POST' })
    return { data: result }
  }

  async put<T = any>(url: string, data?: unknown): Promise<APIResponse<T>> {
    const result = await this.request<T>(url, data, { method: 'PUT' })
    return { data: result }
  }

  async delete<T = any>(url: string): Promise<APIResponse<T>> {
    const result = await this.request<T>(url, undefined, { method: 'DELETE' })
    return { data: result }
  }

  // Auth
  async login(email: string, password: string) {
    return this.post('/api/auth/login', { login: email, password })
  }

  async logout() {
    tokenService.clear()
    return this.post('/api/auth/logout')
  }

  async getUserInfo() {
    return this.get('/api/auth/me')
  }

  async refreshToken() {
    return this.post('/api/auth/refresh')
  }

  // Customers
  async getCustomers(params?: { limit?: number; offset?: number; search?: string }) {
    return this.request<any>('/api/ecommerce/customers', params)
  }

  async getCustomer(id: number) {
    return this.request<any>(`/api/ecommerce/customers/${id}`)
  }

  async updateCustomer(id: number, data: any) {
    return this.request<any>(`/api/ecommerce/customers/${id}/update`, data)
  }

  async exportCustomersCSV(params?: { search?: string }) {
    return this.request<any>('/api/ecommerce/customers/export', params)
  }

  // Invoices
  async getInvoices(params?: { limit?: number; offset?: number; state?: string; search?: string }) {
    return this.request<any>('/api/ecommerce/invoices', params)
  }

  async getInvoice(id: number) {
    return this.request<any>(`/api/ecommerce/invoices/${id}`)
  }

  async createInvoiceFromOrder(orderId: number) {
    return this.request<any>(`/api/ecommerce/orders/${orderId}/create-invoice`)
  }

  async postInvoice(invoiceId: number) {
    return this.request<any>(`/api/ecommerce/invoices/${invoiceId}/post`)
  }

  async sendInvoiceEmail(invoiceId: number) {
    return this.request<any>(`/api/ecommerce/invoices/${invoiceId}/send-email`)
  }

  async getInvoicePDF(invoiceId: number): Promise<Blob> {
    const url = `${this.baseUrl}/api/ecommerce/invoices/${invoiceId}/pdf`
    const headers: HeadersInit = {}
    const accessToken = tokenService.getAccessToken()
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.blob()
  }

  // CRM - Stages
  async getStages() {
    return this.request<any>('/api/ecommerce/crm/stages')
  }

  // CRM - Leads
  async getLeads(params?: { limit?: number; offset?: number; search?: string }) {
    return this.request<any>('/api/ecommerce/crm/leads', params)
  }

  async getLead(id: number) {
    return this.request<any>(`/api/ecommerce/crm/leads/${id}`)
  }

  async createLead(data: {
    name: string
    partner_id?: number
    stage_id?: number
    expected_revenue?: number
    probability?: number
    date_deadline?: string
    description?: string
    email?: string
    phone?: string
    mobile?: string
  }) {
    return this.request<any>('/api/ecommerce/crm/leads/create', data)
  }

  async updateLead(id: number, data: {
    name?: string
    partner_id?: number
    stage_id?: number
    expected_revenue?: number
    probability?: number
    date_deadline?: string
    description?: string
    email?: string
    phone?: string
    mobile?: string
  }) {
    return this.request<any>(`/api/ecommerce/crm/leads/${id}/update`, data)
  }

  async updateLeadStage(id: number, stage_id: number) {
    return this.request<any>(`/api/ecommerce/crm/leads/${id}/stage`, { stage_id })
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export type { APIResponse }
export const api = new ApiClient(API_URL)
export default api
