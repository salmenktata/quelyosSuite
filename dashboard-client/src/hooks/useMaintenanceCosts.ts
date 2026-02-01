import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface MonthlyCost {
  month: string
  cost: number
}

export interface TopEquipmentCost {
  id: number
  name: string
  cost: number
}

export interface MaintenanceCostsData {
  total_cost: number
  preventive_cost: number
  corrective_cost: number
  top_equipment: TopEquipmentCost[]
  monthly_costs: MonthlyCost[]
  period: {
    start_date: string
    end_date: string
  }
}

export interface CostsFilters {
  start_date?: string
  end_date?: string
}

export function useMaintenanceCosts(filters?: CostsFilters) {
  return useQuery({
    queryKey: ['maintenance', 'costs', filters],
    queryFn: async () => {
      const response = await api.post('/api/maintenance/costs', filters || {})
      return response.data as { success: boolean; data: MaintenanceCostsData }
    },
  })
}
