import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface LowStockAlert {
  id: number
  name: string
  sku: string
  current_stock: number
  threshold: number
  diff: number
  image_url: string | null
  list_price: number
  category: string
}

export interface HighStockAlert {
  id: number
  name: string
  sku: string
  current_stock: number
  threshold: number
  diff: number
  image_url: string | null
  list_price: number
  category: string
}

// Hook pour les alertes de stock bas
export function useLowStockAlerts(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['low-stock-alerts', params],
    queryFn: () => api.getLowStockAlerts(params),
    refetchInterval: 60000, // Rafraîchir toutes les minutes
  })
}

// Hook pour les alertes de surstock
export function useHighStockAlerts(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['high-stock-alerts', params],
    queryFn: () => api.getHighStockAlerts(params),
    refetchInterval: 60000, // Rafraîchir toutes les minutes
  })
}

// Hook pour lister tous les produits avec leur stock
export function useStockProducts(params?: { limit?: number; offset?: number; search?: string }) {
  return useQuery({
    queryKey: ['stock-products', params],
    queryFn: () => api.getStockProducts(params),
  })
}

// Hook pour mettre à jour le stock d'un produit
export function useUpdateProductStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      api.updateProductStock(productId, quantity),
    onSuccess: () => {
      // Invalider les requêtes liées au stock pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['stock-products'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

// Hook pour préparer un inventaire physique
export function usePrepareInventory() {
  return useMutation({
    mutationFn: (params?: { category_id?: number; search?: string }) =>
      api.prepareInventory(params),
  })
}

// Hook pour valider un inventaire physique (ajustements en masse)
export function useValidateInventory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (adjustments: Array<{ product_id: number; new_qty: number }>) =>
      api.validateInventory(adjustments),
    onSuccess: () => {
      // Invalider toutes les requêtes stock après validation inventaire
      queryClient.invalidateQueries({ queryKey: ['stock-products'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

// Hook pour lister les mouvements de stock
export function useStockMoves(params?: { limit?: number; offset?: number; product_id?: number }) {
  return useQuery({
    queryKey: ['stock-moves', params],
    queryFn: () => api.getStockMoves(params),
  })
}
