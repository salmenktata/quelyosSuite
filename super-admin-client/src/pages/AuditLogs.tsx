/**
 * Page Audit Logs - Super Admin
 *
 * Fonctionnalités :
 * - Liste paginée des logs d'audit
 * - Filtres avancés (utilisateur, catégorie, sévérité, dates, recherche)
 * - Export CSV
 * - Statistiques et graphiques
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  FileText,
  Download,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Calendar,
  Globe,
} from 'lucide-react'
import { api } from '@/lib/api/gateway'

interface AuditLog {
  id: number
  timestamp: string
  user_id: number | null
  user_name: string
  user_login: string | null
  ip_address: string | null
  action: string
  category: string
  severity: string
  resource_type: string | null
  resource_id: number | null
  resource_name: string | null
  success: boolean
  error_message: string | null
  details: Record<string, unknown> | null
}

interface AuditLogsResponse {
  success: boolean
  total: number
  offset: number
  limit: number
  logs: AuditLog[]
}

interface AuditStats {
  success: boolean
  period_days: number
  total: number
  by_category: Record<string, number>
  by_severity: Record<string, number>
  by_success: Record<string, number>
  top_users: Array<{ name: string; count: number }>
  top_actions: Array<{ action: string; count: number }>
  timeline: Array<{ date: string; count: number }>
}

const CATEGORIES = [
  { value: '', label: 'Toutes catégories' },
  { value: 'auth', label: 'Authentification' },
  { value: 'data', label: 'Données' },
  { value: 'config', label: 'Configuration' },
  { value: 'admin', label: 'Administration' },
  { value: 'security', label: 'Sécurité' },
  { value: 'export', label: 'Export' },
  { value: 'other', label: 'Autre' },
]

const SEVERITIES = [
  { value: '', label: 'Toutes sévérités' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' },
]

export function AuditLogs() {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    severity: '',
    success: '',
    date_from: '',
    date_to: '',
  })
  const [offset, setOffset] = useState(0)
  const [showStats, setShowStats] = useState(false)
  const limit = 50

  // Fetch logs
  const { data: logsData, isLoading, refetch } = useQuery<AuditLogsResponse>({
    queryKey: ['audit-logs', filters, offset],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('offset', String(offset))
      params.set('limit', String(limit))
      if (filters.search) params.set('search', filters.search)
      if (filters.category) params.set('category', filters.category)
      if (filters.severity) params.set('severity', filters.severity)
      if (filters.success) params.set('success', filters.success)
      if (filters.date_from) params.set('date_from', filters.date_from)
      if (filters.date_to) params.set('date_to', filters.date_to)

      const response = await api.request<AuditLogsResponse>({
        method: 'GET',
        path: `/api/super-admin/audit-logs?${params.toString()}`,
      })
      return response.data
    },
    refetchInterval: 30000,
  })

  // Fetch stats
  const { data: statsData } = useQuery<AuditStats>({
    queryKey: ['audit-logs-stats'],
    queryFn: async () => {
      const response = await api.request<AuditStats>({
        method: 'GET',
        path: '/api/super-admin/audit-logs/stats?days=7',
      })
      return response.data
    },
    enabled: showStats,
  })

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.category) params.set('category', filters.category)
      if (filters.severity) params.set('severity', filters.severity)
      if (filters.date_from) params.set('date_from', filters.date_from)
      if (filters.date_to) params.set('date_to', filters.date_to)

      const response = await api.request<string>({
        method: 'GET',
        path: `/api/super-admin/audit-logs/export?${params.toString()}`,
      })

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      // SÉCURITÉ : Log erreur uniquement en dev
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console -- Error logging for CSV export failures in dev
        console.error('Export error:', error)
      }
      // TODO : Afficher notification utilisateur en cas d'erreur export
    }
  }

  const getSeverityBadge = (severity: string) => {
    const styles: Record<string, string> = {
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }
    return styles[severity] || styles.info
  }

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      auth: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      data: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      config: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      admin: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      security: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      export: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    }
    return styles[category] || styles.other
  }

  const totalPages = Math.ceil((logsData?.total || 0) / limit)
  const currentPage = Math.floor(offset / limit) + 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-teal-500" />
            Journal d&apos;Audit
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Traçabilité complète des actions système
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              showStats
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Stats
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats Panel */}
      {showStats && statsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total (7j)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statsData.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Succès</p>
            <p className="text-2xl font-bold text-green-600">{statsData.by_success?.['True'] || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Échecs</p>
            <p className="text-2xl font-bold text-red-600">{statsData.by_success?.['False'] || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Critical</p>
            <p className="text-2xl font-bold text-orange-600">{statsData.by_severity?.critical || 0}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-900 dark:text-white">Filtres</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value })
                  setOffset(0)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <select
            value={filters.category}
            onChange={(e) => {
              setFilters({ ...filters, category: e.target.value })
              setOffset(0)
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <select
            value={filters.severity}
            onChange={(e) => {
              setFilters({ ...filters, severity: e.target.value })
              setOffset(0)
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {SEVERITIES.map((sev) => (
              <option key={sev.value} value={sev.value}>{sev.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => {
              setFilters({ ...filters, date_from: e.target.value })
              setOffset(0)
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => {
              setFilters({ ...filters, date_to: e.target.value })
              setOffset(0)
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-500" />
            <p className="mt-2 text-gray-500">Chargement...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      <Calendar className="w-4 h-4 inline mr-1" />Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      <User className="w-4 h-4 inline mr-1" />Utilisateur
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Catégorie
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Sévérité
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Ressource
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      <Globe className="w-4 h-4 inline mr-1" />IP
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {logsData?.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="text-gray-900 dark:text-white">{log.user_name}</div>
                        {log.user_login && (
                          <div className="text-xs text-gray-500">{log.user_login}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                        {log.action}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getCategoryBadge(log.category)}`}>
                          {log.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getSeverityBadge(log.severity)}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {log.resource_type && (
                          <span>
                            {log.resource_type}
                            {log.resource_id && `:${log.resource_id}`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                        {log.ip_address || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {log.success ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <div className="flex items-center gap-1">
                            <XCircle className="w-5 h-5 text-red-500" />
                            {log.error_message && (
                              <span title={log.error_message}>
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {logsData?.total || 0} résultats - Page {currentPage} sur {totalPages || 1}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= (logsData?.total || 0)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
