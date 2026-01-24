import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useCategories(params?: {
  limit?: number
  offset?: number
  search?: string
  include_tree?: boolean
}) {
  return useQuery({
    queryKey: ['categories', params],
    queryFn: () => api.getCategories(params),
  })
}

export function useCategoriesTree() {
  return useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: () => api.getCategories({ include_tree: true }),
  })
}

export function useCategory(id: number) {
  return useQuery({
    queryKey: ['category', id],
    queryFn: () => api.getCategory(id),
    enabled: !!id,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; parent_id?: number }) =>
      api.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; parent_id?: number | null } }) =>
      api.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['category'] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useMoveCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, newParentId }: { id: number; newParentId: number | null }) =>
      api.moveCategory(id, newParentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
