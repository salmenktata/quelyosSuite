/**
 * Types pour Retail OS
 * Regroupe tous les types partagés + types spécifiques
 */

export * from './backoffice'
export * from './api'
export * from './stock'
export * from './pos'

// Common types needed by store pages
export interface User {
  id: number
  name: string
  email: string
  login?: string
  role?: string
  groups?: string[]
}

export interface Product {
  id: number
  name: string
  sku: string | null
  price: number
  stock_quantity: number
  available_quantity: number
  category_id: number
  category_name?: string
  image_url?: string | null
  active: boolean
  type: string
  created_at?: string
  updated_at?: string
  description?: string
  weight?: number
  barcode?: string
  image?: string | null
  default_code?: string | null
  variant_count?: number
  stock_status?: string
  category?: { id: number; name: string } | null
  attributes?: Attribute[]
  tags?: { id: number; name: string; color?: string }[]
  ribbon?: { id: number; name: string; color?: string } | null
}

export interface ProductImage {
  id: number
  name: string
  url: string
  sequence: number
  product_id: number
}

export interface Category {
  id: number
  name: string
  complete_name?: string
  parent_id?: number | null
  parent_name?: string
  children?: Category[]
  image_url?: string | null
  product_count?: number
  total_product_count?: number
  child_count?: number
  sequence?: number
}

export interface Order {
  id: number
  name: string
  date_order: string
  state: string
  amount_total: number
  amount_untaxed: number
  amount_tax: number
  partner_id: number
  partner_name: string
  customer?: { id: number; name: string; email?: string } | null
  partner_email?: string
  lines?: OrderLine[]
  created_at?: string
  updated_at?: string
}

export interface OrderLine {
  id: number
  product_id: number
  product_name: string
  quantity: number
  price_unit: number
  price_subtotal: number
  price_total: number
}

export interface Coupon {
  id: number
  name: string
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  min_amount?: number
  max_uses?: number
  current_uses?: number
  active: boolean
  date_from?: string
  date_to?: string
  program_type?: string
  trigger?: string
}

export interface Attribute {
  id: number
  name: string
  display_type?: string
  values?: AttributeValue[]
}

export interface AttributeValue {
  id: number
  name: string
  html_color?: string
  sequence?: number
}
