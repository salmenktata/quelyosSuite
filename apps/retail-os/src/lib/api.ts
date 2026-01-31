import { tokenService } from '@quelyos/auth'

const API_URL = import.meta.env.VITE_API_URL || ''

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResponse = any

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

  async request<T = ApiResponse>(url: string, options: RequestInit = {}): Promise<T> {
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

  async get(url: string): Promise<ApiResponse> {
    return this.request(url)
  }

  async post(url: string, data?: unknown): Promise<ApiResponse> {
    return this.request(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put(url: string, data?: unknown): Promise<ApiResponse> {
    return this.request(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete(url: string): Promise<ApiResponse> {
    return this.request(url, { method: 'DELETE' })
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

  // Products
  async getProducts(params?: Record<string, unknown>) {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return this.get(`/api/store/products${qs}`)
  }

  async getProduct(id: number) {
    return this.get(`/api/store/products/${id}`)
  }

  async createProduct(data: unknown) {
    return this.post('/api/store/products', data)
  }

  async updateProduct(id: number, data: unknown) {
    return this.put(`/api/store/products/${id}`, data)
  }

  async deleteProduct(id: number) {
    return this.delete(`/api/store/products/${id}`)
  }

  async archiveProduct(id: number, active: boolean) {
    return this.post(`/api/store/products/${id}/archive`, { active })
  }

  async duplicateProduct(id: number) {
    return this.post(`/api/store/products/${id}/duplicate`)
  }

  async exportProducts(params?: Record<string, unknown>) {
    return this.post('/api/store/products/export', params)
  }

  async importProducts(data: unknown) {
    return this.post('/api/store/products/import', data)
  }

  async getTaxes() {
    return this.get('/api/store/taxes')
  }

  async getUom() {
    return this.get('/api/store/uom')
  }

  async getProductTypes() {
    return this.get('/api/store/product-types')
  }

  async getProductTags(params?: Record<string, unknown>) {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return this.get(`/api/store/product-tags${qs}`)
  }

  async createProductTag(data: unknown) {
    return this.post('/api/store/product-tags', data)
  }

  // Categories
  async getCategories(params?: Record<string, unknown>) {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return this.get(`/api/store/categories${qs}`)
  }

  async getCategory(id: number) {
    return this.get(`/api/store/categories/${id}`)
  }

  async createCategory(data: unknown) {
    return this.post('/api/store/categories', data)
  }

  async updateCategory(id: number, data: unknown) {
    return this.put(`/api/store/categories/${id}`, data)
  }

  async deleteCategory(id: number) {
    return this.delete(`/api/store/categories/${id}`)
  }

  async moveCategory(id: number, data: unknown) {
    return this.post(`/api/store/categories/${id}/move`, data)
  }

  // Orders
  async getOrders(params?: Record<string, unknown>) {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return this.get(`/api/store/orders${qs}`)
  }

  async getOrder(id: number) {
    return this.get(`/api/store/orders/${id}`)
  }

  async updateOrderStatus(id: number, data: unknown) {
    return this.post(`/api/store/orders/${id}/status`, data)
  }

  async getShippingTracking(id: number) {
    return this.get(`/api/store/orders/${id}/tracking`)
  }

  async updateOrderTracking(id: number, data: unknown) {
    return this.post(`/api/store/orders/${id}/tracking`, data)
  }

  async getOrderHistory(id: number) {
    return this.get(`/api/store/orders/${id}/history`)
  }

  async sendQuotationEmail(id: number) {
    return this.post(`/api/store/orders/${id}/send-email`)
  }

  async createInvoiceFromOrder(id: number) {
    return this.post(`/api/store/orders/${id}/create-invoice`)
  }

  async unlockOrder(id: number) {
    return this.post(`/api/store/orders/${id}/unlock`)
  }

  // Coupons
  async getCoupons(params?: Record<string, unknown>) {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return this.get(`/api/store/coupons${qs}`)
  }

  async createCoupon(data: unknown) {
    return this.post('/api/store/coupons', data)
  }

  async updateCoupon(id: number, data: unknown) {
    return this.put(`/api/store/coupons/${id}`, data)
  }

  async deleteCoupon(id: number) {
    return this.delete(`/api/store/coupons/${id}`)
  }

  // Analytics
  async getAnalyticsStats(params?: Record<string, unknown>) {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return this.get(`/api/analytics/stats${qs}`)
  }

  // Product images
  async getProductImages(productId: number) {
    return this.get(`/api/store/products/${productId}/images`)
  }

  async uploadProductImage(productId: number, data: unknown) {
    return this.post(`/api/store/products/${productId}/images`, data)
  }

  async deleteProductImage(productId: number, imageId: number) {
    return this.delete(`/api/store/products/${productId}/images/${imageId}`)
  }

  async reorderProductImages(productId: number, data: unknown) {
    return this.post(`/api/store/products/${productId}/images/reorder`, data)
  }

  // Stock
  async getWarehouses(params?: Record<string, unknown>) {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return this.get(`/api/stock/warehouses${qs}`)
  }

  // Attributes
  async getAttributes(params?: Record<string, unknown>) {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return this.get(`/api/store/attributes${qs}`)
  }

  async createAttribute(data: unknown) {
    return this.post('/api/store/attributes', data)
  }

  async updateAttribute(id: number, data: unknown) {
    return this.put(`/api/store/attributes/${id}`, data)
  }

  async deleteAttribute(id: number) {
    return this.delete(`/api/store/attributes/${id}`)
  }
  // Extended methods for Retail OS
  
  // Product variants
  async getProductVariants(productId: number) {
    return this.post(`/api/products/${productId}/variants`, {})
  }
  
  async updateProductVariant(variantId: number, data: unknown) {
    return this.post(`/api/products/variants/${variantId}/update`, data)
  }
  
  async updateVariantStock(variantId: number, quantity: number) {
    return this.post(`/api/products/variants/${variantId}/stock`, { quantity })
  }
  
  async regenerateProductVariants(productId: number) {
    return this.post(`/api/products/${productId}/variants/regenerate`, {})
  }
  
  // Product attributes (extended)
  async getAllAttributes() {
    return this.getAttributes()
  }
  
  async addProductAttribute(productId: number, data: unknown) {
    return this.post(`/api/products/${productId}/attributes`, data)
  }
  
  async updateProductAttribute(productId: number, attributeLineId: number, data: unknown) {
    return this.post(`/api/products/${productId}/attributes/${attributeLineId}`, data)
  }
  
  async deleteProductAttribute(productId: number, attributeLineId: number) {
    return this.post(`/api/products/${productId}/attributes/${attributeLineId}/delete`, {})
  }
  
  // Product images (extended)
  async uploadProductImages(productId: number, files: File[]) {
    const formData = new FormData()
    files.forEach((file, i) => formData.append(`image_${i}`, file))
    return this.post(`/api/products/${productId}/images`, formData)
  }
  
  async getProductAttributeImages(productId: number) {
    return this.post(`/api/products/${productId}/attribute-images`, {})
  }
  
  // Attribute value images
  async getAttributeValueImages(valueId: number) {
    return this.post(`/api/attributes/values/${valueId}/images`, {})
  }
  
  async uploadAttributeValueImages(valueId: number, files: File[]) {
    const formData = new FormData()
    files.forEach((file, i) => formData.append(`image_${i}`, file))
    return this.post(`/api/attributes/values/${valueId}/images`, formData)
  }
  
  async deleteAttributeValueImage(imageId: number) {
    return this.post(`/api/attributes/values/images/${imageId}/delete`, {})
  }
  
  async reorderAttributeValueImages(valueId: number, imageIds: number[]) {
    return this.post(`/api/attributes/values/${valueId}/images/reorder`, { image_ids: imageIds })
  }
  
  // Coupons (extended)
  async getCoupon(couponId: number) {
    return this.post(`/api/coupons/${couponId}`, {})
  }
  
  // Ribbons
  async getRibbons() {
    return this.post('/api/ribbons', {})
  }
  
  async updateProductRibbon(productId: number, ribbonId: number | null) {
    return this.post(`/api/products/${productId}/ribbon`, { ribbon_id: ribbonId })
  }
  
  // Orders (extended)
  async getDeliverySlipPDF(orderId: number): Promise<Blob> {
    const response = await this.request<Blob>(`/api/orders/${orderId}/delivery-slip`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    return response
  }
}

export const api = new ApiClient(API_URL)
export default api
