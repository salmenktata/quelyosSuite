import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Appraisal {
  id: number
  name: string
  employee_id: number
  employee_name: string
  employee_image?: string
  manager_id: number | null
  manager_name: string | null
  department_id: number | null
  department_name: string | null
  job_id: number | null
  job_name: string | null
  appraisal_type: string
  appraisal_type_label: string
  period_start: string | null
  period_end: string | null
  date_scheduled: string | null
  date_done: string | null
  duration: number
  location: string
  state: string
  state_label: string
  employee_score: string | null
  manager_score: string | null
  final_score: string | null
  employee_feedback: string
  manager_feedback: string
  strengths: string
  improvements: string
  goals_achieved: number
  goals_total: number
  training_needs: string
  training_plan: string
  promotion_recommended: boolean
  salary_increase_recommended: boolean
  career_goals: string
}

export interface AppraisalSummary {
  id: number
  name: string
  employee_id: number
  employee_name: string
  manager_name: string | null
  department_name: string | null
  appraisal_type: string
  appraisal_type_label: string
  date_scheduled: string | null
  date_done: string | null
  state: string
  state_label: string
  final_score: string | null
  goals_achieved: number
  goals_total: number
}

export interface Goal {
  id: number
  name: string
  description: string
  employee_id: number
  employee_name: string
  manager_id: number | null
  manager_name: string | null
  period_start: string | null
  deadline: string | null
  is_overdue: boolean
  progress: number
  state: string
  state_label: string
  priority: string
  priority_label: string
  goal_type: string
  goal_type_label: string
  target_value: number
  current_value: number
  unit: string
  appraisal_id: number | null
  notes: string
}

interface AppraisalsParams {
  tenant_id: number
  employee_id?: number
  manager_id?: number
  department_id?: number
  state?: string | string[]
  appraisal_type?: string
  year?: number
  limit?: number
  offset?: number
}

interface GoalsParams {
  tenant_id: number
  employee_id?: number
  state?: string | string[]
  goal_type?: string
  appraisal_id?: number
  limit?: number
}

export function useAppraisals(params: AppraisalsParams) {
  return useQuery({
    queryKey: ['hr-appraisals', params],
    queryFn: async () => {
      if (!params.tenant_id) return { appraisals: [], total: 0 }

      const response = await api.post<{
        success: boolean
        error?: string
        appraisals: AppraisalSummary[]
        total: number
      }>('/api/hr/appraisals', params)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement')
      }

      return {
        appraisals: response.data.appraisals,
        total: response.data.total,
      }
    },
    enabled: !!params.tenant_id,
  })
}

export function useAppraisal(appraisalId: number | null) {
  return useQuery({
    queryKey: ['hr-appraisal', appraisalId],
    queryFn: async () => {
      if (!appraisalId) return null

      const response = await api.post<{
        success: boolean
        error?: string
        appraisal: Appraisal
        goals: Goal[]
      }>(`/api/hr/appraisals/${appraisalId}`, {})

      if (!response.data.success) {
        throw new Error(response.data.error || 'Évaluation introuvable')
      }

      return {
        appraisal: response.data.appraisal,
        goals: response.data.goals,
      }
    },
    enabled: !!appraisalId,
  })
}

export function useCreateAppraisal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      tenant_id: number
      employee_id: number
      appraisal_type: string
      manager_id?: number
      period_start?: string
      period_end?: string
      date_scheduled?: string
      duration?: number
      location?: string
    }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        appraisal: Appraisal
      }>('/api/hr/appraisals/create', data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur création')
      }

      return response.data.appraisal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-appraisals'] })
    },
  })
}

export function useUpdateAppraisal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Appraisal> }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        appraisal: Appraisal
      }>(`/api/hr/appraisals/${id}/update`, data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur mise à jour')
      }

      return response.data.appraisal
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hr-appraisals'] })
      queryClient.invalidateQueries({ queryKey: ['hr-appraisal', variables.id] })
    },
  })
}

export function useAppraisalAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, action }: { id: number; action: string }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        appraisal: Appraisal
      }>(`/api/hr/appraisals/${id}/action`, { action })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur action')
      }

      return response.data.appraisal
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hr-appraisals'] })
      queryClient.invalidateQueries({ queryKey: ['hr-appraisal', variables.id] })
    },
  })
}

// ============ GOALS ============

export function useGoals(params: GoalsParams) {
  return useQuery({
    queryKey: ['hr-goals', params],
    queryFn: async () => {
      if (!params.tenant_id) return { goals: [], total: 0 }

      const response = await api.post<{
        success: boolean
        error?: string
        goals: Goal[]
        total: number
      }>('/api/hr/goals', params)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement')
      }

      return {
        goals: response.data.goals,
        total: response.data.total,
      }
    },
    enabled: !!params.tenant_id,
  })
}

export function useCreateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      employee_id: number
      name: string
      deadline: string
      description?: string
      period_start?: string
      priority?: string
      goal_type?: string
      target_value?: number
      unit?: string
      appraisal_id?: number
    }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        goal: Goal
      }>('/api/hr/goals/create', data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur création')
      }

      return response.data.goal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-goals'] })
      queryClient.invalidateQueries({ queryKey: ['hr-appraisal'] })
    },
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Goal> }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        goal: Goal
      }>(`/api/hr/goals/${id}/update`, data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur mise à jour')
      }

      return response.data.goal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-goals'] })
      queryClient.invalidateQueries({ queryKey: ['hr-appraisal'] })
    },
  })
}

export function useGoalAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, action }: { id: number; action: string }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        goal: Goal
      }>(`/api/hr/goals/${id}/action`, { action })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur action')
      }

      return response.data.goal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-goals'] })
      queryClient.invalidateQueries({ queryKey: ['hr-appraisal'] })
    },
  })
}
