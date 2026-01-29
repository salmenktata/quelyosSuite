import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { backendRpc } from '@/lib/backend-rpc'
import type { ReorderingRule, CreateReorderingRuleParams, UpdateReorderingRuleParams } from '@/types/stock'
import { logger } from '@quelyos/logger'

// ══════════════════════════════════════════════════════════════════════
// QUERIES
// ══════════════════════════════════════════════════════════════════════

interface UseReorderingRulesParams {
  warehouse_id?: number
  active?: boolean
  triggered?: boolean
}

interface ReorderingRulesResponse {
  rules: ReorderingRule[]
  total: number
}

/**
 * Hook pour récupérer les règles de réapprovisionnement
 */
export function useReorderingRules(params?: UseReorderingRulesParams) {
  return useQuery({
    queryKey: ['stock', 'reordering-rules', params],
    queryFn: async () => {
      try {
        const response = await backendRpc('/api/ecommerce/stock/reordering-rules', params || {})

        if (!response.success) {
          logger.error('[useReorderingRules] API error:', response.error)
          throw new Error(response.error || 'Échec du chargement des règles de réapprovisionnement')
        }

        return response.data as ReorderingRulesResponse
      } catch (error) {
        logger.error('[useReorderingRules] Fetch error:', error)
        throw error
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (plus court car données critiques)
    gcTime: 5 * 60 * 1000,
  })
}

// ══════════════════════════════════════════════════════════════════════
// MUTATIONS
// ══════════════════════════════════════════════════════════════════════

/**
 * Hook pour créer une nouvelle règle de réapprovisionnement
 */
export function useCreateReorderingRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreateReorderingRuleParams) => {
      const response = await backendRpc('/api/ecommerce/stock/reordering-rules/create', params)

      if (!response.success) {
        throw new Error(response.error || 'Échec de la création de la règle')
      }

      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock', 'reordering-rules'] })
      logger.info('[useCreateReorderingRule] Rule created successfully')
    },
    onError: (error) => {
      logger.error('[useCreateReorderingRule] Error:', error)
    },
  })
}

/**
 * Hook pour modifier une règle de réapprovisionnement
 */
export function useUpdateReorderingRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...params }: UpdateReorderingRuleParams & { id: number }) => {
      const response = await backendRpc(`/api/ecommerce/stock/reordering-rules/${id}/update`, params)

      if (!response.success) {
        throw new Error(response.error || 'Échec de la mise à jour de la règle')
      }

      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock', 'reordering-rules'] })
      logger.info('[useUpdateReorderingRule] Rule updated successfully')
    },
    onError: (error) => {
      logger.error('[useUpdateReorderingRule] Error:', error)
    },
  })
}

/**
 * Hook pour supprimer (archiver) une règle de réapprovisionnement
 */
export function useDeleteReorderingRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ruleId: number) => {
      const response = await backendRpc(`/api/ecommerce/stock/reordering-rules/${ruleId}/delete`, {})

      if (!response.success) {
        throw new Error(response.error || 'Échec de la suppression de la règle')
      }

      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock', 'reordering-rules'] })
      logger.info('[useDeleteReorderingRule] Rule deleted successfully')
    },
    onError: (error) => {
      logger.error('[useDeleteReorderingRule] Error:', error)
    },
  })
}

/**
 * Hook pour activer/désactiver une règle de réapprovisionnement
 */
export function useToggleReorderingRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const response = await backendRpc(`/api/ecommerce/stock/reordering-rules/${id}/update`, { active })

      if (!response.success) {
        throw new Error(response.error || 'Échec de la modification de la règle')
      }

      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock', 'reordering-rules'] })
      logger.info('[useToggleReorderingRule] Rule toggled successfully')
    },
    onError: (error) => {
      logger.error('[useToggleReorderingRule] Error:', error)
    },
  })
}
