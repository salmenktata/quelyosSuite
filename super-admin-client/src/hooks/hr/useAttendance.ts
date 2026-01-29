import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Attendance {
  id: number
  employee_id: number
  employee_name: string
  employee_number: string
  department_name: string | null
  check_in: string
  check_out: string | null
  worked_hours: number
  overtime: number
  check_in_mode: string
  check_out_mode: string | null
  state: 'draft' | 'confirmed' | 'validated' | 'anomaly'
  location: {
    check_in: { latitude: number; longitude: number } | null
    check_out: { latitude: number; longitude: number } | null
  }
  notes: string
}

export interface AttendanceFilters {
  tenant_id: number
  employee_id?: number
  department_id?: number
  date_from?: string
  date_to?: string
  state?: string
  limit?: number
  offset?: number
}

export interface TodaySummary {
  date: string
  total_employees: number
  present_today: number
  currently_in: number
  absent: number
  attendances: Attendance[]
}

export interface PeriodReport {
  date_from: string
  date_to: string
  total_entries: number
  employees: Array<{
    employee_id: number
    employee_name: string
    employee_number: string
    total_hours: number
    overtime_hours: number
    days_present: number
    attendances: Attendance[]
  }>
}

export function useAttendances(filters: AttendanceFilters) {
  return useQuery({
    queryKey: ['hr-attendances', filters],
    queryFn: async () => {
      const response = await api.post<{
        success: boolean
        error?: string
        attendances: Attendance[]
        total: number
      }>('/api/hr/attendance', filters)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement')
      }

      return {
        attendances: response.data.attendances,
        total: response.data.total,
      }
    },
    enabled: !!filters.tenant_id,
  })
}

export function useTodayAttendance(tenantId: number | null) {
  return useQuery({
    queryKey: ['hr-today-attendance', tenantId],
    queryFn: async () => {
      if (!tenantId) return null

      const response = await api.post<{
        success: boolean
        error?: string
      } & TodaySummary>('/api/hr/attendance/today', { tenant_id: tenantId })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return {
        date: response.data.date,
        totalEmployees: response.data.total_employees,
        presentToday: response.data.present_today,
        currentlyIn: response.data.currently_in,
        absent: response.data.absent,
        attendances: response.data.attendances,
      }
    },
    enabled: !!tenantId,
    refetchInterval: 60000, // Refresh every minute
  })
}

export function useAttendanceReport(
  tenantId: number | null,
  dateFrom: string | null,
  dateTo: string | null,
  employeeId?: number,
  departmentId?: number
) {
  return useQuery({
    queryKey: ['hr-attendance-report', tenantId, dateFrom, dateTo, employeeId, departmentId],
    queryFn: async () => {
      if (!tenantId || !dateFrom || !dateTo) return null

      const response = await api.post<{
        success: boolean
        error?: string
      } & PeriodReport>('/api/hr/attendance/report', {
        tenant_id: tenantId,
        date_from: dateFrom,
        date_to: dateTo,
        employee_id: employeeId,
        department_id: departmentId,
      })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return {
        dateFrom: response.data.date_from,
        dateTo: response.data.date_to,
        totalEntries: response.data.total_entries,
        employees: response.data.employees,
      }
    },
    enabled: !!tenantId && !!dateFrom && !!dateTo,
  })
}

export function useCheckIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      tenant_id: number
      employee_id: number
      mode?: string
      latitude?: number
      longitude?: number
    }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        attendance: Attendance
      }>('/api/hr/attendance/check-in', data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du pointage')
      }

      return response.data.attendance
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-attendances'] })
      queryClient.invalidateQueries({ queryKey: ['hr-today-attendance'] })
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] })
    },
  })
}

export function useCheckOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      tenant_id: number
      employee_id: number
      mode?: string
      latitude?: number
      longitude?: number
    }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        attendance: Attendance
      }>('/api/hr/attendance/check-out', data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du pointage')
      }

      return response.data.attendance
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-attendances'] })
      queryClient.invalidateQueries({ queryKey: ['hr-today-attendance'] })
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] })
    },
  })
}

export function useCreateAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      tenant_id: number
      employee_id: number
      check_in: string
      check_out?: string
      notes?: string
    }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        attendance: Attendance
      }>('/api/hr/attendance/create', data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la création')
      }

      return response.data.attendance
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-attendances'] })
      queryClient.invalidateQueries({ queryKey: ['hr-today-attendance'] })
    },
  })
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: {
      id: number
      data: { check_in?: string; check_out?: string; notes?: string }
    }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        attendance: Attendance
      }>(`/api/hr/attendance/${id}/update`, data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.attendance
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-attendances'] })
      queryClient.invalidateQueries({ queryKey: ['hr-today-attendance'] })
    },
  })
}

export function useValidateAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{
        success: boolean
        error?: string
        attendance: Attendance
      }>(`/api/hr/attendance/${id}/validate`, {})

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.attendance
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-attendances'] })
    },
  })
}

export function useMarkAttendanceAnomaly() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        attendance: Attendance
      }>(`/api/hr/attendance/${id}/anomaly`, { reason })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.attendance
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-attendances'] })
    },
  })
}
