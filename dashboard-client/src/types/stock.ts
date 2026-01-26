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
  product_id: number
  name: string
  sku: string
  qty_sold: number
  avg_stock: number
  turnover_ratio: number
  days_of_stock: number
  status: TurnoverStatus
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
