/**
 * Page Programmation Backups Automatiques
 *
 * Fonctionnalités :
 * 1. Liste des schedules par tenant
 * 2. Création schedule (tenant + fréquence + rétention)
 * 3. Modification schedule (activer/désactiver)
 * 4. Suppression schedule
 * 5. Exécution manuelle immédiate ("Run now")
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  Plus,
  Play,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
  X,
} from 'lucide-react'
import { api } from '@/lib/api/gateway'
import { BackupSchedulesResponseSchema, TenantsResponseSchema, validateApiResponse } from '@/lib/validators'
import type { BackupScheduleRecord, BackupSchedulesResponse, TenantsResponse } from '@/lib/validators'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ToastContainer'

export function BackupSchedules() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [_editingSchedule, setEditingSchedule] = useState<BackupScheduleRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BackupScheduleRecord | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    tenant_id: 0,
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    day_of_week: 1,
    day_of_month: 1,
    hour: 2,
    minute: 0,
    retention_count: 7,
    notification_email: '',
    enabled: true,
  })

  // Fetch schedules
  const { data: schedulesData, isLoading } = useQuery({
    queryKey: ['super-admin-backup-schedules'],
    queryFn: async () => {
      const response = await api.request<BackupSchedulesResponse>({
        method: 'GET',
        path: '/api/super-admin/backup-schedules',
      })
      return validateApiResponse(BackupSchedulesResponseSchema, response.data)
    },
    refetchInterval: 30000, // Rafraîchir toutes les 30s
  })

  // Fetch tenants pour dropdown
  const { data: tenantsData } = useQuery({
    queryKey: ['super-admin-tenants'],
    queryFn: async () => {
      const response = await api.request<TenantsResponse>({
        method: 'GET',
        path: '/api/super-admin/tenants',
      })
      return validateApiResponse(TenantsResponseSchema, response.data)
    }
  })

  const schedules = schedulesData?.data || []
  const tenants = tenantsData?.data || []

  // Tenants sans schedule actif
  const tenantsWithoutSchedule = tenants.filter(
    t => !schedules.some(s => s.tenant_id === t.id && s.enabled)
  )

  // Create schedule
  const createSchedule = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.request({
        method: 'POST',
        path: '/api/super-admin/backup-schedules',
        body: data,
      })
    },
    onSuccess: async () => {
      toast.success('Programmation créée avec succès')
      setShowCreateModal(false)
      resetForm()
      await queryClient.refetchQueries({ queryKey: ['super-admin-backup-schedules'] })
    },
    onError: () => {
      toast.error('Erreur lors de la création')
    },
  })

  // Update schedule
  const updateSchedule = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<typeof formData> }) => {
      return api.request({
        method: 'PUT',
        path: `/api/super-admin/backup-schedules/${id}`,
        body: data,
      })
    },
    onSuccess: async () => {
      toast.success('Programmation mise à jour')
      setEditingSchedule(null)
      await queryClient.refetchQueries({ queryKey: ['super-admin-backup-schedules'] })
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  // Delete schedule
  const deleteSchedule = useMutation({
    mutationFn: async (id: number) => {
      return api.request({
        method: 'DELETE',
        path: `/api/super-admin/backup-schedules/${id}`,
      })
    },
    onSuccess: async () => {
      toast.success('Programmation supprimée')
      setDeleteTarget(null)
      await queryClient.refetchQueries({ queryKey: ['super-admin-backup-schedules'] })
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    },
  })

  // Run now
  const runNow = useMutation({
    mutationFn: async (id: number) => {
      return api.request({
        method: 'POST',
        path: `/api/super-admin/backup-schedules/${id}/run-now`,
      })
    },
    onSuccess: async () => {
      toast.success('Backup lancé immédiatement')
      await queryClient.refetchQueries({ queryKey: ['super-admin-backups'] })
    },
    onError: () => {
      toast.error('Erreur lors du lancement')
    },
  })

  const resetForm = () => {
    setFormData({
      tenant_id: 0,
      frequency: 'daily',
      day_of_week: 1,
      day_of_month: 1,
      hour: 2,
      minute: 0,
      retention_count: 7,
      notification_email: '',
      enabled: true,
    })
  }

  const handleCreate = () => {
    if (!formData.tenant_id) {
      toast.error('Veuillez sélectionner un tenant')
      return
    }
    createSchedule.mutate(formData)
  }

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'daily': return 'Quotidien'
      case 'weekly': return 'Hebdomadaire'
      case 'monthly': return 'Mensuel'
      default: return freq
    }
  }

  const formatNextRun = (nextRun: string | null) => {
    if (!nextRun) return '—'
    return new Date(nextRun).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Programmation Backups Automatiques
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {schedules.length} programmations • {schedules.filter(s => s.enabled).length} actives
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            disabled={tenantsWithoutSchedule.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Programmation
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Aucune programmation configurée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Fréquence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Heure
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Rétention
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Prochaine Exec
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Dernier Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {schedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        {schedule.enabled ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-400" />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {schedule.tenant_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {getFrequencyLabel(schedule.frequency)}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-400">
                        {schedule.hour.toString().padStart(2, '0')}:{schedule.minute.toString().padStart(2, '0')}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-400">
                        {schedule.retention_count} backups
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatNextRun(schedule.next_run)}
                      </td>
                      <td className="px-6 py-4">
                        {schedule.last_status === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <CheckCircle className="w-3 h-3" />
                            Succès
                          </span>
                        ) : schedule.last_status === 'failed' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                            <XCircle className="w-3 h-3" />
                            Échec
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => runNow.mutate(schedule.id)}
                            disabled={!schedule.enabled || runNow.isPending}
                            className="p-2 text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 disabled:opacity-50"
                            title="Exécuter maintenant"
                          >
                            {runNow.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => updateSchedule.mutate({ id: schedule.id, data: { enabled: !schedule.enabled }})}
                            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                            title={schedule.enabled ? 'Désactiver' : 'Activer'}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(schedule)}
                            className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Nouvelle Programmation
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Tenant */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tenant
                  </label>
                  <select
                    value={formData.tenant_id}
                    onChange={(e) => setFormData({ ...formData, tenant_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={0}>Sélectionner un tenant</option>
                    {tenantsWithoutSchedule.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fréquence */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fréquence
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as typeof formData.frequency })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="daily">Quotidien</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuel</option>
                  </select>
                </div>

                {/* Heure */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Heure
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={formData.hour}
                      onChange={(e) => setFormData({ ...formData, hour: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Minute
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={formData.minute}
                      onChange={(e) => setFormData({ ...formData, minute: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Rétention */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rétention (nombre de backups à conserver)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={formData.retention_count}
                    onChange={(e) => setFormData({ ...formData, retention_count: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Email notification */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email notification (optionnel)
                  </label>
                  <input
                    type="email"
                    value={formData.notification_email}
                    onChange={(e) => setFormData({ ...formData, notification_email: e.target.value })}
                    placeholder="admin@example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreate}
                  disabled={createSchedule.isPending || !formData.tenant_id}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {createSchedule.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <ConfirmModal
            isOpen={true}
            onClose={() => setDeleteTarget(null)}
            onConfirm={() => deleteSchedule.mutate(deleteTarget.id)}
            title="Confirmer la suppression"
            message={`Êtes-vous sûr de vouloir supprimer la programmation pour ${deleteTarget.tenant_name} ?`}
            confirmText="Supprimer"
            variant="danger"
            isLoading={deleteSchedule.isPending}
          />
        )}
      </div>
    </>
  )
}
