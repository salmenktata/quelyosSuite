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

  async get<T = any>(url: string): Promise<APIResponse<T>> {
    const result = await this.request<T>(url)
    return { data: result }
  }

  async post<T = any>(url: string, data?: unknown): Promise<APIResponse<T>> {
    const result = await this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
    return { data: result }
  }

  async put<T = any>(url: string, data?: unknown): Promise<APIResponse<T>> {
    const result = await this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
    return { data: result }
  }

  async delete<T = any>(url: string): Promise<APIResponse<T>> {
    const result = await this.request<T>(url, { method: 'DELETE' })
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

  // Products
  async getProducts(params?: any) { return this.post('/api/ecommerce/products', params) }
  async getProduct(id: number) { return this.get(`/api/ecommerce/products/${id}`) }
  async createProduct(data: any) { return this.post('/api/ecommerce/products/create', data) }
  async updateProduct(id: number, data: any) { return this.post(`/api/ecommerce/products/${id}/update`, data) }
  async deleteProduct(id: number) { return this.post(`/api/ecommerce/products/${id}/delete`) }
  async archiveProduct(id: number, archive = true) { return this.post(`/api/ecommerce/products/${id}/archive`, { archive }) }
  async duplicateProduct(id: number, name?: string) { return this.post(`/api/ecommerce/products/${id}/duplicate`, name ? { name } : {}) }
  async exportProducts(params?: any) { return this.post('/api/ecommerce/products/export', params) }
  async importProducts(data: any) { return this.post('/api/ecommerce/products/import', data) }
  async updateProductStock(productId: number, quantity: number) { return this.post(`/api/ecommerce/products/${productId}/stock`, { quantity }) }

  // Product Images
  async getProductImages(productId: number) { return this.get(`/api/ecommerce/products/${productId}/images`) }
  async uploadProductImages(productId: number, images: Array<{ name: string; image_1920: string }>) { return this.post(`/api/ecommerce/products/${productId}/images/upload`, { images }) }
  async deleteProductImage(productId: number, imageId: number) { return this.post(`/api/ecommerce/products/${productId}/images/${imageId}/delete`) }
  async reorderProductImages(productId: number, imageIds: number[]) { return this.post(`/api/ecommerce/products/${productId}/images/reorder`, { image_ids: imageIds }) }

  // Product metadata
  async getProductTypes() { return this.get('/api/ecommerce/product-types') }
  async getProductTags() { return this.get('/api/ecommerce/product-tags') }
  async createProductTag(name: string, color?: number) { return this.post('/api/ecommerce/product-tags/create', { name, color }) }
  async getAllAttributes() { return this.get('/api/ecommerce/attributes') }
  async getTaxes() { return this.get('/api/ecommerce/taxes') }
  async getUom() { return this.get('/api/ecommerce/uom') }

  // Categories
  async getCategories(params?: any) { return this.post('/api/ecommerce/categories', params) }
  async getCategory(id: number) { return this.get(`/api/ecommerce/categories/${id}`) }
  async createCategory(data: { name: string; parent_id?: number }) { return this.post('/api/ecommerce/categories/create', data) }
  async updateCategory(id: number, data: any) { return this.post(`/api/ecommerce/categories/${id}/update`, data) }
  async deleteCategory(id: number) { return this.post(`/api/ecommerce/categories/${id}/delete`) }
  async moveCategory(id: number, newParentId: number | null) { return this.post(`/api/ecommerce/categories/${id}/move`, { parent_id: newParentId }) }

  // Orders
  async getOrders(params?: any) { return this.post('/api/ecommerce/orders', params) }
  async getOrder(id: number) { return this.get(`/api/ecommerce/orders/${id}`) }
  async updateOrderStatus(id: number, action: string) { return this.post(`/api/ecommerce/orders/${id}/status`, { action }) }
  async updateOrderTracking(orderId: number, data: any) { return this.post(`/api/ecommerce/orders/${orderId}/tracking`, data) }
  async getOrderHistory(orderId: number) { return this.get(`/api/ecommerce/orders/${orderId}/history`) }
  async unlockOrder(orderId: number) { return this.post(`/api/ecommerce/orders/${orderId}/unlock`) }
  async sendQuotationEmail(orderId: number) { return this.post(`/api/ecommerce/orders/${orderId}/send-quotation`) }
  async createInvoiceFromOrder(orderId: number) { return this.post(`/api/ecommerce/orders/${orderId}/create-invoice`) }
  async getDeliverySlipPDF(orderId: number): Promise<Blob> {
    const res = await fetch(`${this.baseUrl}/api/ecommerce/orders/${orderId}/delivery-slip`, {
      headers: this.getHeaders(),
      credentials: 'include',
    })
    return res.blob()
  }
  async getShippingTracking(orderId: number) { return this.get(`/api/ecommerce/orders/${orderId}/shipping-tracking`) }

  // Coupons
  async getCoupons(params?: any) { return this.post('/api/ecommerce/coupons', params) }
  async getCoupon(id: number) { return this.get(`/api/ecommerce/coupons/${id}`) }
  async createCoupon(data: any) { return this.post('/api/ecommerce/coupons/create', data) }
  async updateCoupon(id: number, data: any) { return this.post(`/api/ecommerce/coupons/${id}/update`, data) }
  async deleteCoupon(id: number) { return this.post(`/api/ecommerce/coupons/${id}/delete`) }

  // Delivery
  async getDeliveryMethods() { return this.get("/api/ecommerce/delivery-methods") }
  async getDeliveryMethod(id: number) { return this.get(`/api/ecommerce/delivery-methods/${id}`) }
  async createDeliveryMethod(data: any) { return this.post("/api/ecommerce/delivery-methods/create", data) }
  async updateDeliveryMethod(id: number, data: any) { return this.post(`/api/ecommerce/delivery-methods/${id}/update`, data) }
  async deleteDeliveryMethod(id: number) { return this.post(`/api/ecommerce/delivery-methods/${id}/delete`) }

  // Featured
  async getFeaturedProducts(params?: any) { return this.post("/api/ecommerce/featured", params) }
  async getAvailableProductsForFeatured(params?: any) { return this.post("/api/ecommerce/featured/available", params) }
  async addFeaturedProduct(productId: number) { return this.post("/api/ecommerce/featured/add", { product_id: productId }) }
  async removeFeaturedProduct(productId: number) { return this.post("/api/ecommerce/featured/remove", { product_id: productId }) }
  async reorderFeaturedProducts(productIds: number[]) { return this.post("/api/ecommerce/featured/reorder", { product_ids: productIds }) }

  // Abandoned carts
  async getAbandonedCarts(params?: any) { return this.post("/api/ecommerce/abandoned-carts", params) }
  async getCartRecoveryStats(params?: any) { return this.post("/api/ecommerce/abandoned-carts/stats", params) }
  async sendCartReminder(cartId: number) { return this.post(`/api/ecommerce/abandoned-carts/${cartId}/remind`) }

  // Ribbons
  async getRibbons() { return this.get("/api/ecommerce/ribbons") }
  async updateProductRibbon(productId: number, ribbonId: number | null) { return this.post(`/api/ecommerce/products/${productId}/ribbon`, { ribbon_id: ribbonId }) }

  // Analytics
  async getAnalyticsStats(params?: any) { return this.post("/api/analytics/stats", params) }

  // Product Variants
  async getProductVariants(productId: number) { return this.get(`/api/ecommerce/products/${productId}/variants`) }
  async updateProductVariant(productId: number, variantId: number, data: any) { return this.post(`/api/ecommerce/products/${productId}/variants/${variantId}/update`, data) }
  async updateVariantStock(productId: number, variantId: number, qty: number) { return this.post(`/api/ecommerce/products/${productId}/variants/${variantId}/stock`, { quantity: qty }) }
  async regenerateProductVariants(productId: number) { return this.post(`/api/ecommerce/products/${productId}/variants/regenerate`) }

  // Product Attributes
  async addProductAttribute(productId: number, data: any) { return this.post(`/api/ecommerce/products/${productId}/attributes/add`, data) }
  async updateProductAttribute(productId: number, lineId: number, data: any) { return this.post(`/api/ecommerce/products/${productId}/attributes/${lineId}/update`, data) }
  async deleteProductAttribute(productId: number, lineId: number) { return this.post(`/api/ecommerce/products/${productId}/attributes/${lineId}/delete`) }

  // Attribute Images
  async getProductAttributeImages(productId: number) { return this.get(`/api/ecommerce/products/${productId}/attribute-images`) }
  async getAttributeValueImages(productId: number, ptavId: number) { return this.get(`/api/ecommerce/products/${productId}/attribute-images/${ptavId}`) }
  async uploadAttributeValueImages(productId: number, ptavId: number, images: any) { return this.post(`/api/ecommerce/products/${productId}/attribute-images/${ptavId}/upload`, { images }) }
  async deleteAttributeValueImage(productId: number, ptavId: number, imageId: number) { return this.post(`/api/ecommerce/products/${productId}/attribute-images/${ptavId}/${imageId}/delete`) }
  async reorderAttributeValueImages(productId: number, ptavId: number, imageIds: number[]) { return this.post(`/api/ecommerce/products/${productId}/attribute-images/${ptavId}/reorder`, { image_ids: imageIds }) }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export type { APIResponse }
export const api = new ApiClient(API_URL)
export default api
