import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface MaintenanceDashboardData {
  equipment: {
    total: number
    critical: number
  }
  requests: {
    total: number
    pending: number
    emergency: number
  }
  kpi: {
    avg_mtbf_hours: number
    avg_mttr_hours: number
    avg_uptime_percentage: number
  }
}

export function useMaintenanceDashboard() {
  return useQuery<{ success: boolean; data: MaintenanceDashboardData }>({
    queryKey: ['maintenance', 'dashboard'],
    queryFn: async () => {
      const response = await api.post('/api/maintenance/reports/dashboard')
      return response.data
    },
  })
}
