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
  image: string | null
  slug: string
  category: {
    id: number
    name: string
  } | null
}

export interface ProductDetail extends Product {
  description: string
}

// ==================== CATEGORIES ====================

export interface Category {
  id: number
  name: string
  parent_id: number | null
  parent_name: string | null
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

// ==================== PAGINATION ====================

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    [key: string]: T[]
    total: number
    limit: number
    offset: number
  }
  error?: string
}
