/**
 * Client API Backend pour Next.js
 * Gère les appels JSON-RPC vers le système backend E-commerce
 */

import axios, { AxiosInstance } from 'axios';
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
import type {
  ApiResponse,
  LoginResponse,
  SessionResponse,
  ProductResponse,
  ProductVariantsResponse,
  UpsellProductsResponse,
  FrequentlyBoughtTogetherData,
  VolumePricingData,
  AutocompleteResult,
  SemanticSearchData,
  PopularSearch,
  ReferralInfo,
  ReferralValidation,
  CategoriesResponse,
  CategoryResponse,
  CartResponse,
  DeliveryMethodsData,
  ShippingCostResponse,
  CheckoutData,
  OrderResponse,
  PayPalOrderData,
  PayPalCaptureData,
  WalletPaymentData,
  StripePaymentIntentData,
  StripeConfirmationData,
  PaymentProvidersResponse,
  PaymentInitData,
  PaymentInitResponse,
  ProfileResponse,
  OrdersResponse,
  ReorderResponse,
  AddressesResponse,
  WishlistResponse,
  PublicWishlistData,
  WishlistShareResponse,
  PopupsData,
  CouponValidationResponse,
  AvailableCouponsResponse,
  AnalyticsDashboardData,
  CartSaveResponse,
  CartRecoveryResponse,
  ProductFacetsData,
  StockAlertStatus,
  StockAlertSubscription,
  SeoMetadata,
  BreadcrumbsData,
  OrganizationSeoData,
  SiteConfig,
  BrandConfig,
  ShippingConfig,
  LoyaltyBalanceData,
  LoyaltyTier,
  LoyaltyRedemptionData,
  LoyaltyCalculationData,
  FAQsData,
  StaticPageResponse,
  ProductReviewsResponse,
  ReviewSubmitResponse,
  ReviewHelpfulResponse,
} from '@/types/api';
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

const _DB = process.env.BACKEND_DATABASE || 'quelyos';

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
  private async jsonrpc<T = unknown>(
    endpoint: string,
    params: Record<string, unknown> = {},
    options: { throwOn404?: boolean } = {}
  ): Promise<T> {
    const { throwOn404 = false } = options;

    try {
      // The Next.js proxy handles JSON-RPC wrapping, so we send just params
      const response = await this.api.post(endpoint, params);

      // The proxy returns the result directly
      return response.data;
    } catch (_error: unknown) {
      const error = _error as { response?: { status?: number; data?: { error?: string; message?: string } }; message?: string };
      // Gestion gracieuse des 404 pour les endpoints non implémentés
      if (error.response?.status === 404 && !throwOn404) {
        logger.warn(`Endpoint non implémenté: ${endpoint}`);
        // Retourner une structure par défaut selon le type de réponse attendu
        return { success: false, error: 'Not implemented' } as T;
      }

      logger.error(`Erreur API [${endpoint}]:`, _error);

      // Extract error message from various possible formats
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        (error instanceof Error ? error.message : 'Unknown error');

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

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const result = await this.jsonrpc<LoginResponse>('/auth/login', { email, password });

      if (result.success && result.session_id) {
        this.setSession(result.session_id);
      }

      return result;
    } catch (_error: unknown) {
      const error = _error as Error;
      return { success: false, error: error.message };
    }
  }

  async logout(): Promise<{ success: boolean }> {
    try {
      await this.jsonrpc('/auth/logout');
      this.clearSession();
      return { success: true };
    } catch (_error) {
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

  async getSession(): Promise<SessionResponse> {
    try {
      return await this.jsonrpc<SessionResponse>('/auth/session');
    } catch (_error) {
      return { authenticated: false };
    }
  }

  // ========================================
  // PRODUITS
  // ========================================

  async getProducts(filters: ProductFilters = {}): Promise<ProductListResponse> {
    return this.jsonrpc('/products', filters);
  }

  async getProduct(id: number): Promise<ProductResponse> {
    return this.jsonrpc<ProductResponse>(`/products/${id}`);
  }

  async getProductBySlug(slug: string): Promise<ProductResponse> {
    return this.jsonrpc<ProductResponse>(`/products/slug/${slug}`);
  }

  async getProductVariants(productId: number): Promise<ProductVariantsResponse> {
    return this.jsonrpc<ProductVariantsResponse>(`/products/${productId}/variants`);
  }

  async getUpsellProducts(productId: number, limit: number = 3): Promise<UpsellProductsResponse> {
    return this.jsonrpc<UpsellProductsResponse>(`/products/${productId}/upsell`, { limit });
  }

  async getRecommendations(productId: number, limit: number = 8): Promise<ApiResponse<{ products: Product[] }>> {
    return this.jsonrpc<ApiResponse<{ products: Product[] }>>(`/products/${productId}/recommendations`, { limit });
  }

  async getFrequentlyBoughtTogether(productId: number, limit: number = 4): Promise<ApiResponse<FrequentlyBoughtTogetherData>> {
    return this.jsonrpc<ApiResponse<FrequentlyBoughtTogetherData>>(`/products/${productId}/frequently-bought-together`, { limit });
  }

  async getUserPurchasedProducts(): Promise<ApiResponse<{ product_ids: number[] }>> {
    return this.jsonrpc<ApiResponse<{ product_ids: number[] }>>('/user/purchased-products', {});
  }

  async getProductVolumePricing(productId: number, pricelistId?: number): Promise<ApiResponse<VolumePricingData>> {
    return this.jsonrpc<ApiResponse<VolumePricingData>>(`/products/${productId}/volume-pricing`, { pricelist_id: pricelistId });
  }

  // ========================================
  // SEARCH
  // ========================================

  async searchAutocomplete(query: string, limit: number = 8, includeCategories: boolean = true): Promise<ApiResponse<AutocompleteResult>> {
    return this.jsonrpc<ApiResponse<AutocompleteResult>>('/search/autocomplete', {
      query,
      limit,
      include_categories: includeCategories
    });
  }

  async searchSemantic(query: string, options?: { limit?: number; categoryId?: number }): Promise<ApiResponse<SemanticSearchData>> {
    return this.jsonrpc<ApiResponse<SemanticSearchData>>('/search/semantic', {
      query,
      limit: options?.limit ?? 20,
      category_id: options?.categoryId,
    });
  }

  // ========================================
  // REFERRAL / PARRAINAGE
  // ========================================

  async getReferralInfo(): Promise<ApiResponse<ReferralInfo>> {
    return this.jsonrpc<ApiResponse<ReferralInfo>>('/referral/info', {});
  }

  async validateReferralCode(code: string): Promise<ApiResponse<ReferralValidation>> {
    return this.jsonrpc<ApiResponse<ReferralValidation>>('/referral/apply', { code });
  }

  async getPopularSearches(limit: number = 5): Promise<ApiResponse<{ popular_searches: PopularSearch[] }>> {
    const response = await this.jsonrpc<ApiResponse<{ popular_searches: PopularSearch[] }>>(
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
  } = {}): Promise<CategoriesResponse> {
    const result = await this.jsonrpc<CategoriesResponse>('/categories', filters);
    // Support both response formats
    if (result.data?.categories) {
      return { ...result, categories: result.data.categories };
    }
    return result;
  }

  async getCategory(id: number): Promise<CategoryResponse> {
    return this.jsonrpc<CategoryResponse>(`/categories/${id}`);
  }

  // ========================================
  // PANIER
  // ========================================

  async getCart(): Promise<CartResponse> {
    return this.jsonrpc<CartResponse>('/cart');
  }

  async addToCart(product_id: number, quantity: number = 1): Promise<CartResponse> {
    return this.jsonrpc<CartResponse>('/cart/add', { product_id, quantity });
  }

  async updateCartLine(line_id: number, quantity: number): Promise<CartResponse> {
    return this.jsonrpc<CartResponse>(`/cart/update/${line_id}`, { quantity });
  }

  async removeCartLine(line_id: number): Promise<CartResponse> {
    return this.jsonrpc<CartResponse>(`/cart/remove/${line_id}`);
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

  async calculateShipping(delivery_method_id: number): Promise<ShippingCostResponse> {
    return this.jsonrpc<ShippingCostResponse>('/checkout/shipping', { delivery_method_id });
  }

  async getDeliveryMethods(): Promise<ApiResponse<DeliveryMethodsData>> {
    return this.jsonrpc<ApiResponse<DeliveryMethodsData>>('/delivery/methods');
  }

  async completeCheckout(data: CheckoutData): Promise<OrderResponse> {
    return this.jsonrpc<OrderResponse>('/checkout/complete', data);
  }

  async confirmOrder(data: CheckoutData): Promise<OrderResponse> {
    return this.jsonrpc<OrderResponse>('/checkout/confirm', data);
  }

  // ========================================
  // PAYMENT
  // ========================================

  async createPayPalOrder(orderId: number): Promise<ApiResponse<PayPalOrderData>> {
    return this.jsonrpc<ApiResponse<PayPalOrderData>>('/payment/paypal/create-order', { order_id: orderId });
  }

  async capturePayPalOrder(paypalOrderId: string, orderId: number): Promise<ApiResponse<PayPalCaptureData>> {
    return this.jsonrpc<ApiResponse<PayPalCaptureData>>('/payment/paypal/capture-order', {
      paypal_order_id: paypalOrderId,
      order_id: orderId
    });
  }

  async createWalletPayment(data: WalletPaymentData): Promise<ApiResponse<unknown>> {
    return this.jsonrpc<ApiResponse<unknown>>('/payment/wallet/create', data);
  }

  // ========================================
  // CLIENT
  // ========================================

  async getProfile(): Promise<ProfileResponse> {
    return this.jsonrpc<ProfileResponse>('/customer/profile');
  }

  async updateProfile(data: Partial<User>): Promise<APIResponse> {
    return this.jsonrpc<APIResponse>('/customer/profile/update', data);
  }

  async getOrders(filters?: { limit?: number; offset?: number }): Promise<OrdersResponse> {
    return this.jsonrpc<OrdersResponse>('/customer/orders', filters);
  }

  async getOrder(id: number): Promise<OrderResponse> {
    return this.jsonrpc<OrderResponse>(`/orders/${id}`);
  }

  async reorderOrder(orderId: number): Promise<ReorderResponse> {
    return this.jsonrpc<ReorderResponse>(`/orders/${orderId}/reorder`);
  }

  async getAddresses(): Promise<AddressesResponse> {
    return this.jsonrpc<AddressesResponse>('/customer/addresses');
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

  async getWishlist(): Promise<WishlistResponse> {
    return this.jsonrpc<WishlistResponse>('/wishlist');
  }

  async addToWishlist(product_id: number): Promise<APIResponse> {
    return this.jsonrpc<APIResponse>('/wishlist/add', { product_id });
  }

  async removeFromWishlist(product_id: number): Promise<APIResponse> {
    return this.jsonrpc<APIResponse>(`/wishlist/remove/${product_id}`);
  }

  async getPublicWishlist(token: string): Promise<ApiResponse<PublicWishlistData>> {
    return this.jsonrpc<ApiResponse<PublicWishlistData>>(`/wishlist/public/${token}`);
  }

  async generateWishlistShareLink(): Promise<WishlistShareResponse> {
    return this.jsonrpc<WishlistShareResponse>('/wishlist/share');
  }

  async disableWishlistSharing(): Promise<APIResponse> {
    return this.jsonrpc<APIResponse>('/wishlist/unshare');
  }

  // ========================================
  // MARKETING
  // ========================================

  async getActivePopups(pageUrl: string): Promise<ApiResponse<PopupsData>> {
    return this.jsonrpc<ApiResponse<PopupsData>>('/popups/active', { page_url: pageUrl });
  }

  async trackPopupClick(popupId: number): Promise<APIResponse> {
    return this.jsonrpc<APIResponse>(`/popups/${popupId}/click`);
  }

  // ========================================
  // COUPONS
  // ========================================

  async validateCoupon(code: string, order_id?: number): Promise<CouponValidationResponse> {
    return this.jsonrpc<CouponValidationResponse>('/cart/coupon/apply', { code, order_id });
  }

  async removeCoupon(order_id?: number): Promise<CartResponse> {
    return this.jsonrpc<CartResponse>('/cart/coupon/remove', { order_id });
  }

  async getAvailableCoupons(): Promise<AvailableCouponsResponse> {
    return this.jsonrpc<AvailableCouponsResponse>('/coupons/available');
  }

  // Analytics
  async getAnalyticsDashboard(period: string = '30d'): Promise<ApiResponse<AnalyticsDashboardData>> {
    return this.jsonrpc<ApiResponse<AnalyticsDashboardData>>('/analytics/dashboard', { period });
  }

  // Cart save & recovery
  async saveCart(email: string): Promise<CartSaveResponse> {
    return this.jsonrpc<CartSaveResponse>('/cart/save', { email });
  }

  async recoverCart(token: string): Promise<CartRecoveryResponse> {
    return this.jsonrpc<CartRecoveryResponse>('/cart/recover', { token });
  }

  // Stripe payment
  async createStripePaymentIntent(orderId: number, returnUrl?: string): Promise<ApiResponse<StripePaymentIntentData>> {
    return this.jsonrpc<ApiResponse<StripePaymentIntentData>>('/payment/stripe/create-intent', {
      order_id: orderId,
      return_url: returnUrl
    });
  }

  async confirmStripePayment(paymentIntentId: string, orderId: number): Promise<ApiResponse<StripeConfirmationData>> {
    return this.jsonrpc<ApiResponse<StripeConfirmationData>>('/payment/stripe/confirm', {
      payment_intent_id: paymentIntentId,
      order_id: orderId
    });
  }

  // Product facets (filters)
  async getProductFacets(categoryId?: number): Promise<ApiResponse<ProductFacetsData>> {
    return this.jsonrpc<ApiResponse<ProductFacetsData>>('/products/facets', { category_id: categoryId });
  }

  // Stock alerts
  async getStockAlertStatus(productId: number): Promise<ApiResponse<StockAlertStatus>> {
    return this.jsonrpc<ApiResponse<StockAlertStatus>>(`/products/${productId}/stock-alert-status`);
  }

  async subscribeToStockAlert(productId: number, email: string): Promise<ApiResponse<StockAlertSubscription>> {
    return this.jsonrpc<ApiResponse<StockAlertSubscription>>(`/products/${productId}/notify-restock`, { email });
  }

  async unsubscribeFromStockAlert(subscriptionId: number): Promise<APIResponse> {
    return this.jsonrpc<APIResponse>(`/stock-alerts/unsubscribe/${subscriptionId}`);
  }

  // SEO metadata
  async getProductSeoMetadata(productId: number): Promise<ApiResponse<SeoMetadata>> {
    return this.jsonrpc<ApiResponse<SeoMetadata>>(`/seo/product/${productId}`);
  }

  async getBreadcrumbsData(productId: number): Promise<ApiResponse<BreadcrumbsData>> {
    return this.jsonrpc<ApiResponse<BreadcrumbsData>>(`/seo/breadcrumbs/${productId}`);
  }

  async getOrganizationSeoData(): Promise<ApiResponse<OrganizationSeoData>> {
    return this.jsonrpc<ApiResponse<OrganizationSeoData>>('/seo/organization');
  }

  // Site configuration
  async getSiteConfig(): Promise<ApiResponse<SiteConfig>> {
    const response = await this.jsonrpc<ApiResponse<SiteConfig>>(
      '/site-config',
      {},
      { throwOn404: false }
    );
    // Si l'endpoint n'est pas implémenté, retourner un résultat vide
    if (!response.success) {
      return { success: true, data: {} as SiteConfig };
    }
    return response;
  }

  async getBrandConfig(): Promise<ApiResponse<BrandConfig>> {
    const response = await this.jsonrpc<ApiResponse<BrandConfig>>(
      '/site-config/brand',
      {},
      { throwOn404: false }
    );
    // Si l'endpoint n'est pas implémenté, retourner un résultat vide
    if (!response.success) {
      return { success: true, data: { brand: {}, social: {} } as BrandConfig };
    }
    return response;
  }

  async getShippingConfig(): Promise<ApiResponse<ShippingConfig>> {
    const response = await this.jsonrpc<ApiResponse<ShippingConfig>>(
      '/site-config/shipping',
      {},
      { throwOn404: false }
    );
    // Si l'endpoint n'est pas implémenté, retourner un résultat vide
    if (!response.success) {
      return { success: true, data: { shipping: {}, returns: {} } as ShippingConfig };
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
  }): Promise<ApiResponse<{ message: string }>> {
    return this.jsonrpc<ApiResponse<{ message: string }>>('/contact', data);
  }

  // Loyalty program
  async getLoyaltyBalance(): Promise<ApiResponse<LoyaltyBalanceData>> {
    return this.jsonrpc<ApiResponse<LoyaltyBalanceData>>('/loyalty/balance');
  }

  async getLoyaltyTiers(): Promise<ApiResponse<{ tiers: LoyaltyTier[] }>> {
    return this.jsonrpc<ApiResponse<{ tiers: LoyaltyTier[] }>>('/loyalty/tiers');
  }

  async redeemLoyaltyPoints(points: number, orderId?: number): Promise<ApiResponse<LoyaltyRedemptionData>> {
    return this.jsonrpc<ApiResponse<LoyaltyRedemptionData>>('/loyalty/redeem', { points, order_id: orderId });
  }

  async calculateLoyaltyPoints(amount: number): Promise<ApiResponse<LoyaltyCalculationData>> {
    return this.jsonrpc<ApiResponse<LoyaltyCalculationData>>('/loyalty/calculate', { amount });
  }

  // FAQ
  async getPublicFAQs(categoryCode?: string): Promise<ApiResponse<FAQsData>> {
    return this.jsonrpc<ApiResponse<FAQsData>>('/faq/public', { category_code: categoryCode });
  }

  // Static pages
  async getStaticPage(slug: string): Promise<StaticPageResponse> {
    return this.jsonrpc<StaticPageResponse>(`/pages/${slug}`);
  }

  // Payment providers
  async getPaymentProviders(): Promise<PaymentProvidersResponse> {
    return this.jsonrpc<PaymentProvidersResponse>('/payment/providers');
  }

  async initPayment(data: PaymentInitData): Promise<PaymentInitResponse> {
    return this.jsonrpc<PaymentInitResponse>('/payment/init', data);
  }

  // =========================================================================
  // PRODUCT REVIEWS
  // =========================================================================

  async getProductReviews(productId: number, limit: number = 10, offset: number = 0): Promise<ProductReviewsResponse> {
    return this.jsonrpc<ProductReviewsResponse>(`/products/${productId}/reviews`, { limit, offset });
  }

  async submitProductReview(productId: number, data: {
    rating: number;
    content: string;
    title?: string;
    author_name?: string;
    author_email?: string;
    pros?: string;
    cons?: string;
  }): Promise<ReviewSubmitResponse> {
    return this.jsonrpc<ReviewSubmitResponse>(`/products/${productId}/reviews/submit`, data);
  }

  async markReviewHelpful(reviewId: number, helpful: boolean): Promise<ReviewHelpfulResponse> {
    return this.jsonrpc<ReviewHelpfulResponse>(`/reviews/${reviewId}/helpful`, { helpful });
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
  customerName: string;
  customerTitle?: string | false;
  customerCompany?: string | false;
  avatarUrl?: string | null;
  content: string;
  rating: number;
  isFeatured: boolean;
  isPublished?: boolean;
  displayOn?: string;
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
