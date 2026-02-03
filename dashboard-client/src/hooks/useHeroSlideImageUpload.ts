import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getBackendUrl } from '@quelyos/config'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || getBackendUrl(import.meta.env.MODE as 'development' | 'production' | 'staging')

export function useHeroSlideImageUpload(slideId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('image', file)

      // Récupérer le token d'authentification
      const token = localStorage.getItem('authToken')

      const response = await fetch(`${BACKEND_URL}/api/ecommerce/hero-slides/${slideId}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de l\'upload')
      }

      return data
    },
    onSuccess: () => {
      // Invalider le cache des slides pour forcer le rechargement
      queryClient.invalidateQueries({ queryKey: ['heroSlides'] })
    },
  })
}
