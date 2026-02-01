import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface MaintenanceEquipment {
  id: number
  name: string
  category_name: string
  serial_number: string
  is_critical: boolean
  mtbf_hours: number
  mttr_hours: number
  uptime_percentage: number
  failure_count: number
  last_failure_date: string | null
  next_preventive_date: string | null
}

export interface MaintenanceEquipmentDetail extends MaintenanceEquipment {
  location: string
  purchase_date: string | null
  warranty_end_date: string | null
  recent_requests: Array<{
    id: number
    name: string
    maintenance_type: string
    priority: string
    stage_name: string
    create_date: string | null
  }>
}

export interface EquipmentFilters {
  category_id?: number
  location_id?: number
  critical_only?: boolean
  limit?: number
}

export interface EquipmentCreateData {
  name: string
  category_id?: number
  serial_number?: string
  is_critical?: boolean
  purchase_date?: string
  warranty_end_date?: string
}

export function useMaintenanceEquipment(filters?: EquipmentFilters) {
  return useQuery({
    queryKey: ['maintenance', 'equipment', filters],
    queryFn: async () => {
      const response = await api.post('/api/maintenance/equipment', filters || {})
      return response.data as { success: boolean; data: MaintenanceEquipment[] }
    },
  })
}

export function useMaintenanceEquipmentDetail(id: number) {
  return useQuery({
    queryKey: ['maintenance', 'equipment', id],
    queryFn: async () => {
      const response = await api.post(`/api/maintenance/equipment/${id}`)
      return response.data as { success: boolean; data: MaintenanceEquipmentDetail }
    },
    enabled: !!id,
  })
}

export function useCreateMaintenanceEquipment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: EquipmentCreateData) => {
      const response = await api.post('/api/maintenance/equipment/create', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'equipment'] })
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'dashboard'] })
    },
  })
}
