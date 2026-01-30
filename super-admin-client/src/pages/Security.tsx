/**
 * Centre de Sécurité - Super Admin
 *
 * Fonctionnalités :
 * - Sessions actives : Liste, révocation individuelle/globale
 * - IP Whitelist : Gestion des règles d'accès par IP
 * - API Keys : Création, révocation des clés API
 * - Alertes : Surveillance et gestion des incidents de sécurité
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Shield,
  Monitor,
  Globe,
  Key,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Trash2,
  Plus,
  Copy,
  Check,
  X,
  Eye,
  EyeOff,
  Clock,
  MapPin,
  User,
  Ban,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { api } from '@/lib/api/gateway'
import { useToast } from '@/hooks/useToast'

type TabType = 'overview' | 'sessions' | 'ip-whitelist' | 'api-keys' | 'alerts'

interface Session {
  id: number
  user_id: number
  user_name: string
  user_login: string
  ip_address: string
  device_info: string
  location: string
  created_at: string
  last_activity: string
  is_current: boolean
}

interface IPRule {
  id: number
  name: string
  ip_address: string
  ip_type: 'single' | 'range'
  is_active: boolean
  sequence: number
  user_ids: Array<{ id: number; name: string }>
  valid_from: string | null
  valid_until: string | null
  notes: string | null
}

interface APIKey {
  id: number
  name: string
  key_prefix: string
  description: string | null
  user_id: number
  user_name: string
  tenant_id: number | null
  tenant_name: string | null
  scope: 'read' | 'write' | 'admin'
  rate_limit: number
  is_active: boolean
  created_at: string
  expires_at: string | null
  last_used_at: string | null
  usage_count: number
}

interface SecurityAlert {
  id: number
  name: string
  alert_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'new' | 'acknowledged' | 'investigating' | 'resolved' | 'false_positive'
  ip_address: string | null
  user_id: number | null
  user_name: string | null
  created_at: string
  description: string | null
  auto_action_taken: string | null
}

interface SecuritySummary {
  alerts: {
    total: number
    by_severity: { critical: number; high: number; medium: number; low: number }
    by_status: { new: number; acknowledged: number; investigating: number; resolved: number }
  }
  sessions: { active: number }
  ip_whitelist: { enabled: boolean; rules_count: number }
  api_keys: { active: number; used_today: number }
}

export function Security() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const queryClient = useQueryClient()
  const toast = useToast()

  const tabs = [
    { id: 'overview' as const, name: 'Vue d\'ensemble', icon: Shield },
    { id: 'sessions' as const, name: 'Sessions', icon: Monitor },
    { id: 'ip-whitelist' as const, name: 'IP Whitelist', icon: Globe },
    { id: 'api-keys' as const, name: 'Clés API', icon: Key },
    { id: 'alerts' as const, name: 'Alertes', icon: AlertTriangle },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Centre de Sécurité</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Gestion des sessions, accès et alertes de sécurité
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && <SecurityOverview />}
      {activeTab === 'sessions' && <SessionsTab />}
      {activeTab === 'ip-whitelist' && <IPWhitelistTab />}
      {activeTab === 'api-keys' && <APIKeysTab />}
      {activeTab === 'alerts' && <AlertsTab />}
    </div>
  )
}

// =============================================================================
// OVERVIEW TAB
// =============================================================================

function SecurityOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ['security-summary'],
    queryFn: async () => {
      const response = await api.request<SecuritySummary>({
        method: 'GET',
        path: '/api/super-admin/security/summary',
      })
      return response.data
    },
    refetchInterval: 30000, // Refresh every 30s
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  const alertsData = data?.alerts
  const criticalAlerts = alertsData?.by_severity?.critical || 0
  const newAlerts = alertsData?.by_status?.new || 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Sessions Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {data?.sessions?.active || 0}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Sessions actives</p>
      </div>

      {/* IP Whitelist Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            data?.ip_whitelist?.enabled
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
          }`}>
            {data?.ip_whitelist?.enabled ? 'Actif' : 'Inactif'}
          </span>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {data?.ip_whitelist?.rules_count || 0}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Règles IP</p>
      </div>

      {/* API Keys Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Key className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {data?.api_keys?.active || 0}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Clés actives ({data?.api_keys?.used_today || 0} utilisées aujourd&apos;hui)
        </p>
      </div>

      {/* Alerts Card */}
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border ${
        criticalAlerts > 0
          ? 'border-red-300 dark:border-red-700'
          : 'border-gray-200 dark:border-gray-700'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg ${
            criticalAlerts > 0
              ? 'bg-red-100 dark:bg-red-900/30'
              : 'bg-amber-100 dark:bg-amber-900/30'
          }`}>
            <AlertTriangle className={`w-5 h-5 ${
              criticalAlerts > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-amber-600 dark:text-amber-400'
            }`} />
          </div>
          {newAlerts > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {newAlerts} nouvelles
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {alertsData?.total || 0}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Alertes (24h) - {criticalAlerts} critiques
        </p>
      </div>
    </div>
  )
}

// =============================================================================
// SESSIONS TAB
// =============================================================================

function SessionsTab() {
  const queryClient = useQueryClient()
  const toast = useToast()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: async () => {
      const response = await api.request<{ data: Session[] }>({
        method: 'GET',
        path: '/api/super-admin/sessions',
      })
      return response.data
    },
  })

  const revokeSession = useMutation({
    mutationFn: async (sessionId: number) => {
      return api.request({
        method: 'POST',
        path: `/api/super-admin/sessions/${sessionId}/revoke`,
      })
    },
    onSuccess: () => {
      toast.success('Session révoquée')
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] })
    },
    onError: () => {
      toast.error('Erreur lors de la révocation')
    },
  })

  const revokeUserSessions = useMutation({
    mutationFn: async (userId: number) => {
      return api.request({
        method: 'POST',
        path: `/api/super-admin/sessions/revoke-user/${userId}`,
      })
    },
    onSuccess: (_data, _variables) => {
      toast.success('Toutes les sessions révoquées')
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] })
    },
    onError: () => {
      toast.error('Erreur lors de la révocation')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  const sessions = data?.data || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {sessions.length} session(s) active(s)
        </p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Utilisateur</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">IP / Appareil</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Dernière activité</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sessions.map((session) => (
              <tr key={session.id} className={session.is_current ? 'bg-teal-50/50 dark:bg-teal-900/10' : ''}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {session.user_name}
                        {session.is_current && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 rounded-full">
                            Vous
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{session.user_login}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    {session.ip_address}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{session.device_info}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    {session.last_activity ? new Date(session.last_activity).toLocaleString('fr-FR') : '-'}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => revokeUserSessions.mutate(session.user_id)}
                      disabled={session.is_current}
                      className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Révoquer toutes les sessions"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => revokeSession.mutate(session.id)}
                      disabled={session.is_current}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Révoquer cette session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sessions.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Aucune session active
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// IP WHITELIST TAB
// =============================================================================

function IPWhitelistTab() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [showAddModal, setShowAddModal] = useState(false)
  const [newRule, setNewRule] = useState({ name: '', ip_address: '', notes: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['ip-whitelist'],
    queryFn: async () => {
      const response = await api.request<{ data: IPRule[]; status: { enabled: boolean }; current_ip: string }>({
        method: 'GET',
        path: '/api/super-admin/ip-whitelist',
      })
      return response.data
    },
  })

  const createRule = useMutation({
    mutationFn: async (rule: { name: string; ip_address: string; notes?: string }) => {
      return api.request({
        method: 'POST',
        path: '/api/super-admin/ip-whitelist',
        body: rule,
      })
    },
    onSuccess: () => {
      toast.success('Règle créée')
      setShowAddModal(false)
      setNewRule({ name: '', ip_address: '', notes: '' })
      queryClient.invalidateQueries({ queryKey: ['ip-whitelist'] })
    },
    onError: () => {
      toast.error('Erreur lors de la création')
    },
  })

  const deleteRule = useMutation({
    mutationFn: async (ruleId: number) => {
      return api.request({
        method: 'DELETE',
        path: `/api/super-admin/ip-whitelist/${ruleId}`,
      })
    },
    onSuccess: () => {
      toast.success('Règle supprimée')
      queryClient.invalidateQueries({ queryKey: ['ip-whitelist'] })
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  const rules = data?.data || []
  const currentIp = data?.current_ip

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {rules.length} règle(s) configurée(s)
          </p>
          {currentIp && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Votre IP actuelle : <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{currentIp}</code>
            </p>
          )}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter une règle
        </button>
      </div>

      {/* Warning if no rules */}
      {rules.length === 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-300">Mode permissif activé</p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Aucune règle IP configurée. Tous les accès sont autorisés. Ajoutez des règles pour restreindre l&apos;accès.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">IP / CIDR</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 dark:text-white">{rule.name}</p>
                  {rule.notes && <p className="text-xs text-gray-500 dark:text-gray-400">{rule.notes}</p>}
                </td>
                <td className="px-4 py-3">
                  <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{rule.ip_address}</code>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    rule.ip_type === 'range'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {rule.ip_type === 'range' ? 'Plage CIDR' : 'IP unique'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {rule.is_active ? (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      Actif
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <XCircle className="w-4 h-4" />
                      Inactif
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => deleteRule.mutate(rule.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rules.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Aucune règle configurée
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ajouter une règle IP</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="Bureau principal"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse IP ou CIDR</label>
                <input
                  type="text"
                  value={newRule.ip_address}
                  onChange={(e) => setNewRule({ ...newRule, ip_address: e.target.value })}
                  placeholder="192.168.1.0/24 ou 10.0.0.1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optionnel)</label>
                <textarea
                  value={newRule.notes}
                  onChange={(e) => setNewRule({ ...newRule, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={() => createRule.mutate(newRule)}
                disabled={!newRule.name || !newRule.ip_address}
                className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// API KEYS TAB
// =============================================================================

function APIKeysTab() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [showAddModal, setShowAddModal] = useState(false)
  const [newKey, setNewKey] = useState<{ name: string; scope: 'read' | 'write' | 'admin'; description: string }>({ name: '', scope: 'read', description: '' })
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const response = await api.request<{ data: APIKey[] }>({
        method: 'GET',
        path: '/api/super-admin/api-keys',
      })
      return response.data
    },
  })

  const createKey = useMutation({
    mutationFn: async (keyData: { name: string; scope: string; description?: string }) => {
      return api.request<{ api_key: string }>({
        method: 'POST',
        path: '/api/super-admin/api-keys',
        body: keyData,
      })
    },
    onSuccess: (response) => {
      const apiKey = (response.data as { api_key?: string })?.api_key
      if (apiKey) {
        setGeneratedKey(apiKey)
      }
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
    onError: () => {
      toast.error('Erreur lors de la création')
    },
  })

  const revokeKey = useMutation({
    mutationFn: async (keyId: number) => {
      return api.request({
        method: 'POST',
        path: `/api/super-admin/api-keys/${keyId}/revoke`,
      })
    },
    onSuccess: () => {
      toast.success('Clé révoquée')
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
    onError: () => {
      toast.error('Erreur lors de la révocation')
    },
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  const keys = data?.data || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {keys.filter(k => k.is_active).length} clé(s) active(s)
        </p>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle clé
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom / Préfixe</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Scope</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Utilisations</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Dernière utilisation</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {keys.map((key) => (
              <tr key={key.id} className={!key.is_active ? 'opacity-50' : ''}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 dark:text-white">{key.name}</p>
                  <code className="text-xs text-gray-500 dark:text-gray-400">{key.key_prefix}...</code>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    key.scope === 'admin'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : key.scope === 'write'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {key.scope}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {key.usage_count}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {key.last_used_at ? new Date(key.last_used_at).toLocaleString('fr-FR') : 'Jamais'}
                </td>
                <td className="px-4 py-3 text-right">
                  {key.is_active && (
                    <button
                      onClick={() => revokeKey.mutate(key.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      title="Révoquer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {keys.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Aucune clé API
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && !generatedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Nouvelle clé API</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
                <input
                  type="text"
                  value={newKey.name}
                  onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                  placeholder="Mon intégration"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scope</label>
                <select
                  value={newKey.scope}
                  onChange={(e) => setNewKey({ ...newKey, scope: e.target.value as 'read' | 'write' | 'admin' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="read">Lecture seule</option>
                  <option value="write">Lecture + Écriture</option>
                  <option value="admin">Administration</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (optionnel)</label>
                <textarea
                  value={newKey.description}
                  onChange={(e) => setNewKey({ ...newKey, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={() => createKey.mutate(newKey)}
                disabled={!newKey.name}
                className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Key Modal */}
      {generatedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Clé API créée</h3>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Copiez cette clé maintenant. Elle ne sera <strong>plus jamais affichée</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
              <code className="flex-1 text-sm text-gray-900 dark:text-white break-all">{generatedKey}</code>
              <button
                onClick={() => copyToClipboard(generatedKey)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
              >
                {copiedKey ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setGeneratedKey(null)
                  setShowAddModal(false)
                  setNewKey({ name: '', scope: 'read', description: '' })
                }}
                className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// ALERTS TAB
// =============================================================================

function AlertsTab() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['security-alerts', statusFilter, severityFilter],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (severityFilter !== 'all') params.severity = severityFilter

      const response = await api.request<{ data: SecurityAlert[]; summary: SecuritySummary['alerts'] }>({
        method: 'GET',
        path: '/api/super-admin/security/alerts',
        params,
      })
      return response.data
    },
    refetchInterval: 30000,
  })

  const acknowledgeAlert = useMutation({
    mutationFn: async (alertId: number) => {
      return api.request({
        method: 'POST',
        path: `/api/super-admin/security/alerts/${alertId}/acknowledge`,
      })
    },
    onSuccess: () => {
      toast.success('Alerte prise en compte')
      queryClient.invalidateQueries({ queryKey: ['security-alerts'] })
    },
    onError: () => {
      toast.error('Erreur')
    },
  })

  const resolveAlert = useMutation({
    mutationFn: async ({ alertId, isFalsePositive }: { alertId: number; isFalsePositive?: boolean }) => {
      return api.request({
        method: 'POST',
        path: `/api/super-admin/security/alerts/${alertId}/resolve`,
        body: { is_false_positive: isFalsePositive },
      })
    },
    onSuccess: () => {
      toast.success('Alerte résolue')
      queryClient.invalidateQueries({ queryKey: ['security-alerts'] })
    },
    onError: () => {
      toast.error('Erreur')
    },
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'acknowledged': return <Eye className="w-4 h-4 text-amber-500" />
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'false_positive': return <XCircle className="w-4 h-4 text-gray-500" />
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  const alerts = data?.data || []
  const summary = data?.summary

  return (
    <div className="space-y-4">
      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.by_severity?.critical || 0}</p>
            <p className="text-xs text-red-700 dark:text-red-300">Critiques</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{summary.by_severity?.high || 0}</p>
            <p className="text-xs text-orange-700 dark:text-orange-300">Élevées</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{summary.by_severity?.medium || 0}</p>
            <p className="text-xs text-amber-700 dark:text-amber-300">Moyennes</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{summary.by_severity?.low || 0}</p>
            <p className="text-xs text-gray-700 dark:text-gray-300">Faibles</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="all">Tous les statuts</option>
          <option value="new">Nouvelles</option>
          <option value="acknowledged">Prises en compte</option>
          <option value="resolved">Résolues</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="all">Toutes les sévérités</option>
          <option value="critical">Critiques</option>
          <option value="high">Élevées</option>
          <option value="medium">Moyennes</option>
          <option value="low">Faibles</option>
        </select>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`bg-white dark:bg-gray-800 rounded-xl border p-4 ${
              alert.severity === 'critical'
                ? 'border-red-300 dark:border-red-700'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {getStatusIcon(alert.status)}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white">{alert.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {alert.alert_type}
                    </span>
                  </div>
                  {alert.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {alert.ip_address && <span>IP: {alert.ip_address}</span>}
                    {alert.user_name && <span>User: {alert.user_name}</span>}
                    <span>{new Date(alert.created_at).toLocaleString('fr-FR')}</span>
                  </div>
                  {alert.auto_action_taken && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Action automatique: {alert.auto_action_taken}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              {alert.status === 'new' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => acknowledgeAlert.mutate(alert.id)}
                    className="px-3 py-1 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg"
                  >
                    Prendre en compte
                  </button>
                  <button
                    onClick={() => resolveAlert.mutate({ alertId: alert.id })}
                    className="px-3 py-1 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                  >
                    Résoudre
                  </button>
                  <button
                    onClick={() => resolveAlert.mutate({ alertId: alert.id, isFalsePositive: true })}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Faux positif
                  </button>
                </div>
              )}
              {alert.status === 'acknowledged' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => resolveAlert.mutate({ alertId: alert.id })}
                    className="px-3 py-1 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                  >
                    Résoudre
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {alerts.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Aucune alerte
          </div>
        )}
      </div>
    </div>
  )
}
