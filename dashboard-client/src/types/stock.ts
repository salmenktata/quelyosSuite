/**
 * Types pour le module Stock/Warehouse
 */

// ==================== STOCK VALUATION ====================

export interface StockValuationKPIs {
  total_value: number
  total_qty: number
  avg_value_per_product: number
  valuation_method: string
  product_count: number
}

export interface StockValuationByWarehouse {
  warehouse_id: number
  warehouse_name: string
  total_value: number
  total_qty: number
  product_count: number
}

export interface StockValuationByCategory {
  category_id: number
  category_name: string
  total_value: number
  total_qty: number
  product_count: number
}

export interface StockValuationTimeline {
  date: string
  total_value: number
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

// ==================== OCA STOCK ====================

export interface StockChangeReason {
  id: number
  name: string
  code: string
  description: string
  active: boolean
  usage_count: number
}

export interface StockInventoryOCA {
  id: number
  name: string
  date: string | null
  state: string
  location_id: number
  location_name: string
  user_id: number
  user_name: string
  line_count: number
  note: string
}

export interface LocationLock {
  id: number
  name: string
  location_id: number
  location_name: string
  reason: string
  date_start: string | null
  date_end: string | null
  user_id: number
  user_name: string
  active: boolean
  is_locked: boolean
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

export interface WarehouseRoutesConfig {
  warehouse_id: number
  warehouse_name: string
  routes: Array<{
    id: number
    name: string
    sequence: number
    push_rules_count: number
    pull_rules_count: number
  }>
  config: {
    reception_steps: 'one_step' | 'two_steps' | 'three_steps'
    reception_label: string
    delivery_steps: 'ship_only' | 'pick_ship' | 'pick_pack_ship'
    delivery_label: string
  }
}

export interface ConfigureWarehouseRoutesParams {
  reception_steps?: 'one_step' | 'two_steps' | 'three_steps'
  delivery_steps?: 'ship_only' | 'pick_ship' | 'pick_pack_ship'
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

export interface ExpiryAlertsParams {
  days_threshold?: number // Défaut: 30
  status_filter?: 'alert' | 'removal' | 'expired' | 'all'
  has_stock_only?: boolean
  limit?: number
}

export interface ExpiryAlerts {
  alerts: {
    expired: StockLot[]
    removal: StockLot[]
    alert: StockLot[]
    ok_but_soon: StockLot[]
  }
  stats: {
    expired_count: number
    removal_count: number
    alert_count: number
    ok_but_soon_count: number
    total: number
  }
  days_threshold: number
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

// ==================== ABC ANALYSIS (Gap P2-1) ====================

export type ABCCategory = 'A' | 'B' | 'C'

export interface ABCProduct {
  id: number
  name: string
  sku: string
  qty: number
  standard_price: number
  value: number
  category: ABCCategory
  cumulative_value: number
  cumulative_pct: number
  value_pct: number
}

export interface ABCCategoryKPI {
  count: number
  count_pct: number
  value: number
  value_pct: number
}

export interface ABCKPIs {
  total_value: number
  total_products: number
  category_a: ABCCategoryKPI
  category_b: ABCCategoryKPI
  category_c: ABCCategoryKPI
}

export interface ABCCumulativePoint {
  product_index: number
  cumulative_pct: number
  category: ABCCategory
}

export interface ABCAnalysisResponse {
  products: ABCProduct[]
  kpis: ABCKPIs
  cumulative: ABCCumulativePoint[]
  thresholds: {
    a: number
    b: number
  }
}

export interface ABCAnalysisParams {
  warehouse_id?: number
  category_id?: number
  threshold_a?: number // Défaut: 80
  threshold_b?: number // Défaut: 95
}

// ==================== STOCK FORECAST (Gap P2-2) ====================

export interface HistoricalSale {
  date: string
  qty_sold: number
}

export interface ForecastDay {
  date: string
  qty_forecast: number
}

export interface ForecastMetrics {
  moving_averages: {
    ma_7: number
    ma_30: number
    ma_90: number
  }
  trend: {
    status: 'increasing' | 'decreasing' | 'stable'
    slope: number
  }
  current_stock: number
  total_forecast: number
  avg_daily_forecast: number
  days_of_stock: number
}

export interface ForecastRecommendation {
  type: 'warning' | 'info' | 'success'
  message: string
  qty_to_order?: number
}

export interface StockForecastResponse {
  product_id: number
  product_name: string
  product_sku: string
  historical: HistoricalSale[]
  forecast: ForecastDay[]
  metrics: ForecastMetrics
  recommendations: ForecastRecommendation[]
  method: 'moving_average' | 'linear_trend'
  period_days: number
  forecast_days: number
}

export interface StockForecastParams {
  product_id: number
  forecast_days?: number // Défaut: 30
  method?: 'moving_average' | 'linear_trend' // Défaut: 'moving_average'
  period_days?: number // Défaut: 90
}

// ==================== UOM / UNITS OF MEASURE (Gap P2-3) ====================

export interface UnitOfMeasure {
  id: number
  name: string
  category_id: number
  category_name: string
  uom_type: 'bigger' | 'reference' | 'smaller'
  factor: number
  factor_inv: number
  rounding: number
  active: boolean
}

export interface UomCategory {
  id: number
  name: string
  uom_count: number
}

export interface UomConversionResult {
  original_qty: number
  from_uom: {
    id: number
    name: string
  }
  to_uom: {
    id: number
    name: string
  }
  converted_qty: number
  formula: string
}

export interface ProductUomConfig {
  product_id: number
  product_name: string
  uom: {
    id: number
    name: string
    category: string
    rounding: number
  }
  uom_po: {
    id: number
    name: string
    category: string
  }
  alternative_uoms: Array<{
    id: number
    name: string
    factor: number
    factor_inv: number
  }>
}

export interface UomListParams {
  category_id?: number
}

export interface UomConvertParams {
  qty: number
  from_uom_id: number
  to_uom_id: number
}

// ==================== LOT TRACEABILITY (Gap P2-4) ====================

export interface TraceabilityMove {
  id: number
  date: string | null
  location_src: string
  location_dest: string
  quantity: number
  uom: string
  reference: string
  origin: string
  picking_name: string | null
  partner: string | null
}

export interface LotTraceability {
  lot: {
    id: number
    name: string
    ref: string
    product_id: number
    product_name: string
    product_sku: string
    stock_qty: number
    expiration_date: string | null
  }
  upstream: TraceabilityMove[]
  downstream: TraceabilityMove[]
  upstream_count: number
  downstream_count: number
}

// ==================== ADVANCED STOCK REPORTS (Gap P2-5) ====================

export interface StockoutItem {
  product_id: number
  product_name: string
  product_sku: string
  current_stock: number
  warehouse: string
  min_qty: number
  shortage: number
}

export interface DeadStockItem {
  product_id: number
  product_name: string
  product_sku: string
  qty_available: number
  value: number
  last_move_date: string | null
  days_inactive: number
}

export interface StockAnomaly {
  product_id: number
  product_name: string
  product_sku: string
  qty_available: number
  anomaly_type: 'negative_stock'
  severity: 'high' | 'medium' | 'low'
}

export interface AdvancedStockReports {
  stockouts: {
    items: StockoutItem[]
    count: number
    total_value: number
  }
  dead_stock: {
    items: DeadStockItem[]
    count: number
    total_value: number
    days_threshold: number
  }
  anomalies: {
    items: StockAnomaly[]
    count: number
  }
  kpis: {
    stockout_count: number
    dead_stock_count: number
    anomaly_count: number
    total_dead_stock_value: number
  }
}

export interface AdvancedStockReportsParams {
  days_threshold?: number
}
