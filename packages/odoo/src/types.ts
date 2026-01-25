/**
 * Types TypeScript unifiés pour modèles Odoo
 * Centralise tous les types utilisés par e-commerce et backoffice
 */

// ========================================
// Types de base Odoo
// ========================================

export interface OdooRecord {
  id: number;
  display_name?: string;
  create_date?: string;
  write_date?: string;
}

export interface OdooResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface OdooPaginatedResponse<T> extends OdooResponse {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}

// ========================================
// Produits
// ========================================

export interface OdooProduct extends OdooRecord {
  name: string;
  description?: string;
  description_sale?: string;
  list_price: number;
  standard_price: number;
  default_code?: string;
  barcode?: string;
  categ_id?: [number, string];
  image_url?: string;
  image_1920?: string;
  images?: OdooProductImage[];
  qty_available?: number;
  virtual_available?: number;
  active?: boolean;
  sale_ok?: boolean;
  purchase_ok?: boolean;
  type?: 'product' | 'consu' | 'service';
  uom_id?: [number, string];
  ribbon_id?: [number, string];
  attribute_line_ids?: number[];
  product_variant_ids?: number[];
}

export interface OdooProductImage extends OdooRecord {
  url: string;
  name?: string;
  sequence?: number;
  is_main?: boolean;
}

export interface OdooProductVariant extends OdooRecord {
  product_tmpl_id: [number, string];
  default_code?: string;
  barcode?: string;
  list_price: number;
  standard_price: number;
  qty_available: number;
  image_url?: string;
  attribute_value_ids?: number[];
}

// ========================================
// Catégories
// ========================================

export interface OdooCategory extends OdooRecord {
  name: string;
  parent_id?: [number, string] | false;
  child_id?: number[];
  product_count?: number;
  complete_name?: string;
  image_url?: string;
  sequence?: number;
}

// ========================================
// Clients / Partners
// ========================================

export interface OdooPartner extends OdooRecord {
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  street?: string;
  street2?: string;
  city?: string;
  zip?: string;
  country_id?: [number, string];
  state_id?: [number, string];
  customer_rank?: number;
  supplier_rank?: number;
  category_id?: number[];
  property_product_pricelist?: [number, string];
}

export interface OdooAddress extends OdooRecord {
  type: 'contact' | 'invoice' | 'delivery' | 'other';
  parent_id: [number, string];
  name?: string;
  street?: string;
  street2?: string;
  city?: string;
  zip?: string;
  country_id?: [number, string];
  state_id?: [number, string];
  phone?: string;
}

// ========================================
// Commandes / Orders
// ========================================

export interface OdooSaleOrder extends OdooRecord {
  name: string;
  partner_id: [number, string];
  partner_invoice_id?: [number, string];
  partner_shipping_id?: [number, string];
  date_order: string;
  state: 'draft' | 'sent' | 'sale' | 'done' | 'cancel';
  amount_untaxed: number;
  amount_tax: number;
  amount_total: number;
  order_line?: OdooSaleOrderLine[];
  pricelist_id?: [number, string];
  currency_id?: [number, string];
}

export interface OdooSaleOrderLine extends OdooRecord {
  order_id: [number, string];
  product_id: [number, string];
  product_uom_qty: number;
  price_unit: number;
  price_subtotal: number;
  price_total: number;
  discount?: number;
  tax_id?: number[];
}

// ========================================
// Stock / Inventory
// ========================================

export interface OdooStockQuant extends OdooRecord {
  product_id: [number, string];
  location_id: [number, string];
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
}

export interface OdooWarehouse extends OdooRecord {
  name: string;
  code: string;
  company_id: [number, string];
  lot_stock_id?: [number, string];
  active?: boolean;
}

// ========================================
// Pricelists / Pricing
// ========================================

export interface OdooPricelist extends OdooRecord {
  name: string;
  currency_id: [number, string];
  active?: boolean;
  discount_policy?: 'with_discount' | 'without_discount';
  item_ids?: OdooPricelistItem[];
}

export interface OdooPricelistItem extends OdooRecord {
  pricelist_id: [number, string];
  applied_on: '3_global' | '2_product_category' | '1_product' | '0_product_variant';
  product_tmpl_id?: [number, string];
  product_id?: [number, string];
  categ_id?: [number, string];
  compute_price: 'fixed' | 'percentage' | 'formula';
  fixed_price?: number;
  percent_price?: number;
  price_discount?: number;
  min_quantity?: number;
  date_start?: string;
  date_end?: string;
}

// ========================================
// Currencies
// ========================================

export interface OdooCurrency extends OdooRecord {
  name: string;
  symbol: string;
  position: 'before' | 'after';
  rounding?: number;
  active?: boolean;
}

// ========================================
// Subscriptions (SaaS)
// ========================================

export interface OdooSubscription extends OdooRecord {
  name: string;
  partner_id: [number, string];
  plan_id: [number, string];
  state: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  trial_end_date?: string;
  next_billing_date?: string;
  billing_cycle: 'monthly' | 'yearly';
  max_users: number;
  max_products: number;
  max_orders: number;
  current_users?: number;
  current_products?: number;
  current_orders?: number;
}

export interface OdooSubscriptionPlan extends OdooRecord {
  name: string;
  code: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_products: number;
  max_orders: number;
  support_level?: 'email' | 'priority' | 'dedicated';
  features?: any;
  is_popular?: boolean;
  active?: boolean;
}

// ========================================
// Accounts / Finance
// ========================================

export interface OdooAccount extends OdooRecord {
  code: string;
  name: string;
  account_type: string;
  company_id: [number, string];
  currency_id?: [number, string];
}

export interface OdooAccountMove extends OdooRecord {
  name: string;
  move_type: 'entry' | 'out_invoice' | 'in_invoice' | 'out_refund' | 'in_refund';
  partner_id?: [number, string];
  invoice_date?: string;
  date: string;
  state: 'draft' | 'posted' | 'cancel';
  amount_untaxed: number;
  amount_tax: number;
  amount_total: number;
  line_ids?: number[];
}

export interface OdooAccountMoveLine extends OdooRecord {
  move_id: [number, string];
  account_id: [number, string];
  partner_id?: [number, string];
  name?: string;
  debit: number;
  credit: number;
  balance: number;
  date: string;
}
