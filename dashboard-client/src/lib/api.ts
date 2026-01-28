import type {
  PaginatedResponse,
  Customer,
  CustomerListItem,
  ProductsQueryParams,
  ProductCreateData,
  ProductUpdateData,
  CouponCreate,
  StockProduct,
  StockMove,
  DeliveryMethod,
  AnalyticsStats,
  AbandonedCart,
  AbandonedCartsQueryParams,
  CartRecoveryStats,
  OrderHistoryItem,
  ShippingTrackingInfo,
  Stage,
  LeadListItem,
  Lead,
} from '@/types'
import type {
  APIResponse,
  LoginResponse,
  SessionResponse,
  Order,
  OrderDetail,
  Address,
  Product,
  ProductDetail,
  Category,
  Cart,
  Coupon,
  Ribbon,
} from '@quelyos/types'
import { logger } from '@quelyos/logger'

// Développement : accès direct au backend via VITE_API_URL
// Production : URL backend configurée dans .env.production
const API_URL = import.meta.env.VITE_API_URL || ''

class ApiClient {
  private baseUrl: string
  private sessionId: string | null = null
  private tenantId: number | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    // Récupérer le session_id du localStorage et nettoyer les valeurs invalides
    const storedSession = localStorage.getItem('session_id')
    // Ne garder que les sessions valides (pas "null", "undefined", ou vide)
    if (storedSession && storedSession !== 'null' && storedSession !== 'undefined' && storedSession.trim() !== '') {
      this.sessionId = storedSession
    } else {
      this.sessionId = null
      localStorage.removeItem('session_id')
    }
    // Récupérer le tenant_id du localStorage
    const storedTenantId = localStorage.getItem('tenant_id')
    if (storedTenantId && storedTenantId !== 'null') {
      this.tenantId = parseInt(storedTenantId, 10)
    }
  }

  /**
   * Définir le tenant courant pour toutes les requêtes API
   */
  setTenantId(tenantId: number | null): void {
    this.tenantId = tenantId
    if (tenantId) {
      localStorage.setItem('tenant_id', String(tenantId))
    } else {
      localStorage.removeItem('tenant_id')
    }
  }

  /**
   * Récupérer le tenant_id courant
   */
  getTenantId(): number | null {
    return this.tenantId
  }

  async request<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    logger.debug('[API] request() ->', endpoint, 'URL:', url)

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Utiliser Authorization au lieu de X-Session-Id (déjà autorisé par CORS)
    if (this.sessionId && this.sessionId !== 'null' && this.sessionId !== 'undefined') {
      headers['Authorization'] = `Bearer ${this.sessionId}`
    }

    logger.debug('[API] Sending fetch to:', url)
    const response = await fetch(url, {
      method: 'POST',
      headers,
      // credentials: 'omit' car le backend utilise Access-Control-Allow-Origin: *
      // qui est incompatible avec credentials: 'include'
      // Authentification via X-Session-Id header à la place
      credentials: 'omit',
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          ...(data || {}),
          // Injecter automatiquement tenant_id si défini
          ...(this.tenantId ? { tenant_id: this.tenantId } : {}),
        },
        id: Math.random(),
      }),
    })
    logger.debug('[API] Response status:', response.status, response.statusText)

    if (!response.ok) {
      if (response.status === 401 && !import.meta.env.DEV) {
        // Session expirée, nettoyer et rediriger (seulement en production)
        this.sessionId = null
        localStorage.removeItem('session_id')
        localStorage.removeItem('user')
        window.location.href = '/login'
        throw new Error('Session expirée')
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const json = await response.json()

    if (json.error) {
      // Vérifier si c'est une erreur d'authentification
      const errorMessage = json.error.data?.message || json.error.message || 'API Error'
      if (!import.meta.env.DEV && (errorMessage.toLowerCase().includes('session') || errorMessage.toLowerCase().includes('authentication'))) {
        // Rediriger vers login seulement en production
        this.sessionId = null
        localStorage.removeItem('session_id')
        localStorage.removeItem('user')
        window.location.href = '/login'
        throw new Error('Session expirée')
      }
      throw new Error(errorMessage)
    }

    // Vérifier si le résultat est null UNIQUEMENT si on a une session
    // (les endpoints publics peuvent retourner null légitimement)
    // TEMPORAIRE DEV : Désactiver la redirection automatique
    if (json.result === null && !endpoint.includes('/logout') && this.sessionId && !import.meta.env.DEV) {
      // Si le résultat est null et qu'on a une session, c'est probablement une session expirée
      this.sessionId = null
      localStorage.removeItem('session_id')
      localStorage.removeItem('user')
      window.location.href = '/login'
      throw new Error('Session expirée')
    }

    return json.result as T
  }

  // Méthode publique pour permettre aux hooks d'appeler l'API
  // Retourne { data: <réponse endpoint> } où <réponse endpoint> = { success, error?, data? }
  public async post<T = { success: boolean; error?: string; data?: any }>(
    endpoint: string,
    data?: unknown
  ): Promise<{ data: T }> {
    const result = await this.request<T>(endpoint, data)
    return { data: result }
  }

  // ==================== AUTH ====================

  async login(email: string, password: string): Promise<LoginResponse> {
    logger.debug('[API] login() called with email:', email)
    const result = await this.request<LoginResponse>('/api/ecommerce/auth/login', {
      email,
      password,
    })
    logger.debug('[API] login() result:', result)

    if (result.success && result.session_id) {
      logger.debug('[API] Login successful, storing session')
      this.sessionId = result.session_id
      localStorage.setItem('session_id', result.session_id)
      if (result.user) {
        // Les groupes sont déjà inclus dans result.user depuis le backend
        localStorage.setItem('user', JSON.stringify(result.user))
        logger.debug('[API] User stored with groups:', (result.user as any).groups?.length || 0, 'groups')
      }
      logger.debug('[API] Session stored:', this.sessionId?.substring(0, 20) + '...')
    } else {
      logger.warn('[API] Login failed or no session_id:', result)
    }

    return result
  }

  async getUserInfo(): Promise<APIResponse<{ user: { id: number; name: string; email: string; login: string; groups: string[] } }>> {
    // Utiliser credentials: 'include' pour envoyer les cookies de session backend
    const url = `${this.baseUrl}/api/auth/user-info`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Envoyer cookies pour auth backend
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {},
        id: Math.random(),
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.result || data
  }

  async logout(): Promise<APIResponse> {
    const result = await this.request<APIResponse>('/api/ecommerce/auth/logout')
    this.sessionId = null
    localStorage.removeItem('session_id')
    localStorage.removeItem('user')
    return result
  }

  async checkSession(): Promise<SessionResponse> {
    return this.request<SessionResponse>('/api/ecommerce/auth/session')
  }

  async register(data: { name: string; email: string; password: string; phone?: string }) {
    return this.request<APIResponse<{ user: Customer }>>('/api/ecommerce/auth/register', data)
  }

  // ==================== PRODUCTS ====================

  async getProducts(params?: ProductsQueryParams) {
    return this.request<PaginatedResponse<Product>>('/api/ecommerce/products', params)
  }

  async getProduct(id: number) {
    return this.request<APIResponse<{ product: ProductDetail }>>(
      `/api/ecommerce/products/${id}`
    )
  }

  async createProduct(data: ProductCreateData) {
    return this.request<APIResponse<{ product: Product }>>(
      '/api/ecommerce/products/create',
      data
    )
  }

  async updateProduct(id: number, data: ProductUpdateData) {
    return this.request<APIResponse<{ product: Product }>>(
      `/api/ecommerce/products/${id}/update`,
      data
    )
  }

  async deleteProduct(id: number) {
    return this.request<APIResponse>(`/api/ecommerce/products/${id}/delete`)
  }

  async archiveProduct(id: number, archive: boolean = true) {
    return this.request<
      APIResponse<{
        product: { id: number; name: string; active: boolean }
        message: string
      }>
    >(`/api/ecommerce/products/${id}/archive`, { archive })
  }

  async duplicateProduct(id: number, name?: string) {
    return this.request<APIResponse<{ product: Product; message: string }>>(
      `/api/ecommerce/products/${id}/duplicate`,
      name ? { name } : {}
    )
  }

  async exportProducts(params?: { category_id?: number; search?: string }) {
    return this.request<
      APIResponse<{
        products: Array<{
          id: number
          name: string
          default_code: string
          barcode: string
          price: number
          standard_price: number
          qty_available: number
          stock_status: string
          weight: number
          category: string
          active: string
        }>
        total: number
        columns: Array<{ key: string; label: string }>
      }>
    >('/api/ecommerce/products/export', params)
  }

  async importProducts(data: {
    products: Array<{
      name: string
      price?: number
      standard_price?: number
      description?: string
      default_code?: string
      barcode?: string
      weight?: number
      category?: string
    }>
    update_existing?: boolean
  }) {
    return this.request<
      APIResponse<{
        created: Array<{ id: number; name: string; row: number }>
        updated: Array<{ id: number; name: string; row: number }>
        errors: Array<{ row: number; error: string }>
        summary: {
          total_rows: number
          created_count: number
          updated_count: number
          error_count: number
        }
      }>
    >('/api/ecommerce/products/import', data)
  }

  // ==================== RIBBONS (BADGES) ====================

  async getRibbons() {
    return this.request<APIResponse<{ ribbons: Ribbon[] }>>('/api/ecommerce/ribbons')
  }

  async updateProductRibbon(productId: number, ribbonId: number | null) {
    return this.request<APIResponse<{ message: string }>>(
      `/api/ecommerce/products/${productId}/ribbon`,
      { ribbon_id: ribbonId }
    )
  }

  // Taxes
  async getTaxes() {
    return this.request<
      APIResponse<{
        taxes: Array<{
          id: number
          name: string
          amount: number
          amount_type: 'percent' | 'fixed' | 'group' | 'division'
          price_include: boolean
          description: string
        }>
      }>
    >('/api/ecommerce/taxes')
  }

  // Unités de mesure
  async getUom() {
    return this.request<
      APIResponse<{
        uom: Array<{
          id: number
          name: string
          category_id: number
          category_name: string
          uom_type: 'bigger' | 'reference' | 'smaller'
          factor: number
        }>
      }>
    >('/api/ecommerce/uom')
  }

  // Types de produits
  async getProductTypes() {
    return this.request<
      APIResponse<{
        product_types: Array<{
          value: 'consu' | 'service' | 'product'
          label: string
          description: string
        }>
      }>
    >('/api/ecommerce/product-types')
  }

  // Tags produits
  async getProductTags() {
    return this.request<
      APIResponse<{
        tags: Array<{
          id: number
          name: string
          color: number
        }>
      }>
    >('/api/ecommerce/product-tags')
  }

  async createProductTag(name: string, color?: number) {
    return this.request<
      APIResponse<{
        id: number
        name: string
        color: number
      }>
    >('/api/ecommerce/product-tags/create', { name, color })
  }

  // Product Images
  async getProductImages(productId: number) {
    return this.request<
      APIResponse<{
        images: Array<{ id: number; name: string; url: string; sequence: number }>
      }>
    >(`/api/ecommerce/products/${productId}/images`)
  }

  async uploadProductImages(
    productId: number,
    images: Array<{ name: string; image_1920: string }>
  ) {
    return this.request<
      APIResponse<{
        images: Array<{ id: number; name: string; url: string; sequence: number }>
        message: string
      }>
    >(`/api/ecommerce/products/${productId}/images/upload`, { images })
  }

  async deleteProductImage(productId: number, imageId: number) {
    return this.request<APIResponse<{ message: string }>>(
      `/api/ecommerce/products/${productId}/images/${imageId}/delete`
    )
  }

  async reorderProductImages(productId: number, imageIds: number[]) {
    return this.request<APIResponse<{ message: string }>>(
      `/api/ecommerce/products/${productId}/images/reorder`,
      { image_ids: imageIds }
    )
  }

  // Variant Images (product.product specific)
  async getVariantImages(productId: number, variantId: number) {
    return this.request<
      APIResponse<{
        images: Array<{
          id: number
          name: string
          url: string
          url_medium: string
          url_small: string
          sequence: number
        }>
      }>
    >(`/api/ecommerce/products/${productId}/variants/${variantId}/images`)
  }

  async uploadVariantImages(
    productId: number,
    variantId: number,
    images: Array<{ name: string; image_1920: string }>
  ) {
    return this.request<
      APIResponse<{
        images: Array<{
          id: number
          name: string
          url: string
          url_medium: string
          url_small: string
          sequence: number
        }>
        message: string
      }>
    >(`/api/ecommerce/products/${productId}/variants/${variantId}/images/upload`, { images })
  }

  async deleteVariantImage(productId: number, variantId: number, imageId: number) {
    return this.request<APIResponse<{ message: string }>>(
      `/api/ecommerce/products/${productId}/variants/${variantId}/images/${imageId}/delete`
    )
  }

  async reorderVariantImages(productId: number, variantId: number, imageIds: number[]) {
    return this.request<APIResponse<{ message: string }>>(
      `/api/ecommerce/products/${productId}/variants/${variantId}/images/reorder`,
      { image_ids: imageIds }
    )
  }

  // Product Variants
  async getAllAttributes() {
    return this.request<
      APIResponse<{
        attributes: Array<{
          id: number
          name: string
          display_type: string
          create_variant: string
          values: Array<{
            id: number
            name: string
            html_color?: string | null
            sequence: number
          }>
        }>
      }>
    >('/api/ecommerce/attributes')
  }

  async getProductVariants(productId: number) {
    return this.request<
      APIResponse<{
        attribute_lines: Array<{
          id: number
          attribute_id: number
          attribute_name: string
          display_type: string
          values: Array<{ id: number; name: string; html_color?: string | null }>
        }>
        variants: Array<{
          id: number
          name: string
          display_name: string
          default_code: string
          barcode: string
          list_price: number
          standard_price: number
          qty_available: number
          image: string | null
          attribute_values: Array<{
            id: number
            name: string
            attribute_id: number
            attribute_name: string
          }>
        }>
        variant_count: number
      }>
    >(`/api/ecommerce/products/${productId}/variants`)
  }

  async addProductAttribute(
    productId: number,
    data: { attribute_id: number; value_ids: number[] }
  ) {
    return this.request<
      APIResponse<{
        attribute_line: {
          id: number
          attribute_id: number
          attribute_name: string
          values: Array<{ id: number; name: string }>
        }
        message: string
      }>
    >(`/api/ecommerce/products/${productId}/attributes/add`, data)
  }

  async updateProductAttribute(
    productId: number,
    lineId: number,
    data: { value_ids: number[] }
  ) {
    return this.request<
      APIResponse<{
        attribute_line: {
          id: number
          attribute_id: number
          attribute_name: string
          values: Array<{ id: number; name: string }>
        }
        message: string
      }>
    >(`/api/ecommerce/products/${productId}/attributes/${lineId}/update`, data)
  }

  async deleteProductAttribute(productId: number, lineId: number) {
    return this.request<APIResponse<{ message: string }>>(
      `/api/ecommerce/products/${productId}/attributes/${lineId}/delete`
    )
  }

  async updateProductVariant(
    productId: number,
    variantId: number,
    data: {
      list_price?: number
      standard_price?: number
      default_code?: string
      barcode?: string
    }
  ) {
    return this.request<
      APIResponse<{
        variant: {
          id: number
          name: string
          display_name: string
          default_code: string
          barcode: string
          list_price: number
          standard_price: number
        }
        message: string
      }>
    >(`/api/ecommerce/products/${productId}/variants/${variantId}/update`, data)
  }

  async updateVariantStock(productId: number, variantId: number, quantity: number) {
    return this.request<
      APIResponse<{
        variant: {
          id: number
          name: string
          qty_available: number
        }
        message: string
      }>
    >(`/api/ecommerce/products/${productId}/variants/${variantId}/stock/update`, { quantity })
  }

  async regenerateProductVariants(productId: number) {
    return this.request<
      APIResponse<{
        variants_before: number
        variants_after: number
        variants_created: number
        variants: Array<{
          id: number
          name: string
          display_name: string
          default_code: string
          barcode: string
          list_price: number
          standard_price: number
          qty_available: number
          active: boolean
          attributes: Array<{
            attribute: string
            value: string
            attribute_id: number
            value_id: number
          }>
        }>
        message: string
      }>
    >(`/api/ecommerce/products/${productId}/variants/regenerate`)
  }

  // ==================== ATTRIBUTE VALUE IMAGES (V2) ====================
  // Images associées aux valeurs d'attributs (ex: images pour la couleur "Rouge")

  async getProductAttributeImages(productId: number) {
    return this.request<
      APIResponse<{
        attribute_lines: Array<{
          id: number
          attribute_id: number
          attribute_name: string
          display_type: string
          values: Array<{
            ptav_id: number
            name: string
            html_color: string | null
            image_count: number
            first_image_url: string | null
          }>
        }>
      }>
    >(`/api/ecommerce/products/${productId}/attribute-images`)
  }

  async getAttributeValueImages(productId: number, ptavId: number) {
    return this.request<
      APIResponse<{
        images: Array<{
          id: number
          name: string
          url: string
          url_medium: string
          url_small: string
          sequence: number
        }>
        ptav_id: number
        ptav_name: string
      }>
    >(`/api/ecommerce/products/${productId}/attribute-values/${ptavId}/images`)
  }

  async uploadAttributeValueImages(
    productId: number,
    ptavId: number,
    images: Array<{ name: string; image_1920: string }>
  ) {
    return this.request<
      APIResponse<{
        images: Array<{
          id: number
          name: string
          url: string
          url_medium: string
          url_small: string
          sequence: number
        }>
        message: string
      }>
    >(`/api/ecommerce/products/${productId}/attribute-values/${ptavId}/images/upload`, { images })
  }

  async deleteAttributeValueImage(productId: number, ptavId: number, imageId: number) {
    return this.request<APIResponse<{ message: string }>>(
      `/api/ecommerce/products/${productId}/attribute-values/${ptavId}/images/${imageId}/delete`
    )
  }

  async reorderAttributeValueImages(productId: number, ptavId: number, imageIds: number[]) {
    return this.request<APIResponse<{ message: string }>>(
      `/api/ecommerce/products/${productId}/attribute-values/${ptavId}/images/reorder`,
      { image_ids: imageIds }
    )
  }

  // ==================== CATEGORIES ====================

  async getCategories(params?: {
    limit?: number
    offset?: number
    search?: string
    include_tree?: boolean
  }) {
    return this.request<APIResponse<{
      categories: Category[]
      total: number
      limit: number
      offset: number
    }>>(
      '/api/ecommerce/categories',
      params
    )
  }

  async getCategory(id: number) {
    return this.request<APIResponse<{ category: Category }>>(
      `/api/ecommerce/categories/${id}`
    )
  }

  async createCategory(data: { name: string; parent_id?: number }) {
    return this.request<APIResponse<{ category: Category }>>(
      '/api/ecommerce/categories/create',
      data
    )
  }

  async updateCategory(id: number, data: { name?: string; parent_id?: number | null }) {
    return this.request<APIResponse<{ category: Category }>>(
      `/api/ecommerce/categories/${id}/update`,
      data
    )
  }

  async deleteCategory(id: number) {
    return this.request<APIResponse>(`/api/ecommerce/categories/${id}/delete`)
  }

  async moveCategory(id: number, newParentId: number | null) {
    return this.request<APIResponse<{ category: Category }>>(
      `/api/ecommerce/categories/${id}/move`,
      { parent_id: newParentId }
    )
  }

  // ==================== ORDERS ====================

  async getOrders(params?: {
    limit?: number
    offset?: number
    status?: string
    search?: string
    date_from?: string
    date_to?: string
  }) {
    return this.request<PaginatedResponse<Order>>('/api/ecommerce/orders', params)
  }

  async getOrder(id: number) {
    return this.request<APIResponse<{ order: OrderDetail }>>(
      `/api/ecommerce/orders/${id}`
    )
  }

  async createOrder(data: {
    partner_id?: number
    lines?: Array<{ product_id: number; quantity: number; price_unit?: number }>
    confirm?: boolean
  }) {
    return this.request<APIResponse<{ order: Order }>>('/api/ecommerce/orders/create', data)
  }

  async updateOrderStatus(id: number, action: 'confirm' | 'cancel' | 'done') {
    return this.request<APIResponse<{ order: Order }>>(
      `/api/ecommerce/orders/${id}/status`,
      { action }
    )
  }

  async getCustomerOrders(params?: { limit?: number; offset?: number }) {
    return this.request<PaginatedResponse<Order>>('/api/ecommerce/customer/orders', params)
  }

  async getDeliverySlipPDF(orderId: number): Promise<Blob> {
    const url = `${this.baseUrl}/api/ecommerce/orders/${orderId}/delivery-slip`

    const headers: HeadersInit = {}
    if (this.sessionId) {
      headers['X-Session-Id'] = this.sessionId
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

  async getShippingTracking(orderId: number) {
    return this.request<APIResponse<ShippingTrackingInfo>>(
      `/api/ecommerce/orders/${orderId}/tracking`
    )
  }

  async updateOrderTracking(
    orderId: number,
    data: { picking_id: number; tracking_ref: string; carrier_id?: number }
  ) {
    return this.request<
      APIResponse<{
        message: string
        data: {
          picking_id: number
          picking_name: string
          carrier_tracking_ref: string
          carrier_tracking_url: string
        }
      }>
    >(`/api/ecommerce/orders/${orderId}/tracking/update`, data)
  }

  async getOrderHistory(orderId: number) {
    return this.request<APIResponse<{ history: OrderHistoryItem[] }>>(
      `/api/ecommerce/orders/${orderId}/history`
    )
  }

  async sendQuotationEmail(orderId: number) {
    return this.request<
      APIResponse<{
        message: string
        order: {
          id: number
          name: string
          state: string
        }
      }>
    >(`/api/ecommerce/orders/${orderId}/send-quotation`)
  }

  async createInvoiceFromOrder(orderId: number) {
    return this.request<
      APIResponse<{
        message: string
        invoice: {
          id: number
          name: string
          state: string
          amount_total: number
        }
      }>
    >(`/api/ecommerce/orders/${orderId}/create-invoice`)
  }

  async unlockOrder(orderId: number) {
    return this.request<
      APIResponse<{
        message: string
        order: {
          id: number
          name: string
          state: string
        }
      }>
    >(`/api/ecommerce/orders/${orderId}/unlock`)
  }

  // ==================== CUSTOMERS (ADMIN) ====================

  async getCustomers(params?: { limit?: number; offset?: number; search?: string }) {
    return this.request<PaginatedResponse<CustomerListItem>>('/api/ecommerce/customers', params)
  }

  async getCustomer(id: number) {
    return this.request<{
      success: boolean
      customer: {
        id: number
        name: string
        email: string
        phone: string
        mobile: string
        street: string
        street2: string
        city: string
        zip: string
        country: string
        create_date: string
        orders_count: number
        total_spent: number
        orders: Array<{
          id: number
          name: string
          date_order: string
          state: string
          amount_total: number
        }>
        addresses: Array<{
          id: number
          name: string
          street: string
          city: string
          zip: string
          country: string
          type: string
        }>
      }
    }>(`/api/ecommerce/customers/${id}`)
  }

  async updateCustomer(id: number, data: {
    name?: string
    email?: string
    phone?: string
    mobile?: string
    street?: string
    city?: string
    zip?: string
  }) {
    return this.request<{
      success: boolean
      customer: {
        id: number
        name: string
        email: string
        phone: string
        mobile: string
        street: string
        city: string
        zip: string
      }
      message: string
    }>(`/api/ecommerce/customers/${id}/update`, data)
  }

  async exportCustomersCSV(params?: { search?: string }) {
    return this.request<
      APIResponse<{
        customers: Array<{
          id: number
          name: string
          email: string
          phone: string
          mobile: string
          street: string
          street2: string
          city: string
          zip: string
          state: string
          country: string
          orders_count: number
          total_spent: number
          create_date: string
        }>
        total: number
        columns: Array<{ key: string; label: string }>
      }>
    >('/api/ecommerce/customers/export', params)
  }

  // ==================== STOCK ====================

  async getStockProducts(params?: { limit?: number; offset?: number; search?: string }) {
    return this.request<PaginatedResponse<StockProduct>>('/api/ecommerce/stock/products', params)
  }

  async updateProductStock(productId: number, quantity: number) {
    return this.request<APIResponse<{ stock: { product_id: number; qty_available: number } }>>(
      `/api/ecommerce/products/${productId}/stock/update`,
      { quantity }
    )
  }

  async getStockMoves(params?: { limit?: number; offset?: number; product_id?: number }) {
    return this.request<APIResponse<{ moves: StockMove[]; total: number; limit: number; offset: number }>>(
      '/api/ecommerce/stock/moves',
      params
    )
  }

  async exportStockCSV(filters: { date_from?: string; date_to?: string }) {
    return this.request<APIResponse<{ data: any[]; total: number; filters: { date_from?: string; date_to?: string } }>>(
      '/api/ecommerce/stock/export',
      filters
    )
  }

  // ==================== STOCK TRANSFERS ====================

  async getStockTransfers(params?: {
    limit?: number
    offset?: number
    state?: string
    warehouse_id?: number
    search?: string
  }) {
    return this.request('/api/ecommerce/stock/pickings', params)
  }

  async getStockLocations(params?: {
    warehouse_id?: number
    usage?: string
    internal_only?: boolean
  }) {
    return this.request('/api/ecommerce/stock/locations', params)
  }

  async createStockTransfer(params: {
    product_id: number
    quantity: number
    from_location_id: number
    to_location_id: number
    note?: string
  }) {
    return this.request('/api/ecommerce/stock/transfer', params)
  }

  async validateStockTransfer(pickingId: number) {
    return this.request(`/api/ecommerce/stock/pickings/${pickingId}/validate`, {})
  }

  async cancelStockTransfer(pickingId: number) {
    return this.request(`/api/ecommerce/stock/pickings/${pickingId}/cancel`, {})
  }

  // ==================== DELIVERY ====================

  async getDeliveryMethods() {
    return this.request<APIResponse<{ delivery_methods: DeliveryMethod[] }>>(
      '/api/ecommerce/delivery/methods'
    )
  }

  async getDeliveryMethod(id: number) {
    return this.request<{
      success: boolean
      delivery_method: {
        id: number
        name: string
        delivery_type: string
        fixed_price: number
        free_over: number
        active: boolean
      }
    }>(`/api/ecommerce/delivery/methods/${id}`)
  }

  async createDeliveryMethod(data: {
    name: string
    fixed_price: number
    free_over?: number
  }) {
    return this.request<{
      success: boolean
      delivery_method: {
        id: number
        name: string
        fixed_price: number
        delivery_type: string
        active: boolean
      }
      message: string
    }>('/api/ecommerce/delivery/methods/create', data)
  }

  async updateDeliveryMethod(
    id: number,
    data: {
      name?: string
      fixed_price?: number
      free_over?: number | null
      active?: boolean
    }
  ) {
    return this.request<{
      success: boolean
      delivery_method: {
        id: number
        name: string
        fixed_price: number
        active: boolean
      }
      message: string
    }>(`/api/ecommerce/delivery/methods/${id}/update`, data)
  }

  async deleteDeliveryMethod(id: number) {
    return this.request<{
      success: boolean
      message: string
    }>(`/api/ecommerce/delivery/methods/${id}/delete`)
  }

  // ==================== FEATURED PRODUCTS ====================

  async getFeaturedProducts(params?: { limit?: number; offset?: number }) {
    return this.request<
      APIResponse<{
        products: Array<{
          id: number
          name: string
          price: number
          image: string | null
          sequence: number
          qty_available: number
          stock_status: 'in_stock' | 'low_stock' | 'out_of_stock'
          category: { id: number; name: string } | null
        }>
        total: number
      }>
    >('/api/ecommerce/featured', params)
  }

  async getAvailableProductsForFeatured(params?: {
    limit?: number
    offset?: number
    search?: string
  }) {
    return this.request<
      APIResponse<{
        products: Array<{
          id: number
          name: string
          price: number
          image: string | null
          default_code: string
          category: { id: number; name: string } | null
        }>
        total: number
      }>
    >('/api/ecommerce/featured/available', params)
  }

  async addFeaturedProduct(productId: number) {
    return this.request<
      APIResponse<{
        product: { id: number; name: string; sequence: number }
        message: string
      }>
    >('/api/ecommerce/featured/add', { product_id: productId })
  }

  async removeFeaturedProduct(productId: number) {
    return this.request<APIResponse<{ message: string }>>('/api/ecommerce/featured/remove', {
      product_id: productId,
    })
  }

  async reorderFeaturedProducts(productIds: number[]) {
    return this.request<APIResponse<{ message: string }>>('/api/ecommerce/featured/reorder', {
      product_ids: productIds,
    })
  }

  // ==================== ANALYTICS ====================

  async getAnalyticsStats() {
    return this.request<APIResponse<AnalyticsStats>>('/api/ecommerce/analytics/stats')
  }

  async getRevenueChart(params?: { period?: string; start_date?: string; end_date?: string; group_by?: string }) {
    return this.request<{
      success: boolean
      data: Array<{ period: string; revenue: number; orders: number }>
      period: string
      group_by: string
    }>('/api/ecommerce/analytics/revenue-chart', params)
  }

  async getOrdersChart(params?: { period?: string }) {
    return this.request<{
      success: boolean
      data: Array<{ period: string; total: number; confirmed: number; pending: number; cancelled: number }>
      period: string
      group_by: string
    }>('/api/ecommerce/analytics/orders-chart', params)
  }

  async getConversionFunnel(params?: { period?: string }) {
    return this.request<{
      success: boolean
      data: Array<{ stage: string; count: number; percentage: number; color: string }>
      period: string
    }>('/api/ecommerce/analytics/conversion-funnel', params)
  }

  async getTopCategories(params?: { limit?: number }) {
    return this.request<{
      success: boolean
      data: Array<{ id: number; name: string; qty_sold: number; revenue: number }>
    }>('/api/ecommerce/analytics/top-categories', params)
  }

  // ==================== CART ====================

  async getCart(guestEmail?: string) {
    return this.request<APIResponse<{ cart: Cart }>>('/api/ecommerce/cart', {
      guest_email: guestEmail,
    })
  }

  async addToCart(data: { product_id: number; quantity: number; guest_email?: string }) {
    return this.request<APIResponse<{ cart: Partial<Cart> }>>(
      '/api/ecommerce/cart/add',
      data
    )
  }

  async updateCartLine(data: { line_id: number; quantity: number; guest_email?: string }) {
    return this.request<APIResponse<{ cart: Partial<Cart> }>>(
      '/api/ecommerce/cart/update',
      data
    )
  }

  async removeFromCart(lineId: number, guestEmail?: string) {
    return this.request<APIResponse<{ cart: Partial<Cart> }>>(
      `/api/ecommerce/cart/remove/${lineId}`,
      { guest_email: guestEmail }
    )
  }

  async clearCart(guestEmail?: string) {
    return this.request<APIResponse<{ cart: Partial<Cart> }>>(
      '/api/ecommerce/cart/clear',
      { guest_email: guestEmail }
    )
  }

  // ==================== ABANDONED CARTS (ADMIN) ====================

  async getAbandonedCarts(params?: AbandonedCartsQueryParams) {
    return this.request<
      APIResponse<{
        abandoned_carts: AbandonedCart[]
        total: number
        limit: number
        offset: number
      }>
    >('/api/ecommerce/cart/abandoned', params)
  }

  async sendCartReminder(cartId: number) {
    return this.request<APIResponse<{ message: string }>>(
      `/api/ecommerce/cart/${cartId}/send-reminder`
    )
  }

  async getCartRecoveryStats(params?: { period?: string }) {
    return this.request<APIResponse<CartRecoveryStats>>(
      '/api/ecommerce/cart/recovery-stats',
      params
    )
  }

  // ==================== CUSTOMER PROFILE ====================

  async getCustomerProfile() {
    return this.request<APIResponse<{ profile: Customer }>>(
      '/api/ecommerce/customer/profile'
    )
  }

  async updateCustomerProfile(data: Partial<Customer>) {
    return this.request<APIResponse<{ profile: Customer }>>(
      '/api/ecommerce/customer/profile/update',
      data
    )
  }

  // ==================== CUSTOMER ADDRESSES ====================

  async getCustomerAddresses() {
    return this.request<APIResponse<{ addresses: Address[] }>>(
      '/api/ecommerce/customer/addresses'
    )
  }

  async createCustomerAddress(data: Omit<Address, 'id'>) {
    return this.request<APIResponse<{ address: Address }>>(
      '/api/ecommerce/customer/addresses/create',
      data
    )
  }

  async updateCustomerAddress(id: number, data: Partial<Address>) {
    return this.request<APIResponse<{ address: Address }>>(
      `/api/ecommerce/customer/addresses/${id}/update`,
      data
    )
  }

  async deleteCustomerAddress(id: number) {
    return this.request<APIResponse>(
      `/api/ecommerce/customer/addresses/${id}/delete`
    )
  }

  // ==================== COUPONS ====================

  async getCoupons(params?: { limit?: number; offset?: number; active_only?: boolean }) {
    return this.request<PaginatedResponse<Coupon>>('/api/ecommerce/coupons', params)
  }

  async createCoupon(data: CouponCreate) {
    return this.request<APIResponse<{ coupon: Coupon }>>(
      '/api/ecommerce/coupons/create',
      data
    )
  }

  async getCoupon(id: number) {
    return this.request<{
      success: boolean
      coupon: {
        id: number
        name: string
        program_type: string
        trigger: string
        active: boolean
        date_from: string | null
        date_to: string | null
        codes: string[]
        reward: {
          id: number | null
          discount: number
          discount_mode: string
          discount_fixed_amount: number
        } | null
      }
    }>(`/api/ecommerce/coupons/${id}`)
  }

  async updateCoupon(
    id: number,
    data: {
      name?: string
      active?: boolean
      date_from?: string | null
      date_to?: string | null
      discount_type?: string
      discount_value?: number
    }
  ) {
    return this.request<{
      success: boolean
      coupon: { id: number; name: string; active: boolean }
      message: string
    }>(`/api/ecommerce/coupons/${id}/update`, data)
  }

  async deleteCoupon(id: number) {
    return this.request<{
      success: boolean
      message: string
    }>(`/api/ecommerce/coupons/${id}/delete`)
  }

  async applyCouponToCart(code: string, guestEmail?: string) {
    return this.request<APIResponse<{ cart: Partial<Cart>; discount_amount?: number }>>(
      '/api/ecommerce/cart/coupon/apply',
      { code, guest_email: guestEmail }
    )
  }

  async removeCouponFromCart(guestEmail?: string) {
    return this.request<APIResponse<{ cart: Partial<Cart> }>>(
      '/api/ecommerce/cart/coupon/remove',
      { guest_email: guestEmail }
    )
  }

  // ==================== PAYMENT TRANSACTIONS ====================

  async getPaymentTransactions(params?: {
    limit?: number
    offset?: number
    state?: string
    search?: string
  }) {
    return this.request<{
      success: boolean
      data: {
        transactions: Array<{
          id: number
          reference: string
          provider_reference: string
          amount: number
          currency: string
          state: string
          state_label: string
          provider: { id: number | null; name: string }
          partner: { id: number | null; name: string; email: string }
          order: { id: number; name: string } | null
          create_date: string | null
          last_state_change: string | null
        }>
        total: number
        limit: number
        offset: number
        stats: {
          total: number
          done: number
          pending: number
          error: number
          canceled: number
          total_amount: number
        }
      }
    }>('/api/ecommerce/payment/transactions', params)
  }

  async getPaymentTransaction(id: number) {
    return this.request<{
      success: boolean
      transaction: {
        id: number
        reference: string
        provider_reference: string
        amount: number
        currency: string
        state: string
        state_label: string
        provider: { id: number | null; name: string; code: string }
        partner: { id: number | null; name: string; email: string; phone: string }
        order: { id: number; name: string; amount_total: number; state: string } | null
        create_date: string | null
      }
    }>(`/api/ecommerce/payment/transactions/${id}`)
  }

  async refundTransaction(
    transactionId: number,
    data: { amount?: number; reason?: string }
  ) {
    return this.request<{
      success: boolean
      message: string
      transaction: {
        id: number
        reference: string
        state: string
        refund_amount: number
        refund_reason: string
      }
    }>(`/api/ecommerce/payment/transactions/${transactionId}/refund`, data)
  }

  // ==================== STOCK INVENTORY ====================

  async prepareInventory(params?: { category_id?: number; search?: string }) {
    return this.request<
      APIResponse<{
        inventory_lines: Array<{
          product_id: number
          product_name: string
          sku: string
          image_url: string
          category: string
          theoretical_qty: number
          counted_qty: number | null
        }>
        total_products: number
      }>
    >('/api/ecommerce/stock/inventory/prepare', params)
  }

  async validateInventory(adjustments: Array<{ product_id: number; new_qty: number }>) {
    return this.request<
      APIResponse<{
        adjusted_products: Array<{
          product_id: number
          product_name: string
          old_qty: number
          new_qty: number
          difference: number
        }>
        total_adjusted: number
        errors: Array<{ error: string; product_id?: number }>
        error_count: number
      }>
    >('/api/ecommerce/stock/inventory/validate', { adjustments })
  }

  // ==================== STOCK ALERTS ====================

  async getLowStockAlerts(params?: { limit?: number; offset?: number }) {
    return this.request<{
      success: boolean
      data: {
        alerts: Array<{
          id: number
          name: string
          sku: string
          current_stock: number
          threshold: number
          diff: number
          image_url: string | null
          list_price: number
          category: string
        }>
        total: number
      }
    }>(`/api/ecommerce/stock/low-stock-alerts`, params)
  }

  async getHighStockAlerts(params?: { limit?: number; offset?: number }) {
    return this.request<{
      success: boolean
      data: {
        alerts: Array<{
          id: number
          name: string
          sku: string
          current_stock: number
          threshold: number
          diff: number
          image_url: string | null
          list_price: number
          category: string
        }>
        total: number
      }
    }>(`/api/ecommerce/stock/high-stock-alerts`, params)
  }


  // ==================== INVOICES ====================

  async getInvoices(params?: { limit?: number; offset?: number; state?: string; search?: string }) {
    return this.request<{
      success: boolean
      data: {
        invoices: Array<{
          id: number
          name: string
          move_type: string
          move_type_label: string
          state: string
          partner: { id: number | null; name: string }
          invoice_date: string | null
          amount_total: number
          amount_residual: number
          currency: string
          payment_state: string
          invoice_origin: string
        }>
        total: number
        stats: {
          total: number
          draft: number
          posted: number
          paid: number
          total_amount: number
        }
      }
    }>('/api/ecommerce/invoices', params)
  }

  async getInvoice(id: number) {
    return this.request<{
      success: boolean
      invoice: {
        id: number
        name: string
        move_type: string
        state: string
        partner: { id: number | null; name: string; email: string }
        invoice_date: string | null
        amount_untaxed: number
        amount_tax: number
        amount_total: number
        amount_residual: number
        payment_state: string
        invoice_origin: string
        lines: Array<{
          id: number
          name: string
          product: { id: number; name: string } | null
          quantity: number
          price_unit: number
          price_total: number
        }>
      }
    }>(`/api/ecommerce/invoices/${id}`)
  }

  async postInvoice(invoiceId: number) {
    return this.request<{
      success: boolean
      invoice: { id: number; name: string; state: string }
      message: string
    }>(`/api/ecommerce/invoices/${invoiceId}/post`)
  }

  async sendInvoiceEmail(invoiceId: number) {
    return this.request<{
      success: boolean
      message: string
    }>(`/api/ecommerce/invoices/${invoiceId}/send-email`)
  }

  async getInvoicePDF(invoiceId: number): Promise<Blob> {
    const url = `${this.baseUrl}/api/ecommerce/invoices/${invoiceId}/pdf`

    const headers: HeadersInit = {}
    if (this.sessionId) {
      headers['X-Session-Id'] = this.sessionId
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

  // ==================== SITE CONFIGURATION ====================

  async getSiteConfig() {
    return this.request<APIResponse<{
      config: {
        brand: {
          name: string
          slogan: string
          description: string
          email: string
          phone: string
          phoneFormatted: string
          whatsapp: string
        }
        social: {
          facebook: string
          instagram: string
          twitter: string
          youtube: string
          linkedin: string
          tiktok: string
        }
        shipping: {
          freeThreshold: number
          standardDaysMin: number
          standardDaysMax: number
          expressDaysMin: number
          expressDaysMax: number
        }
        returns: {
          windowDays: number
          refundDaysMin: number
          refundDaysMax: number
          warrantyYears: number
        }
        customerService: {
          hoursStart: number
          hoursEnd: number
          days: string
        }
        loyalty: {
          pointsRatio: number
          defaultDiscountPercent: number
        }
        currency: {
          code: string
          symbol: string
        }
        seo: {
          siteUrl: string
          title: string
          description: string
        }
        features: {
          wishlist: boolean
          comparison: boolean
          reviews: boolean
          guestCheckout: boolean
        }
        assets: {
          logoUrl: string
          primaryColor: string
          secondaryColor: string
        }
      }
    }>>('/api/ecommerce/site-config')
  }

  async updateSiteConfig(data: {
    shipping?: {
      freeThreshold?: number
      standardDaysMin?: number
      standardDaysMax?: number
      expressDaysMin?: number
      expressDaysMax?: number
    }
    returns?: {
      windowDays?: number
      refundDaysMin?: number
      refundDaysMax?: number
      warrantyYears?: number
    }
    brand?: {
      name?: string
      slogan?: string
      description?: string
      email?: string
      phone?: string
      whatsapp?: string
    }
    social?: {
      facebook?: string
      instagram?: string
      twitter?: string
      youtube?: string
      linkedin?: string
      tiktok?: string
    }
    loyalty?: {
      pointsRatio?: number
      defaultDiscountPercent?: number
    }
    features?: {
      wishlist?: boolean
      comparison?: boolean
      reviews?: boolean
      guestCheckout?: boolean
    }
    assets?: {
      logoUrl?: string
      primaryColor?: string
      secondaryColor?: string
    }
  }) {
    return this.request<APIResponse<{ message: string; updated: string[] }>>('/api/ecommerce/site-config/update', data)
  }

  // ========================================
  // CRM METHODS
  // ========================================

  async getStages() {
    return this.request<APIResponse<Stage[]>>('/api/ecommerce/crm/stages')
  }

  async getLeads(params?: { limit?: number; offset?: number; search?: string }) {
    return this.request<APIResponse<{ data: LeadListItem[]; pagination: { total: number; limit: number; offset: number } }>>('/api/ecommerce/crm/leads', params)
  }

  async getLead(id: number) {
    return this.request<APIResponse<Lead>>(`/api/ecommerce/crm/leads/${id}`)
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
    return this.request<APIResponse<{ id: number; name: string; stage_id?: number; stage_name?: string }>>('/api/ecommerce/crm/leads/create', data)
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
    return this.request<APIResponse<{ id: number; name: string; expected_revenue?: number; probability?: number }>>(`/api/ecommerce/crm/leads/${id}/update`, data)
  }

  async updateLeadStage(id: number, stage_id: number) {
    return this.request<APIResponse<{ id: number; stage_id: number; stage_name: string }>>(`/api/ecommerce/crm/leads/${id}/stage`, { stage_id })
  }
}

export const api = new ApiClient(API_URL)
