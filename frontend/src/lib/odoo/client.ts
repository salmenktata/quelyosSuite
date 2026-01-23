/**
 * Client HTTP pour communiquer avec l'API Odoo E-commerce
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type {
  APIResponse,
  User,
  Product,
  ProductFilters,
  ProductListResponse,
  Cart,
  Order,
  Profile,
  Address,
  WishlistItem,
  PaymentMethod,
  DeliveryMethod,
  Category
} from '@/types';

// Utiliser l'URL du frontend Next.js pour les routes API proxy
const API_BASE_URL = '/api';

class OdooClient {
  private client: AxiosInstance;
  private sessionId: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Important pour les cookies de session
    });

    // Intercepteur pour ajouter le session_id si disponible
    this.client.interceptors.request.use((config) => {
      if (this.sessionId && config.headers) {
        config.headers['X-Session-ID'] = this.sessionId;
      }
      return config;
    });

    // Intercepteur pour gérer les erreurs
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Appel générique à l'API JSON-RPC Odoo
   */
  private async call<T = any>(
    endpoint: string,
    params: any = {},
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post(
      endpoint,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: params,
        id: Math.random(),
      },
      config
    );

    // Odoo retourne les données dans response.data.result
    return response.data.result || response.data;
  }

  // ==================== AUTH ====================

  async login(email: string, password: string): Promise<APIResponse<{ user: User; session_id: string }>> {
    const result = await this.call('/auth/login', {
      login: email,
      password: password,
    });

    if (result.success && result.session_id) {
      this.sessionId = result.session_id;
      // Stocker dans localStorage pour persistance
      if (typeof window !== 'undefined') {
        localStorage.setItem('odoo_session_id', result.session_id);
      }
    }

    return result;
  }

  async logout(): Promise<APIResponse> {
    const result = await this.call('/auth/logout');

    this.sessionId = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('odoo_session_id');
    }

    return result;
  }

  async register(data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<APIResponse<{ user: User }>> {
    const result = await this.call('/auth/register', data);

    if (result.success && result.session_id) {
      this.sessionId = result.session_id;
      if (typeof window !== 'undefined') {
        localStorage.setItem('odoo_session_id', result.session_id);
      }
    }

    return result;
  }

  async checkSession(): Promise<APIResponse<{ authenticated: boolean; user?: User }>> {
    // Restaurer session_id depuis localStorage
    if (typeof window !== 'undefined' && !this.sessionId) {
      this.sessionId = localStorage.getItem('odoo_session_id');
    }

    return await this.call('/auth/session');
  }

  async resetPassword(email: string): Promise<APIResponse> {
    return await this.call('/auth/reset-password', { email });
  }

  // ==================== PRODUCTS ====================

  async getProducts(filters?: ProductFilters): Promise<ProductListResponse> {
    return await this.call('/products', filters || {});
  }

  async getProduct(id: number): Promise<APIResponse<{ product: Product }>> {
    return await this.call(`/products/${id}`);
  }

  async getProductBySlug(slug: string): Promise<APIResponse<{ product: Product }>> {
    return await this.call(`/products/slug/${slug}`);
  }

  async getFeaturedProducts(limit = 8): Promise<APIResponse<{ products: Product[] }>> {
    return await this.call('/products/featured', { limit });
  }

  async getCategories(): Promise<APIResponse<{ categories: Category[] }>> {
    return await this.call('/categories');
  }

  async getCategoryProducts(categoryId: number, filters?: ProductFilters): Promise<ProductListResponse> {
    return await this.call(`/categories/${categoryId}/products`, filters || {});
  }

  // ==================== CART ====================

  async getCart(): Promise<APIResponse<{ cart: Cart }>> {
    return await this.call('/cart');
  }

  async addToCart(productId: number, quantity = 1): Promise<APIResponse<{ cart: Cart }>> {
    return await this.call('/cart/add', {
      product_id: productId,
      quantity: quantity,
    });
  }

  async updateCartLine(lineId: number, quantity: number): Promise<APIResponse<{ cart: Cart }>> {
    return await this.call(`/cart/update/${lineId}`, { quantity });
  }

  async removeCartLine(lineId: number): Promise<APIResponse<{ cart: Cart }>> {
    return await this.call(`/cart/remove/${lineId}`);
  }

  async clearCart(): Promise<APIResponse> {
    return await this.call('/cart/clear');
  }

  async getCartCount(): Promise<APIResponse<{ count: number }>> {
    return await this.call('/cart/count');
  }

  // ==================== CHECKOUT ====================

  async validateCart(): Promise<APIResponse<{ valid: boolean; errors: string[] }>> {
    return await this.call('/checkout/validate');
  }

  async calculateShipping(data: {
    delivery_method_id: number;
    address?: Partial<Address>;
  }): Promise<APIResponse<{ shipping_cost: number; delivery_method: DeliveryMethod }>> {
    return await this.call('/checkout/shipping', data);
  }

  async confirmOrder(data: {
    delivery_method_id: number;
    payment_method_id: number;
    billing_address?: Partial<Address>;
    shipping_address?: Partial<Address>;
    notes?: string;
  }): Promise<APIResponse<{ order: Order; payment_url?: string }>> {
    return await this.call('/checkout/confirm', data);
  }

  async getPaymentMethods(): Promise<APIResponse<{ payment_methods: PaymentMethod[] }>> {
    return await this.call('/payment-methods');
  }

  async getDeliveryMethods(): Promise<APIResponse<{ delivery_methods: DeliveryMethod[] }>> {
    return await this.call('/delivery-methods');
  }

  // ==================== CUSTOMER ====================

  async getProfile(): Promise<APIResponse<{ profile: Profile }>> {
    return await this.call('/customer/profile');
  }

  async updateProfile(data: Partial<Profile>): Promise<APIResponse<{ profile: Profile }>> {
    return await this.call('/customer/profile/update', data);
  }

  async getOrders(params?: {
    limit?: number;
    offset?: number;
    state?: string;
  }): Promise<APIResponse<{ orders: Order[]; total: number }>> {
    return await this.call('/customer/orders', params || {});
  }

  async getOrder(orderId: number): Promise<APIResponse<{ order: Order }>> {
    return await this.call(`/customer/orders/${orderId}`);
  }

  async getAddresses(): Promise<APIResponse<{ addresses: Address[] }>> {
    return await this.call('/customer/addresses');
  }

  async addAddress(address: Partial<Address>): Promise<APIResponse<{ address: Address }>> {
    return await this.call('/customer/addresses/add', address);
  }

  async updateAddress(addressId: number, data: Partial<Address>): Promise<APIResponse> {
    return await this.call(`/customer/addresses/${addressId}/update`, data);
  }

  async deleteAddress(addressId: number): Promise<APIResponse> {
    return await this.call(`/customer/addresses/${addressId}/delete`);
  }

  // ==================== WISHLIST ====================

  async getWishlist(): Promise<APIResponse<{ count: number; items: WishlistItem[] }>> {
    return await this.call('/wishlist');
  }

  async addToWishlist(productId: number): Promise<APIResponse> {
    return await this.call('/wishlist/add', { product_id: productId });
  }

  async removeFromWishlist(productId: number): Promise<APIResponse> {
    return await this.call(`/wishlist/remove/${productId}`);
  }

  async checkInWishlist(productId: number): Promise<APIResponse<{ in_wishlist: boolean }>> {
    return await this.call(`/wishlist/check/${productId}`);
  }

  // ==================== COMPARISON ====================

  async getComparison(): Promise<APIResponse<{ count: number; max_items: number; products: Product[] }>> {
    return await this.call('/comparison');
  }

  async addToComparison(productId: number): Promise<APIResponse> {
    return await this.call('/comparison/add', { product_id: productId });
  }

  async removeFromComparison(productId: number): Promise<APIResponse> {
    return await this.call(`/comparison/remove/${productId}`);
  }

  async clearComparison(): Promise<APIResponse> {
    return await this.call('/comparison/clear');
  }
}

// Export singleton instance
export const odooClient = new OdooClient();

// Export class pour tests
export default OdooClient;
