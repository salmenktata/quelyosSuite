/**
 * Client API Odoo pour Next.js
 * Gère les appels JSON-RPC vers le backend Odoo E-commerce
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type {
  Product,
  ProductListResponse,
  ProductFilters,
  Cart,
  Order,
  User,
  Address,
  WishlistItem,
  APIResponse,
} from '@/types';

// Use Next.js API proxy to avoid CORS issues
// The proxy at /api/odoo/* forwards requests to Odoo server-side
const API_BASE = '/api/odoo';
const DB = process.env.ODOO_DATABASE || 'quelyos';

export class OdooClient {
  private api: AxiosInstance;
  private sessionId: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
      // No need for withCredentials since we're using our own proxy
      withCredentials: false,
    });

    // Intercepteur pour ajouter automatiquement le session_id
    this.api.interceptors.request.use((config) => {
      // Add session_id to request body
      if (this.sessionId && config.data) {
        config.data.session_id = this.sessionId;
      }
      return config;
    });

    // Log errors for debugging
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Proxy Error:', error);
        if (error.response?.data?.error) {
          console.error('Odoo Error:', error.response.data.error);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Appel JSON-RPC générique vers Odoo via le proxy Next.js
   * Le proxy ajoute automatiquement le wrapper JSON-RPC
   */
  private async jsonrpc<T = any>(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    try {
      // The Next.js proxy handles JSON-RPC wrapping, so we send just params
      const response = await this.api.post(endpoint, params);

      // The proxy returns the result directly
      return response.data;
    } catch (error: any) {
      console.error(`Odoo API Error [${endpoint}]:`, error);

      // Extract error message from various possible formats
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Unknown error';

      throw new Error(errorMessage);
    }
  }

  /**
   * Définir le session_id (après login)
   */
  setSession(sessionId: string) {
    this.sessionId = sessionId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('odoo_session_id', sessionId);
    }
  }

  /**
   * Récupérer le session_id du localStorage
   */
  loadSession() {
    if (typeof window !== 'undefined') {
      const sessionId = localStorage.getItem('odoo_session_id');
      if (sessionId) {
        this.sessionId = sessionId;
      }
    }
  }

  /**
   * Effacer la session
   */
  clearSession() {
    this.sessionId = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('odoo_session_id');
    }
  }

  // ========================================
  // AUTHENTIFICATION
  // ========================================

  async login(email: string, password: string): Promise<{ success: boolean; session_id?: string; user?: User; error?: string }> {
    try {
      const result = await this.jsonrpc('/auth/login', { email, password });

      if (result.success && result.session_id) {
        this.setSession(result.session_id);
      }

      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async logout(): Promise<{ success: boolean }> {
    try {
      await this.jsonrpc('/auth/logout');
      this.clearSession();
      return { success: true };
    } catch (error) {
      this.clearSession();
      return { success: false };
    }
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<APIResponse> {
    return this.jsonrpc('/auth/register', data);
  }

  async getSession(): Promise<{ authenticated: boolean; user?: User }> {
    try {
      return await this.jsonrpc('/auth/session');
    } catch (error) {
      return { authenticated: false };
    }
  }

  // ========================================
  // PRODUITS
  // ========================================

  async getProducts(filters: ProductFilters = {}): Promise<ProductListResponse> {
    return this.jsonrpc('/products', filters);
  }

  async getProduct(id: number): Promise<{ success: boolean; product?: Product; error?: string }> {
    return this.jsonrpc(`/products/${id}`);
  }

  async getProductBySlug(slug: string): Promise<{ success: boolean; product?: Product; error?: string }> {
    return this.jsonrpc(`/products/slug/${slug}`);
  }

  async getUpsellProducts(productId: number, limit: number = 3): Promise<{ success: boolean; products?: Product[]; error?: string }> {
    return this.jsonrpc(`/products/${productId}/upsell`, { limit });
  }

  async getRecommendations(productId: number, limit: number = 8): Promise<APIResponse & { data?: { products: Product[] } }> {
    return this.jsonrpc(`/products/${productId}/recommendations`, { limit });
  }

  // ========================================
  // SEARCH
  // ========================================

  async searchAutocomplete(query: string, limit: number = 8, includeCategories: boolean = true): Promise<APIResponse & { data?: any }> {
    return this.jsonrpc('/search/autocomplete', {
      query,
      limit,
      include_categories: includeCategories
    });
  }

  async getPopularSearches(limit: number = 5): Promise<APIResponse & { data?: { popular_searches: Array<{ query: string; type: string; count: number; category_id?: number }> } }> {
    return this.jsonrpc('/search/popular', { limit });
  }

  // ========================================
  // CATÉGORIES
  // ========================================

  async getCategories(filters: {
    limit?: number;
    offset?: number;
    include_featured_products?: boolean;
    featured_limit?: number;
  } = {}): Promise<{ success: boolean; data?: { categories: any[] }; categories?: any[]; error?: string }> {
    const result = await this.jsonrpc('/categories', filters);
    // Support both response formats
    if (result.data?.categories) {
      return { ...result, categories: result.data.categories };
    }
    return result;
  }

  async getCategory(id: number): Promise<{ success: boolean; category?: any; error?: string }> {
    return this.jsonrpc(`/categories/${id}`);
  }

  // ========================================
  // PANIER
  // ========================================

  async getCart(): Promise<{ success: boolean; cart?: Cart; error?: string }> {
    return this.jsonrpc('/cart');
  }

  async addToCart(product_id: number, quantity: number = 1): Promise<APIResponse & { cart?: Cart }> {
    return this.jsonrpc('/cart/add', { product_id, quantity });
  }

  async updateCartLine(line_id: number, quantity: number): Promise<APIResponse & { cart?: Cart }> {
    return this.jsonrpc(`/cart/update/${line_id}`, { quantity });
  }

  async removeCartLine(line_id: number): Promise<APIResponse & { cart?: Cart }> {
    return this.jsonrpc(`/cart/remove/${line_id}`);
  }

  async clearCart(): Promise<APIResponse> {
    return this.jsonrpc('/cart/clear');
  }

  // ========================================
  // CHECKOUT
  // ========================================

  async validateCart(): Promise<APIResponse> {
    return this.jsonrpc('/checkout/validate');
  }

  async calculateShipping(delivery_method_id: number): Promise<APIResponse & { shipping_cost?: number }> {
    return this.jsonrpc('/checkout/shipping', { delivery_method_id });
  }

  async getDeliveryMethods(): Promise<APIResponse & { data?: { delivery_methods: any[] } }> {
    return this.jsonrpc('/checkout/delivery-methods');
  }

  async completeCheckout(data: any): Promise<APIResponse & { order?: Order }> {
    return this.jsonrpc('/checkout/complete', data);
  }

  async confirmOrder(data: {
    shipping_address_id?: number;
    billing_address_id?: number;
    delivery_method_id: number;
    payment_method_id: number;
    notes?: string;
  }): Promise<APIResponse & { order?: Order }> {
    return this.jsonrpc('/checkout/confirm', data);
  }

  // ========================================
  // PAYMENT
  // ========================================

  async createPayPalOrder(orderId: number): Promise<APIResponse & { data?: any }> {
    return this.jsonrpc('/payment/paypal/create-order', { order_id: orderId });
  }

  async capturePayPalOrder(paypalOrderId: string, orderId: number): Promise<APIResponse & { data?: any }> {
    return this.jsonrpc('/payment/paypal/capture-order', {
      paypal_order_id: paypalOrderId,
      order_id: orderId
    });
  }

  async createWalletPayment(data: {
    amount: number;
    payment_method_id: number;
    shipping_address: any;
    order_id?: number;
  }): Promise<APIResponse & { data?: any }> {
    return this.jsonrpc('/payment/wallet/create', data);
  }

  // ========================================
  // CLIENT
  // ========================================

  async getProfile(): Promise<APIResponse & { profile?: User }> {
    return this.jsonrpc('/customer/profile');
  }

  async updateProfile(data: Partial<User>): Promise<APIResponse> {
    return this.jsonrpc('/customer/profile', data);
  }

  async getOrders(filters?: { limit?: number; offset?: number }): Promise<APIResponse & { orders?: Order[] }> {
    return this.jsonrpc('/customer/orders', filters);
  }

  async getOrder(id: number): Promise<APIResponse & { order?: Order }> {
    return this.jsonrpc(`/customer/orders/${id}`);
  }

  async getAddresses(): Promise<APIResponse & { addresses?: Address[] }> {
    return this.jsonrpc('/customer/addresses');
  }

  async addAddress(address: Address): Promise<APIResponse> {
    return this.jsonrpc('/customer/addresses', address);
  }

  async updateAddress(id: number, address: Partial<Address>): Promise<APIResponse> {
    return this.jsonrpc(`/customer/addresses/${id}`, address);
  }

  async deleteAddress(id: number): Promise<APIResponse> {
    return this.jsonrpc(`/customer/addresses/${id}/delete`);
  }

  // ========================================
  // WISHLIST
  // ========================================

  async getWishlist(): Promise<APIResponse & { wishlist?: WishlistItem[] }> {
    return this.jsonrpc('/wishlist');
  }

  async addToWishlist(product_id: number): Promise<APIResponse> {
    return this.jsonrpc('/wishlist/add', { product_id });
  }

  async removeFromWishlist(product_id: number): Promise<APIResponse> {
    return this.jsonrpc(`/wishlist/remove/${product_id}`);
  }

  async getPublicWishlist(token: string): Promise<APIResponse & { data?: any }> {
    return this.jsonrpc(`/wishlist/public/${token}`);
  }

  // ========================================
  // MARKETING
  // ========================================

  async getActivePopups(pageUrl: string): Promise<APIResponse & { data?: any }> {
    return this.jsonrpc('/popups/active', { page_url: pageUrl });
  }

  async trackPopupClick(popupId: number): Promise<APIResponse> {
    return this.jsonrpc(`/popups/${popupId}/click`);
  }

  // ========================================
  // COUPONS
  // ========================================

  async validateCoupon(code: string, order_id?: number): Promise<APIResponse & { cart?: Cart; discount?: number }> {
    return this.jsonrpc('/coupon/validate', { code, order_id });
  }

  async removeCoupon(order_id?: number): Promise<APIResponse & { cart?: Cart }> {
    return this.jsonrpc('/coupon/remove', { order_id });
  }

  async getAvailableCoupons(): Promise<APIResponse & { coupons?: any[] }> {
    return this.jsonrpc('/coupons/available');
  }

  // Analytics
  async getAnalyticsDashboard(period: string = '30d'): Promise<APIResponse & { data?: any }> {
    return this.jsonrpc('/analytics/dashboard', { period });
  }

  // Cart recovery
  async recoverCart(token: string): Promise<APIResponse & { data?: any }> {
    return this.jsonrpc(`/cart/recover/${token}`, {});
  }

  // Product facets (filters)
  async getProductFacets(categoryId?: number): Promise<APIResponse & { data?: any }> {
    return this.jsonrpc('/products/facets', { category_id: categoryId });
  }

  // Stock alerts
  async getStockAlertStatus(productId: number): Promise<APIResponse & { data?: { subscribed: boolean; subscription_id?: number } }> {
    return this.jsonrpc(`/products/${productId}/stock-alert-status`);
  }

  async subscribeToStockAlert(productId: number, email: string): Promise<APIResponse & { data?: { message: string; subscription_id: number } }> {
    return this.jsonrpc(`/products/${productId}/notify-restock`, { email });
  }

  async unsubscribeFromStockAlert(subscriptionId: number): Promise<APIResponse> {
    return this.jsonrpc(`/stock-alerts/unsubscribe/${subscriptionId}`);
  }

  // SEO metadata
  async getProductSeoMetadata(productId: number): Promise<APIResponse & { data?: any }> {
    return this.jsonrpc(`/seo/product/${productId}`);
  }

  async getBreadcrumbsData(productId: number): Promise<APIResponse & { data?: { breadcrumbs: any[]; structured_data?: any } }> {
    return this.jsonrpc(`/seo/breadcrumbs/${productId}`);
  }

  async getOrganizationSeoData(): Promise<APIResponse & { data?: { structured_data?: any } }> {
    return this.jsonrpc('/seo/organization');
  }

  // Site configuration
  async getSiteConfig(): Promise<APIResponse & { data?: { config: any } }> {
    return this.jsonrpc('/site-config');
  }

  async getBrandConfig(): Promise<APIResponse & { data?: { brand: any; social: any } }> {
    return this.jsonrpc('/site-config/brand');
  }

  async getShippingConfig(): Promise<APIResponse & { data?: { shipping: any; returns: any } }> {
    return this.jsonrpc('/site-config/shipping');
  }

  // ========================================
  // CONTACT
  // ========================================

  async submitContactForm(data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }): Promise<APIResponse & { message?: string }> {
    return this.jsonrpc('/contact', data);
  }

  // Loyalty program
  async getLoyaltyBalance(): Promise<APIResponse & { data?: any }> {
    return this.jsonrpc('/loyalty/balance');
  }

  async getLoyaltyTiers(): Promise<APIResponse & { data?: { tiers: any[] } }> {
    return this.jsonrpc('/loyalty/tiers');
  }

  async redeemLoyaltyPoints(points: number, orderId?: number): Promise<APIResponse & { data?: { discount_amount: number; new_balance: number; message: string } }> {
    return this.jsonrpc('/loyalty/redeem', { points, order_id: orderId });
  }

  async calculateLoyaltyPoints(amount: number): Promise<APIResponse & { data?: { points: number; program_active: boolean } }> {
    return this.jsonrpc('/loyalty/calculate-points', { amount });
  }
}

// Instance singleton
export const odooClient = new OdooClient();

// Charger la session au démarrage (côté client uniquement)
if (typeof window !== 'undefined') {
  odooClient.loadSession();
}
