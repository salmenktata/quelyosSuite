/**
 * Hooks pour les fonctionnalités avancées Stock (Gaps P1 & P2)
 *
 * - P1-3: Historique mouvements stock
 * - P1-4: Configuration routes entrepôt
 * - P1-6 & P1-7: Lots/Serial + Dates expiration
 * - P2-1: Analyse ABC (Pareto 80-20)
 * - P2-2: Prévisions besoins stock
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  StockMove,
  StockMovesParams,
  ProductStockHistory,
  ProductStockHistoryParams,
  StockRoute,
  StockRouteDetail,
  WarehouseRoutesConfig,
  ConfigureWarehouseRoutesParams,
  StockLot,
  StockLotDetail,
  LotsParams,
  ExpiryAlerts,
  ExpiryAlertsParams,
  ProductExpiryConfig,
  UpdateProductExpiryConfigParams,
  ABCAnalysisResponse,
  ABCAnalysisParams,
  StockForecastResponse,
  StockForecastParams,
  UnitOfMeasure,
  UomCategory,
  UomConversionResult,
  ProductUomConfig,
  UomListParams,
  UomConvertParams,
  LotTraceability,
  AdvancedStockReports,
  AdvancedStockReportsParams,
} from '@/types/stock'

// ==================== STOCK MOVES HISTORY (Gap P1-3) ====================

/**
 * Liste des mouvements de stock avec filtres avancés
 */
export function useStockMoves(params?: StockMovesParams) {
  return useQuery({
    queryKey: ['stock', 'moves', params],
    queryFn: async () => {
      const response = await api.post('/api/ecommerce/stock/moves', params || {})
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement des mouvements')
      }
      return {
        moves: response.data.data.moves as StockMove[],
        total: response.data.data.total as number,
        limit: response.data.data.limit as number,
        offset: response.data.data.offset as number,
      }
    },
  })
}

/**
 * Historique des mouvements d'un produit spécifique
 */
export function useProductStockHistory(productId: number, params?: ProductStockHistoryParams) {
  return useQuery({
    queryKey: ['stock', 'products', productId, 'history', params],
    queryFn: async () => {
      const response = await api.post(
        `/api/ecommerce/products/${productId}/stock/history`,
        params || {}
      )
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement de l\'historique')
      }
      return response.data.data as ProductStockHistory
    },
    enabled: !!productId,
  })
}

// ==================== WAREHOUSE ROUTES (Gap P1-4) ====================

/**
 * Liste toutes les routes stock disponibles
 */
export function useStockRoutes() {
  return useQuery({
    queryKey: ['stock', 'routes'],
    queryFn: async () => {
      const response = await api.post('/api/ecommerce/stock/routes', {})
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement des routes')
      }
      return {
        routes: response.data.data.routes as StockRoute[],
        total: response.data.data.total as number,
      }
    },
  })
}

/**
 * Détails d'une route avec ses règles push/pull
 */
export function useStockRouteDetail(routeId: number) {
  return useQuery({
    queryKey: ['stock', 'routes', routeId],
    queryFn: async () => {
      const response = await api.post(`/api/ecommerce/stock/routes/${routeId}`, {})
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement de la route')
      }
      return response.data.data as StockRouteDetail
    },
    enabled: !!routeId,
  })
}

/**
 * Routes configurées pour un entrepôt
 */
export function useWarehouseRoutes(warehouseId: number) {
  return useQuery({
    queryKey: ['warehouses', warehouseId, 'routes'],
    queryFn: async () => {
      const response = await api.post(
        `/api/ecommerce/warehouses/${warehouseId}/routes`,
        {}
      )
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement des routes')
      }
      return response.data.data as WarehouseRoutesConfig
    },
    enabled: !!warehouseId,
  })
}

/**
 * Configurer les étapes de réception/livraison d'un entrepôt
 */
export function useConfigureWarehouseRoutes(warehouseId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: ConfigureWarehouseRoutesParams) => {
      const response = await api.post(
        `/api/ecommerce/warehouses/${warehouseId}/routes/configure`,
        params
      )
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la configuration')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses', warehouseId, 'routes'] })
      queryClient.invalidateQueries({ queryKey: ['warehouses', warehouseId] })
    },
  })
}

// ==================== LOTS/SERIAL & EXPIRATION (Gap P1-6 & P1-7) ====================

/**
 * Liste tous les lots/numéros de série
 */
export function useStockLots(params?: LotsParams) {
  return useQuery({
    queryKey: ['stock', 'lots', params],
    queryFn: async () => {
      const response = await api.post('/api/ecommerce/stock/lots', params || {})
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement des lots')
      }
      return {
        lots: response.data.data.lots as StockLot[],
        total: response.data.data.total as number,
        limit: response.data.data.limit as number,
        offset: response.data.data.offset as number,
      }
    },
  })
}

/**
 * Détails complets d'un lot/numéro de série
 */
export function useStockLotDetail(lotId: number) {
  return useQuery({
    queryKey: ['stock', 'lots', lotId],
    queryFn: async () => {
      const response = await api.post(`/api/ecommerce/stock/lots/${lotId}`, {})
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement du lot')
      }
      return response.data.data as StockLotDetail
    },
    enabled: !!lotId,
  })
}

/**
 * Alertes d'expiration avec groupement par statut
 */
export function useExpiryAlerts(params?: ExpiryAlertsParams) {
  return useQuery({
    queryKey: ['stock', 'expiry-alerts', params],
    queryFn: async () => {
      const response = await api.post('/api/ecommerce/stock/lots/expiry-alerts', params || {})
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement des alertes')
      }
      return response.data.data as ExpiryAlerts
    },
  })
}

/**
 * Configuration des délais d'expiration d'un produit
 */
export function useProductExpiryConfig(productId: number) {
  return useQuery({
    queryKey: ['products', productId, 'expiry-config'],
    queryFn: async () => {
      const response = await api.post(
        `/api/ecommerce/products/${productId}/expiry-config`,
        {}
      )
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement de la configuration')
      }
      return response.data.data as ProductExpiryConfig
    },
    enabled: !!productId,
  })
}

/**
 * Mettre à jour la configuration d'expiration d'un produit
 */
export function useUpdateProductExpiryConfig(productId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: UpdateProductExpiryConfigParams) => {
      const response = await api.post(
        `/api/ecommerce/products/${productId}/expiry-config/update`,
        params
      )
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la mise à jour')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', productId, 'expiry-config'] })
      queryClient.invalidateQueries({ queryKey: ['products', productId] })
    },
  })
}

// ==================== ABC ANALYSIS (Gap P2-1) ====================

/**
 * Analyse ABC des produits selon la règle de Pareto 80-20
 */
export function useABCAnalysis(params?: ABCAnalysisParams) {
  return useQuery({
    queryKey: ['stock', 'abc-analysis', params],
    queryFn: async () => {
      const response = await api.post('/api/ecommerce/stock/abc-analysis', params || {})
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de l\'analyse ABC')
      }
      return response.data.data as ABCAnalysisResponse
    },
  })
}

// ==================== STOCK FORECAST (Gap P2-2) ====================

/**
 * Prévisions de besoins stock basées sur historique ventes
 */
export function useStockForecast(params: StockForecastParams) {
  return useQuery({
    queryKey: ['stock', 'forecast', params],
    queryFn: async () => {
      const response = await api.post('/api/ecommerce/stock/forecast', params)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la génération des prévisions')
      }
      return response.data.data as StockForecastResponse
    },
    enabled: !!params.product_id,
  })
}

// ==================== UOM / UNITS OF MEASURE (Gap P2-3) ====================

/**
 * Liste toutes les unités de mesure disponibles
 */
export function useUnitOfMeasures(params?: UomListParams) {
  return useQuery({
    queryKey: ['stock', 'uom', params],
    queryFn: async () => {
      const response = await api.post('/api/ecommerce/stock/uom', params || {})
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement des UoM')
      }
      return {
        uoms: response.data.data.uoms as UnitOfMeasure[],
        total: response.data.data.total as number,
      }
    },
  })
}

/**
 * Liste toutes les catégories UoM
 */
export function useUomCategories() {
  return useQuery({
    queryKey: ['stock', 'uom', 'categories'],
    queryFn: async () => {
      const response = await api.post('/api/ecommerce/stock/uom/categories', {})
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement des catégories')
      }
      return {
        categories: response.data.data.categories as UomCategory[],
        total: response.data.data.total as number,
      }
    },
  })
}

/**
 * Convertit une quantité entre deux UoM
 */
export function useUomConversion() {
  return useMutation({
    mutationFn: async (params: UomConvertParams) => {
      const response = await api.post('/api/ecommerce/stock/uom/convert', params)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la conversion')
      }
      return response.data.data as UomConversionResult
    },
  })
}

/**
 * Configuration UoM d'un produit
 */
export function useProductUomConfig(productId: number) {
  return useQuery({
    queryKey: ['products', productId, 'uom-config'],
    queryFn: async () => {
      const response = await api.post(`/api/ecommerce/products/${productId}/uom-config`, {})
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement de la configuration')
      }
      return response.data.data as ProductUomConfig
    },
    enabled: !!productId,
  })
}

// ==================== LOT TRACEABILITY (Gap P2-4) ====================

/**
 * Traçabilité complète amont/aval d'un lot
 */
export function useLotTraceability(lotId: number) {
  return useQuery({
    queryKey: ['stock', 'lots', lotId, 'traceability'],
    queryFn: async () => {
      const response = await api.post(`/api/ecommerce/stock/lots/${lotId}/traceability`, {})
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement de la traçabilité')
      }
      return response.data.data as LotTraceability
    },
    enabled: !!lotId,
  })
}

// ==================== ADVANCED STOCK REPORTS (Gap P2-5) ====================

/**
 * Rapports stock avancés : ruptures, dead stock, anomalies
 */
export function useAdvancedStockReports(params?: AdvancedStockReportsParams) {
  return useQuery({
    queryKey: ['stock', 'reports', 'advanced', params],
    queryFn: async () => {
      const response = await api.post('/api/ecommerce/stock/reports/advanced', params || {})
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement des rapports')
      }
      return response.data.data as AdvancedStockReports
    },
  })
}
