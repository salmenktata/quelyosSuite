/**
 * Gestion des Groupes de Sécurité - Super Admin
 *
 * Fonctionnalités :
 * 1. Liste des groupes Quelyos organisés par module (User/Manager)
 * 2. Vue détaillée d'un groupe avec ses utilisateurs
 * 3. Ajout/retrait d'utilisateurs dans un groupe
 * 4. Matrice Groupes ↔ Plans (lecture seule)
 * 5. Filtrage par module/catégorie + recherche textuelle
 * 6. Vue tous les groupes système (mode avancé)
 */

import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Shield,
  ShieldCheck,
  Users,
  Search,
  ChevronRight,
  X,
  Plus,
  Loader2,
  RefreshCw,
  Filter,
  Package,
  UserPlus,
  UserMinus,
  AlertTriangle,
  Check,
  Building2,
  Clock,
  Grid3X3,
} from 'lucide-react'
import { api } from '@/lib/api/gateway'
import { useToast } from '@/hooks/useToast'
import { z } from 'zod'
import { validateApiResponse } from '@/lib/validators'
import { Breadcrumbs } from '@/components/common'

// --- Schemas Zod ---

const ImpliedGroupSchema = z.object({
  id: z.number(),
  name: z.string(),
})

const GroupPlanSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
})

const SecurityGroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  category: z.string(),
  is_quelyos: z.boolean(),
  users_count: z.number(),
  comment: z.string(),
  plans: z.array(GroupPlanSchema),
  implied_ids: z.array(ImpliedGroupSchema),
})

const PlanSummarySchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  group_count: z.number(),
})

const GroupsResponseSchema = z.object({
  success: z.boolean().optional(),
  error: z.string().optional(),
  data: z.array(SecurityGroupSchema).optional().default([]),
  plans: z.array(PlanSummarySchema).optional().default([]),
})

const GroupUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  login: z.string(),
  email: z.string(),
  active: z.boolean(),
  tenant_id: z.number().nullable(),
  tenant_name: z.string(),
  last_login: z.string().nullable(),
})

const GroupDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  comment: z.string(),
  implied_ids: z.array(ImpliedGroupSchema),
})

const GroupUsersResponseSchema = z.object({
  success: z.boolean(),
  group: GroupDetailSchema,
  users: z.array(GroupUserSchema),
  total: z.number(),
})

type SecurityGroup = z.infer<typeof SecurityGroupSchema>
type GroupUser = z.infer<typeof GroupUserSchema>
type PlanSummary = z.infer<typeof PlanSummarySchema>

type TabType = 'quelyos' | 'all' | 'matrix'

// --- Helpers ---

function getModuleFromGroupName(name: string): string | null {
  const modules = ['home', 'finance', 'store', 'stock', 'crm', 'marketing', 'hr', 'support', 'pos', 'maintenance']
  const lower = name.toLowerCase()
  for (const mod of modules) {
    if (lower.includes(mod)) return mod
  }
  return null
}

function getLevelBadge(name: string): { label: string; color: string } {
  const lower = name.toLowerCase()
  if (lower.includes('manager')) return { label: 'Manager', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' }
  if (lower.includes('technician')) return { label: 'Technicien', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' }
  if (lower.includes('user')) return { label: 'User', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' }
  return { label: 'Système', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' }
}

const MODULE_LABELS: Record<string, string> = {
  home: 'Accueil / CMS',
  finance: 'Finance',
  store: 'Boutique',
  stock: 'Stock',
  crm: 'CRM',
  marketing: 'Marketing',
  hr: 'Ressources Humaines',
  support: 'Support',
  pos: 'Caisse',
  maintenance: 'Maintenance / GMAO',
}

// --- Component ---

export function SecurityGroups() {
  const [activeTab, setActiveTab] = useState<TabType>('quelyos')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [showAddUser, setShowAddUser] = useState(false)
  const [addUserLogin, setAddUserLogin] = useState('')
  const queryClient = useQueryClient()
  const toast = useToast()

  // --- Queries ---

  const { data: groupsData, isLoading, error, refetch } = useQuery({
    queryKey: ['security-groups'],
    queryFn: async () => {
      const response = await api.request<z.infer<typeof GroupsResponseSchema>>({
        method: 'GET',
        path: '/api/super-admin/security-groups',
      })
      return validateApiResponse(GroupsResponseSchema, response.data)
    },
  })

  const { data: groupUsersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['security-group-users', selectedGroupId],
    queryFn: async () => {
      if (!selectedGroupId) return null
      const response = await api.request<z.infer<typeof GroupUsersResponseSchema>>({
        method: 'GET',
        path: `/api/super-admin/security-groups/${selectedGroupId}/users`,
      })
      return GroupUsersResponseSchema.parse(response.data)
    },
    enabled: !!selectedGroupId,
  })

  const { data: allUsersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await api.request<{ success: boolean; users: Array<{ id: number; name: string; login: string; email: string }> }>({
        method: 'GET',
        path: '/api/super-admin/users',
      })
      return response.data.users || []
    },
    enabled: showAddUser,
  })

  // --- Mutations ---

  const addUserMutation = useMutation({
    mutationFn: async ({ groupId, userIds }: { groupId: number; userIds: number[] }) => {
      return api.request({
        method: 'POST',
        path: `/api/super-admin/security-groups/${groupId}/users`,
        body: { action: 'add', user_ids: userIds },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-group-users', selectedGroupId] })
      queryClient.invalidateQueries({ queryKey: ['security-groups'] })
      toast.success('Utilisateur ajouté au groupe')
      setShowAddUser(false)
      setAddUserLogin('')
    },
    onError: () => {
      toast.error('Erreur lors de l\'ajout')
    },
  })

  const removeUserMutation = useMutation({
    mutationFn: async ({ groupId, userIds }: { groupId: number; userIds: number[] }) => {
      return api.request({
        method: 'POST',
        path: `/api/super-admin/security-groups/${groupId}/users`,
        body: { action: 'remove', user_ids: userIds },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-group-users', selectedGroupId] })
      queryClient.invalidateQueries({ queryKey: ['security-groups'] })
      toast.success('Utilisateur retiré du groupe')
    },
    onError: () => {
      toast.error('Erreur lors du retrait')
    },
  })

  // --- Computed ---

  const groups = groupsData?.data || []
  const plans = groupsData?.plans || []

  const quelyosGroups = useMemo(() => groups.filter(g => g.is_quelyos), [groups])

  const groupedByModule = useMemo(() => {
    const map: Record<string, SecurityGroup[]> = {}
    for (const g of quelyosGroups) {
      const mod = getModuleFromGroupName(g.name) || 'other'
      if (!map[mod]) map[mod] = []
      map[mod].push(g)
    }
    // Trier chaque module : user avant manager
    for (const mod of Object.keys(map)) {
      map[mod].sort((a, b) => {
        const aLevel = a.name.toLowerCase().includes('manager') ? 2 : a.name.toLowerCase().includes('technician') ? 1 : 0
        const bLevel = b.name.toLowerCase().includes('manager') ? 2 : b.name.toLowerCase().includes('technician') ? 1 : 0
        return aLevel - bLevel
      })
    }
    return map
  }, [quelyosGroups])

  const filteredGroups = useMemo(() => {
    let source = activeTab === 'quelyos' ? quelyosGroups : groups
    if (moduleFilter !== 'all' && activeTab === 'quelyos') {
      source = source.filter(g => getModuleFromGroupName(g.name) === moduleFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      source = source.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.full_name.toLowerCase().includes(q) ||
        g.comment.toLowerCase().includes(q)
      )
    }
    return source
  }, [groups, quelyosGroups, activeTab, moduleFilter, searchQuery])

  const availableModules = useMemo(() => {
    const mods = new Set<string>()
    for (const g of quelyosGroups) {
      const mod = getModuleFromGroupName(g.name)
      if (mod) mods.add(mod)
    }
    return Array.from(mods).sort()
  }, [quelyosGroups])

  // Utilisateurs disponibles pour ajout (pas déjà dans le groupe)
  const availableUsers = useMemo(() => {
    if (!allUsersData || !groupUsersData) return []
    const existingIds = new Set(groupUsersData.users.map(u => u.id))
    return allUsersData.filter(u => !existingIds.has(u.id))
  }, [allUsersData, groupUsersData])

  const filteredAvailableUsers = useMemo(() => {
    if (!addUserLogin.trim()) return availableUsers
    const q = addUserLogin.toLowerCase()
    return availableUsers.filter(u =>
      u.name.toLowerCase().includes(q) || u.login.toLowerCase().includes(q)
    )
  }, [availableUsers, addUserLogin])

  // --- Handlers ---

  const handleAddUser = useCallback((userId: number) => {
    if (!selectedGroupId) return
    addUserMutation.mutate({ groupId: selectedGroupId, userIds: [userId] })
  }, [selectedGroupId, addUserMutation])

  const handleRemoveUser = useCallback((userId: number) => {
    if (!selectedGroupId) return
    removeUserMutation.mutate({ groupId: selectedGroupId, userIds: [userId] })
  }, [selectedGroupId, removeUserMutation])

  // --- Breadcrumbs ---

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Groupes de Sécurité' },
  ]

  // --- Render ---

  if (error) {
    return (
      <div>
        <Breadcrumbs items={breadcrumbItems} />
        <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center" role="alert">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 dark:text-red-300">Erreur lors du chargement des groupes de sécurité</p>
          <button onClick={() => refetch()} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="flex items-center justify-between mt-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
            <Shield className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Groupes de Sécurité</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {quelyosGroups.length} groupes Quelyos · {groups.length} groupes totaux
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {([
          { key: 'quelyos' as const, label: 'Groupes Quelyos', icon: ShieldCheck },
          { key: 'all' as const, label: 'Tous les groupes', icon: Shield },
          { key: 'matrix' as const, label: 'Matrice Plans', icon: Grid3X3 },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSelectedGroupId(null) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Matrice Plans ↔ Groupes */}
      {activeTab === 'matrix' && (
        <MatrixView groups={quelyosGroups} plans={plans} groupedByModule={groupedByModule} />
      )}

      {/* Liste des groupes */}
      {activeTab !== 'matrix' && (
        <div className="flex gap-6">
          {/* Panel gauche : liste */}
          <div className={`${selectedGroupId ? 'w-1/2' : 'w-full'} transition-all`}>
            {/* Filtres */}
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un groupe..."
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              {activeTab === 'quelyos' && (
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={moduleFilter}
                    onChange={e => setModuleFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white appearance-none cursor-pointer focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">Tous les modules</option>
                    {availableModules.map(mod => (
                      <option key={mod} value={mod}>{MODULE_LABELS[mod] || mod}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                ))}
              </div>
            )}

            {/* Groups list */}
            {!isLoading && activeTab === 'quelyos' && moduleFilter === 'all' && !searchQuery.trim() ? (
              // Vue groupée par module
              <div className="space-y-6">
                {Object.entries(groupedByModule).sort(([a], [b]) => a.localeCompare(b)).map(([mod, modGroups]) => (
                  <div key={mod}>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
                      {MODULE_LABELS[mod] || mod} ({modGroups.length})
                    </h3>
                    <div className="space-y-1">
                      {modGroups.map(group => (
                        <GroupRow
                          key={group.id}
                          group={group}
                          isSelected={selectedGroupId === group.id}
                          onClick={() => setSelectedGroupId(selectedGroupId === group.id ? null : group.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : !isLoading && (
              // Vue plate filtrée
              <div className="space-y-1">
                {filteredGroups.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun groupe trouvé</p>
                  </div>
                )}
                {filteredGroups.map(group => (
                  <GroupRow
                    key={group.id}
                    group={group}
                    isSelected={selectedGroupId === group.id}
                    onClick={() => setSelectedGroupId(selectedGroupId === group.id ? null : group.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Panel droit : détail groupe */}
          {selectedGroupId && (
            <div className="w-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <GroupDetailPanel
                groupId={selectedGroupId}
                data={groupUsersData}
                isLoading={isLoadingUsers}
                onClose={() => setSelectedGroupId(null)}
                onAddUser={handleAddUser}
                onRemoveUser={handleRemoveUser}
                showAddUser={showAddUser}
                setShowAddUser={setShowAddUser}
                addUserLogin={addUserLogin}
                setAddUserLogin={setAddUserLogin}
                filteredAvailableUsers={filteredAvailableUsers}
                isAdding={addUserMutation.isPending}
                isRemoving={removeUserMutation.isPending}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// --- Sub-components ---

function GroupRow({ group, isSelected, onClick }: { group: SecurityGroup; isSelected: boolean; onClick: () => void }) {
  const badge = getLevelBadge(group.name)

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
        isSelected
          ? 'bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800'
          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
      }`}
    >
      <ShieldCheck className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {group.name}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
            {badge.label}
          </span>
        </div>
        {group.comment && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{group.comment}</p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <Users className="w-3.5 h-3.5" />
          {group.users_count}
        </div>
        {group.plans.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Package className="w-3.5 h-3.5" />
            {group.plans.length}
          </div>
        )}
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
      </div>
    </button>
  )
}

interface GroupDetailPanelProps {
  groupId: number
  data: z.infer<typeof GroupUsersResponseSchema> | null | undefined
  isLoading: boolean
  onClose: () => void
  onAddUser: (userId: number) => void
  onRemoveUser: (userId: number) => void
  showAddUser: boolean
  setShowAddUser: (v: boolean) => void
  addUserLogin: string
  setAddUserLogin: (v: string) => void
  filteredAvailableUsers: Array<{ id: number; name: string; login: string; email: string }>
  isAdding: boolean
  isRemoving: boolean
}

function GroupDetailPanel({
  data,
  isLoading,
  onClose,
  onAddUser,
  onRemoveUser,
  showAddUser,
  setShowAddUser,
  addUserLogin,
  setAddUserLogin,
  filteredAvailableUsers,
  isAdding,
  isRemoving,
}: GroupDetailPanelProps) {
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!data) return null

  const { group, users } = data

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-280px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{group.name}</h3>
          {group.comment && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{group.comment}</p>
          )}
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Héritages */}
      {group.implied_ids.length > 0 && (
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hérite de :</p>
          <div className="flex flex-wrap gap-1">
            {group.implied_ids.map(ig => (
              <span key={ig.id} className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                {ig.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Users header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Utilisateurs ({users.length})
        </span>
        <button
          onClick={() => setShowAddUser(!showAddUser)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-colors"
        >
          {showAddUser ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
          {showAddUser ? 'Annuler' : 'Ajouter'}
        </button>
      </div>

      {/* Add user form */}
      {showAddUser && (
        <div className="px-5 py-3 bg-teal-50 dark:bg-teal-900/10 border-b border-gray-200 dark:border-gray-700">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={addUserLogin}
              onChange={e => setAddUserLogin(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {filteredAvailableUsers.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">Aucun utilisateur disponible</p>
            )}
            {filteredAvailableUsers.slice(0, 10).map(user => (
              <button
                key={user.id}
                onClick={() => onAddUser(user.id)}
                disabled={isAdding}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors disabled:opacity-50"
              >
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.login}</p>
                </div>
                {isAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                ) : (
                  <Plus className="w-4 h-4 text-teal-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Users list */}
      <div className="flex-1 overflow-y-auto">
        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun utilisateur dans ce groupe</p>
          </div>
        )}
        {users.map(user => (
          <div
            key={user.id}
            className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                {!user.active && (
                  <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">Inactif</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span>{user.login}</span>
                {user.tenant_name && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {user.tenant_name}
                  </span>
                )}
                {user.last_login && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(user.last_login).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => onRemoveUser(user.id)}
              disabled={isRemoving}
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
              title="Retirer du groupe"
            >
              {isRemoving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Matrice Plans ↔ Groupes ---

function MatrixView({
  groups,
  plans,
  groupedByModule,
}: {
  groups: SecurityGroup[]
  plans: PlanSummary[]
  groupedByModule: Record<string, SecurityGroup[]>
}) {
  if (plans.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Aucun plan actif trouvé</p>
      </div>
    )
  }

  const moduleOrder = ['home', 'finance', 'store', 'stock', 'crm', 'marketing', 'hr', 'support', 'pos', 'maintenance']

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-48">
                Module / Groupe
              </th>
              {plans.map(plan => (
                <th key={plan.id} className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex flex-col items-center gap-1">
                    <span>{plan.name}</span>
                    <span className="text-[10px] font-normal text-gray-400">{plan.group_count} groupes</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {moduleOrder.map(mod => {
              const modGroups = groupedByModule[mod]
              if (!modGroups || modGroups.length === 0) return null

              return modGroups.map((group, idx) => (
                <tr key={group.id} className={`border-t border-gray-100 dark:border-gray-700/50 ${idx === 0 ? 'border-t-2 border-t-gray-200 dark:border-t-gray-600' : ''}`}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {idx === 0 && (
                        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase w-16">
                          {MODULE_LABELS[mod]?.split(' ')[0] || mod}
                        </span>
                      )}
                      {idx !== 0 && <span className="w-16" />}
                      <span className="text-sm text-gray-700 dark:text-gray-300">{group.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${getLevelBadge(group.name).color}`}>
                        {getLevelBadge(group.name).label}
                      </span>
                    </div>
                  </td>
                  {plans.map(plan => {
                    const hasGroup = group.plans.some(p => p.id === plan.id)
                    return (
                      <td key={plan.id} className="text-center px-4 py-2.5">
                        {hasGroup ? (
                          <Check className="w-5 h-5 text-teal-600 dark:text-teal-400 mx-auto" />
                        ) : (
                          <span className="block w-5 h-5 mx-auto text-gray-200 dark:text-gray-700">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
