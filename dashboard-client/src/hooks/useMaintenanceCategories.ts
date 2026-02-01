import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface MaintenanceCategory {
  id: number
  name: string
  equipment_count: number
}

export interface CategoryCreateData {
  name: string
}

export function useMaintenanceCategories() {
  return useQuery({
    queryKey: ['maintenance', 'categories'],
    queryFn: async () => {
      const response = await api.post('/api/maintenance/categories', {})
      return response.data as { success: boolean; data: MaintenanceCategory[] }
    },
  })
}

export function useCreateMaintenanceCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CategoryCreateData) => {
      const response = await api.post('/api/maintenance/categories/create', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'equipment'] })
    },
  })
}
