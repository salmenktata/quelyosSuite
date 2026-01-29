import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Contract } from './useContracts'

export interface Employee {
  id: number
  employee_number: string
  name: string
  first_name: string
  last_name: string
  work_email: string
  work_phone: string
  mobile_phone: string
  department_id: number | null
  department_name: string | null
  job_id: number | null
  job_title: string
  parent_id: number | null
  parent_name: string | null
  state: 'active' | 'suspended' | 'departed'
  hire_date: string | null
  seniority: string
  attendance_state: 'checked_in' | 'checked_out'
  image_url: string | null
  // Detailed fields
  gender?: string
  birthday?: string
  place_of_birth?: string
  country_id?: number
  country_name?: string
  identification_id?: string
  marital?: string
  spouse_name?: string
  children?: number
  address?: {
    street: string
    street2: string
    city: string
    state: string
    zip: string
    country: string
  }
  private_email?: string
  emergency_contact?: string
  emergency_phone?: string
  bank_name?: string
  bank_account_number?: string
  contract?: Contract | null
  remaining_leaves?: number
  coach_id?: number
  coach_name?: string
  departure_date?: string
  departure_reason?: string
}

export interface EmployeeFilters {
  tenant_id: number
  department_id?: number
  job_id?: number
  state?: string
  manager_id?: number
  search?: string
  limit?: number
  offset?: number
}

export interface CreateEmployeeData {
  tenant_id: number
  first_name: string
  last_name: string
  work_email?: string
  work_phone?: string
  mobile_phone?: string
  department_id?: number
  job_id?: number
  parent_id?: number
  job_title?: string
  hire_date?: string
  gender?: string
  birthday?: string
  identification_id?: string
  marital?: string
  children?: number
  emergency_contact?: string
  emergency_phone?: string
}

export interface UpdateEmployeeData {
  first_name?: string
  last_name?: string
  work_email?: string
  work_phone?: string
  mobile_phone?: string
  department_id?: number | null
  job_id?: number | null
  parent_id?: number | null
  job_title?: string
  state?: string
  hire_date?: string
  gender?: string
  birthday?: string
  identification_id?: string
  marital?: string
  children?: number
  emergency_contact?: string
  emergency_phone?: string
  departure_date?: string
  departure_reason?: string
}

export function useEmployees(filters: EmployeeFilters) {
  return useQuery({
    queryKey: ['hr-employees', filters],
    queryFn: async () => {
      const response = await api.post<{
        success: boolean
        error?: string
        employees: Employee[]
        total: number
      }>('/api/hr/employees', filters)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement des employés')
      }

      return {
        employees: response.data.employees,
        total: response.data.total,
      }
    },
    enabled: !!filters.tenant_id,
  })
}

export function useEmployee(employeeId: number | null) {
  return useQuery({
    queryKey: ['hr-employee', employeeId],
    queryFn: async () => {
      if (!employeeId) return null

      const response = await api.post<{
        success: boolean
        error?: string
        employee: Employee
      }>(`/api/hr/employees/${employeeId}`, {})

      if (!response.data.success) {
        throw new Error(response.data.error || 'Employé introuvable')
      }

      return response.data.employee
    },
    enabled: !!employeeId,
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateEmployeeData) => {
      const response = await api.post<{
        success: boolean
        error?: string
        employee: Employee
      }>('/api/hr/employees/create', data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la création')
      }

      return response.data.employee
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] })
      queryClient.invalidateQueries({ queryKey: ['hr-dashboard'] })
    },
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateEmployeeData }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        employee: Employee
      }>(`/api/hr/employees/${id}/update`, data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la mise à jour')
      }

      return response.data.employee
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] })
      queryClient.invalidateQueries({ queryKey: ['hr-employee', id] })
      queryClient.invalidateQueries({ queryKey: ['hr-dashboard'] })
    },
  })
}

export function useArchiveEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { departure_date?: string; departure_reason?: string } }) => {
      const response = await api.post<{
        success: boolean
        error?: string
      }>(`/api/hr/employees/${id}/archive`, data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de l\'archivage')
      }

      return true
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] })
      queryClient.invalidateQueries({ queryKey: ['hr-employee', id] })
      queryClient.invalidateQueries({ queryKey: ['hr-dashboard'] })
    },
  })
}

export function useEmployeeLeaves(employeeId: number | null) {
  return useQuery({
    queryKey: ['hr-employee-leaves', employeeId],
    queryFn: async () => {
      if (!employeeId) return null

      const response = await api.post<{
        success: boolean
        error?: string
        balances: Array<{
          leave_type_id: number
          leave_type_name: string
          leave_type_code: string
          allocated: number
          taken: number
          remaining: number
        }>
        leaves: Array<{
          id: number
          reference: string
          leave_type_name: string
          leave_type_color?: number
          date_from: string
          date_to: string
          number_of_days: number
          state: string
          state_label?: string
        }>
      }>(`/api/hr/employees/${employeeId}/leaves`, {})

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return {
        balances: response.data.balances,
        leaves: response.data.leaves,
      }
    },
    enabled: !!employeeId,
  })
}

export function useEmployeeAttendance(employeeId: number | null, limit = 30) {
  return useQuery({
    queryKey: ['hr-employee-attendance', employeeId, limit],
    queryFn: async () => {
      if (!employeeId) return null

      const response = await api.post<{
        success: boolean
        error?: string
        attendances: Array<{
          id: number
          check_in: string
          check_out: string | null
          worked_hours: number
          overtime: number
          state: string
        }>
        attendance_state: string
      }>(`/api/hr/employees/${employeeId}/attendance`, { limit })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return {
        attendances: response.data.attendances,
        attendanceState: response.data.attendance_state,
      }
    },
    enabled: !!employeeId,
  })
}

export function useSubordinates(employeeId: number | null) {
  return useQuery({
    queryKey: ['hr-subordinates', employeeId],
    queryFn: async () => {
      if (!employeeId) return []

      const response = await api.post<{
        success: boolean
        error?: string
        subordinates: Employee[]
      }>(`/api/hr/employees/${employeeId}/subordinates`, {})

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.subordinates
    },
    enabled: !!employeeId,
  })
}
