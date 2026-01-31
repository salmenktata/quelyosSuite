import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

interface CategoryTreeItem {
  id: number
  name: string
  parent_id: number | null
  complete_name: string
  product_count: number
  children: CategoryTreeItem[]
}

interface CategoriesTreeData {
  data?: {
    categories: CategoryTreeItem[]
  }
}

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
    onMutate: async (newCategory) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['categories'] })

      // Snapshot the previous value
      const previousCategories = queryClient.getQueryData(['categories', 'tree'])

      // Optimistically update to the new value
      queryClient.setQueryData(['categories', 'tree'], (old: CategoriesTreeData | undefined) => {
        if (!old?.data?.categories) return old

        // Create optimistic category with temporary ID
        const optimisticCategory = {
          id: -Date.now(),
          name: newCategory.name,
          parent_id: newCategory.parent_id || null,
          complete_name: newCategory.name,
          product_count: 0,
          children: [],
        }

        // Add to root or to parent
        if (!newCategory.parent_id) {
          return {
            ...old,
            data: {
              ...old.data,
              categories: [...old.data.categories, optimisticCategory],
            },
          }
        }

        return old
      })

      return { previousCategories }
    },
    onError: (_err, _newCategory, context) => {
      // Rollback on error
      if (context?.previousCategories) {
        queryClient.setQueryData(['categories', 'tree'], context.previousCategories)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; parent_id?: number | null } }) =>
      api.updateCategory(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] })

      const previousCategories = queryClient.getQueryData(['categories', 'tree'])

      // Optimistically update
      queryClient.setQueryData(['categories', 'tree'], (old: CategoriesTreeData | undefined) => {
        if (!old?.data?.categories) return old

        const updateCategoryInTree = (categories: CategoryTreeItem[]): CategoryTreeItem[] => {
          return categories.map((cat) => {
            if (cat.id === id) {
              return {
                ...cat,
                ...data,
                complete_name: data.name || cat.complete_name,
              }
            }
            if (cat.children) {
              return {
                ...cat,
                children: updateCategoryInTree(cat.children),
              }
            }
            return cat
          })
        }

        return {
          ...old,
          data: {
            ...old.data,
            categories: updateCategoryInTree(old.data.categories),
          },
        }
      })

      return { previousCategories }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(['categories', 'tree'], context.previousCategories)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['category'] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.deleteCategory(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] })

      const previousCategories = queryClient.getQueryData(['categories', 'tree'])

      // Optimistically remove category
      queryClient.setQueryData(['categories', 'tree'], (old: CategoriesTreeData | undefined) => {
        if (!old?.data?.categories) return old

        const removeCategoryFromTree = (categories: CategoryTreeItem[]): CategoryTreeItem[] => {
          return categories
            .filter((cat) => cat.id !== id)
            .map((cat) => ({
              ...cat,
              children: cat.children ? removeCategoryFromTree(cat.children) : [],
            }))
        }

        return {
          ...old,
          data: {
            ...old.data,
            categories: removeCategoryFromTree(old.data.categories),
          },
        }
      })

      return { previousCategories }
    },
    onError: (_err, _id, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(['categories', 'tree'], context.previousCategories)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useMoveCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, newParentId }: { id: number; newParentId: number | null }) =>
      api.moveCategory(id, newParentId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['categories'] })

      const previousCategories = queryClient.getQueryData(['categories', 'tree'])

      // Optimistically move category (simplified - full implementation would rebuild tree)
      // For now, just invalidate to keep it simple and safe
      return { previousCategories }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(['categories', 'tree'], context.previousCategories)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
