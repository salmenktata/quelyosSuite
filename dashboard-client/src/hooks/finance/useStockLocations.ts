import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { odooRpc } from '@/lib/odoo-rpc'
import { buildLocationTree } from '@/lib/stock/tree-utils'
import type { StockLocation, LocationTreeNode, CreateLocationParams, UpdateLocationParams } from '@/types/stock'
import { logger } from '@quelyos/logger'
import { useMemo } from 'react'

// ══════════════════════════════════════════════════════════════════════
// QUERIES
// ══════════════════════════════════════════════════════════════════════

interface UseLocationsTreeParams {
  warehouse_id?: number
  usage?: 'internal' | 'view'
  active?: boolean
}

/**
 * Hook pour récupérer l'arbre des locations
 * Construit automatiquement la structure hiérarchique côté client
 */
export function useLocationsTree(params?: UseLocationsTreeParams) {
  const query = useQuery({
    queryKey: ['stock', 'locations', 'tree', params],
    queryFn: async () => {
      try {
        const response = await odooRpc('/api/ecommerce/stock/locations/tree', params || {})

        if (!response.success) {
          logger.error('[useLocationsTree] API error:', response.error)
          throw new Error(response.error || 'Échec du chargement des emplacements')
        }

        return (response.data?.locations as StockLocation[]) || []
      } catch (error) {
        logger.error('[useLocationsTree] Fetch error:', error)
        throw error
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  })

  // Construire l'arbre côté client
  const tree = useMemo(() => {
    if (!query.data) return []
    return buildLocationTree(query.data)
  }, [query.data])

  return {
    ...query,
    tree,
    locations: query.data || []
  }
}

// ══════════════════════════════════════════════════════════════════════
// MUTATIONS
// ══════════════════════════════════════════════════════════════════════

/**
 * Hook pour créer une nouvelle location
 */
export function useCreateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreateLocationParams) => {
      const response = await odooRpc('/api/ecommerce/stock/locations/create', params)

      if (!response.success) {
        throw new Error(response.error || 'Échec de la création de l\'emplacement')
      }

      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock', 'locations'] })
      logger.info('[useCreateLocation] Location created successfully')
    },
    onError: (error) => {
      logger.error('[useCreateLocation] Error:', error)
    },
  })
}

/**
 * Hook pour modifier une location
 */
export function useUpdateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...params }: UpdateLocationParams & { id: number }) => {
      const response = await odooRpc(`/api/ecommerce/stock/locations/${id}/update`, params)

      if (!response.success) {
        throw new Error(response.error || 'Échec de la mise à jour de l\'emplacement')
      }

      return response.data
    },
    // Optimistic update
    onMutate: async (variables) => {
      // Annuler queries en cours
      await queryClient.cancelQueries({ queryKey: ['stock', 'locations'] })

      // Snapshot previous value
      const previousLocations = queryClient.getQueryData(['stock', 'locations', 'tree'])

      // Optimistically update
      queryClient.setQueryData(['stock', 'locations', 'tree'], (old: any) => {
        if (!old?.data?.locations) return old

        return {
          ...old,
          data: {
            ...old.data,
            locations: old.data.locations.map((loc: StockLocation) =>
              loc.id === variables.id ? { ...loc, ...variables } : loc
            )
          }
        }
      })

      return { previousLocations }
    },
    // Rollback on error
    onError: (error, variables, context) => {
      if (context?.previousLocations) {
        queryClient.setQueryData(['stock', 'locations', 'tree'], context.previousLocations)
      }
      logger.error('[useUpdateLocation] Error:', error)
    },
    // Refetch on success
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stock', 'locations'] })
      logger.info('[useUpdateLocation] Location updated successfully')
    },
  })
}

/**
 * Hook pour archiver une location
 */
export function useArchiveLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (locationId: number) => {
      const response = await odooRpc(`/api/ecommerce/stock/locations/${locationId}/archive`, {})

      if (!response.success) {
        throw new Error(response.error || 'Échec de l\'archivage de l\'emplacement')
      }

      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock', 'locations'] })
      logger.info('[useArchiveLocation] Location archived successfully')
    },
    onError: (error) => {
      logger.error('[useArchiveLocation] Error:', error)
    },
  })
}

/**
 * Hook pour déplacer une location dans l'arbre
 */
export function useMoveLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, new_parent_id }: { id: number; new_parent_id: number }) => {
      const response = await odooRpc(`/api/ecommerce/stock/locations/${id}/move`, {
        new_parent_id
      })

      if (!response.success) {
        throw new Error(response.error || 'Échec du déplacement de l\'emplacement')
      }

      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock', 'locations'] })
      logger.info('[useMoveLocation] Location moved successfully')
    },
    onError: (error) => {
      logger.error('[useMoveLocation] Error:', error)
    },
  })
}
