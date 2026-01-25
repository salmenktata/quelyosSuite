/**
 * Types TypeScript partagés entre Frontend (Next.js) et Backoffice (React/Vite)
 * Définitions unifiées pour garantir cohérence tri-couche
 */

// ==================== API RESPONSES ====================

export interface APIResponse<T = any> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  session_id?: string;
  error?: string;
}

export interface SessionResponse {
  success: boolean;
  user?: User;
  is_authenticated: boolean;
}

// ==================== USER & AUTH ====================

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  is_portal?: boolean;
  active?: boolean;
  create_date?: string;
}

// ==================== PRODUCT ====================

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  technical_description?: string;
  price?: number; // Prix affiché (peut varier selon pricelist)
  list_price?: number; // Prix catalogue de base
  standard_price?: number; // Coût d'achat
  compare_at_price?: number; // Prix barré
  currency?: Currency;
  default_code?: string;
  barcode?: string;
  image?: string | null;
  image_url?: string;
  images?: ProductImage[];
  category?: Category | null;
  in_stock?: boolean;
  stock_qty?: number;
  qty_available?: number;
  virtual_available?: number;
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  weight?: number;
  volume?: number;
  product_length?: number;
  product_width?: number;
  product_height?: number;
  active?: boolean;
  detailed_type?: 'consu' | 'service' | 'product';
  uom_id?: number | null;
  uom_name?: string | null;
  // Marketing
  is_featured?: boolean;
  is_new?: boolean;
  is_bestseller?: boolean;
  ribbon?: Ribbon | null;
  offer_end_date?: string | null; // ISO 8601
  // Analytics
  view_count?: number;
  wishlist_count?: number;
  avg_rating?: number;
  review_count?: number;
  // Relations
  variants?: ProductVariant[];
  variant_count?: number;
  related_products?: number[];
  taxes?: ProductTax[];
  product_tag_ids?: ProductTag[];
  // SEO
  seo?: SEOData;
  create_date?: string | null;
}

export interface ProductDetail extends Product {
  description_purchase?: string;
}

export interface ProductVariant {
  id: number;
  name: string;
  display_name?: string;
  price: number;
  list_price?: number;
  in_stock: boolean;
  stock_qty: number;
  qty_available?: number;
  default_code?: string;
  barcode?: string;
  attributes: ProductAttribute[];
  attribute_values?: Array<{
    attribute_id: number;
    attribute_name: string;
    value_id: number;
    value_name: string;
  }>;
  images?: ProductImage[];
  image_url?: string;
}

export interface ProductAttribute {
  id?: number;
  name: string;
  value_id?: number;
  value: string;
}

export interface ProductImage {
  id: string | number;
  name?: string;
  url: string;
  alt?: string;
  is_main?: boolean;
  sequence?: number;
}

export interface ProductTax {
  id: number;
  name: string;
  amount: number;
  amount_type: 'percent' | 'fixed' | 'group' | 'division';
  price_include: boolean;
}

export interface ProductTag {
  id: number;
  name: string;
  color: number;
}

export interface UnitOfMeasure {
  id: number;
  name: string;
  category_id: number;
  category_name: string;
  uom_type: 'bigger' | 'reference' | 'smaller';
  factor: number;
}

export interface ProductType {
  value: 'consu' | 'service' | 'product';
  label: string;
  description: string;
}

// Types pour l'API /variants enrichie
export interface AttributeLine {
  id: number;
  attribute_id: number;
  attribute_name: string;
  display_type: 'color' | 'pills' | 'select' | 'radio';
  values: AttributeValue[];
}

export interface AttributeValue {
  id: number;
  name: string;
  html_color?: string;
  sequence?: number;
}

export interface ExtendedProductVariant extends ProductVariant {
  display_name?: string;
  list_price?: number;
  default_code?: string;
  barcode?: string;
  qty_available?: number;
}

export interface VariantsResponse {
  success: boolean;
  product_id: number;
  attribute_lines: AttributeLine[];
  variants: ExtendedProductVariant[];
}

// ==================== RIBBON (BADGES) ====================

export interface Ribbon {
  id: number;
  name: string;
  bg_color: string;
  text_color: string;
  position: 'left' | 'right';
  style: 'ribbon' | 'tag';
  sequence?: number;
}

// ==================== CATEGORY ====================

export interface Category {
  id: number;
  name: string;
  slug?: string;
  parent_id?: number | null;
  parent_name?: string;
  image?: string;
  image_url?: string;
  product_count?: number;
  total_product_count?: number;
  child_count?: number;
  featured_products?: Product[];
  description?: string;
  seo?: SEOData;
  sequence?: number;
  active?: boolean;
  child_ids?: number[];
  children?: Category[];
  complete_name?: string;
}

// ==================== CART & ORDER ====================

export interface Cart {
  id: number;
  lines: CartLine[];
  subtotal: number;
  tax_total: number;
  shipping_cost?: number;
  discount?: number;
  total: number;
  currency?: Currency;
  coupon?: Coupon;
  item_count: number;
}

export interface CartLine {
  id: number;
  product: Product;
  quantity: number;
  unit_price: number;
  subtotal: number;
  variant?: ProductVariant;
}

export interface Order {
  id: number;
  name: string; // Référence commande (ex: SO001)
  state: 'draft' | 'sent' | 'sale' | 'done' | 'cancel';
  date_order: string;
  customer: User;
  lines: OrderLine[];
  line_count?: number; // Nombre de lignes de commande
  subtotal: number;
  amount_untaxed?: number; // Alias Odoo de subtotal
  tax_total: number;
  amount_tax?: number; // Alias Odoo de tax_total
  shipping_cost: number;
  discount?: number;
  total: number;
  amount_total?: number;
  currency?: Currency;
  shipping_address?: Address;
  billing_address?: Address;
  payment_method?: string;
  delivery_method?: string;
  tracking_number?: string;
  notes?: string;
  invoice_status?: 'no' | 'to invoice' | 'invoiced';
  delivery_status?: 'no' | 'partial' | 'full';
}

export interface OrderLine {
  id: number;
  product: Product;
  product_uom_qty: number;
  price_unit: number;
  price_subtotal: number;
  price_tax: number;
  price_total: number;
  // Champs dupliqués depuis product pour faciliter l'accès
  product_name?: string;
  image_url?: string;
  quantity?: number; // Alias de product_uom_qty
}

export interface OrderDetail extends Order {
  amount_untaxed?: number;
  amount_tax?: number;
  history?: any[];
  tracking_info?: any;
}

// ==================== ADDRESS ====================

export interface Address {
  id?: number;
  name?: string;
  street: string;
  street2?: string;
  city: string;
  zip: string;
  country_id?: number;
  country_name?: string;
  state_id?: number;
  state_name?: string;
  phone?: string;
  email?: string;
  type?: 'contact' | 'invoice' | 'delivery' | 'other';
  is_default?: boolean;
}

// ==================== WISHLIST ====================

export interface WishlistItem {
  id: number;
  product: Product;
  added_date: string;
}

// ==================== CURRENCY ====================

export interface Currency {
  id: number;
  name: string;
  symbol: string;
  position: 'before' | 'after';
  decimal_places?: number;
  rate?: number;
  active?: boolean;
}

// ==================== COUPON ====================

export interface Coupon {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_amount?: number;
  max_discount?: number;
  valid_from?: string;
  valid_until?: string;
  usage_limit?: number;
  usage_count?: number;
  active: boolean;
  trigger?: string;
  name?: string;
  program_type?: string;
  date_from?: string;
  date_to?: string;
}

// ==================== SEO ====================

export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string[];
  og_title?: string;
  og_description?: string;
  og_image?: string;
  canonical_url?: string;
}

// ==================== FILTERS ====================

export interface ProductFilters {
  category_id?: number;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  is_featured?: boolean;
  is_new?: boolean;
  is_bestseller?: boolean;
  search?: string;
  sort?: 'name' | 'price_asc' | 'price_desc' | 'newest' | 'popularity';
  limit?: number;
  offset?: number;
  attributes?: Record<string, number[]>; // { color: [1,2], size: [3] }
}

export interface ProductListResponse {
  success: boolean;
  products: Product[];
  total: number;
  limit: number;
  offset: number;
  has_more?: boolean;
  facets?: ProductFacets;
}

export interface ProductFacets {
  categories: Array<{ id: number; name: string; count: number }>;
  price_ranges: Array<{ min: number; max: number; count: number }>;
  attributes: Record<string, Array<{ id: number; name: string; count: number }>>;
  in_stock_count: number;
  out_of_stock_count: number;
}

// ==================== PRICELISTS ====================

export interface Pricelist {
  id: number;
  name: string;
  currency_id: number;
  currency_name?: string;
  currency_symbol?: string;
  active: boolean;
  item_ids?: PricelistItem[];
  discount_policy?: 'with_discount' | 'without_discount';
  company_id?: number;
  country_group_ids?: number[];
}

export interface PricelistItem {
  id: number;
  applied_on: '3_global' | '2_product_category' | '1_product' | '0_product_variant';
  product_tmpl_id?: number;
  product_id?: number;
  categ_id?: number;
  compute_price: 'fixed' | 'percentage' | 'formula';
  fixed_price?: number;
  percent_price?: number;
  price_discount?: number;
  min_quantity?: number;
  date_start?: string;
  date_end?: string;
}

// ==================== WAREHOUSE ====================

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  company_id: number;
  company_name: string;
  partner_id: number;
  active: boolean;
  lot_stock_id?: number;
}

// ==================== CUSTOMER CATEGORY ====================

export interface CustomerCategory {
  id: number;
  name: string;
  color: number;
  partner_ids?: number[];
  parent_id?: number | null;
  child_ids?: number[];
  active?: boolean;
}
