import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Department {
  id: number
  name: string
  code: string
  complete_name: string
  parent_id: number | null
  parent_name: string | null
  manager_id: number | null
  manager_name: string | null
  total_employee: number
  color: number
  active: boolean
}

export interface DepartmentTree {
  id: number
  name: string
  code: string
  manager: {
    id: number
    name: string
    job: string | null
    image: string | null
  } | null
  total_employee: number
  children: DepartmentTree[]
}

export interface Job {
  id: number
  name: string
  code: string
  department_id: number | null
  department_name: string | null
  description: string
  requirements: string
  expected_employees: number
  current_employees: number
  no_of_employee?: number
  open_positions: number
  active: boolean
}

export interface CreateDepartmentData {
  tenant_id: number
  name: string
  code?: string
  parent_id?: number
  manager_id?: number
  sequence?: number
  color?: number
  note?: string
}

export interface CreateJobData {
  tenant_id: number
  name: string
  code?: string
  department_id?: number
  description?: string
  requirements?: string
  expected_employees?: number
}

export function useDepartments(tenantId: number | null) {
  return useQuery({
    queryKey: ['hr-departments', tenantId],
    queryFn: async () => {
      if (!tenantId) return { departments: [], total: 0 }

      const response = await api.post<{
        success: boolean
        error?: string
        departments: Department[]
        total: number
      }>('/api/hr/departments', { tenant_id: tenantId })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement')
      }

      return {
        departments: response.data.departments,
        total: response.data.total,
      }
    },
    enabled: !!tenantId,
  })
}

export function useDepartmentsTree(tenantId: number | null) {
  return useQuery({
    queryKey: ['hr-departments-tree', tenantId],
    queryFn: async () => {
      if (!tenantId) return []

      const response = await api.post<{
        success: boolean
        error?: string
        tree: DepartmentTree[]
      }>('/api/hr/departments/tree', { tenant_id: tenantId })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement')
      }

      return response.data.tree
    },
    enabled: !!tenantId,
  })
}

export function useDepartment(departmentId: number | null) {
  return useQuery({
    queryKey: ['hr-department', departmentId],
    queryFn: async () => {
      if (!departmentId) return null

      const response = await api.post<{
        success: boolean
        error?: string
        department: Department
        members: Array<{
          id: number
          name: string
          employee_number: string
          job_title: string
          image_url: string | null
        }>
      }>(`/api/hr/departments/${departmentId}`, {})

      if (!response.data.success) {
        throw new Error(response.data.error || 'Département introuvable')
      }

      return {
        department: response.data.department,
        members: response.data.members,
      }
    },
    enabled: !!departmentId,
  })
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateDepartmentData) => {
      const response = await api.post<{
        success: boolean
        error?: string
        department: Department
      }>('/api/hr/departments/create', data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la création')
      }

      return response.data.department
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-departments'] })
      queryClient.invalidateQueries({ queryKey: ['hr-departments-tree'] })
      queryClient.invalidateQueries({ queryKey: ['hr-dashboard'] })
    },
  })
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateDepartmentData> }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        department: Department
      }>(`/api/hr/departments/${id}/update`, data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la mise à jour')
      }

      return response.data.department
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['hr-departments'] })
      queryClient.invalidateQueries({ queryKey: ['hr-departments-tree'] })
      queryClient.invalidateQueries({ queryKey: ['hr-department', id] })
    },
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{
        success: boolean
        error?: string
      }>(`/api/hr/departments/${id}/delete`, {})

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la suppression')
      }

      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-departments'] })
      queryClient.invalidateQueries({ queryKey: ['hr-departments-tree'] })
    },
  })
}

// Jobs hooks
export function useJobs(tenantId: number | null, departmentId?: number) {
  return useQuery({
    queryKey: ['hr-jobs', tenantId, departmentId],
    queryFn: async () => {
      if (!tenantId) return { jobs: [], total: 0 }

      const response = await api.post<{
        success: boolean
        error?: string
        jobs: Job[]
        total: number
      }>('/api/hr/jobs', { tenant_id: tenantId, department_id: departmentId })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement')
      }

      return {
        jobs: response.data.jobs,
        total: response.data.total,
      }
    },
    enabled: !!tenantId,
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateJobData) => {
      const response = await api.post<{
        success: boolean
        error?: string
        job: Job
      }>('/api/hr/jobs/create', data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la création')
      }

      return response.data.job
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-jobs'] })
    },
  })
}

export function useUpdateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateJobData> }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        job: Job
      }>(`/api/hr/jobs/${id}/update`, data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la mise à jour')
      }

      return response.data.job
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-jobs'] })
    },
  })
}
