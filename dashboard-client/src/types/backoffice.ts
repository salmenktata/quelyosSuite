// ==================== STOCK ====================

export interface StockProduct {
  id: number
  name: string
  sku: string | null
  image: string
  image_url?: string | null  // Alias pour image
  category: string
  list_price?: number  // Prix de vente
  qty_available: number
  virtual_available: number
  incoming_qty: number
  outgoing_qty: number
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock'
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

// ==================== STOCK TRANSFERS ====================

export type TransferState = 'draft' | 'waiting' | 'confirmed' | 'assigned' | 'done' | 'cancel'

export interface TransferProduct {
  id: number
  name: string
  sku: string
  quantity: number
  quantity_done: number
}

export interface StockTransfer {
  id: number
  name: string
  state: TransferState
  state_label: string
  scheduled_date: string | null
  date_done: string | null
  from_location: string
  to_location: string
  from_warehouse: string | null
  to_warehouse: string | null
  products: TransferProduct[]
  products_count: number
  note: string
  create_date: string | null
  user_name: string | null
}

export interface StockLocation {
  id: number
  name: string
  complete_name: string
  warehouse_id: number | null
  warehouse_name: string | null
  usage: string
}

export interface CreateTransferParams {
  product_id: number
  quantity: number
  from_location_id: number
  to_location_id: number
  note?: string
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

export interface RevenueChartData {
  period: string
  revenue: number
  orders: number
}

export interface OrdersChartData {
  period: string
  total: number
  confirmed: number
  pending: number
  cancelled: number
}

export interface ConversionFunnelData {
  stage: string
  count: number
  percentage: number
  color: string
}

export interface TopCategoryData {
  id: number
  name: string
  qty_sold: number
  revenue: number
}

export interface AnalyticsChartParams {
  period?: '7d' | '30d' | '12m' | 'custom'
  start_date?: string
  end_date?: string
  group_by?: 'day' | 'month'
}

// ==================== INVOICES ====================

export interface InvoiceLine {
  id: number
  product_id: number | null
  product_name: string
  name: string
  quantity: number
  price_unit: number
  price_subtotal: number
  price_total: number
  tax_ids: number[]
}

// NOTE: Invoice est déjà exporté par @quelyos/types/common
// On ne le redéfinit pas ici pour éviter les duplications
// export interface Invoice {
//   id: number
//   name: string
//   partner_id: number
//   partner_name: string
//   invoice_date: string | null
//   invoice_date_due: string | null
//   amount_untaxed: number
//   amount_tax: number
//   amount_total: number
//   amount_residual: number
//   state: 'draft' | 'posted' | 'cancel'
//   payment_state: 'not_paid' | 'in_payment' | 'paid' | 'partial' | 'reversed'
//   invoice_line_ids?: InvoiceLine[]
// }

export interface InvoicesQueryParams {
  limit?: number
  offset?: number
  search?: string
  partner_id?: number
  state?: 'draft' | 'posted' | 'cancel'
  payment_state?: 'not_paid' | 'in_payment' | 'paid' | 'partial' | 'reversed'
  date_from?: string
  date_to?: string
}

export interface InvoiceStats {
  total_invoices: number
  total_revenue: number
  unpaid_amount: number
  overdue_count: number
}

// ==================== ABANDONED CARTS ====================

export interface AbandonedCartItem {
  product_name: string
  quantity: number
  price: number
}

export interface AbandonedCart {
  id: number
  name: string
  partner_id: number | null
  partner_name: string
  partner_email: string | null
  write_date: string | null
  hours_ago: number
  amount_total: number
  lines_count: number
  items: AbandonedCartItem[]
}

export interface AbandonedCartsQueryParams {
  limit?: number
  offset?: number
  hours_threshold?: number
  search?: string
}

export interface CartRecoveryStats {
  period: string
  abandoned_count: number
  abandonedvalue: number
  recovered_count: number
  recoveredvalue: number
  recovery_rate: number
}

// ==================== ORDER TRACKING ====================

export interface OrderTracking {
  picking_id: number
  picking_name: string
  state: string
  state_label: string
  carrier_id: number | null
  carrier_name: string | null
  carrier_tracking_ref: string
  carrier_tracking_url: string
}

export interface OrderHistoryTrackingValue {
  field: string
  field_desc: string
  oldvalue: string
  newvalue: string
}

// NOTE: OrderHistoryItem est déjà exporté par @quelyos/types/common
// On ne le redéfinit pas ici pour éviter les duplications
// export interface OrderHistoryItem {
//   id: number
//   date: string | null
//   author: string
//   body: string
//   message_type: string
//   subtype: string | null
//   trackingvalues: OrderHistoryTrackingValue[]
// }

// ==================== PAGINATION ====================

export interface PaginatedData<T> {
  total: number
  limit: number
  offset: number
  [key: string]: T[] | number
}

// NOTE: PaginatedResponse est déjà exporté par @quelyos/types/common
// On ne le redéfinit pas ici pour éviter les duplications
// export interface PaginatedResponse<T> {
//   success: boolean
//   data: PaginatedData<T>
//   error?: string
// }

export interface ShippingTrackingInfo {
  status: 'tracked' | 'no_tracking'
  message?: string
  tracking_ref?: string
  carrier_name?: string
  carrier_code?: string
  tracking_url?: string
  shipment_date?: string
  tracking_info?: OrderTracking[]
}

export interface ProductsQueryParams {
  limit?: number;
  offset?: number;
  search?: string;
  category_id?: number;
  in_stock?: boolean;
  stock_status?: string;
  include_archived?: boolean;
  price_min?: number;
  price_max?: number;
  attributevalue_ids?: number[];
  sort?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface CouponCreate {
  code: string;
  name?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discountvalue: number;
  min_amount?: number;
  max_discount?: number;
  max_usage?: number;
  valid_from?: string;
  valid_until?: string;
  date_from?: string;
  date_to?: string;
  usage_limit?: number;
  active?: boolean;
}

export interface CustomerListItem {
  id: number;
  name: string;
  email: string;
  phone?: string;
  mobile?: string;
  city?: string;
  zip?: string;
  country?: string;
  total_orders?: number;
  orders_count?: number;
  total_spent?: number;
  create_date?: string;
}

export interface DataTableColumn<T = any> {
  key: string;
  id?: string;
  label: string;
  sortable?: boolean;
  accessor?: (item: T) => any;
  sortFn?: (a: T, b: T) => number;
  render?: (item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  cellClassName?: string;
  headerClassName?: string;
  showOnMobile?: boolean;
}

export interface MobileCardConfig<T = any> {
  title: (item: T) => React.ReactNode;
  subtitle?: (item: T) => React.ReactNode;
  content: (item: T) => React.ReactNode;
  actions?: (item: T) => React.ReactNode;
  renderCard?: (item: T) => React.ReactNode;
  renderActions?: (item: T) => React.ReactNode;
}

export interface BulkAction<T = any> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedItems: T[]) => void;
  onExecute?: (selectedItems: T[]) => void;
  variant?: 'default' | 'danger' | 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}

export interface DataTableState {
  sortField?: string;
  sortOrder?: SortOrder;
  selectedIds?: Set<number | string>;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  keyExtractor?: (item: T) => string | number;
  isLoading?: boolean;
  error?: string | null;
  mobileConfig?: MobileCardConfig<T>;
  sortField?: string;
  sortOrder?: SortOrder;
  onSort?: (key: string, order: SortOrder) => void;
  onSortChange?: (field: string, order: SortOrder) => void;
  pagination?: {
    total: number;
    offset: number;
    limit: number;
    onPageChange: (offset: number) => void;
  };
  bulkActions?: BulkAction<T>[];
  selectedItems?: T[];
  selectedIds?: Set<number | string>;
  onSelectionChange?: (ids: Set<number | string>) => void;
  emptyMessage?: string;
  emptyComponent?: React.ReactNode;
  skeletonRows?: number;
  className?: string;
  tableClassName?: string;
}

export type SortOrder = 'asc' | 'desc' | null;

// Import types from shared
import type { User } from '@quelyos/types';

export type Customer = User;
export type ProductCreateData = Record<string, any>;
export type ProductUpdateData = Record<string, any>;

// ==================== CRM ====================

export interface Stage {
  id: number
  name: string
  sequence: number
  fold: boolean
  is_won: boolean
}

export interface LeadListItem {
  id: number
  name: string
  partner_id?: number
  partner_name?: string
  stage_id: number
  stage_name: string
  expected_revenue?: number
  probability?: number
  user_id?: number
  user_name?: string
  date_deadline?: string
  create_date: string
}

export interface Lead extends LeadListItem {
  description?: string
  email?: string
  phone?: string
  mobile?: string
  write_date?: string
}
