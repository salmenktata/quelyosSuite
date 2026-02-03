/**
 * TeamManagement — Gestion des permissions utilisateur par le Manager
 *
 * Fonctionnalités :
 * - Liste des utilisateurs du tenant avec leurs permissions
 * - Configuration des niveaux d'accès par module (aucun/lecture/complet)
 * - Drill-down par module pour permissions par page
 * - Invitation de nouveaux utilisateurs
 * - Suppression d'un utilisateur du tenant
 * - Badge Manager / User sur chaque membre
 * - Support dark/light mode complet
 */
import { useState, useEffect, useCallback } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button } from '@/components/common'
import { usePermissions } from '@/hooks/usePermissions'
import { tokenService } from '@/lib/tokenService'
import {
  MODULE_PAGES,
  MODULE_LABELS,
  ACCESS_LEVEL_LABELS,
  type AccessLevel,
  type ModulePageConfig,
} from '@/config/module-pages'
import type { ModuleId } from '@/config/modules'
import {
  Users,
  Shield,
  ChevronDown,
  ChevronRight,
  UserPlus,
  Trash2,
  Eye,
  Edit3,
  Lock,
  Crown,
  AlertTriangle,
  Check,
  X,
  Loader2,
} from 'lucide-react'
import { getBackendUrl } from '@quelyos/config'

const API_BASE = import.meta.env.VITE_BACKEND_URL || getBackendUrl(import.meta.env.MODE as any)

interface TeamMember {
  id: number
  name: string
  email: string
  login: string
  is_manager: boolean
  groups: string[]
  permissions: Record<string, { level: AccessLevel; pages: Record<string, string> }>
  created_at: string | null
}

interface InviteFormData {
  email: string
  name: string
  permissions: Record<string, { level: AccessLevel; pages: Record<string, AccessLevel> }>
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = tokenService.getAccessToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {}),
    },
    credentials: 'include',
  })
  return res.json()
}

function _AccessLevelBadge({ level }: { level: AccessLevel }) {
  const styles = {
    none: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
    read: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    full: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  }
  const icons = {
    none: <Lock className="w-3 h-3" />,
    read: <Eye className="w-3 h-3" />,
    full: <Edit3 className="w-3 h-3" />,
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${styles[level]}`}>
      {icons[level]}
      {ACCESS_LEVEL_LABELS[level]}
    </span>
  )
}

function AccessLevelSelect({
  value,
  onChange,
  disabled,
}: {
  value: AccessLevel
  onChange: (v: AccessLevel) => void
  disabled?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as AccessLevel)}
      disabled={disabled}
      className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 disabled:opacity-50"
    >
      <option value="none">{ACCESS_LEVEL_LABELS.none}</option>
      <option value="read">{ACCESS_LEVEL_LABELS.read}</option>
      <option value="full">{ACCESS_LEVEL_LABELS.full}</option>
    </select>
  )
}

export default function TeamManagement() {
  const { isTenantManager, isSuperAdmin } = usePermissions()
  const [team, setTeam] = useState<TeamMember[]>([])
  const [planModules, setPlanModules] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<number | null>(null)
  const [expandedUser, setExpandedUser] = useState<number | null>(null)
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState<InviteFormData>({
    email: '',
    name: '',
    permissions: {},
  })
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ success: boolean; temp_password?: string; error?: string } | null>(null)
  const [editingPermissions, setEditingPermissions] = useState<Record<string, { level: AccessLevel; pages: Record<string, AccessLevel> }>>({})
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null)

  const canManage = isTenantManager() || isSuperAdmin()

  // Modules visibles = filtrés par le plan du tenant (si disponible)
  const allModuleIds = Object.keys(MODULE_LABELS) as ModuleId[]
  const visibleModules: ModuleId[] = allModuleIds.filter(
    (moduleId) => planModules.length === 0 || planModules.includes(moduleId)
  )

  const loadTeam = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<{ success: boolean; team: TeamMember[]; plan_modules?: string[]; error?: string }>('/api/tenant/team')
      if (data.success) {
        setTeam(data.team)
        if (data.plan_modules) setPlanModules(data.plan_modules)
      } else {
        setError(data.error || 'Erreur de chargement')
      }
    } catch {
      setError('Impossible de charger la liste des membres')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (canManage) {
      loadTeam()
    }
  }, [canManage, loadTeam])

  const handleExpandUser = (userId: number) => {
    if (expandedUser === userId) {
      setExpandedUser(null)
      setEditingPermissions({})
      setExpandedModule(null)
    } else {
      setExpandedUser(userId)
      const member = team.find((m) => m.id === userId)
      if (member) {
        // Initialiser les permissions d'édition
        const perms: typeof editingPermissions = {}
        for (const mod of visibleModules) {
          const existing = member.permissions[mod]
          perms[mod] = {
            level: (existing?.level as AccessLevel) || 'none',
            pages: (existing?.pages as Record<string, AccessLevel>) || {},
          }
        }
        setEditingPermissions(perms)
      }
    }
  }

  const handleModuleLevelChange = (moduleId: string, level: AccessLevel) => {
    setEditingPermissions((prev) => ({
      ...prev,
      [moduleId]: { ...(prev[moduleId] || { level: 'none', pages: {} }), level },
    }))
  }

  const handlePageLevelChange = (moduleId: string, pageId: string, level: AccessLevel) => {
    setEditingPermissions((prev) => ({
      ...prev,
      [moduleId]: {
        ...(prev[moduleId] || { level: 'none', pages: {} }),
        pages: { ...prev[moduleId]?.pages, [pageId]: level },
      },
    }))
  }

  const handleSavePermissions = async (userId: number) => {
    setSaving(userId)
    try {
      const data = await apiFetch<{ success: boolean; error?: string }>(
        `/api/tenant/team/${userId}/permissions`,
        {
          method: 'POST',
          body: JSON.stringify({ permissions: editingPermissions }),
        }
      )
      if (data.success) {
        await loadTeam()
        setExpandedUser(null)
        setEditingPermissions({})
      } else {
        setError(data.error || 'Erreur lors de la sauvegarde')
      }
    } catch {
      setError('Erreur lors de la sauvegarde des permissions')
    } finally {
      setSaving(null)
    }
  }

  const handleInvite = async () => {
    if (!inviteForm.email) return
    setInviteLoading(true)
    setInviteResult(null)
    try {
      const data = await apiFetch<{ success: boolean; user?: { temp_password: string }; error?: string }>(
        '/api/tenant/team/invite',
        {
          method: 'POST',
          body: JSON.stringify(inviteForm),
        }
      )
      if (data.success && data.user) {
        setInviteResult({ success: true, temp_password: data.user.temp_password })
        await loadTeam()
      } else {
        setInviteResult({ success: false, error: data.error || 'Erreur' })
      }
    } catch {
      setInviteResult({ success: false, error: 'Erreur de connexion' })
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRemoveUser = async (userId: number) => {
    try {
      const data = await apiFetch<{ success: boolean; error?: string }>(
        `/api/tenant/team/${userId}`,
        { method: 'DELETE' }
      )
      if (data.success) {
        setConfirmRemove(null)
        await loadTeam()
      } else {
        setError(data.error || 'Erreur lors de la suppression')
      }
    } catch {
      setError('Erreur lors de la suppression')
    }
  }

  if (!canManage) {
    return (
      <Layout>
        <div className="p-6">
          <Breadcrumbs items={[{ label: 'Paramètres', path: '/settings' }, { label: 'Équipe' }]} />
          <div className="mt-8 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Accès réservé</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {`Seuls les managers peuvent gérer l'équipe.`}
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <Breadcrumbs items={[{ label: 'Paramètres', path: '/settings' }, { label: 'Équipe' }]} />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion de l&apos;équipe</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {`Gérez les accès et permissions des membres de votre équipe`}
            </p>
          </div>
          <Button
            onClick={() => {
              setShowInvite(true)
              setInviteForm({ email: '', name: '', permissions: {} })
              setInviteResult(null)
            }}
            className="gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Inviter
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Invite Modal */}
        {showInvite && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inviter un membre</h3>
              <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nom complet"
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permissions initiales</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {visibleModules.map((moduleId) => (
                  <div key={moduleId} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{MODULE_LABELS[moduleId]}</span>
                    <AccessLevelSelect
                      value={inviteForm.permissions[moduleId]?.level || 'none'}
                      onChange={(level) =>
                        setInviteForm((f) => ({
                          ...f,
                          permissions: { ...f.permissions, [moduleId]: { level, pages: {} } },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {inviteResult && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  inviteResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}
              >
                {inviteResult.success ? (
                  <div>
                    <p className="font-medium">Utilisateur invité avec succès !</p>
                    <p className="mt-1">
                      Mot de passe temporaire : <code className="font-mono bg-white dark:bg-gray-800 px-1 rounded">{inviteResult.temp_password}</code>
                    </p>
                    <p className="text-xs mt-1 opacity-75">Communiquez ce mot de passe de manière sécurisée.</p>
                  </div>
                ) : (
                  inviteResult.error
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowInvite(false)}>
                Annuler
              </Button>
              <Button onClick={handleInvite} disabled={inviteLoading || !inviteForm.email}>
                {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span className="ml-1">Inviter</span>
              </Button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}

        {/* Team List */}
        {!loading && team.length > 0 && (
          <div className="space-y-3">
            {team.map((member) => (
              <div
                key={member.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
              >
                {/* Member Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  onClick={() => !member.is_manager && handleExpandUser(member.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">{member.name}</span>
                        {member.is_manager && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                            <Crown className="w-3 h-3" />
                            Manager
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{member.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quick permission badges */}
                    {!member.is_manager && (
                      <div className="hidden md:flex items-center gap-1">
                        {visibleModules.slice(0, 5).map((moduleId) => {
                          const perm = member.permissions[moduleId]
                          const level = (perm?.level as AccessLevel) || 'none'
                          if (level === 'none') return null
                          return (
                            <span
                              key={moduleId}
                              className={`px-1.5 py-0.5 text-[10px] rounded ${
                                level === 'full'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}
                            >
                              {MODULE_LABELS[moduleId]}
                            </span>
                          )
                        })}
                      </div>
                    )}

                    {!member.is_manager && (
                      <>
                        {confirmRemove === member.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveUser(member.id)
                              }}
                              className="text-red-600 hover:text-red-700 dark:text-red-400"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setConfirmRemove(null)
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setConfirmRemove(member.id)
                            }}
                            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        {expandedUser === member.id ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded: Permissions Editor */}
                {expandedUser === member.id && !member.is_manager && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Permissions de {member.name}
                    </h4>

                    <div className="space-y-2">
                      {visibleModules.map((moduleId) => {
                        const perm = editingPermissions[moduleId]
                        const level = perm?.level || 'none'
                        const isExpanded = expandedModule === `${member.id}-${moduleId}`
                        const pages: ModulePageConfig[] = MODULE_PAGES[moduleId] || []

                        return (
                          <div key={moduleId} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between px-3 py-2">
                              <button
                                className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200"
                                onClick={() =>
                                  setExpandedModule(isExpanded ? null : `${member.id}-${moduleId}`)
                                }
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                )}
                                {MODULE_LABELS[moduleId]}
                              </button>
                              <AccessLevelSelect
                                value={level}
                                onChange={(v) => handleModuleLevelChange(moduleId, v)}
                              />
                            </div>

                            {isExpanded && level !== 'none' && pages.length > 0 && (
                              <div className="border-t border-gray-100 dark:border-gray-700 px-3 py-2 space-y-1">
                                {pages.map((page) => (
                                  <div key={page.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">{page.label}</span>
                                    <AccessLevelSelect
                                      value={(perm?.pages[page.id] as AccessLevel) || level}
                                      onChange={(v) => handlePageLevelChange(moduleId, page.id, v)}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setExpandedUser(null)
                          setEditingPermissions({})
                        }}
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={() => handleSavePermissions(member.id)}
                        disabled={saving === member.id}
                      >
                        {saving === member.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        <span className="ml-1">Enregistrer</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && team.length === 0 && !error && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aucun membre</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {`Invitez des membres pour commencer à collaborer`}
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
