/**
 * HR Dashboard - Tableau de bord Ressources Humaines
 *
 * Fonctionnalités :
 * - Affichage des KPIs RH (effectif, départements, présences, absents)
 * - Alertes pour congés en attente et contrats expirants
 * - Répartition des employés par département
 * - Liste des demandes de congés récentes
 * - Tableau des contrats arrivant à échéance
 */
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button } from '@/components/common'
import { useMyTenant } from '@/hooks/useMyTenant'
import { useHRDashboard } from '@/hooks/hr'
import { hrNotices } from '@/lib/notices'
import {
  Users,
  Building2,
  CalendarOff,
  FileText,
  AlertCircle,
  UserCheck,
  UserX,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function HRDashboard() {
  const navigate = useNavigate()
  const { tenant } = useMyTenant()
  const [now] = useState(() => Date.now())
  const {
    data: dashboardData,
    isLoading,
    isError,
    todayAttendance: _todayAttendance,
    pendingLeaves,
    expiringContracts,
  } = useHRDashboard(tenant?.id || null)

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              ))}
            </div>
          </div>
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
            { label: 'Ressources Humaines' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Ressources Humaines
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Vue d'ensemble de votre équipe
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
        <PageNotice config={hrNotices.dashboard} className="mb-2" />

        {/* Error State */}
        {isError && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div className="flex-1">
                <p className="text-red-800 dark:text-red-200">
                  Une erreur est survenue lors du chargement des données.
                </p>
              </div>
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

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Effectif total"
          value={dashboardData?.totalEmployees || 0}
          icon={Users}
          color="cyan"
          link="/hr/employees"
        />
        <KPICard
          title="Départements"
          value={dashboardData?.departmentsCount || 0}
          icon={Building2}
          color="violet"
          link="/hr/departments"
        />
        <KPICard
          title="Présents aujourd'hui"
          value={dashboardData?.presentToday || 0}
          subtitle={`${dashboardData?.currentlyIn || 0} actuellement sur site`}
          icon={UserCheck}
          color="emerald"
          link="/hr/attendance"
        />
        <KPICard
          title="Absents"
          value={dashboardData?.absent || 0}
          icon={UserX}
          color="red"
          link="/hr/leaves"
        />
      </div>

      {/* Alertes */}
      {((dashboardData?.pendingLeaves || 0) > 0 || (dashboardData?.expiringContracts || 0) > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(dashboardData?.pendingLeaves || 0) > 0 && (
            <AlertCard
              title="Demandes de congés en attente"
              count={dashboardData?.pendingLeaves || 0}
              icon={CalendarOff}
              color="amber"
              link="/hr/leaves"
              linkText="Voir les demandes"
            />
          )}
          {(dashboardData?.expiringContracts || 0) > 0 && (
            <AlertCard
              title="Contrats arrivant à échéance (30j)"
              count={dashboardData?.expiringContracts || 0}
              icon={FileText}
              color="orange"
              link="/hr/contracts"
              linkText="Voir les contrats"
            />
          )}
        </div>
      )}

      {/* Grilles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par département */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Répartition par département
          </h3>
          {dashboardData?.employeesByDepartment && dashboardData.employeesByDepartment.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.employeesByDepartment.slice(0, 6).map((dept, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">{dept.department}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{
                          width: `${Math.min(100, (dept.count / (dashboardData?.activeEmployees || 1)) * 100)}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                      {dept.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Aucune donnée disponible
            </p>
          )}
        </div>

        {/* Demandes en attente */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Demandes de congés récentes
            </h3>
            <Link
              to="/hr/leaves"
              className="text-cyan-600 hover:text-cyan-700 text-sm"
            >
              Voir tout
            </Link>
          </div>
          {pendingLeaves && pendingLeaves.length > 0 ? (
            <div className="space-y-3">
              {pendingLeaves.slice(0, 5).map((leave) => (
                <div
                  key={leave.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {leave.employee_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {leave.leave_type_name} • {leave.number_of_days} jour(s)
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    leave.state === 'confirm'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {leave.state_label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Aucune demande en attente
            </p>
          )}
        </div>
      </div>

      {/* Contrats expirants */}
      {expiringContracts && expiringContracts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Contrats arrivant à échéance
            </h3>
            <Link
              to="/hr/contracts"
              className="text-cyan-600 hover:text-cyan-700 text-sm"
            >
              Voir tout
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 font-medium">Employé</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Date fin</th>
                  <th className="pb-3 font-medium">Jours restants</th>
                </tr>
              </thead>
              <tbody>
                {expiringContracts.slice(0, 5).map((contract) => {
                  const daysLeft = contract.date_end
                    ? Math.ceil((new Date(contract.date_end).getTime() - now) / (1000 * 60 * 60 * 24))
                    : 0
                  return (
                    <tr key={contract.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <td className="py-3 text-gray-900 dark:text-white">
                        {contract.employee_name}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">
                        {contract.contract_type_label}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">
                        {contract.date_end ? new Date(contract.date_end).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          daysLeft <= 7
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : daysLeft <= 14
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {daysLeft} jours
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </Layout>
  )
}

// Components
interface KPICardProps {
  title: string
  value: number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  color: 'cyan' | 'violet' | 'emerald' | 'red' | 'amber' | 'orange'
  link: string
}

function KPICard({ title, value, subtitle, icon: Icon, color, link }: KPICardProps) {
  const colorClasses = {
    cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  }

  return (
    <Link
      to={link}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Link>
  )
}

interface AlertCardProps {
  title: string
  count: number
  icon: React.ComponentType<{ className?: string }>
  color: 'amber' | 'orange' | 'red'
  link: string
  linkText: string
}

function AlertCard({ title, count, icon: Icon, color, link, linkText }: AlertCardProps) {
  const colorClasses = {
    amber: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
    orange: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
    red: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
  }
  const iconClasses = {
    amber: 'text-amber-600 dark:text-amber-400',
    orange: 'text-orange-600 dark:text-orange-400',
    red: 'text-red-600 dark:text-red-400',
  }

  return (
    <div className={`rounded-xl p-4 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${iconClasses[color]}`} />
        <div className="flex-1">
          <p className="font-medium text-gray-900 dark:text-white">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {count}
          </p>
        </div>
        <Link
          to={link}
          className="text-sm text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
        >
          {linkText} →
        </Link>
      </div>
    </div>
  )
}
