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

  // ========================================
  // CATÉGORIES
  // ========================================

  async getCategories(filters: { limit?: number; offset?: number } = {}): Promise<{ success: boolean; categories: any[]; error?: string }> {
    return this.jsonrpc('/categories', filters);
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
}

// Instance singleton
export const odooClient = new OdooClient();

// Charger la session au démarrage (côté client uniquement)
if (typeof window !== 'undefined') {
  odooClient.loadSession();
}
