import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { odooRpc } from '@/lib/odoo-rpc'

export interface Tenant {
  id: number
  name: string
  code: string
  domain: string
  active: boolean

  // Branding
  logo_url?: string
  favicon_url?: string
  slogan?: string

  // Theme - Couleurs (13 CSS Variables)
  primary_color: string
  primary_dark: string
  primary_light: string
  secondary_color: string
  secondary_dark: string
  secondary_light: string
  accent_color: string
  background_color: string
  foreground_color: string
  muted_color: string
  muted_foreground: string
  border_color: string
  ring_color: string

  // Theme - Typographie
  font_family: 'inter' | 'roboto' | 'poppins' | 'montserrat' | 'open-sans' | 'lato'

  // Theme - Dark Mode
  enable_dark_mode: boolean
  default_dark: boolean

  // Contact
  email?: string
  phone?: string
  whatsapp?: string

  // SEO
  meta_title?: string
  meta_description?: string
}

export interface TenantThemeUpdate {
  colors?: {
    primary?: string
    primary_dark?: string
    primary_light?: string
    secondary?: string
    secondary_dark?: string
    secondary_light?: string
    accent?: string
    background?: string
    foreground?: string
    muted?: string
    muted_foreground?: string
    border?: string
    ring?: string
  }
  fonts?: {
    family?: string
  }
  options?: {
    enable_dark_mode?: boolean
    default_dark?: boolean
  }
}

export function useTenants() {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const response = await odooRpc<{ tenants: Tenant[]; total: number }>('/api/ecommerce/tenant/list')
      return response.tenants || []
    },
  })
}

export function useTenant(id: number) {
  return useQuery({
    queryKey: ['tenants', id],
    queryFn: async () => {
      const response = await odooRpc<{ tenant: Tenant }>(`/api/ecommerce/tenant/${id}`)
      return response.tenant
    },
    enabled: !!id,
  })
}

export function useUpdateTenantTheme() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, theme }: { id: number; theme: TenantThemeUpdate }) => {
      const response = await odooRpc(`/api/ecommerce/tenants/${id}/theme/update`, theme)
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['tenants', variables.id] })
    },
  })
}

export function useUploadTenantLogo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`${import.meta.env.VITE_ODOO_URL}/api/ecommerce/tenants/${id}/upload-logo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Upload failed')
      }
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['tenants', variables.id] })
    },
  })
}

export function useUploadTenantFavicon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`${import.meta.env.VITE_ODOO_URL}/api/ecommerce/tenants/${id}/upload-favicon`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Upload failed')
      }
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['tenants', variables.id] })
    },
  })
}
