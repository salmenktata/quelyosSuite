/**
 * Types pour le module Stock/Warehouse
 */

// ==================== STOCK VALUATION ====================

export interface StockValuationKPIs {
  totalvalue: number
  total_qty: number
  avgvalue_per_product: number
  valuation_method: string
  product_count: number
}

export interface StockValuationByWarehouse {
  warehouse_id: number
  warehouse_name: string
  totalvalue: number
  total_qty: number
  product_count: number
}

export interface StockValuationByCategory {
  category_id: number
  category_name: string
  totalvalue: number
  total_qty: number
  product_count: number
}

export interface StockValuationTimeline {
  date: string
  totalvalue: number
}

export interface StockValuationResponse {
  kpis: StockValuationKPIs
  by_warehouse: StockValuationByWarehouse[]
  by_category: StockValuationByCategory[]
  timeline: StockValuationTimeline[]
}

// ==================== STOCK TURNOVER ====================

export type TurnoverStatus = 'excellent' | 'good' | 'slow' | 'dead'

export interface StockTurnoverProduct {
  id: number
  product_id?: number // Pour compatibilité
  name: string
  sku: string
  qty_available: number // Gap P1-2: Stock actuel
  qty_sold_365: number // Gap P1-2: Quantité vendue sur 365j
  qty_sold?: number // Alias legacy
  avg_stock?: number // Legacy
  stock_turnover_365: number // Gap P1-2: Ratio de rotation
  turnover_ratio?: number // Alias legacy
  days_of_stock: number // Gap P1-2: Jours de stock restants
  standard_price?: number // Prix coût
  list_price?: number // Prix vente
  status?: TurnoverStatus
}

export interface StockTurnoverKPIs {
  avg_turnover_ratio: number
  slow_movers_count: number
  dead_stock_count: number
  total_sales_qty: number
  period_days: number
}

export interface StockTurnoverResponse {
  kpis: StockTurnoverKPIs
  products: StockTurnoverProduct[]
  total: number
  limit: number
  offset: number
}

// ==================== WAREHOUSES ====================

export interface Warehouse {
  id: number
  name: string
  code: string
  company_id: number
  partner_id?: number
  active: boolean
  location_ids?: StockLocation[]
}

// ==================== LOCATIONS ====================

export interface StockLocation {
  id: number
  name: string
  complete_name: string
  usage: 'internal' | 'view' | 'supplier' | 'customer' | 'inventory' | 'transit'
  parent_id: number | null
  warehouse_id: number
  warehouse_name: string
  barcode?: string
  stock_count: number
  children?: StockLocation[]
}

export interface LocationTreeNode extends StockLocation {
  level: number
  isExpanded: boolean
  path: number[]
}

// ==================== REORDERING RULES ====================

export interface ReorderingRule {
  id: number
  product_id: number
  product_name: string
  product_sku: string
  warehouse_id: number
  warehouse_name: string
  min_qty: number
  max_qty: number
  qty_multiple: number
  rule_horizon?: number // Gap P1-1: Jours d'horizon (défaut 365)
  deadline?: number // Gap P1-1: Jours délai livraison fournisseur
  current_stock: number
  is_triggered: boolean
  qty_to_order: number
  active: boolean
}

// ==================== API PARAMS ====================

export interface StockValuationParams {
  warehouse_id?: number
  category_id?: number
  date?: string
}

export interface StockTurnoverParams {
  start_date?: string
  end_date?: string
  category_id?: number
  status_filter?: TurnoverStatus
  limit?: number
  offset?: number
}

export interface CreateWarehouseParams {
  name: string
  code: string
  company_id: number
  partner_id?: number
  partner_data?: {
    name: string
    street?: string
    city?: string
    zip?: string
    country_id?: number
  }
}

export interface UpdateWarehouseParams {
  name?: string
  partner_id?: number
  active?: boolean
}

export interface CreateLocationParams {
  name: string
  usage: 'internal' | 'view'
  warehouse_id: number
  parent_id?: number
  barcode?: string
}

export interface UpdateLocationParams {
  name?: string
  parent_id?: number
  barcode?: string
  active?: boolean
}

export interface CreateReorderingRuleParams {
  product_id: number
  warehouse_id: number
  product_min_qty: number
  product_max_qty: number
  qty_multiple?: number
}

export interface UpdateReorderingRuleParams {
  product_min_qty?: number
  product_max_qty?: number
  qty_multiple?: number
  active?: boolean
}

// ==================== STOCK MOVES HISTORY (Gap P1-3) ====================

export interface StockMove {
  id: number
  product_id: number
  product_name: string
  product_sku: string
  quantity: number
  uom: string
  location_src_id: number
  location_src: string
  location_dest_id: number
  location_dest: string
  date: string | null
  state: 'draft' | 'waiting' | 'confirmed' | 'assigned' | 'done' | 'cancel'
  state_label: string
  move_type: string // 'Entrée (réception)', 'Sortie (livraison)', etc.
  reference: string
  origin: string
  picking_id: number | null
  picking_name: string | null
}

export interface StockMovesParams {
  product_id?: number
  location_id?: number
  date_from?: string
  date_to?: string
  state?: string
  move_type?: 'in' | 'out' | 'internal'
  limit?: number
  offset?: number
}

export interface ProductStockHistoryParams {
  date_from?: string
  date_to?: string
  move_type?: 'in' | 'out' | 'internal' | 'all'
  limit?: number
  offset?: number
}

export interface ProductStockHistory {
  product_id: number
  product_name: string
  product_sku: string
  current_stock: number
  history: StockHistoryEntry[]
  total: number
  limit: number
  offset: number
}

export interface StockHistoryEntry {
  id: number
  date: string | null
  move_type: string
  icon: string // 'arrow_downward', 'arrow_upward', etc.
  quantity: number
  impact: string // '+10', '-5', '~3'
  location_src: string
  location_dest: string
  reference: string
  origin: string
  picking_id: number | null
  picking_name: string | null
  state: string
}

// ==================== WAREHOUSE ROUTES (Gap P1-4) ====================

export interface StockRoute {
  id: number
  name: string
  sequence: number
  active: boolean
  route_type: 'warehouse' | 'global'
  warehouses: Array<{ id: number; name: string }>
  push_rules_count: number
  pull_rules_count: number
  sale_selectable: boolean
  product_selectable: boolean
}

export interface StockRouteDetail extends StockRoute {
  push_rules: PushRule[]
  pull_rules: PullRule[]
}

export interface PushRule {
  id: number
  name: string
  location_src_id: number
  location_src: string
  location_dest_id: number
  location_dest: string
  picking_type_id: number | null
  picking_type: string | null
  auto: boolean
  active: boolean
}

export interface PullRule {
  id: number
  name: string
  action: string
  location_dest_id: number
  location_dest: string
  location_src_id: number | null
  location_src: string | null
  picking_type_id: number | null
  picking_type: string | null
  procure_method: string
  active: boolean
}

// ==================== LOTS/SERIAL & EXPIRATION (Gap P1-6 & P1-7) ====================

export type ExpiryStatus = 'ok' | 'alert' | 'removal' | 'expired'

export interface StockLot {
  id: number
  name: string
  ref: string
  product_id: number
  product_name: string
  product_sku: string
  stock_qty: number
  expiration_date: string | null
  use_date: string | null // Best Before Date (DLUO)
  removal_date: string | null
  alert_date: string | null
  days_until_expiry: number
  days_until_alert: number
  days_until_removal: number
  days_until_best_before: number
  expiry_status: ExpiryStatus
  is_expired: boolean
  is_near_expiry: boolean
}

export interface StockLotDetail extends StockLot {
  company_id: number | null
  note: string
  total_stock: number
  stock_by_location: Array<{
    location_id: number
    location_name: string
    quantity: number
  }>
  recent_moves: Array<{
    id: number
    date: string | null
    location_src: string
    location_dest: string
    quantity: number
    reference: string
  }>
}

export interface LotsParams {
  product_id?: number
  expiry_status?: ExpiryStatus
  has_stock?: boolean
  limit?: number
  offset?: number
}

export interface ProductExpiryConfig {
  product_id: number
  product_name: string
  tracking: 'none' | 'lot' | 'serial'
  use_expiration_date: boolean
  expiration_time: number // Jours avant expiration
  use_time: number // Jours avant DLUO
  removal_time: number // Jours avant retrait
  alert_time: number // Jours avant alerte
}

export interface UpdateProductExpiryConfigParams {
  use_expiration_date?: boolean
  expiration_time?: number
  use_time?: number
  removal_time?: number
  alert_time?: number
}

