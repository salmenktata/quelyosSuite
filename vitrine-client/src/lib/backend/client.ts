/**
 * Client API Backend pour Next.js
 * Gère les appels JSON-RPC vers le système backend E-commerce
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
} from '@quelyos/types';
import { logger } from '@/lib/logger';

// Use Next.js API proxy to avoid CORS issues
// The proxy at /api/backend/* forwards requests to backend server-side
const getApiBase = () => {
  // Côté serveur (SSR), utiliser l'URL complète
  if (typeof window === 'undefined') {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return `${baseUrl}/api/backend`;
  }
  // Côté client, utiliser le chemin relatif
  return '/api/backend';
};

const DB = process.env.BACKEND_DATABASE || 'quelyos';

export class BackendClient {
  private api: AxiosInstance;
  private sessionId: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: getApiBase(),
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

    // Log errors for debugging (only in development)
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('API Error:', error);
        if (error.response?.data?.error) {
          logger.error('Détails:', error.response.data.error);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Appel JSON-RPC générique vers backend via le proxy Next.js
   * Le proxy ajoute automatiquement le wrapper JSON-RPC
   */
  private async jsonrpc<T = any>(
    endpoint: string,
    params: Record<string, any> = {},
    options: { throwOn404?: boolean } = {}
  ): Promise<T> {
    const { throwOn404 = false } = options;

    try {
      // The Next.js proxy handles JSON-RPC wrapping, so we send just params
      const response = await this.api.post(endpoint, params);

      // The proxy returns the result directly
      return response.data;
    } catch (error: any) {
      // Gestion gracieuse des 404 pour les endpoints non implémentés
      if (error.response?.status === 404 && !throwOn404) {
        logger.warn(`Endpoint non implémenté: ${endpoint}`);
        // Retourner une structure par défaut selon le type de réponse attendu
        return { success: false, error: 'Not implemented' } as T;
      }

      logger.error(`Erreur API [${endpoint}]:`, error);

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
      localStorage.setItem('backend_session_id', sessionId);
    }
  }

  /**
   * Récupérer le session_id du localStorage
   */
  loadSession() {
    if (typeof window !== 'undefined') {
      const sessionId = localStorage.getItem('backend_session_id');
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
      localStorage.removeItem('backend_session_id');
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

  async getProductVariants(productId: number): Promise<any> {
    return this.jsonrpc(`/products/${productId}/variants`);
  }

  async getUpsellProducts(productId: number, limit: number = 3): Promise<{ success: boolean; products?: Product[]; error?: string }> {
    return this.jsonrpc(`/products/${productId}/upsell`, { limit });
  }

  async getRecommendations(productId: number, limit: number = 8): Promise<APIResponse & { data?: { products: Product[] } }> {
    return this.jsonrpc(`/products/${productId}/recommendations`, { limit });
  }

  async getFrequentlyBoughtTogether(productId: number, limit: number = 4): Promise<APIResponse & {
    data?: {
      products: Array<{ id: number; name: string; slug: string; price: number; image_url: string | null; in_stock: boolean; co_purchase_count: number }>;
      bundle_total: number;
      bundle_discount: number;
      bundle_price: number;
    }
  }> {
    return this.jsonrpc(`/products/${productId}/frequently-bought-together`, { limit });
  }

  async getUserPurchasedProducts(): Promise<APIResponse & { data?: { product_ids: number[] } }> {
    return this.jsonrpc('/user/purchased-products', {});
  }

  async getProductVolumePricing(productId: number, pricelistId?: number): Promise<APIResponse & {
    data?: {
      base_price: number;
      currency: string;
      tiers: Array<{
        min_quantity: number;
        price: number;
        discount_percent: number;
        savings_per_unit: number;
      }>;
    }
  }> {
    return this.jsonrpc(`/products/${productId}/volume-pricing`, { pricelist_id: pricelistId });
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

  async searchSemantic(query: string, options?: { limit?: number; categoryId?: number }): Promise<APIResponse & {
    data?: {
      products: Array<{
        id: number;
        name: string;
        slug: string;
        price: number;
        compare_at_price: number | null;
        image_url: string | null;
        category: string | null;
        in_stock: boolean;
        is_bestseller: boolean;
        relevance_score: number;
      }>;
      query_expansion: string[];
      total_found: number;
    }
  }> {
    return this.jsonrpc('/search/semantic', {
      query,
      limit: options?.limit ?? 20,
      category_id: options?.categoryId,
    });
  }

  // ========================================
  // REFERRAL / PARRAINAGE
  // ========================================

  async getReferralInfo(): Promise<APIResponse & {
    data?: {
      referral_code: string;
      referral_link: string;
      referred_count: number;
      successful_referrals: number;
      pending_referrals: number;
      earned_rewards: number;
      reward_rate: number;
      rewards: { referrer: string; referee: string };
    }
  }> {
    return this.jsonrpc('/referral/info', {});
  }

  async validateReferralCode(code: string): Promise<APIResponse & {
    data?: { referrer_name: string; discount: string; message: string }
  }> {
    return this.jsonrpc('/referral/apply', { code });
  }

  async getPopularSearches(limit: number = 5): Promise<APIResponse & { data?: { popular_searches: Array<{ query: string; type: string; count: number; category_id?: number }> } }> {
    const response = await this.jsonrpc<APIResponse & { data?: { popular_searches: Array<{ query: string; type: string; count: number; category_id?: number }> } }>(
      '/search/popular',
      { limit },
      { throwOn404: false }
    );
    // Si l'endpoint n'est pas implémenté, retourner un résultat vide
    if (!response.success) {
      return { success: true, data: { popular_searches: [] } };
    }
    return response;
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
    return this.jsonrpc('/delivery/methods');
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
    return this.jsonrpc('/customer/profile/update', data);
  }

  async getOrders(filters?: { limit?: number; offset?: number }): Promise<APIResponse & { orders?: Order[] }> {
    return this.jsonrpc('/customer/orders', filters);
  }

  async getOrder(id: number): Promise<APIResponse & { order?: Order }> {
    return this.jsonrpc(`/orders/${id}`);
  }

  async reorderOrder(orderId: number): Promise<APIResponse & {
    cart?: Cart;
    added_products?: Array<{ name: string; quantity: number; adjusted: boolean }>;
    unavailable_products?: Array<{ name: string; reason: string }>;
    message?: string;
  }> {
    return this.jsonrpc(`/orders/${orderId}/reorder`);
  }

  async getAddresses(): Promise<APIResponse & { addresses?: Address[] }> {
    return this.jsonrpc('/customer/addresses');
  }

  async addAddress(address: Address): Promise<APIResponse> {
    return this.jsonrpc('/customer/addresses/create', address);
  }

  async updateAddress(id: number, address: Partial<Address>): Promise<APIResponse> {
    return this.jsonrpc(`/customer/addresses/${id}/update`, address);
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

  async generateWishlistShareLink(): Promise<APIResponse & { share_token?: string; share_url?: string }> {
    return this.jsonrpc('/wishlist/share');
  }

  async disableWishlistSharing(): Promise<APIResponse> {
    return this.jsonrpc('/wishlist/unshare');
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
    return this.jsonrpc('/cart/coupon/apply', { code, order_id });
  }

  async removeCoupon(order_id?: number): Promise<APIResponse & { cart?: Cart }> {
    return this.jsonrpc('/cart/coupon/remove', { order_id });
  }

  async getAvailableCoupons(): Promise<APIResponse & { coupons?: any[] }> {
    return this.jsonrpc('/coupons/available');
  }

  // Analytics
  async getAnalyticsDashboard(period: string = '30d'): Promise<APIResponse & { data?: any }> {
    return this.jsonrpc('/analytics/dashboard', { period });
  }

  // Cart save & recovery
  async saveCart(email: string): Promise<APIResponse & { recovery_url?: string; token?: string; cart?: Cart }> {
    return this.jsonrpc('/cart/save', { email });
  }

  async recoverCart(token: string): Promise<APIResponse & { cart?: Cart }> {
    return this.jsonrpc('/cart/recover', { token });
  }

  // Stripe payment
  async createStripePaymentIntent(orderId: number, returnUrl?: string): Promise<APIResponse & {
    client_secret?: string;
    payment_intent_id?: string;
    amount?: number;
    currency?: string;
    order?: any;
  }> {
    return this.jsonrpc('/payment/stripe/create-intent', {
      order_id: orderId,
      return_url: returnUrl
    });
  }

  async confirmStripePayment(paymentIntentId: string, orderId: number): Promise<APIResponse & {
    status?: string;
    order?: Order;
  }> {
    return this.jsonrpc('/payment/stripe/confirm', {
      payment_intent_id: paymentIntentId,
      order_id: orderId
    });
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
    const response = await this.jsonrpc<APIResponse & { data?: { config: any } }>(
      '/site-config',
      {},
      { throwOn404: false }
    );
    // Si l'endpoint n'est pas implémenté, retourner un résultat vide
    if (!response.success) {
      return { success: true, data: { config: {} } };
    }
    return response;
  }

  async getBrandConfig(): Promise<APIResponse & { data?: { brand: any; social: any } }> {
    const response = await this.jsonrpc<APIResponse & { data?: { brand: any; social: any } }>(
      '/site-config/brand',
      {},
      { throwOn404: false }
    );
    // Si l'endpoint n'est pas implémenté, retourner un résultat vide
    if (!response.success) {
      return { success: true, data: { brand: {}, social: {} } };
    }
    return response;
  }

  async getShippingConfig(): Promise<APIResponse & { data?: { shipping: any; returns: any } }> {
    const response = await this.jsonrpc<APIResponse & { data?: { shipping: any; returns: any } }>(
      '/site-config/shipping',
      {},
      { throwOn404: false }
    );
    // Si l'endpoint n'est pas implémenté, retourner un résultat vide
    if (!response.success) {
      return { success: true, data: { shipping: {}, returns: {} } };
    }
    return response;
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
    return this.jsonrpc('/loyalty/calculate', { amount });
  }

  // FAQ
  async getPublicFAQs(categoryCode?: string): Promise<APIResponse & { data?: { categories: any[]; faqs: any[] } }> {
    return this.jsonrpc('/faq/public', { category_code: categoryCode });
  }

  // Static pages
  async getStaticPage(slug: string): Promise<APIResponse & { page?: { id: number; title: string; subtitle?: string; content: string; seo_title?: string; seo_description?: string } }> {
    return this.jsonrpc(`/pages/${slug}`);
  }

  // Payment providers
  async getPaymentProviders(): Promise<{ success: boolean; providers: any[]; error?: string }> {
    return this.jsonrpc('/payment/providers');
  }

  async initPayment(data: {
    provider_id: number;
    amount: number;
    currency_code: string;
    order_reference: string;
    customer_data: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
    };
    return_url: string;
  }): Promise<{ success: boolean; paymentUrl?: string; transactionRef?: string; transactionId?: number; error?: string }> {
    return this.jsonrpc('/payment/init', data);
  }

  // =========================================================================
  // PRODUCT REVIEWS
  // =========================================================================

  async getProductReviews(productId: number, limit: number = 10, offset: number = 0): Promise<{
    success: boolean;
    reviews: any[];
    total: number;
    avgRating: number;
    ratingDistribution: Record<number, number>;
    error?: string;
  }> {
    return this.jsonrpc(`/products/${productId}/reviews`, { limit, offset });
  }

  async submitProductReview(productId: number, data: {
    rating: number;
    content: string;
    title?: string;
    author_name?: string;
    author_email?: string;
    pros?: string;
    cons?: string;
  }): Promise<{ success: boolean; message?: string; reviewId?: number; error?: string }> {
    return this.jsonrpc(`/products/${productId}/reviews/submit`, data);
  }

  async markReviewHelpful(reviewId: number, helpful: boolean): Promise<{
    success: boolean;
    helpfulYes: number;
    helpfulNo: number;
    error?: string;
  }> {
    return this.jsonrpc(`/reviews/${reviewId}/helpful`, { helpful });
  }

  // =========================================================================
  // BLOG
  // =========================================================================

  async getBlogPosts(params: {
    category_slug?: string;
    tag_slug?: string;
    featured_only?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    success: boolean;
    posts: BlogPost[];
    total: number;
    hasMore: boolean;
    error?: string;
  }> {
    return this.jsonrpc('/blog/posts', params);
  }

  async getBlogPost(slug: string): Promise<{
    success: boolean;
    post?: BlogPost;
    relatedPosts?: BlogPost[];
    error?: string;
  }> {
    return this.jsonrpc(`/blog/posts/${slug}`, {});
  }

  async getBlogCategories(): Promise<{
    success: boolean;
    categories: BlogCategory[];
    error?: string;
  }> {
    return this.jsonrpc('/blog/categories', {});
  }

  // =========================================================================
  // TESTIMONIALS
  // =========================================================================

  async getTestimonials(params: {
    featured_only?: boolean;
    limit?: number;
  } = {}): Promise<{
    success: boolean;
    testimonials: Testimonial[];
    error?: string;
  }> {
    return this.jsonrpc('/testimonials', params);
  }

  // =========================================================================
  // COLLECTIONS
  // =========================================================================

  async getCollections(): Promise<{
    success: boolean;
    collections: Collection[];
    error?: string;
  }> {
    return this.jsonrpc('/collections', {});
  }

  async getCollection(slug: string): Promise<{
    success: boolean;
    collection?: Collection;
    products?: Product[];
    error?: string;
  }> {
    return this.jsonrpc(`/collections/${slug}`, {});
  }

  // =========================================================================
  // FLASH SALES
  // =========================================================================

  async getFlashSales(): Promise<{
    success: boolean;
    flashSales: FlashSale[];
    error?: string;
  }> {
    return this.jsonrpc('/flash-sales', {});
  }

  // =========================================================================
  // LIVE EVENTS (Live Shopping)
  // =========================================================================

  async getLiveEvents(params?: { limit?: number }): Promise<{
    success: boolean;
    liveEvents: LiveEvent[];
    total: number;
    error?: string;
  }> {
    return this.jsonrpc('/live-events', params || {});
  }

  // =========================================================================
  // TRENDING PRODUCTS (Produits Tendance)
  // =========================================================================

  async getTrendingProducts(params?: { limit?: number }): Promise<{
    success: boolean;
    products: TrendingProduct[];
    total: number;
    error?: string;
  }> {
    return this.jsonrpc('/trending-products', params || {});
  }
}

export interface TrendingProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  social_mentions: number;
  trending_score: number;
}

// Types pour les nouvelles entités
export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  coverUrl?: string;
  categoryId: number;
  categoryName: string;
  authorName: string;
  state: 'draft' | 'published' | 'archived';
  publishedDate?: string;
  isFeatured: boolean;
  viewsCount: number;
  readingTime: number;
  tags: { id: number; name: string }[];
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
  postCount: number;
}

export interface Testimonial {
  id: number;
  authorName: string;
  authorTitle?: string;
  authorCompany?: string;
  authorPhoto?: string;
  content: string;
  rating: number;
  isFeatured: boolean;
}

export interface Collection {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  productCount: number;
}

export interface FlashSale {
  id: number;
  name: string;
  description?: string;
  bannerUrl?: string;
  startDate: string;
  endDate: string;
  products: Product[];
}

export interface LiveEvent {
  id: number;
  name: string;
  title: string;
  description: string;
  thumbnail: string | null;
  thumbnailUrl: string | null;
  scheduledAt: string;
  durationMinutes: number;
  hostName: string;
  host: string;
  hostAvatar: string | null;
  productIds: number[];
  productCount: number;
  state: 'draft' | 'scheduled' | 'live' | 'ended' | 'cancelled';
  isLive: boolean;
  viewersCount: number;
  viewers: number;
}

// Instance singleton
export const backendClient = new BackendClient();

// Charger la session au démarrage (côté client uniquement)
if (typeof window !== 'undefined') {
  backendClient.loadSession();
}
