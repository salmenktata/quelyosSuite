// Types pour l'API Quelyos

export interface ApiResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

// ==================== PRODUCTS ====================

export interface Product {
  id: number
  name: string
  price: number
  standard_price?: number
  default_code: string
  barcode?: string
  image: string | null
  slug: string
  qty_available: number
  virtual_available?: number
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock'
  weight?: number
  active?: boolean
  create_date?: string | null
  variant_count?: number
  category: {
    id: number
    name: string
  } | null
}

export interface ProductTax {
  id: number
  name: string
  amount: number
  amount_type: 'percent' | 'fixed' | 'group' | 'division'
  price_include: boolean
}

export interface ProductTag {
  id: number
  name: string
  color: number
}

export interface ProductDetail extends Product {
  description: string
  description_purchase?: string
  volume?: number
  product_length?: number
  product_width?: number
  product_height?: number
  detailed_type?: 'consu' | 'service' | 'product'
  uom_id?: number | null
  uom_name?: string | null
  images?: ProductImage[]
  taxes?: ProductTax[]
  product_tag_ids?: ProductTag[]
}

export interface UnitOfMeasure {
  id: number
  name: string
  category_id: number
  category_name: string
  uom_type: 'bigger' | 'reference' | 'smaller'
  factor: number
}

export interface ProductType {
  value: 'consu' | 'service' | 'product'
  label: string
  description: string
}

export interface ProductImage {
  id: number
  name: string
  url: string
  sequence: number
}

export interface ProductAttribute {
  id: number
  name: string
  display_type: string
  create_variant: string
  values: ProductAttributeValue[]
}

export interface ProductAttributeValue {
  id: number
  name: string
  html_color?: string | null
  sequence: number
}

export interface ProductAttributeLine {
  id: number
  attribute_id: number
  attribute_name: string
  display_type: string
  values: Array<{ id: number; name: string; html_color?: string | null }>
}

export interface ProductVariant {
  id: number
  name: string
  display_name: string
  default_code: string
  barcode: string
  list_price: number
  standard_price: number
  qty_available: number
  image: string | null
  images?: Array<{ id: number; name: string; url: string; sequence: number }>
  image_count?: number
  attribute_values: Array<{
    id: number
    name: string
    attribute_id: number
    attribute_name: string
  }>
}

export interface ProductsQueryParams {
  limit?: number
  offset?: number
  category_id?: number
  search?: string
  sort_by?: 'name' | 'price' | 'qty_available' | 'create_date' | 'default_code'
  sort_order?: 'asc' | 'desc'
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock'
  include_archived?: boolean
  price_min?: number
  price_max?: number
}

export interface ProductCreateData {
  name: string
  price: number
  description?: string
  category_id?: number
  default_code?: string
  barcode?: string
  standard_price?: number
  weight?: number
  product_length?: number
  product_width?: number
  product_height?: number
  taxes_id?: number[]
  product_tag_ids?: number[]
}

export interface ProductUpdateData {
  name?: string
  price?: number
  description?: string
  category_id?: number | null
  default_code?: string
  barcode?: string
  standard_price?: number
  weight?: number
  product_length?: number
  product_width?: number
  product_height?: number
  active?: boolean
  taxes_id?: number[]
  product_tag_ids?: number[]
}

// ==================== CATEGORIES ====================

export interface Category {
  id: number
  name: string
  complete_name?: string
  parent_id: number | null
  parent_name: string | null
  product_count?: number
  total_product_count?: number
  child_count?: number
  children?: Category[]
}

export interface CategoriesQueryParams {
  limit?: number
  offset?: number
  search?: string
  include_tree?: boolean
}

export interface CategoriesResponse {
  categories: Category[]
  total: number
  limit: number
  offset: number
}

// ==================== ORDERS ====================

export interface Order {
  id: number
  name: string
  date_order: string | null
  state: 'draft' | 'sent' | 'sale' | 'done' | 'cancel'
  amount_total: number
  customer: {
    id: number
    name: string
    email: string
  } | null
  lines_count?: number
}

export interface OrderLine {
  id: number
  product: {
    id: number
    name: string
    image: string
  }
  quantity: number
  price_unit: number
  price_subtotal: number
  price_total: number
}

export interface OrderDetail extends Omit<Order, 'lines_count'> {
  amount_untaxed: number
  amount_tax: number
  customer: {
    id: number
    name: string
    email: string
    phone: string
    street: string
    city: string
    zip: string
    country: string
  } | null
  lines: OrderLine[]
}

// ==================== CART ====================

export interface Cart {
  id: number
  lines: OrderLine[]
  amount_untaxed: number
  amount_tax: number
  amount_total: number
  lines_count: number
}

// ==================== CUSTOMERS ====================

export interface Customer {
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
  country_id: number | null
}

export interface CustomerListItem {
  id: number
  name: string
  email: string
  phone: string
  mobile: string
  street: string
  city: string
  zip: string
  country: string
  orders_count: number
  total_spent: number
  create_date: string | null
}

export interface Address {
  id: number
  name: string
  type: 'delivery' | 'invoice'
  street: string
  street2: string
  city: string
  zip: string
  state: string
  country: string
  phone: string
}

// ==================== AUTH ====================

export interface User {
  id: number
  name: string
  email: string
  phone: string
}

export interface LoginResponse {
  success: boolean
  session_id?: string
  user?: User
  error?: string
}

export interface SessionResponse {
  authenticated: boolean
  user?: User
}

// ==================== COUPONS ====================

export interface Coupon {
  id: number
  name: string
  active: boolean
  program_type: string
  trigger: string
  applies_on: string
  date_from: string | null
  date_to: string | null
  limit_usage: boolean
  max_usage: number
  reward?: {
    reward_type: string
    discount: number
    discount_mode: 'percent' | 'fixed'
  }
}

export interface CouponCreate {
  name: string
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  date_from?: string
  date_to?: string
  max_usage?: number
}

// ==================== STOCK ====================

export interface StockProduct {
  id: number
  name: string
  sku: string
  image: string
  qty_available: number
  virtual_available: number
  incoming_qty: number
  outgoing_qty: number
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock'
  category: string
}

export interface StockMove {
  id: number
  product: {
    id: number
    name: string
  }
  quantity: number
  location_src: string
  location_dest: string
  date: string | null
  state: string
  reference: string
}

// ==================== DELIVERY ====================

export interface DeliveryMethod {
  id: number
  name: string
  delivery_type: string
  fixed_price: number
  free_over: boolean | number
  active?: boolean
}

// ==================== ANALYTICS ====================

export interface AnalyticsStats {
  totals: {
    products: number
    customers: number
    orders: number
    confirmed_orders: number
    pending_orders: number
    out_of_stock_products: number
    low_stock_products: number
    revenue: number
  }
  recent_orders: Array<{
    id: number
    name: string
    date_order: string | null
    state: string
    amount_total: number
    customer: {
      id: number
      name: string
    } | null
  }>
  top_products: Array<{
    id: number
    name: string
    qty_sold: number
    revenue: number
  }>
  stock_alerts: Array<{
    id: number
    name: string
    default_code: string
    qty_available: number
    alert_level: 'critical' | 'warning'
    alert_message: string
    image: string | null
  }>
}

// ==================== PAGINATION ====================

export interface PaginatedData<T> {
  total: number
  limit: number
  offset: number
  [key: string]: T[] | number
}

export interface PaginatedResponse<T> {
  success: boolean
  data: PaginatedData<T>
  error?: string
}
