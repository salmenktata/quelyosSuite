/**
 * Employés - Liste et gestion des employés
 *
 * Fonctionnalités :
 * - Liste des employés en vue grille ou liste
 * - Recherche par nom, matricule, email
 * - Filtrage par département et statut
 * - Affichage du statut de présence en temps réel
 * - Accès rapide aux fiches employés
 */
import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common'
import { useMyTenant } from '@/hooks/useMyTenant'
import { useEmployees, useDepartments, type Employee } from '@/hooks/hr'
import { hrNotices } from '@/lib/notices'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Mail,
  Phone,
  Building2,
  MoreVertical,
  UserCheck,
  UserX,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

export default function EmployeesPage() {
  const navigate = useNavigate()
  const { tenant } = useMyTenant()
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<number | undefined>()
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { data: employeesData, isLoading, isError } = useEmployees({
    tenant_id: tenant?.id || 0,
    department_id: departmentFilter,
    state: statusFilter,
    search: search || undefined,
    limit: 100,
  })

  const { data: departmentsData } = useDepartments(tenant?.id || null)

  const employees = employeesData?.employees || []
  const departments = departmentsData?.departments || []

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <SkeletonTable rows={10} columns={6} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'RH', href: '/hr' },
            { label: 'Employés' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Employés
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {employeesData?.total || 0} employés au total
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/hr/employees/new')}
          >
            Nouvel employé
          </Button>
        </div>

        {/* PageNotice */}
        <PageNotice config={hrNotices.employees} className="mb-2" />

        {/* Error State */}
        {isError && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement des employés.
              </p>
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => window.location.reload()}
              >
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500"
            />
          </div>

          <select
            value={departmentFilter || ''}
            onChange={(e) => setDepartmentFilter(e.target.value ? Number(e.target.value) : undefined)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="">Tous les départements</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>

          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="suspended">Suspendu</option>
            <option value="departed">Parti</option>
          </select>

          <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600' : 'bg-white dark:bg-gray-800 text-gray-500'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600' : 'bg-white dark:bg-gray-800 text-gray-500'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {employees.map(employee => (
              <EmployeeCard key={employee.id} employee={employee} onClick={() => navigate(`/hr/employees/${employee.id}`)} />
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 text-left text-sm text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 font-medium">Employé</th>
                  <th className="px-4 py-3 font-medium">Département</th>
                  <th className="px-4 py-3 font-medium">Poste</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Présence</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {employees.map(employee => (
                  <tr
                    key={employee.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/30 cursor-pointer"
                    onClick={() => navigate(`/hr/employees/${employee.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 font-semibold">
                          {employee.first_name?.[0]}{employee.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {employee.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {employee.employee_number}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {employee.department_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {employee.job_title || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={employee.state} />
                    </td>
                    <td className="px-4 py-3">
                      <AttendanceBadge state={employee.attendance_state} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {employee.work_email && (
                          <a
                            href={`mailto:${employee.work_email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                        )}
                        {employee.mobile_phone && (
                          <a
                            href={`tel:${employee.mobile_phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state */}
        {employees.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun employé trouvé
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {search || departmentFilter || statusFilter
                ? 'Modifiez vos filtres pour voir plus de résultats'
                : 'Commencez par ajouter votre premier employé'}
            </p>
            {!search && !departmentFilter && !statusFilter && (
              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => navigate('/hr/employees/new')}
              >
                Ajouter un employé
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

// Components
function EmployeeCard({ employee, onClick }: { employee: Employee; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 font-semibold text-lg">
          {employee.first_name?.[0]}{employee.last_name?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {employee.name}
            </h3>
            <AttendanceBadge state={employee.attendance_state} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {employee.employee_number}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {employee.job_title && (
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            {employee.job_title}
          </p>
        )}
        {employee.department_name && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Building2 className="w-4 h-4" />
            {employee.department_name}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <StatusBadge status={employee.state} />
        <div className="flex items-center gap-1">
          {employee.work_email && (
            <a
              href={`mailto:${employee.work_email}`}
              onClick={(e) => e.stopPropagation()}
              className="p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg transition-colors"
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
          {employee.mobile_phone && (
            <a
              href={`tel:${employee.mobile_phone}`}
              onClick={(e) => e.stopPropagation()}
              className="p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg transition-colors"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    suspended: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    departed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
  }
  const labels = {
    active: 'Actif',
    suspended: 'Suspendu',
    departed: 'Parti',
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || styles.active}`}>
      {labels[status as keyof typeof labels] || status}
    </span>
  )
}

function AttendanceBadge({ state }: { state: string }) {
  if (state === 'checked_in') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
        <UserCheck className="w-3 h-3" />
        Présent
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
      <UserX className="w-3 h-3" />
      Absent
    </span>
  )
}
