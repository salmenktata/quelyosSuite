import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { StockTransfer, StockLocation, CreateTransferParams, TransferState } from '@/types'

interface TransfersResponse {
  success: boolean
  data?: {
    transfers: StockTransfer[]
    total: number
    limit: number
    offset: number
  }
  error?: string
}

interface LocationsResponse {
  success: boolean
  data?: {
    locations: StockLocation[]
    total: number
  }
  error?: string
}

interface TransferActionResponse {
  success: boolean
  data?: {
    picking_id: number
    picking_name: string
    state: string
  }
  message?: string
  error?: string
}

// Hook pour lister les transferts
export function useStockTransfers(params?: {
  limit?: number
  offset?: number
  state?: TransferState | ''
  warehouse_id?: number
  search?: string
}) {
  return useQuery({
    queryKey: ['stock-transfers', params],
    queryFn: () => api.getStockTransfers(params) as Promise<TransfersResponse>,
  })
}

// Hook pour lister les locations
export function useStockLocations(params?: {
  warehouse_id?: number
  usage?: string
  internal_only?: boolean
}) {
  return useQuery({
    queryKey: ['stock-locations', params],
    queryFn: () => api.getStockLocations(params) as Promise<LocationsResponse>,
  })
}

// Hook pour créer un transfert
export function useCreateTransfer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: CreateTransferParams) =>
      api.createStockTransfer(params) as Promise<TransferActionResponse>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] })
      queryClient.invalidateQueries({ queryKey: ['stock-products'] })
      queryClient.invalidateQueries({ queryKey: ['stock-moves'] })
    },
  })
}

// Hook pour valider un transfert
export function useValidateTransfer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (pickingId: number) =>
      api.validateStockTransfer(pickingId) as Promise<TransferActionResponse>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] })
      queryClient.invalidateQueries({ queryKey: ['stock-products'] })
      queryClient.invalidateQueries({ queryKey: ['stock-moves'] })
    },
  })
}

// Hook pour annuler un transfert
export function useCancelTransfer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (pickingId: number) =>
      api.cancelStockTransfer(pickingId) as Promise<TransferActionResponse>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] })
    },
  })
}
