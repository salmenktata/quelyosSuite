/**
 * Page Alertes Sécurité
 *
 * - Liste des alertes avec filtres (sévérité, statut)
 * - Summary 24h en cartes KPI
 * - Actions : acknowledge, resolve
 * - Auto-refresh 30s
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldAlert, CheckCircle, Eye, AlertTriangle, Shield, Clock } from 'lucide-react'
import { api } from '@/lib/api/gateway'
import type { SecurityAlert, SecurityAlertsSummary } from '@/lib/validators'

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  low: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  acknowledged: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  resolved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
}

export function SecurityAlerts() {
  const queryClient = useQueryClient()
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['security-alerts', severityFilter, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (severityFilter !== 'all') params.severity = severityFilter
      if (statusFilter !== 'all') params.status = statusFilter

      const response = await api.request<{ data: SecurityAlert[]; summary?: SecurityAlertsSummary }>({
        method: 'GET',
        path: '/api/super-admin/security/alerts',
        params,
      })
      return response.data
    },
    refetchInterval: 30_000,
  })

  const alerts = alertsData?.data || []
  const summary = alertsData?.summary

  const acknowledgeMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.request({ method: 'POST', path: `/api/super-admin/security/alerts/${id}/acknowledge` })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-alerts'] })
    },
  })

  const resolveMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.request({ method: 'POST', path: `/api/super-admin/security/alerts/${id}/resolve` })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-alerts'] })
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Alertes Sécurité</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Surveillance et gestion des alertes de sécurité</p>
      </div>

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Total 24h"
            value={summary.total_24h}
            icon={ShieldAlert}
            color="text-gray-600 dark:text-gray-300"
          />
          <SummaryCard
            label="Critiques"
            value={summary.critical_count}
            icon={AlertTriangle}
            color="text-red-600 dark:text-red-400"
          />
          <SummaryCard
            label="Non résolues"
            value={summary.unresolved_count}
            icon={Clock}
            color="text-orange-600 dark:text-orange-400"
          />
          <SummaryCard
            label="Résolues"
            value={summary.resolved_count}
            icon={CheckCircle}
            color="text-green-600 dark:text-green-400"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        >
          <option value="all">Toutes sévérités</option>
          <option value="critical">Critique</option>
          <option value="high">Haute</option>
          <option value="medium">Moyenne</option>
          <option value="low">Basse</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        >
          <option value="all">Tous statuts</option>
          <option value="active">Active</option>
          <option value="acknowledged">Acquittée</option>
          <option value="resolved">Résolue</option>
        </select>
      </div>

      {/* Alerts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center">
            <Shield className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="text-gray-500 dark:text-gray-400">Aucune alerte pour les filtres sélectionnés</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sévérité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                      {alert.alert_type?.replace(/_/g, ' ') || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${SEVERITY_STYLES[alert.severity] || ''}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                      {alert.message}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[alert.status] || ''}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {alert.created_at ? new Date(alert.created_at).toLocaleString('fr-FR') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {alert.status === 'active' && (
                          <button
                            onClick={() => acknowledgeMutation.mutate(alert.id)}
                            disabled={acknowledgeMutation.isPending}
                            className="px-2.5 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors disabled:opacity-50"
                            title="Acquitter"
                          >
                            <Eye className="w-3.5 h-3.5 inline mr-1" />
                            Acquitter
                          </button>
                        )}
                        {alert.status !== 'resolved' && (
                          <button
                            onClick={() => resolveMutation.mutate(alert.id)}
                            disabled={resolveMutation.isPending}
                            className="px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
                            title="Résoudre"
                          >
                            <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                            Résoudre
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon, color }: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  )
}
