import type {
  ApiResponse,
  LoginResponse,
  SessionResponse,
  PaginatedResponse,
  Order,
  OrderDetail,
  Customer,
  CustomerListItem,
  Address,
  Product,
  ProductDetail,
  Category,
  Cart,
  Coupon,
  CouponCreate,
  StockProduct,
  DeliveryMethod,
  AnalyticsStats,
} from '../types'

// En développement, utiliser le proxy Vite (pas de CORS)
// En production, utiliser l'URL complète
const API_URL = import.meta.env.VITE_API_URL || ''

class ApiClient {
  private baseUrl: string
  private sessionId: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    // Récupérer le session_id du localStorage
    this.sessionId = localStorage.getItem('session_id')
  }

  private async request<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Ajouter le session_id si disponible
    if (this.sessionId) {
      headers['X-Session-Id'] = this.sessionId
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: data || {},
        id: Math.random(),
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const json = await response.json()

    if (json.error) {
      throw new Error(json.error.data?.message || 'API Error')
    }

    return json.result as T
  }

  // ==================== AUTH ====================

  async login(email: string, password: string): Promise<LoginResponse> {
    const result = await this.request<LoginResponse>('/api/ecommerce/auth/login', {
      email,
      password,
    })

    if (result.success && result.session_id) {
      this.sessionId = result.session_id
      localStorage.setItem('session_id', result.session_id)
      if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user))
      }
    }

    return result
  }

  async logout(): Promise<ApiResponse> {
    const result = await this.request<ApiResponse>('/api/ecommerce/auth/logout')
    this.sessionId = null
    localStorage.removeItem('session_id')
    localStorage.removeItem('user')
    return result
  }

  async checkSession(): Promise<SessionResponse> {
    return this.request<SessionResponse>('/api/ecommerce/auth/session')
  }

  async register(data: { name: string; email: string; password: string; phone?: string }) {
    return this.request<ApiResponse<{ user: Customer }>>('/api/ecommerce/auth/register', data)
  }

  // ==================== PRODUCTS ====================

  async getProducts(params?: { limit?: number; offset?: number; category_id?: number }) {
    return this.request<PaginatedResponse<Product>>('/api/ecommerce/products', params)
  }

  async getProduct(id: number) {
    return this.request<ApiResponse<{ product: ProductDetail }>>(
      `/api/ecommerce/products/${id}`
    )
  }

  async createProduct(data: {
    name: string
    price: number
    description?: string
    category_id?: number
  }) {
    return this.request<ApiResponse<{ product: Product }>>(
      '/api/ecommerce/products/create',
      data
    )
  }

  async updateProduct(id: number, data: Partial<Product>) {
    return this.request<ApiResponse<{ product: Product }>>(
      `/api/ecommerce/products/${id}/update`,
      data
    )
  }

  async deleteProduct(id: number) {
    return this.request<ApiResponse>(`/api/ecommerce/products/${id}/delete`)
  }

  // ==================== CATEGORIES ====================

  async getCategories(params?: { limit?: number; offset?: number }) {
    return this.request<ApiResponse<{ categories: Category[] }>>(
      '/api/ecommerce/categories',
      params
    )
  }

  async getCategory(id: number) {
    return this.request<ApiResponse<{ category: Category }>>(
      `/api/ecommerce/categories/${id}`
    )
  }

  async createCategory(data: { name: string; parent_id?: number }) {
    return this.request<ApiResponse<{ category: Category }>>(
      '/api/ecommerce/categories/create',
      data
    )
  }

  async updateCategory(id: number, data: { name?: string; parent_id?: number | null }) {
    return this.request<ApiResponse<{ category: Category }>>(
      `/api/ecommerce/categories/${id}/update`,
      data
    )
  }

  async deleteCategory(id: number) {
    return this.request<ApiResponse>(`/api/ecommerce/categories/${id}/delete`)
  }

  // ==================== ORDERS ====================

  async getOrders(params?: { limit?: number; offset?: number; status?: string }) {
    return this.request<PaginatedResponse<Order>>('/api/ecommerce/orders', params)
  }

  async getOrder(id: number) {
    return this.request<ApiResponse<{ order: OrderDetail }>>(
      `/api/ecommerce/orders/${id}`
    )
  }

  async createOrder(data: {
    partner_id?: number
    lines?: Array<{ product_id: number; quantity: number; price_unit?: number }>
    confirm?: boolean
  }) {
    return this.request<ApiResponse<{ order: Order }>>('/api/ecommerce/orders/create', data)
  }

  async updateOrderStatus(id: number, action: 'confirm' | 'cancel' | 'done') {
    return this.request<ApiResponse<{ order: Order }>>(
      `/api/ecommerce/orders/${id}/status`,
      { action }
    )
  }

  async getCustomerOrders(params?: { limit?: number; offset?: number }) {
    return this.request<PaginatedResponse<Order>>('/api/ecommerce/customer/orders', params)
  }

  // ==================== CUSTOMERS (ADMIN) ====================

  async getCustomers(params?: { limit?: number; offset?: number; search?: string }) {
    return this.request<PaginatedResponse<CustomerListItem>>('/api/ecommerce/customers', params)
  }

  // ==================== STOCK ====================

  async getStockProducts(params?: { limit?: number; offset?: number; search?: string }) {
    return this.request<PaginatedResponse<StockProduct>>('/api/ecommerce/stock/products', params)
  }

  async updateProductStock(productId: number, quantity: number) {
    return this.request<ApiResponse<{ stock: { product_id: number; qty_available: number } }>>(
      `/api/ecommerce/products/${productId}/stock/update`,
      { quantity }
    )
  }

  // ==================== DELIVERY ====================

  async getDeliveryMethods() {
    return this.request<ApiResponse<{ delivery_methods: DeliveryMethod[] }>>(
      '/api/ecommerce/delivery/methods'
    )
  }

  // ==================== ANALYTICS ====================

  async getAnalyticsStats() {
    return this.request<ApiResponse<AnalyticsStats>>('/api/ecommerce/analytics/stats')
  }

  // ==================== CART ====================

  async getCart(guestEmail?: string) {
    return this.request<ApiResponse<{ cart: Cart }>>('/api/ecommerce/cart', {
      guest_email: guestEmail,
    })
  }

  async addToCart(data: { product_id: number; quantity: number; guest_email?: string }) {
    return this.request<ApiResponse<{ cart: Partial<Cart> }>>(
      '/api/ecommerce/cart/add',
      data
    )
  }

  async updateCartLine(data: { line_id: number; quantity: number; guest_email?: string }) {
    return this.request<ApiResponse<{ cart: Partial<Cart> }>>(
      '/api/ecommerce/cart/update',
      data
    )
  }

  async removeFromCart(lineId: number, guestEmail?: string) {
    return this.request<ApiResponse<{ cart: Partial<Cart> }>>(
      `/api/ecommerce/cart/remove/${lineId}`,
      { guest_email: guestEmail }
    )
  }

  async clearCart(guestEmail?: string) {
    return this.request<ApiResponse<{ cart: Partial<Cart> }>>(
      '/api/ecommerce/cart/clear',
      { guest_email: guestEmail }
    )
  }

  // ==================== CUSTOMER PROFILE ====================

  async getCustomerProfile() {
    return this.request<ApiResponse<{ profile: Customer }>>(
      '/api/ecommerce/customer/profile'
    )
  }

  async updateCustomerProfile(data: Partial<Customer>) {
    return this.request<ApiResponse<{ profile: Customer }>>(
      '/api/ecommerce/customer/profile/update',
      data
    )
  }

  // ==================== CUSTOMER ADDRESSES ====================

  async getCustomerAddresses() {
    return this.request<ApiResponse<{ addresses: Address[] }>>(
      '/api/ecommerce/customer/addresses'
    )
  }

  async createCustomerAddress(data: Omit<Address, 'id'>) {
    return this.request<ApiResponse<{ address: Address }>>(
      '/api/ecommerce/customer/addresses/create',
      data
    )
  }

  async updateCustomerAddress(id: number, data: Partial<Address>) {
    return this.request<ApiResponse<{ address: Address }>>(
      `/api/ecommerce/customer/addresses/${id}/update`,
      data
    )
  }

  async deleteCustomerAddress(id: number) {
    return this.request<ApiResponse>(
      `/api/ecommerce/customer/addresses/${id}/delete`
    )
  }

  // ==================== COUPONS ====================

  async getCoupons(params?: { limit?: number; offset?: number; active_only?: boolean }) {
    return this.request<PaginatedResponse<Coupon>>('/api/ecommerce/coupons', params)
  }

  async createCoupon(data: CouponCreate) {
    return this.request<ApiResponse<{ coupon: Coupon }>>(
      '/api/ecommerce/coupons/create',
      data
    )
  }

  async applyCouponToCart(code: string, guestEmail?: string) {
    return this.request<ApiResponse<{ cart: Partial<Cart>; discount_amount?: number }>>(
      '/api/ecommerce/cart/coupon/apply',
      { code, guest_email: guestEmail }
    )
  }

  async removeCouponFromCart(guestEmail?: string) {
    return this.request<ApiResponse<{ cart: Partial<Cart> }>>(
      '/api/ecommerce/cart/coupon/remove',
      { guest_email: guestEmail }
    )
  }
}

export const api = new ApiClient(API_URL)
