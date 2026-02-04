/**
 * Congés - Gestion des demandes de congés
 *
 * Fonctionnalités :
 * - Liste des demandes de congés avec filtres
 * - Workflow de validation (approuver/refuser)
 * - Filtrage par statut et type de congé
 * - Visualisation détaillée des demandes
 * - Création de nouvelles demandes
 */
import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common'
import { useMyTenant } from '@/hooks/useMyTenant'
import { useLeaves, useApproveLeave, useRefuseLeave, useLeaveTypes, type Leave } from '@/hooks/hr'
import { hrNotices } from '@/lib/notices'
import { colorIndexToHex } from '@/lib/colorPalette'
import {
  CalendarOff,
  Plus,
  Check,
  X,
  Eye,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

export default function LeavesPage() {
  const { tenant } = useMyTenant()
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [typeFilter, setTypeFilter] = useState<number | undefined>()
  const [_showModal, setShowModal] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null)

  const { data: leavesData, isLoading, isError } = useLeaves({
    tenant_id: tenant?.id || 0,
    state: statusFilter,
    leave_type_id: typeFilter,
    limit: 100,
  })

  const { data: leaveTypes } = useLeaveTypes(tenant?.id || null)
  const { mutate: approveLeave, isPending: isApproving } = useApproveLeave()
  const { mutate: refuseLeave, isPending: isRefusing } = useRefuseLeave()

  const leaves = leavesData?.leaves || []

  const handleApprove = (leave: Leave) => {
    approveLeave(leave.id)
  }

  const handleRefuse = (leave: Leave) => {
    refuseLeave({ id: leave.id })
  }

  const getStateColor = (state: string) => {
    switch (state) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      case 'confirm':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      case 'validate1':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'validate':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'refuse':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'cancel':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <SkeletonTable rows={10} columns={5} />
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
            { label: 'Congés' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Demandes de congés
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {leavesData?.total || 0} demandes au total
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowModal(true)}
          >
            Nouvelle demande
          </Button>
        </div>

        {/* PageNotice */}
        <PageNotice config={hrNotices.leaves} className="mb-2" />

        {/* Error State */}
        {isError && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement des congés.
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
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="confirm">À approuver</option>
            <option value="validate1">1ère validation</option>
            <option value="validate">Approuvé</option>
            <option value="refuse">Refusé</option>
            <option value="cancel">Annulé</option>
          </select>

          <select
            value={typeFilter || ''}
            onChange={(e) => setTypeFilter(e.target.value ? Number(e.target.value) : undefined)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="">Tous les types</option>
            {leaveTypes?.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>

        {/* Liste des demandes */}
        {leaves.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 text-left text-sm text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 font-medium">Employé</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Période</th>
                  <th className="px-4 py-3 font-medium">Durée</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {leaves.map(leave => (
                  <tr key={leave.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 text-sm font-semibold">
                          {leave.employee_name?.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {leave.employee_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const colorHex = colorIndexToHex((leave as { leave_type_color?: number | string }).leave_type_color)
                        return (
                          <span
                            className="px-2 py-1 text-xs rounded-full"
                            style={{
                              backgroundColor: `${colorHex}20`,
                              color: colorHex,
                            }}
                          >
                            {leave.leave_type_name}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          {new Date(leave.date_from).toLocaleDateString('fr-FR')}
                          {' - '}
                          {new Date(leave.date_to).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                      {leave.number_of_days} jour{leave.number_of_days > 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStateColor(leave.state)}`}>
                        {leave.state_label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {(leave.state === 'confirm' || leave.state === 'validate1') && (
                          <>
                            <button
                              onClick={() => handleApprove(leave)}
                              disabled={isApproving}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded"
                              title="Approuver"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRefuse(leave)}
                              disabled={isRefusing}
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                              title="Refuser"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedLeave(leave)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty */}
        {leaves.length === 0 && (
          <div className="text-center py-12">
            <CalendarOff className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucune demande de congé
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {statusFilter || typeFilter
                ? 'Modifiez vos filtres pour voir plus de résultats'
                : 'Aucune demande trouvée'}
            </p>
          </div>
        )}

        {/* Modal détails */}
        {selectedLeave && (
          <LeaveDetailModal
            leave={selectedLeave}
            onClose={() => setSelectedLeave(null)}
            onApprove={() => handleApprove(selectedLeave)}
            onRefuse={() => handleRefuse(selectedLeave)}
          />
        )}
      </div>
    </Layout>
  )
}

function LeaveDetailModal({
  leave,
  onClose,
  onApprove,
  onRefuse,
}: {
  leave: Leave
  onClose: () => void
  onApprove: () => void
  onRefuse: () => void
}) {
  const canAction = leave.state === 'confirm' || leave.state === 'validate1'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Demande de congé
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 font-semibold">
              {leave.employee_name?.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{leave.employee_name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{leave.leave_type_name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Date début</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(leave.date_from).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Date fin</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(leave.date_to).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Durée</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {leave.number_of_days} jour{leave.number_of_days > 1 ? 's' : ''}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Statut</p>
              <p className="font-medium text-gray-900 dark:text-white">{leave.state_label}</p>
            </div>
          </div>

          {leave.notes && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Motif</p>
              <p className="text-gray-900 dark:text-white">{leave.notes}</p>
            </div>
          )}
        </div>

        {canAction && (
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onRefuse}
              className="flex-1 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg"
            >
              Refuser
            </button>
            <button
              onClick={onApprove}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
            >
              Approuver
            </button>
          </div>
        )}

        {!canAction && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
