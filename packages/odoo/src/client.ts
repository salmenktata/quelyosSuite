/**
 * Client HTTP Odoo haut niveau
 * Méthodes métier pour e-commerce et backoffice
 * Combine les 200+ méthodes des clients frontend/backoffice
 */

import { odooRpc } from './rpc';
import type { OdooResponse } from './types';

/**
 * Client Odoo unifié avec méthodes métier
 * Compatible SSR Next.js, Client Next.js, et Vite
 */
export class OdooClient {
  // ========================================
  // AUTHENTIFICATION
  // ========================================

  async login(email: string, password: string): Promise<OdooResponse<{
    session_id?: string;
    user?: any;
  }>> {
    return odooRpc.call('/api/auth/login', { email, password });
  }

  async logout(): Promise<OdooResponse> {
    return odooRpc.call('/api/auth/logout');
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<OdooResponse> {
    return odooRpc.call('/api/auth/register', data);
  }

  async getSession(): Promise<OdooResponse<{
    authenticated: boolean;
    user?: any;
  }>> {
    return odooRpc.call('/api/auth/session');
  }

  // ========================================
  // PRODUITS
  // ========================================

  async getProducts(filters: {
    limit?: number;
    offset?: number;
    category_id?: number;
    search?: string;
    min_price?: number;
    max_price?: number;
    attributes?: Record<string, any>;
  } = {}): Promise<OdooResponse<{
    products: any[];
    total?: number;
  }>> {
    return odooRpc.call('/api/ecommerce/products', filters);
  }

  async getProduct(id: number): Promise<OdooResponse<{ product: any }>> {
    return odooRpc.call(`/api/ecommerce/products/${id}`);
  }

  async getProductBySlug(slug: string): Promise<OdooResponse<{ product: any }>> {
    return odooRpc.call(`/api/ecommerce/products/slug/${slug}`);
  }

  async getProductVariants(productId: number): Promise<OdooResponse<{
    variants: any[];
    attribute_lines: any[];
  }>> {
    return odooRpc.call(`/api/ecommerce/products/${productId}/variants`);
  }

  async createProduct(data: Record<string, any>): Promise<OdooResponse<{ id: number }>> {
    return odooRpc.call('/api/ecommerce/products/create', data);
  }

  async updateProduct(id: number, data: Record<string, any>): Promise<OdooResponse> {
    return odooRpc.call(`/api/ecommerce/products/${id}/update`, data);
  }

  async deleteProduct(id: number): Promise<OdooResponse> {
    return odooRpc.call(`/api/ecommerce/products/${id}/delete`);
  }

  // ========================================
  // RECHERCHE
  // ========================================

  async searchAutocomplete(
    query: string,
    options: {
      limit?: number;
      include_categories?: boolean;
    } = {}
  ): Promise<OdooResponse<{
    products: any[];
    categories: any[];
  }>> {
    return odooRpc.call('/api/ecommerce/search/autocomplete', {
      query,
      ...options,
    });
  }

  async getPopularSearches(limit: number = 5): Promise<OdooResponse<{
    popular_searches: Array<{ query: string; count: number }>;
  }>> {
    return odooRpc.call('/api/ecommerce/search/popular', { limit });
  }

  // ========================================
  // CATÉGORIES
  // ========================================

  async getCategories(filters: {
    limit?: number;
    offset?: number;
    include_featured_products?: boolean;
    parent_id?: number | null;
  } = {}): Promise<OdooResponse<{ categories: any[] }>> {
    return odooRpc.call('/api/ecommerce/categories', filters);
  }

  async getCategory(id: number): Promise<OdooResponse<{ category: any }>> {
    return odooRpc.call(`/api/ecommerce/categories/${id}`);
  }

  async createCategory(data: Record<string, any>): Promise<OdooResponse<{ id: number }>> {
    return odooRpc.call('/api/ecommerce/categories/create', data);
  }

  async updateCategory(id: number, data: Record<string, any>): Promise<OdooResponse> {
    return odooRpc.call(`/api/ecommerce/categories/${id}/update`, data);
  }

  async deleteCategory(id: number): Promise<OdooResponse> {
    return odooRpc.call(`/api/ecommerce/categories/${id}/delete`);
  }

  // ========================================
  // PANIER
  // ========================================

  async getCart(): Promise<OdooResponse<{ cart: any }>> {
    return odooRpc.call('/api/ecommerce/cart');
  }

  async addToCart(product_id: number, quantity: number = 1): Promise<OdooResponse<{ cart: any }>> {
    return odooRpc.call('/api/ecommerce/cart/add', { product_id, quantity });
  }

  async updateCartLine(line_id: number, quantity: number): Promise<OdooResponse<{ cart: any }>> {
    return odooRpc.call(`/api/ecommerce/cart/update/${line_id}`, { quantity });
  }

  async removeCartLine(line_id: number): Promise<OdooResponse<{ cart: any }>> {
    return odooRpc.call(`/api/ecommerce/cart/remove/${line_id}`);
  }

  async clearCart(): Promise<OdooResponse> {
    return odooRpc.call('/api/ecommerce/cart/clear');
  }

  // ========================================
  // CHECKOUT
  // ========================================

  async validateCart(): Promise<OdooResponse> {
    return odooRpc.call('/api/ecommerce/checkout/validate');
  }

  async calculateShipping(delivery_method_id: number): Promise<OdooResponse<{
    shipping_cost: number;
  }>> {
    return odooRpc.call('/api/ecommerce/checkout/shipping', { delivery_method_id });
  }

  async confirmOrder(data: {
    shipping_address_id?: number;
    billing_address_id?: number;
    delivery_method_id?: number;
    payment_method?: string;
  }): Promise<OdooResponse<{ order_id: number }>> {
    return odooRpc.call('/api/ecommerce/checkout/confirm', data);
  }

  // ========================================
  // COMMANDES
  // ========================================

  async getOrders(filters: {
    limit?: number;
    offset?: number;
    state?: string;
  } = {}): Promise<OdooResponse<{
    orders: any[];
    total?: number;
  }>> {
    return odooRpc.call('/api/ecommerce/orders', filters);
  }

  async getOrder(id: number): Promise<OdooResponse<{ order: any }>> {
    return odooRpc.call(`/api/ecommerce/orders/${id}`);
  }

  async cancelOrder(id: number): Promise<OdooResponse> {
    return odooRpc.call(`/api/ecommerce/orders/${id}/cancel`);
  }

  // ========================================
  // CLIENTS / PARTNERS
  // ========================================

  async getCustomers(filters: {
    limit?: number;
    offset?: number;
    search?: string;
  } = {}): Promise<OdooResponse<{
    customers: any[];
    total?: number;
  }>> {
    return odooRpc.call('/api/ecommerce/customers', filters);
  }

  async getCustomer(id: number): Promise<OdooResponse<{ customer: any }>> {
    return odooRpc.call(`/api/ecommerce/customers/${id}`);
  }

  async updateCustomer(id: number, data: Record<string, any>): Promise<OdooResponse> {
    return odooRpc.call(`/api/ecommerce/customers/${id}/update`, data);
  }

  // ========================================
  // ADRESSES
  // ========================================

  async getAddresses(): Promise<OdooResponse<{ addresses: any[] }>> {
    return odooRpc.call('/api/ecommerce/customer/addresses');
  }

  async createAddress(data: Record<string, any>): Promise<OdooResponse<{ id: number }>> {
    return odooRpc.call('/api/ecommerce/customer/addresses/create', data);
  }

  async updateAddress(id: number, data: Record<string, any>): Promise<OdooResponse> {
    return odooRpc.call(`/api/ecommerce/customer/addresses/${id}/update`, data);
  }

  async deleteAddress(id: number): Promise<OdooResponse> {
    return odooRpc.call(`/api/ecommerce/customer/addresses/${id}/delete`);
  }

  // ========================================
  // WISHLIST
  // ========================================

  async getWishlist(): Promise<OdooResponse<{ items: any[] }>> {
    return odooRpc.call('/api/ecommerce/wishlist');
  }

  async addToWishlist(product_id: number): Promise<OdooResponse> {
    return odooRpc.call('/api/ecommerce/wishlist/add', { product_id });
  }

  async removeFromWishlist(product_id: number): Promise<OdooResponse> {
    return odooRpc.call('/api/ecommerce/wishlist/remove', { product_id });
  }

  async shareWishlist(): Promise<OdooResponse<{ token: string }>> {
    return odooRpc.call('/api/ecommerce/wishlist/share');
  }

  // ========================================
  // PRICELISTS
  // ========================================

  async getPricelists(filters: {
    limit?: number;
    offset?: number;
  } = {}): Promise<OdooResponse<{ pricelists: any[] }>> {
    return odooRpc.call('/api/ecommerce/pricelists', filters);
  }

  async getPricelist(id: number): Promise<OdooResponse<{ pricelist: any }>> {
    return odooRpc.call(`/api/ecommerce/pricelists/${id}`);
  }

  // ========================================
  // CURRENCIES
  // ========================================

  async getCurrencies(): Promise<OdooResponse<{ currencies: any[] }>> {
    return odooRpc.call('/api/ecommerce/currencies');
  }

  async convertCurrency(
    amount: number,
    from_currency: string,
    to_currency: string
  ): Promise<OdooResponse<{ amount: number }>> {
    return odooRpc.call('/api/ecommerce/currencies/convert', {
      amount,
      from_currency,
      to_currency,
    });
  }

  // ========================================
  // STOCK / WAREHOUSES
  // ========================================

  async getWarehouses(): Promise<OdooResponse<{ warehouses: any[] }>> {
    return odooRpc.call('/api/ecommerce/warehouses');
  }

  async getWarehouse(id: number): Promise<OdooResponse<{ warehouse: any }>> {
    return odooRpc.call(`/api/ecommerce/warehouses/${id}`);
  }

  async getProductStock(
    product_id: number,
    warehouse_id?: number
  ): Promise<OdooResponse<{ qty_available: number; virtual_available: number }>> {
    return odooRpc.call(`/api/ecommerce/products/${product_id}/stock`, {
      warehouse_id,
    });
  }

  // ========================================
  // CMS / SITE CONFIG
  // ========================================

  async getSiteConfig(): Promise<OdooResponse<{ config: any }>> {
    return odooRpc.call('/api/ecommerce/site-config');
  }

  async updateSiteConfig(data: Record<string, any>): Promise<OdooResponse> {
    return odooRpc.call('/api/ecommerce/site-config/update', data);
  }

  async getMenus(code?: string): Promise<OdooResponse<{ menus: any[] }>> {
    if (code) {
      return odooRpc.call(`/api/ecommerce/menus/${code}`);
    }
    return odooRpc.call('/api/ecommerce/menus');
  }

  async getHeroSlides(): Promise<OdooResponse<{ slides: any[] }>> {
    return odooRpc.call('/api/ecommerce/hero-slides');
  }

  async getPromoBanners(): Promise<OdooResponse<{ banners: any[] }>> {
    return odooRpc.call('/api/ecommerce/promo-banners');
  }

  async getTrustBadges(): Promise<OdooResponse<{ badges: any[] }>> {
    return odooRpc.call('/api/ecommerce/trust-badges');
  }

  // ========================================
  // ANALYTICS
  // ========================================

  async getDashboard(): Promise<OdooResponse<{ stats: any }>> {
    return odooRpc.call('/api/ecommerce/analytics/dashboard');
  }

  async getAnalytics(period: string = '30d'): Promise<OdooResponse<{ data: any }>> {
    return odooRpc.call('/api/ecommerce/analytics', { period });
  }

  // ========================================
  // SUBSCRIPTIONS (SaaS)
  // ========================================

  async getSubscriptionPlans(): Promise<OdooResponse<{ plans: any[] }>> {
    return odooRpc.call('/api/ecommerce/subscription/plans');
  }

  async getCurrentSubscription(): Promise<OdooResponse<{ subscription: any }>> {
    return odooRpc.call('/api/ecommerce/subscription/current');
  }

  async createSubscription(plan_id: number): Promise<OdooResponse<{ id: number }>> {
    return odooRpc.call('/api/ecommerce/subscription/create', { plan_id });
  }

  async cancelSubscription(id: number): Promise<OdooResponse> {
    return odooRpc.call(`/api/ecommerce/subscription/${id}/cancel`);
  }
}

// Export singleton instance
export const odooClient = new OdooClient();
