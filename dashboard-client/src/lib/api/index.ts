/**
 * API Barrel Export - Organisation modulaire
 *
 * Permet le tree-shaking via des imports spécifiques:
 * - import { api } from '@/lib/api' (legacy, tout importer)
 * - import { login, logout } from '@/lib/api/modules/auth' (optimal, tree-shakeable)
 */

// Export legacy pour compatibilité (importe tout)
export { api, apiClient } from '../api'

// Export types
export type {
  APIResponse,
  LoginResponse,
  SessionResponse,
  Order,
  OrderDetail,
  Address,
  Product,
  ProductDetail,
  Category,
  Cart,
  Coupon,
  Ribbon,
} from '@/types'

export type {
  PaginatedResponse,
  Customer,
  CustomerListItem,
  ProductsQueryParams,
  ProductCreateData,
  ProductUpdateData,
  CouponCreate,
  StockProduct,
  StockMove,
  DeliveryMethod,
  AnalyticsStats,
  AbandonedCart,
  AbandonedCartsQueryParams,
  CartRecoveryStats,
  OrderHistoryItem,
  ShippingTrackingInfo,
  Stage,
  LeadListItem,
  Lead,
} from '@/types'

// Note: Pour des imports optimisés (tree-shakeable), utilisez:
// import { login, logout } from '@/lib/api/modules/auth'
// import { getProducts, createProduct } from '@/lib/api/modules/store'
// etc.
