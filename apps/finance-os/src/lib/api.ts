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
    console.log('[DEBUG] API Request:', { url, method: options.method || 'GET', body: options.body })
    const res = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers: { ...this.getHeaders(), ...(options.headers as Record<string, string>) },
      credentials: 'include',
    })
    console.log('[DEBUG] API Response:', { status: res.status, ok: res.ok })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('[DEBUG] API Error:', text)
      throw new Error(text || `API error: ${res.status}`)
    }
    const data = await res.json()
    console.log('[DEBUG] API Data:', data)
    return data
  }

  async get(url: string) {
    return this.request(url)
  }

  async post(url: string, data?: unknown) {
    return this.request(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put(url: string, data?: unknown) {
    return this.request(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete(url: string) {
    return this.request(url, { method: 'DELETE' })
  }

  async login(email: string, password: string) {
    console.log('[DEBUG] Login attempt:', { login: email, password: '***' })
    const payload = { login: email, password }
    console.log('[DEBUG] Payload:', JSON.stringify(payload))
    const result = await this.post('/api/auth/login', payload)
    console.log('[DEBUG] Login result:', result)
    return result
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
