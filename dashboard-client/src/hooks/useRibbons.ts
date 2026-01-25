import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

/**
 * Hook pour récupérer la liste des rubans (badges) disponibles
 */
export function useRibbons() {
  return useQuery({
    queryKey: ['ribbons'],
    queryFn: () => api.getRibbons(),
  })
}

/**
 * Hook pour mettre à jour le ruban d'un produit
 */
export function useUpdateProductRibbon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, ribbonId }: { productId: number; ribbonId: number | null }) =>
      api.updateProductRibbon(productId, ribbonId),
    onSuccess: (_, variables) => {
      // Invalider le cache du produit et de la liste des produits
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
