import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface LeaveType {
  id: number
  name: string
  code: string
  color: number
  requires_allocation: boolean
  allocation_type: 'no' | 'fixed' | 'accrual'
  request_unit: 'day' | 'half_day' | 'hour'
  validation_type: 'no_validation' | 'manager' | 'hr' | 'both'
  max_days: number
  max_consecutive_days: number
  min_notice_days: number
  unpaid: boolean
  requires_attachment: boolean
  attachment_description: string
  active: boolean
}

export interface Leave {
  id: number
  reference: string
  name: string
  employee_id: number
  employee_name: string
  department_name: string | null
  leave_type_id: number
  leave_type_name: string
  leave_type_code: string
  leave_type_color: number
  date_from: string
  date_to: string
  number_of_days: number
  request_unit_half: boolean
  state: 'draft' | 'confirm' | 'validate1' | 'validate' | 'refuse' | 'cancel'
  state_label: string
  notes: string
  manager_name: string | null
  first_approver: string | null
  validated_date: string | null
  refuse_reason: string
  has_attachments: boolean
  attachment_count: number
}

export interface LeaveAllocation {
  id: number
  reference: string
  name: string
  employee_id: number
  employee_name: string
  leave_type_id: number
  leave_type_name: string
  leave_type_code: string
  leave_type_color?: number
  number_of_days: number
  leaves_taken: number
  remaining_leaves: number
  date_from: string
  date_to: string
  allocation_type: string
  state: 'draft' | 'validate' | 'cancel'
  state_label?: string
  notes: string
}

export interface LeaveBalance {
  leave_type_id: number
  leave_type_name: string
  leave_type_code: string
  leave_type_color?: number
  allocated: number
  taken: number
  remaining: number
  remaining_leaves?: number
}

export interface CalendarEvent {
  id: number
  title: string
  start: string
  end: string
  date_from?: string
  date_to?: string
  color: number
  leave_type_color?: number
  employee_id: number
  employee_name: string
  leave_type: string
  state: string
  days: number
}

export interface LeaveFilters {
  tenant_id: number
  employee_id?: number
  department_id?: number
  leave_type_id?: number
  state?: string | string[]
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

export function useLeaveTypes(tenantId: number | null) {
  return useQuery({
    queryKey: ['hr-leave-types', tenantId],
    queryFn: async () => {
      if (!tenantId) return []

      const response = await api.post<{
        success: boolean
        error?: string
        leave_types: LeaveType[]
      }>('/api/hr/leave-types', { tenant_id: tenantId })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.leave_types
    },
    enabled: !!tenantId,
  })
}

export function useCreateLeaveType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      tenant_id: number
      name: string
      code: string
      color?: number
      requires_allocation?: boolean
      allocation_type?: string
      request_unit?: string
      validation_type?: string
      max_days?: number
      unpaid?: boolean
      requires_attachment?: boolean
      attachment_description?: string
    }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        leave_type: LeaveType
      }>('/api/hr/leave-types/create', data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.leave_type
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-leave-types'] })
    },
  })
}

export function useUpdateLeaveType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LeaveType> }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        leave_type: LeaveType
      }>(`/api/hr/leave-types/${id}/update`, data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.leave_type
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-leave-types'] })
    },
  })
}

export function useInitDefaultLeaveTypes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tenantId: number) => {
      const response = await api.post<{
        success: boolean
        error?: string
        message: string
      }>('/api/hr/leave-types/init-defaults', { tenant_id: tenantId })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.message
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-leave-types'] })
    },
  })
}

// Leaves
export function useLeaves(filters: LeaveFilters) {
  return useQuery({
    queryKey: ['hr-leaves', filters],
    queryFn: async () => {
      const response = await api.post<{
        success: boolean
        error?: string
        leaves: Leave[]
        total: number
      }>('/api/hr/leaves', filters)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return {
        leaves: response.data.leaves,
        total: response.data.total,
      }
    },
    enabled: !!filters.tenant_id,
  })
}

export function useLeave(leaveId: number | null) {
  return useQuery({
    queryKey: ['hr-leave', leaveId],
    queryFn: async () => {
      if (!leaveId) return null

      const response = await api.post<{
        success: boolean
        error?: string
        leave: Leave
      }>(`/api/hr/leaves/${leaveId}`, {})

      if (!response.data.success) {
        throw new Error(response.data.error || 'Demande introuvable')
      }

      return response.data.leave
    },
    enabled: !!leaveId,
  })
}

export function useCreateLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      tenant_id: number
      employee_id: number
      leave_type_id: number
      date_from: string
      date_to: string
      notes?: string
      request_unit_half?: boolean
    }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        leave: Leave
      }>('/api/hr/leaves/create', data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.leave
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-leaves'] })
      queryClient.invalidateQueries({ queryKey: ['hr-leaves-calendar'] })
      queryClient.invalidateQueries({ queryKey: ['hr-pending-leaves'] })
      queryClient.invalidateQueries({ queryKey: ['hr-dashboard'] })
    },
  })
}

export function useUpdateLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: {
      id: number
      data: {
        leave_type_id?: number
        date_from?: string
        date_to?: string
        notes?: string
        request_unit_half?: boolean
      }
    }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        leave: Leave
      }>(`/api/hr/leaves/${id}/update`, data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.leave
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['hr-leaves'] })
      queryClient.invalidateQueries({ queryKey: ['hr-leave', id] })
      queryClient.invalidateQueries({ queryKey: ['hr-leaves-calendar'] })
    },
  })
}

export function useConfirmLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{
        success: boolean
        error?: string
        leave: Leave
      }>(`/api/hr/leaves/${id}/confirm`, {})

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.leave
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['hr-leaves'] })
      queryClient.invalidateQueries({ queryKey: ['hr-leave', id] })
      queryClient.invalidateQueries({ queryKey: ['hr-pending-leaves'] })
    },
  })
}

export function useApproveLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{
        success: boolean
        error?: string
        leave: Leave
      }>(`/api/hr/leaves/${id}/approve`, {})

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.leave
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['hr-leaves'] })
      queryClient.invalidateQueries({ queryKey: ['hr-leave', id] })
      queryClient.invalidateQueries({ queryKey: ['hr-pending-leaves'] })
      queryClient.invalidateQueries({ queryKey: ['hr-leaves-calendar'] })
      queryClient.invalidateQueries({ queryKey: ['hr-dashboard'] })
    },
  })
}

export function useValidateLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{
        success: boolean
        error?: string
        leave: Leave
      }>(`/api/hr/leaves/${id}/validate`, {})

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.leave
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['hr-leaves'] })
      queryClient.invalidateQueries({ queryKey: ['hr-leave', id] })
      queryClient.invalidateQueries({ queryKey: ['hr-pending-leaves'] })
      queryClient.invalidateQueries({ queryKey: ['hr-leaves-calendar'] })
      queryClient.invalidateQueries({ queryKey: ['hr-dashboard'] })
    },
  })
}

export function useRefuseLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        leave: Leave
      }>(`/api/hr/leaves/${id}/refuse`, { reason })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.leave
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['hr-leaves'] })
      queryClient.invalidateQueries({ queryKey: ['hr-leave', id] })
      queryClient.invalidateQueries({ queryKey: ['hr-pending-leaves'] })
    },
  })
}

export function useCancelLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{
        success: boolean
        error?: string
        leave: Leave
      }>(`/api/hr/leaves/${id}/cancel`, {})

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.leave
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['hr-leaves'] })
      queryClient.invalidateQueries({ queryKey: ['hr-leave', id] })
      queryClient.invalidateQueries({ queryKey: ['hr-leaves-calendar'] })
    },
  })
}

export function useLeavesCalendar(
  tenantId: number | null,
  dateFrom: string | null,
  dateTo: string | null,
  departmentId?: number
) {
  return useQuery({
    queryKey: ['hr-leaves-calendar', tenantId, dateFrom, dateTo, departmentId],
    queryFn: async () => {
      if (!tenantId || !dateFrom || !dateTo) return []

      const response = await api.post<{
        success: boolean
        error?: string
        events: CalendarEvent[]
      }>('/api/hr/leaves/calendar', {
        tenant_id: tenantId,
        date_from: dateFrom,
        date_to: dateTo,
        department_id: departmentId,
      })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.events
    },
    enabled: !!tenantId && !!dateFrom && !!dateTo,
  })
}

export function usePendingLeaves(tenantId: number | null, managerEmployeeId?: number) {
  return useQuery({
    queryKey: ['hr-pending-leaves', tenantId, managerEmployeeId],
    queryFn: async () => {
      if (!tenantId) return { leaves: [], total: 0 }

      const response = await api.post<{
        success: boolean
        error?: string
        pending_leaves: Leave[]
        total: number
      }>('/api/hr/leaves/pending', {
        tenant_id: tenantId,
        manager_employee_id: managerEmployeeId,
      })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return {
        leaves: response.data.pending_leaves,
        total: response.data.total,
      }
    },
    enabled: !!tenantId,
  })
}

// Allocations
export function useLeaveAllocations(filters: {
  tenant_id: number
  employee_id?: number
  leave_type_id?: number
  state?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: ['hr-leave-allocations', filters],
    queryFn: async () => {
      const response = await api.post<{
        success: boolean
        error?: string
        allocations: LeaveAllocation[]
        total: number
      }>('/api/hr/leave-allocations', filters)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return {
        allocations: response.data.allocations,
        total: response.data.total,
      }
    },
    enabled: !!filters.tenant_id,
  })
}

export function useCreateLeaveAllocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      tenant_id: number
      employee_id: number
      leave_type_id: number
      number_of_days: number
      date_from?: string
      date_to?: string
      allocation_type?: string
      notes?: string
    }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        allocation: LeaveAllocation
      }>('/api/hr/leave-allocations/create', data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.allocation
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-leave-allocations'] })
      queryClient.invalidateQueries({ queryKey: ['hr-leave-balances'] })
    },
  })
}

export function useValidateLeaveAllocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{
        success: boolean
        error?: string
        allocation: LeaveAllocation
      }>(`/api/hr/leave-allocations/${id}/validate`, {})

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.allocation
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-leave-allocations'] })
      queryClient.invalidateQueries({ queryKey: ['hr-leave-balances'] })
    },
  })
}

export function useBulkCreateAllocations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      tenant_id: number
      leave_type_id: number
      number_of_days: number
      year?: number
    }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        created: number
        message: string
      }>('/api/hr/leave-allocations/bulk-create', data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return {
        created: response.data.created,
        message: response.data.message,
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-leave-allocations'] })
      queryClient.invalidateQueries({ queryKey: ['hr-leave-balances'] })
    },
  })
}

export function useLeaveBalances(tenantId: number | null, employeeId: number | null) {
  return useQuery({
    queryKey: ['hr-leave-balances', tenantId, employeeId],
    queryFn: async () => {
      if (!tenantId || !employeeId) return []

      const response = await api.post<{
        success: boolean
        error?: string
        balances: LeaveBalance[]
      }>('/api/hr/leave-balances', {
        tenant_id: tenantId,
        employee_id: employeeId,
      })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.balances
    },
    enabled: !!tenantId && !!employeeId,
  })
}
