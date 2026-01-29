/**
 * Types API génériques pour les réponses backend
 */

import type { Product, User, Cart, Order, Address, WishlistItem } from '@quelyos/types';

// ========================================
// TYPES DE BASE
// ========================================

/**
 * Réponse API générique avec succès/erreur
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Pagination générique
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
}

// ========================================
// AUTHENTIFICATION
// ========================================

export interface LoginResponse {
  success: boolean;
  session_id?: string;
  user?: User;
  error?: string;
}

export interface SessionResponse {
  authenticated: boolean;
  user?: User;
}

// ========================================
// PRODUITS
// ========================================

export interface ProductResponse {
  success: boolean;
  product?: Product;
  error?: string;
}

export interface ProductVariant {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  attributes: Array<{
    name: string;
    value: string;
  }>;
  image_url?: string;
}

export interface ProductVariantsResponse {
  success: boolean;
  variants?: ProductVariant[];
  error?: string;
}

export interface UpsellProductsResponse {
  success: boolean;
  products?: Product[];
  error?: string;
}

export interface FrequentlyBoughtTogetherData {
  products: Array<{
    id: number;
    name: string;
    slug: string;
    price: number;
    image_url: string | null;
    in_stock: boolean;
    co_purchase_count: number;
  }>;
  bundle_total: number;
  bundle_discount: number;
  bundle_price: number;
}

export interface VolumePricingTier {
  min_quantity: number;
  price: number;
  discount_percent: number;
  savings_per_unit: number;
}

export interface VolumePricingData {
  base_price: number;
  currency: string;
  tiers: VolumePricingTier[];
}

// ========================================
// RECHERCHE
// ========================================

export interface AutocompleteResult {
  query: string;
  products: Product[];
  categories: Array<{
    id: number;
    name: string;
    slug: string;
    product_count: number;
  }>;
  suggestions: string[];
}

export interface SemanticSearchProduct {
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
}

export interface SemanticSearchData {
  products: SemanticSearchProduct[];
  query_expansion: string[];
  total_found: number;
}

export interface PopularSearch {
  query: string;
  type: string;
  count: number;
  category_id?: number;
}

// ========================================
// PARRAINAGE
// ========================================

export interface ReferralInfo {
  referral_code: string;
  referral_link: string;
  referred_count: number;
  successful_referrals: number;
  pending_referrals: number;
  earned_rewards: number;
  reward_rate: number;
  rewards: { referrer: string; referee: string };
}

export interface ReferralValidation {
  referrer_name: string;
  discount: string;
  message: string;
}

// ========================================
// CATÉGORIES
// ========================================

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: number;
  product_count?: number;
  featured_products?: Product[];
}

export interface CategoriesResponse {
  success: boolean;
  data?: { categories: Category[] };
  categories?: Category[];
  error?: string;
}

export interface CategoryResponse {
  success: boolean;
  category?: Category;
  error?: string;
}

// ========================================
// PANIER
// ========================================

export interface CartResponse {
  success: boolean;
  cart?: Cart;
  error?: string;
}

// ========================================
// CHECKOUT
// ========================================

export interface DeliveryMethod {
  id: number;
  name: string;
  description: string;
  fixed_price: number | null;
  delivery_time?: string;
}

export interface DeliveryMethodsData {
  delivery_methods: DeliveryMethod[];
}

export interface ShippingCostResponse {
  success: boolean;
  shipping_cost?: number;
  error?: string;
}

export interface CheckoutData {
  shipping_address_id?: number;
  shipping_address?: Partial<Address>;
  billing_address_id?: number;
  delivery_method_id: number;
  payment_method?: string;
  payment_method_id?: number;
  notes?: string;
  save_address?: boolean;
}

export interface OrderData {
  order: Order;
}

export type OrderResponse = ApiResponse<OrderData>;

// ========================================
// PAIEMENT
// ========================================

export interface PayPalOrderData {
  order_id: string;
  paypal_order_id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface PayPalCaptureData {
  order_id: string;
  transaction_id: string;
  status: string;
  payment_source: unknown;
  purchase_units: unknown[];
}

export interface WalletPaymentData {
  amount: number;
  payment_method_id: number;
  shipping_address: ShippingAddress;
  order_id?: number;
}

export interface WalletPaymentResponseData {
  client_secret: string;
  payment_intent_id: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface StripePaymentIntentData {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
  order: Order;
}

export interface StripeConfirmationData {
  status: string;
  order: Order;
}

export interface PaymentProvider {
  id: number;
  name: string;
  code: string;
  description?: string;
  logo_url?: string;
  is_active: boolean;
  supported_currencies: string[];
}

export interface PaymentProvidersResponse {
  success: boolean;
  providers: PaymentProvider[];
  error?: string;
}

export interface PaymentInitData {
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
}

export interface PaymentInitResponse {
  success: boolean;
  paymentUrl?: string;
  transactionRef?: string;
  transactionId?: number;
  error?: string;
}

// ========================================
// PROFIL CLIENT
// ========================================

export interface ProfileResponse {
  success: boolean;
  profile?: User;
  error?: string;
}

export interface OrdersResponse {
  success: boolean;
  orders?: Order[];
  error?: string;
}

export interface ReorderResponse {
  success: boolean;
  cart?: Cart;
  added_products?: Array<{ name: string; quantity: number; adjusted: boolean }>;
  unavailable_products?: Array<{ name: string; reason: string }>;
  message?: string;
  error?: string;
}

export interface AddressesResponse {
  success: boolean;
  addresses?: Address[];
  error?: string;
}

// ========================================
// WISHLIST
// ========================================

export interface WishlistResponse {
  success: boolean;
  wishlist?: WishlistItem[];
  error?: string;
}

export interface PublicWishlistProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string | null;
  stock_available: boolean;
  added_date: string | null;
}

export interface PublicWishlist {
  owner_name: string;
  items: PublicWishlistProduct[];
  total_items: number;
}

export interface PublicWishlistData {
  wishlist: PublicWishlist;
}

export interface WishlistShareResponse {
  success: boolean;
  share_token?: string;
  share_url?: string;
  error?: string;
}

// ========================================
// MARKETING
// ========================================

export interface Popup {
  id: number;
  name: string;
  content: string;
  type: 'modal' | 'banner' | 'slide-in';
  trigger: 'immediate' | 'exit-intent' | 'scroll' | 'time-delay';
  position?: string;
  delay_seconds?: number;
  scroll_percentage?: number;
}

export interface PopupsData {
  popups: Popup[];
  popup?: Popup;
}

// ========================================
// COUPONS
// ========================================

export interface Coupon {
  id: number;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_amount?: number;
  valid_from?: string;
  valid_to?: string;
}

export interface CouponValidationResponse {
  success: boolean;
  cart?: Cart;
  discount?: number;
  error?: string;
  message?: string;
}

export interface AvailableCouponsResponse {
  success: boolean;
  coupons?: Coupon[];
  error?: string;
}

// ========================================
// ANALYTICS
// ========================================

export interface AnalyticsDashboardData {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  conversion_rate: number;
  top_products: Array<{
    id: number;
    name: string;
    sales_count: number;
    revenue: number;
  }>;
  recent_orders: Order[];
}

// ========================================
// CART RECOVERY
// ========================================

export interface CartSaveResponse {
  success: boolean;
  recovery_url?: string;
  token?: string;
  cart?: Cart;
  error?: string;
}

export interface CartRecoveryData {
  products_restored: number;
  coupon_applied: boolean;
  coupon_code?: string;
  message: string;
}

export type CartRecoveryResponse = ApiResponse<CartRecoveryData>;

// ========================================
// FACETTES PRODUIT
// ========================================

export interface ProductFacet {
  attribute: string;
  label: string;
  values: Array<{
    value: string;
    count: number;
    selected?: boolean;
  }>;
}

export interface ProductFacetsData {
  facets: ProductFacet[];
  price_range: {
    min: number;
    max: number;
  };
}

// ========================================
// ALERTES STOCK
// ========================================

export interface StockAlertStatus {
  subscribed: boolean;
  subscription_id?: number;
}

export interface StockAlertSubscription {
  message: string;
  subscription_id: number;
}

// ========================================
// SEO
// ========================================

export interface SeoMetadata {
  title: string;
  description: string;
  keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  canonical_url?: string;
  structured_data?: Record<string, unknown>;
}

export interface Breadcrumb {
  name: string;
  url: string;
  position: number;
}

export interface BreadcrumbsData {
  breadcrumbs: Breadcrumb[];
  structured_data?: Record<string, unknown>;
}

export interface OrganizationSeoData {
  structured_data: Record<string, unknown>;
}

// ========================================
// CONFIGURATION SITE
// ========================================

export interface SiteConfig {
  site_name: string;
  tagline?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  currency: string;
  timezone?: string;
  features?: Record<string, boolean>;
}

export interface BrandConfig {
  brand: {
    name: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
  };
  social: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export interface ShippingConfig {
  shipping: {
    free_shipping_threshold?: number;
    default_delivery_time?: string;
  };
  returns: {
    return_period_days: number;
    return_policy_url?: string;
  };
}

// ========================================
// FIDÉLITÉ
// ========================================

export interface LoyaltyBalanceData {
  current_balance: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
  tier_name?: string;
  tier_benefits?: string[];
}

export interface LoyaltyTier {
  id: number;
  name: string;
  min_points: number;
  benefits: string[];
  icon?: string;
}

export interface LoyaltyRedemptionData {
  discount_amount: number;
  new_balance: number;
  message: string;
}

export interface LoyaltyCalculationData {
  points: number;
  program_active: boolean;
}

// ========================================
// FAQ
// ========================================

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category_id: number;
  category_name: string;
  order: number;
}

export interface FAQCategory {
  id: number;
  name: string;
  code: string;
  description?: string;
}

export interface FAQsData {
  categories: FAQCategory[];
  faqs: FAQ[];
}

// ========================================
// PAGES STATIQUES
// ========================================

export interface StaticPage {
  id: number;
  title: string;
  subtitle?: string;
  content: string;
  seo_title?: string;
  seo_description?: string;
}

export interface StaticPageResponse {
  success: boolean;
  page?: StaticPage;
  error?: string;
}

// ========================================
// AVIS PRODUITS
// ========================================

export interface ProductReview {
  id: number;
  product_id: number;
  rating: number;
  title?: string;
  content: string;
  author_name: string;
  author_email?: string;
  pros?: string;
  cons?: string;
  verified_purchase: boolean;
  helpful_yes: number;
  helpful_no: number;
  created_at: string;
  state: 'pending' | 'approved' | 'rejected';
}

export interface ProductReviewsResponse {
  success: boolean;
  reviews: ProductReview[];
  total: number;
  avgRating: number;
  ratingDistribution: Record<number, number>;
  error?: string;
}

export interface ReviewSubmitResponse {
  success: boolean;
  message?: string;
  reviewId?: number;
  error?: string;
}

export interface ReviewHelpfulResponse {
  success: boolean;
  helpfulYes: number;
  helpfulNo: number;
  error?: string;
}
