import { tokenService } from '@quelyos/auth'

const API_URL = import.meta.env.VITE_API_URL || ''

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

  async request<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers: { ...this.getHeaders(), ...(options.headers as Record<string, string>) },
      credentials: 'include',
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `API error: ${res.status}`)
    }
    return res.json()
  }

  async get<T = unknown>(url: string): Promise<T> {
    return this.request(url)
  }

  async post<T = unknown>(url: string, data?: unknown): Promise<T> {
    return this.request(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T = unknown>(url: string, data?: unknown): Promise<T> {
    return this.request(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T = unknown>(url: string): Promise<T> {
    return this.request(url, { method: 'DELETE' })
  }

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
}

export const api = new ApiClient(API_URL)
export default api
