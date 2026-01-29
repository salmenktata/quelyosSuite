import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Contract {
  id: number
  name: string
  employee_id: number
  employee_name: string
  department_id: number | null
  department_name: string | null
  job_id: number | null
  job_title: string | null
  job_name?: string | null
  contract_type: 'cdi' | 'cdd' | 'stage' | 'interim' | 'apprenticeship' | 'freelance'
  contract_type_label: string
  date_start: string
  date_end: string | null
  trial_date_end: string | null
  wage: number
  wage_type: 'monthly' | 'hourly'
  currency: string
  schedule_pay: string
  hours_per_week: number
  time_type: 'full' | 'part'
  state: 'draft' | 'open' | 'close' | 'cancel'
  state_label: string
  notes: string
  advantages: string
}

export interface ContractFilters {
  tenant_id: number
  employee_id?: number
  department_id?: number
  contract_type?: string
  state?: string
  search?: string
  limit?: number
  offset?: number
}

export interface CreateContractData {
  tenant_id: number
  employee_id: number
  contract_type: string
  date_start: string
  wage: number
  date_end?: string
  trial_date_end?: string
  department_id?: number
  job_id?: number
  wage_type?: string
  schedule_pay?: string
  hours_per_week?: number
  time_type?: string
  notes?: string
  advantages?: string
}

export function useContracts(filters: ContractFilters) {
  return useQuery({
    queryKey: ['hr-contracts', filters],
    queryFn: async () => {
      const response = await api.post<{
        success: boolean
        error?: string
        contracts: Contract[]
        total: number
      }>('/api/hr/contracts', filters)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement')
      }

      return {
        contracts: response.data.contracts,
        total: response.data.total,
      }
    },
    enabled: !!filters.tenant_id,
  })
}

export function useContract(contractId: number | null) {
  return useQuery({
    queryKey: ['hr-contract', contractId],
    queryFn: async () => {
      if (!contractId) return null

      const response = await api.post<{
        success: boolean
        error?: string
        contract: Contract
      }>(`/api/hr/contracts/${contractId}`, {})

      if (!response.data.success) {
        throw new Error(response.data.error || 'Contrat introuvable')
      }

      return response.data.contract
    },
    enabled: !!contractId,
  })
}

export function useCreateContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateContractData) => {
      const response = await api.post<{
        success: boolean
        error?: string
        contract: Contract
      }>('/api/hr/contracts/create', data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la création')
      }

      return response.data.contract
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-contracts'] })
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] })
      queryClient.invalidateQueries({ queryKey: ['hr-dashboard'] })
    },
  })
}

export function useUpdateContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateContractData> }) => {
      const response = await api.post<{
        success: boolean
        error?: string
        contract: Contract
      }>(`/api/hr/contracts/${id}/update`, data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la mise à jour')
      }

      return response.data.contract
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['hr-contracts'] })
      queryClient.invalidateQueries({ queryKey: ['hr-contract', id] })
    },
  })
}

export function useOpenContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{
        success: boolean
        error?: string
        contract: Contract
      }>(`/api/hr/contracts/${id}/open`, {})

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.contract
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['hr-contracts'] })
      queryClient.invalidateQueries({ queryKey: ['hr-contract', id] })
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] })
    },
  })
}

export function useCloseContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{
        success: boolean
        error?: string
        contract: Contract
      }>(`/api/hr/contracts/${id}/close`, {})

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return response.data.contract
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['hr-contracts'] })
      queryClient.invalidateQueries({ queryKey: ['hr-contract', id] })
    },
  })
}

export function useExpiringContracts(tenantId: number | null, days = 30) {
  return useQuery({
    queryKey: ['hr-expiring-contracts', tenantId, days],
    queryFn: async () => {
      if (!tenantId) return { contracts: [], total: 0 }

      const response = await api.post<{
        success: boolean
        error?: string
        contracts: Contract[]
        total: number
      }>('/api/hr/contracts/expiring', { tenant_id: tenantId, days })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }

      return {
        contracts: response.data.contracts,
        total: response.data.total,
      }
    },
    enabled: !!tenantId,
  })
}
