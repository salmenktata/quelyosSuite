/**
 * Présences - Suivi du pointage et temps de travail
 *
 * Fonctionnalités :
 * - KPIs temps réel (effectif, présents, sur site, absents)
 * - Liste des pointages du jour avec check-in/check-out
 * - Actions de pointage manuel pour les employés
 * - Rafraîchissement des données
 */
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button } from '@/components/common'
import { useMyTenant } from '@/hooks/useMyTenant'
import { useTodayAttendance, useCheckIn, useCheckOut } from '@/hooks/hr'
import { hrNotices } from '@/lib/notices'
import {
  Clock,
  UserCheck,
  UserX,
  Users,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'

export default function AttendancePage() {
  const { tenant } = useMyTenant()
  const { data: todayData, isLoading, isError, refetch } = useTodayAttendance(tenant?.id || null)
  const { mutate: checkIn } = useCheckIn()
  const { mutate: checkOut } = useCheckOut()

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-24" />
            ))}
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
            { label: 'RH', href: '/hr' },
            { label: 'Présences' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Présences
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {todayData?.date
                ? new Date(todayData.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : "Aujourd'hui"}
            </p>
          </div>
          <Button
            variant="secondary"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => refetch()}
          >
            Actualiser
          </Button>
        </div>

        {/* PageNotice */}
        <PageNotice config={hrNotices.attendance} className="mb-2" />

        {/* Error State */}
        {isError && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement des présences.
              </p>
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => refetch()}
              >
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard
            title="Effectif total"
            value={todayData?.totalEmployees || 0}
            icon={Users}
            color="gray"
          />
          <KPICard
            title="Présents aujourd'hui"
            value={todayData?.presentToday || 0}
            icon={UserCheck}
            color="emerald"
          />
          <KPICard
            title="Actuellement sur site"
            value={todayData?.currentlyIn || 0}
            icon={Clock}
            color="cyan"
          />
          <KPICard
            title="Absents"
            value={todayData?.absent || 0}
            icon={UserX}
            color="red"
          />
        </div>

        {/* Liste des pointages */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pointages du jour
            </h2>
          </div>

          {todayData?.attendances && todayData.attendances.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 text-left text-sm text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 font-medium">Employé</th>
                  <th className="px-4 py-3 font-medium">Entrée</th>
                  <th className="px-4 py-3 font-medium">Sortie</th>
                  <th className="px-4 py-3 font-medium">Durée</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {todayData.attendances.map(att => (
                  <tr key={att.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 text-sm font-semibold">
                          {att.employee_name?.charAt(0)}
                        </div>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {att.employee_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {att.check_in
                        ? new Date(att.check_in).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {att.check_out
                        ? new Date(att.check_out).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                      {att.worked_hours ? `${att.worked_hours.toFixed(1)}h` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {!att.check_out && att.check_in && tenant?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => checkOut({ tenant_id: tenant.id, employee_id: att.employee_id })}
                        >
                          Sortie
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center">
              <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Aucun pointage enregistré aujourd'hui
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

function KPICard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: 'gray' | 'emerald' | 'cyan' | 'red'
}) {
  const colorClasses = {
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  )
}
