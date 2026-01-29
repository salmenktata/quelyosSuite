import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface SkillType {
  id: number
  name: string
  color: string
  skill_count: number
}

export interface Skill {
  id: number
  name: string
  description: string
  skill_type_id: number
  skill_type_name: string
  skill_type_color: string
}

export interface EmployeeSkill {
  id: number
  employee_id: number
  skill_id: number
  skill_name: string
  skill_type_id: number
  skill_type_name: string
  skill_type_color: string
  level: string
  level_label: string
  level_progress: number
}

export function useSkillTypes(tenantId: number | null) {
  return useQuery({
    queryKey: ['hr-skill-types', tenantId],
    queryFn: async () => {
      if (!tenantId) return []

      const response = await api.post<{
        success: boolean
        error?: string
        skill_types: SkillType[]
      }>('/api/hr/skill-types', { tenant_id: tenantId })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.skill_types
    },
    enabled: !!tenantId,
  })
}

export function useSkills(tenantId: number | null, skillTypeId?: number) {
  return useQuery({
    queryKey: ['hr-skills', tenantId, skillTypeId],
    queryFn: async () => {
      if (!tenantId) return []

      const params: Record<string, unknown> = { tenant_id: tenantId }
      if (skillTypeId) params.skill_type_id = skillTypeId

      const response = await api.post<{
        success: boolean
        error?: string
        skills: Skill[]
      }>('/api/hr/skills', params)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.skills
    },
    enabled: !!tenantId,
  })
}

export function useEmployeeSkills(employeeId: number | null) {
  return useQuery({
    queryKey: ['hr-employee-skills', employeeId],
    queryFn: async () => {
      if (!employeeId) return []

      const response = await api.post<{
        success: boolean
        error?: string
        employee_skills: EmployeeSkill[]
      }>(`/api/hr/employees/${employeeId}/skills`, {})

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.employee_skills
    },
    enabled: !!employeeId,
  })
}

export function useUpdateEmployeeSkills() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      employeeId,
      skills,
    }: {
      employeeId: number
      skills: Array<{ skill_id: number; level: string; level_progress: number }>
    }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        employee_skills: EmployeeSkill[]
      }>(`/api/hr/employees/${employeeId}/skills/update`, { skills })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.employee_skills
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hr-employee-skills', variables.employeeId] })
    },
  })
}

export function useCreateSkillType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { tenant_id: number; name: string; color?: string }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        skill_type: SkillType
      }>('/api/hr/skill-types/create', data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.skill_type
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-skill-types'] })
    },
  })
}

export function useCreateSkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      tenant_id: number
      name: string
      skill_type_id: number
      description?: string
    }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        skill: Skill
      }>('/api/hr/skills/create', data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.skill
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-skills'] })
      queryClient.invalidateQueries({ queryKey: ['hr-skill-types'] })
    },
  })
}
