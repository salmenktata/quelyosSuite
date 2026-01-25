import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { odooRpc } from '@/lib/odoo-rpc'

export interface MenuItem {
  id: number
  name: string
  code: string
  label: string
  url: string
  icon?: string
  description?: string
  parent_id?: number | null
  sequence: number
  active: boolean
  open_new_tab: boolean
  requires_auth: boolean
  css_class?: string
  children?: MenuItem[]
  children_count?: number
}

export function useMenus() {
  return useQuery({
    queryKey: ['menus'],
    queryFn: async () => {
      const response = await odooRpc<{ menus: MenuItem[] }>('/api/ecommerce/menus/list')
      return response
    },
  })
}

export function useCreateMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<MenuItem>) => {
      const response = await odooRpc('/api/ecommerce/menus/create', data)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la création')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] })
    },
  })
}

export function useUpdateMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<MenuItem> & { id: number }) => {
      const response = await odooRpc(`/api/ecommerce/menus/${id}/update`, data)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la mise à jour')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] })
    },
  })
}

export function useDeleteMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await odooRpc(`/api/ecommerce/menus/${id}/delete`)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la suppression')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] })
    },
  })
}

export function useReorderMenus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (menuIds: number[]) => {
      const response = await odooRpc('/api/ecommerce/menus/reorder', { menu_ids: menuIds })
      if (!response.success) {
        throw new Error(response.error || "Erreur lors de la mise à jour de l'ordre")
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] })
    },
  })
}
