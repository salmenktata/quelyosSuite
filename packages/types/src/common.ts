/**
 * Common shared types used across all Quelyos applications
 *
 * SINGLE SOURCE OF TRUTH for core types:
 * - API responses (APIResponse, LoginResponse, SessionResponse)
 * - Core entities (User, Product, Category, Order, Cart, Address)
 * - E-commerce (Coupon, Ribbon, Wishlist)
 *
 * Used by:
 * - dashboard-client (ERP Complet / Full Suite)
 * - vitrine-client (E-commerce)
 * - All 7 SaaS apps
 *
 * @package @quelyos/types
 */

// ============================================================================
// API RESPONSES
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Login response with JWT token
 */
export interface LoginResponse {
  success: boolean
  access_token?: string
  expires_in?: number
  session_id?: string
  user?: User
  error?: string
}

/**
 * Session check response
 */
export interface SessionResponse {
  success?: boolean
  authenticated: boolean
  is_authenticated?: boolean // Alias for authenticated (backend naming)
  user?: User
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[]
  data?: T[] // Alias for items (used in some endpoints)
  total: number
  page?: number
  limit?: number
  hasMore?: boolean
}

// ============================================================================
// USER & AUTH
// ============================================================================

/**
 * User entity
 */
export interface User {
  id: number
  name: string
  login: string
  email?: string
  groups?: string[]
  tenant_id?: number
  tenant_domain?: string
  image?: string
  phone?: string
  mobile?: string
  function?: string
  active?: boolean
}

// ============================================================================
// PRODUCTS & CATALOG
// ============================================================================

/**
 * Product base interface
 */
export interface Product {
  id: number
  name: string
  slug?: string
  sku?: string
  default_code?: string // SKU/Reference (backend naming)
  description?: string
  description_sale?: string
  description_purchase?: string
  price: number
  compare_at_price?: number
  list_price?: number
  standard_price?: number // Cost price
  image?: string
  image_url?: string
  images?: ProductImage[]
  category?: string | { id: number; name: string } // Can be string or object
  category_id?: number
  in_stock?: boolean
  stock_quantity?: number
  qty_available?: number
  is_bestseller?: boolean
  is_new?: boolean
  discount_percent?: number
  rating?: number
  reviews_count?: number
  tags?: string[]
  product_tag_ids?: Array<{ id: number; name: string }> // Backend tags format
  attributes?: ProductAttribute[]
  variants?: ProductVariant[]
  variant_count?: number
  seo_title?: string
  seo_description?: string
  create_date?: string
  write_date?: string
  active?: boolean
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock'
  detailed_type?: 'consu' | 'service' | 'product'
  product_type?: 'consu' | 'service' | 'product' // Alias for detailed_type
  uom_name?: string // Unit of measure
  barcode?: string
  weight?: number
  volume?: number
  product_length?: number
  product_width?: number
  product_height?: number
  ribbon?: Ribbon | { id: number; name: string } | null
}

/**
 * Detailed product with full information
 */
export interface ProductDetail extends Product {
  taxes?: any; // TODO: typer correctement
  technical_description?: string;
  uom_id?: any; // TODO: typer correctement
  is_featured?: boolean;
  offer_end_date?: string | null;
  long_description?: string
  specifications?: Record<string, string>
  shipping_info?: string
  return_policy?: string
  related_products?: Product[]
  frequently_bought_together?: Product[]
  volume_pricing?: VolumePricingTier[]
  stock_location?: string
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
}

/**
 * Product image
 */
export interface ProductImage {
  id: number
  name?: string // Image name/filename
  url: string
  alt?: string
  position?: number
  is_main?: boolean
}

/**
 * Product attribute (e.g., Color: Red, Size: M)
 */
export interface ProductAttribute {
  name: string
  value: string
  display_name?: string
}

/**
 * Product variant
 */
export interface ProductVariant {
  id: number
  name: string
  sku: string
  price: number
  stock_quantity: number
  attributes: ProductAttribute[]
  image_url?: string
}

/**
 * Volume pricing tier
 */
export interface VolumePricingTier {
  min_quantity: number
  price: number
  discount_percent: number
  savings_per_unit?: number
}

/**
 * Product category
 */
export interface Category {
  id: number
  name: string
  slug?: string
  description?: string
  parent_id?: number
  parent_name?: string
  complete_name?: string // Full hierarchical name
  image_url?: string
  product_count?: number
  total_product_count?: number // Total including children
  child_count?: number // Number of direct children
  children?: Category[]
  active?: boolean
}

// ============================================================================
// ORDERS & CHECKOUT
// ============================================================================

/**
 * Order base interface
 */
export interface Order {
  id: number
  name: string
  reference?: string
  date_order: string | null
  state: OrderState
  state_label?: string
  amount_untaxed?: number
  amount_tax?: number
  amount_total: number
  amount_paid?: number
  amount_due?: number
  customer?: {
    id: number
    name: string
    email?: string
  } | null
  partner_id?: number
  partner_name?: string
  shipping_address?: Address
  billing_address?: Address
  payment_method?: string
  delivery_method?: string
  tracking_number?: string
  notes?: string
  create_date?: string | null
  write_date?: string | null
  invoice_status?: string
  delivery_status?: string
  line_count?: number
  // Aliases for backend compatibility
  total?: number // Alias for amount_total
  subtotal?: number // Alias for amount_untaxed
  tax_total?: number // Alias for amount_tax
  currency?: {
    symbol: string
    name?: string
  }
}

/**
 * Order state
 */
export type OrderState = 'draft' | 'sent' | 'sale' | 'done' | 'cancel'

/**
 * Detailed order with line items
 */
export interface OrderDetail extends Order {
  order_lines: OrderLine[]
  lines?: OrderLine[] // Alias for order_lines
  invoices?: Invoice[]
  payments?: Payment[]
  shipments?: Shipment[]
  history?: OrderHistoryItem[]
}

/**
 * Order line item
 */
export interface OrderLine {
  id: number
  product_id: number
  product_name: string
  product_sku?: string
  product_image?: string
  image_url?: string // Alias for product_image
  quantity: number
  price_unit: number
  price_subtotal: number
  price_total: number
  discount?: number
  tax_ids?: number[]
  tax_amount?: number
  product?: Partial<Product> // Optional expanded product data
}

/**
 * Order history item
 */
export interface OrderHistoryItem {
  id: number
  date: string
  user: string
  author?: string // Alias for user
  action: string
  description: string
}

// ============================================================================
// CART & CHECKOUT
// ============================================================================

/**
 * Shopping cart
 */
export interface Cart {
  id?: number
  lines: CartLine[]
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  currency?: string
  coupon_code?: string
  coupon_discount?: number
  item_count?: number
}

/**
 * Cart line item
 */
export interface CartLine {
  id?: number
  product_id: number
  product_name: string
  product_slug?: string
  product_sku?: string
  product_image?: string
  variant_id?: number
  quantity: number
  price_unit: number
  price_subtotal: number
  price_total: number
  discount?: number
  in_stock?: boolean
  max_quantity?: number
}

// ============================================================================
// ADDRESS
// ============================================================================

/**
 * Address (shipping or billing)
 */
export interface Address {
  id?: number
  name?: string
  street?: string
  street2?: string
  city?: string
  state_id?: number
  state_name?: string
  zip?: string
  country_id?: number
  country_name?: string
  phone?: string
  email?: string
  is_default?: boolean
  type?: 'contact' | 'invoice' | 'delivery' | 'other'
}

// ============================================================================
// COUPONS & PROMOTIONS
// ============================================================================

/**
 * Coupon / Discount code
 */
export interface Coupon {
  id: number
  code: string
  name?: string
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  min_purchase?: number
  max_discount?: number
  valid_from?: string
  valid_to?: string
  date_from?: string // Alias for valid_from (backend naming)
  date_to?: string // Alias for valid_to (backend naming)
  usage_limit?: number
  usage_count?: number
  active?: boolean
  applicable_products?: number[]
  applicable_categories?: number[]
  program_type?: string // Program type (loyalty, promotion, etc.)
  trigger?: string // Trigger condition
}

/**
 * Ribbon / Badge (e.g., "New", "Sale", "Limited")
 */
export interface Ribbon {
  id: number
  name: string
  html_class?: string
  bg_color?: string
  text_color?: string
  display_name?: string
}

// ============================================================================
// WISHLIST
// ============================================================================

/**
 * Wishlist item
 */
export interface WishlistItem {
  id: number
  product_id: number
  product_name: string
  product_slug?: string
  product_price: number
  product_image?: string
  added_date: string
  in_stock?: boolean
}

// ============================================================================
// INVOICES & PAYMENTS
// ============================================================================

/**
 * Invoice
 */
export interface Invoice {
  id: number
  name: string
  partner_id: number
  partner_name: string
  invoice_date: string | null
  invoice_date_due: string | null
  amount_untaxed: number
  amount_tax: number
  amount_total: number
  amount_residual: number
  state: 'draft' | 'posted' | 'cancel'
  payment_state: 'not_paid' | 'in_payment' | 'paid' | 'partial' | 'reversed'
}

/**
 * Payment
 */
export interface Payment {
  id: number
  name: string
  payment_date: string
  amount: number
  payment_method: string
  state: string
  reference?: string
}

/**
 * Shipment / Delivery
 */
export interface Shipment {
  id: number
  name: string
  carrier?: string
  tracking_number?: string
  shipping_date?: string
  delivery_date?: string
  state: string
}
