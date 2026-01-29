import { useQuery } from '@tanstack/react-query'
import { useDepartments } from './useDepartments'
import { useEmployees } from './useEmployees'
import { useTodayAttendance } from './useAttendance'
import { usePendingLeaves } from './useLeaves'
import { useExpiringContracts } from './useContracts'

export interface HRDashboardData {
  totalEmployees: number
  activeEmployees: number
  departmentsCount: number
  presentToday: number
  currentlyIn: number
  absent: number
  pendingLeaves: number
  expiringContracts: number
  employeesByDepartment: Array<{
    department: string
    count: number
    color: number
  }>
  employeesByStatus: Array<{
    status: string
    label: string
    count: number
  }>
  contractsByType: Array<{
    type: string
    label: string
    count: number
  }>
  recentActivity: Array<{
    type: 'hire' | 'leave' | 'departure' | 'contract'
    message: string
    date: string
  }>
}

export function useHRDashboard(tenantId: number | null) {
  // Fetch all data in parallel
  const employeesQuery = useEmployees({ tenant_id: tenantId || 0, limit: 1000 })
  const departmentsQuery = useDepartments(tenantId)
  const todayAttendanceQuery = useTodayAttendance(tenantId)
  const pendingLeavesQuery = usePendingLeaves(tenantId)
  const expiringContractsQuery = useExpiringContracts(tenantId, 30)

  const isLoading =
    employeesQuery.isLoading ||
    departmentsQuery.isLoading ||
    todayAttendanceQuery.isLoading ||
    pendingLeavesQuery.isLoading ||
    expiringContractsQuery.isLoading

  const isError =
    employeesQuery.isError ||
    departmentsQuery.isError

  // Compute dashboard data
  const dashboardData: HRDashboardData | null = tenantId ? {
    totalEmployees: employeesQuery.data?.total || 0,
    activeEmployees: employeesQuery.data?.employees.filter(e => e.state === 'active').length || 0,
    departmentsCount: departmentsQuery.data?.total || 0,
    presentToday: todayAttendanceQuery.data?.presentToday || 0,
    currentlyIn: todayAttendanceQuery.data?.currentlyIn || 0,
    absent: todayAttendanceQuery.data?.absent || 0,
    pendingLeaves: pendingLeavesQuery.data?.total || 0,
    expiringContracts: expiringContractsQuery.data?.total || 0,
    employeesByDepartment: computeEmployeesByDepartment(
      employeesQuery.data?.employees || [],
      departmentsQuery.data?.departments || []
    ),
    employeesByStatus: computeEmployeesByStatus(employeesQuery.data?.employees || []),
    contractsByType: computeContractsByType(employeesQuery.data?.employees || []),
    recentActivity: [], // Would need additional API endpoint
  } : null

  return {
    data: dashboardData,
    isLoading,
    isError,
    employees: employeesQuery.data?.employees || [],
    departments: departmentsQuery.data?.departments || [],
    todayAttendance: todayAttendanceQuery.data,
    pendingLeaves: pendingLeavesQuery.data?.leaves || [],
    expiringContracts: expiringContractsQuery.data?.contracts || [],
  }
}

function computeEmployeesByDepartment(
  employees: Array<{ department_id: number | null; department_name: string | null; state: string }>,
  departments: Array<{ id: number; name: string; color: number }>
) {
  const activeEmployees = employees.filter(e => e.state === 'active')
  const deptMap = new Map<number, { name: string; count: number; color: number }>()

  // Initialize with all departments
  departments.forEach(d => {
    deptMap.set(d.id, { name: d.name, count: 0, color: d.color })
  })

  // Add "Non assigné" for employees without department
  let unassignedCount = 0

  // Count employees
  activeEmployees.forEach(e => {
    if (e.department_id) {
      const dept = deptMap.get(e.department_id)
      if (dept) {
        dept.count++
      }
    } else {
      unassignedCount++
    }
  })

  const result = Array.from(deptMap.values())
    .filter(d => d.count > 0)
    .map(d => ({
      department: d.name,
      count: d.count,
      color: d.color,
    }))
    .sort((a, b) => b.count - a.count)

  if (unassignedCount > 0) {
    result.push({ department: 'Non assigné', count: unassignedCount, color: 0 })
  }

  return result
}

function computeEmployeesByStatus(
  employees: Array<{ state: string }>
) {
  const statusLabels: Record<string, string> = {
    active: 'Actif',
    suspended: 'Suspendu',
    departed: 'Parti',
  }

  const counts = employees.reduce((acc, e) => {
    acc[e.state] = (acc[e.state] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(counts).map(([status, count]) => ({
    status,
    label: statusLabels[status] || status,
    count,
  }))
}

function computeContractsByType(
  employees: Array<{ contract?: { contract_type: string; contract_type_label: string } | null }>
) {
  const typeLabels: Record<string, string> = {
    cdi: 'CDI',
    cdd: 'CDD',
    stage: 'Stage',
    interim: 'Intérim',
    apprenticeship: 'Apprentissage',
    freelance: 'Freelance',
  }

  const counts = employees.reduce((acc, e) => {
    if (e.contract) {
      const type = e.contract.contract_type
      acc[type] = (acc[type] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  return Object.entries(counts).map(([type, count]) => ({
    type,
    label: typeLabels[type] || type,
    count,
  }))
}

// Hook for specific KPIs
export function useHRKPIs(tenantId: number | null) {
  return useQuery({
    queryKey: ['hr-kpis', tenantId],
    queryFn: async () => {
      // This could be a dedicated API endpoint for better performance
      // For now, we'll compute from other queries
      return null
    },
    enabled: false, // Disabled until API endpoint exists
  })
}
