import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface MaintenanceRequest {
  id: number
  name: string
  equipment_name: string
  maintenance_type: 'corrective' | 'preventive'
  priority: '0' | '1' | '2' | '3'
  is_emergency: boolean
  downtime_impact: 'none' | 'low' | 'medium' | 'high' | 'critical'
  stage_name: string
  schedule_date: string | null
  total_cost: number
  actual_duration_hours: number
}

export interface RequestFilters {
  equipment_id?: number
  maintenance_type?: 'corrective' | 'preventive'
  state?: 'pending' | 'done'
  limit?: number
}

export interface RequestCreateData {
  name: string
  equipment_id: number
  maintenance_type: 'corrective' | 'preventive'
  priority?: '0' | '1' | '2' | '3'
  description?: string
  schedule_date?: string
  is_emergency?: boolean
  downtime_impact?: 'none' | 'low' | 'medium' | 'high' | 'critical'
  planned_duration_hours?: number
}

export function useMaintenanceRequests(filters?: RequestFilters) {
  return useQuery({
    queryKey: ['maintenance', 'requests', filters],
    queryFn: async () => {
      const response = await api.post('/api/maintenance/requests', filters || {})
      return response.data as { success: boolean; data: MaintenanceRequest[] }
    },
  })
}

export function useCreateMaintenanceRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: RequestCreateData) => {
      const response = await api.post('/api/maintenance/requests/create', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'requests'] })
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'equipment'] })
    },
  })
}
