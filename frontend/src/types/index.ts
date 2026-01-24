// Types globaux pour l'application e-commerce

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  is_portal: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  technical_description?: string;
  price?: number; // Backend peut retourner 'price' selon le contexte
  list_price?: number;
  compare_at_price?: number;
  currency?: Currency;
  is_featured?: boolean;
  is_new?: boolean;
  is_bestseller?: boolean;
  images?: ProductImage[];
  category?: Category | null;
  in_stock?: boolean;
  stock_qty?: number;
  seo?: SEOData;
  view_count?: number;
  wishlist_count?: number;
  avg_rating?: number;
  review_count?: number;
  variants?: ProductVariant[];
  related_products?: number[];
  default_code?: string;
  image_url?: string;
}

export interface ProductVariant {
  id: number;
  name: string;
  price: number;
  in_stock: boolean;
  stock_qty: number;
  attributes: ProductAttribute[];
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
  url: string;
  alt: string;
  is_main?: boolean;
}

export interface Category {
  id: number;
  name: string;
  parent_id?: number;
  parent_name?: string;
  child_count?: number;
  product_count?: number;
  image_url?: string;
}

export interface Currency {
  id: number;
  name: string;
  symbol: string;
}

export interface SEOData {
  slug: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  canonical_url: string;
}

export interface Cart {
  id: number | null;
  name?: string;
  state?: string;
  lines: CartLine[];
  amount_untaxed: number;
  amount_tax: number;
  amount_total: number;
  currency: Currency;
  line_count: number;
  item_count: number;
  cart_last_update?: string;
  coupon_code?: string;
}

export interface CartLine {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  image_url: string;
  quantity: number;
  price_unit: number;
  price_subtotal: number;
  price_total: number;
  discount: number;
  currency_symbol?: string;
}

export interface Order {
  id: number;
  name: string;
  date_order: string;
  state: string;
  lines?: OrderLine[];
  amount_untaxed: number;
  amount_tax: number;
  amount_total: number;
  currency: Currency;
  line_count: number;
  item_count: number;
  partner_invoice?: Address;
  partner_shipping?: Address;
}

export interface OrderLine {
  id: number;
  product_id: number;
  product_name: string;
  image_url: string;
  quantity: number;
  price_unit: number;
  price_subtotal: number;
  price_total: number;
}

export interface Address {
  id?: number;
  name: string;
  type?: 'contact' | 'invoice' | 'delivery' | 'other';
  street: string;
  street2?: string;
  city: string;
  zip: string;
  country_id?: number;
  country_name?: string;
  state_id?: number;
  state_name?: string;
  phone?: string;
  is_main?: boolean;
}

export interface Profile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  mobile?: string;
  street?: string;
  street2?: string;
  city?: string;
  zip?: string;
  country_id?: number;
  country_name?: string;
  state_id?: number;
  state_name?: string;
}

export interface WishlistItem {
  id: number;
  product: Product;
  date_added: string;
  notes?: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  image_url?: string;
}

export interface DeliveryMethod {
  id: number;
  name: string;
  description: string;
  fixed_price?: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  error?: string;
  message?: string;
  [key: string]: any;
}

export interface ProductFilters {
  category_id?: number;
  search?: string;
  price_min?: number;
  price_max?: number;
  is_featured?: boolean;
  is_new?: boolean;
  is_bestseller?: boolean;
  limit?: number;
  offset?: number;
  sort?: 'name' | 'price_asc' | 'price_desc' | 'newest' | 'popular';
}

export interface ProductListResponse {
  success: boolean;
  products: Product[];
  total: number;
  limit: number;
  offset: number;
  facets: {
    categories: { id: number; name: string; count: number }[];
    price_range: { min: number; max: number };
  };
}

// Re-export CMS types
export * from './cms';
