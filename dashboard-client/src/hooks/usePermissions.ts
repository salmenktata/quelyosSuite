import { useAuth } from '@/lib/finance/compat/auth'
import { getCurrentEdition } from '@/lib/editionDetector'
import type { AccessLevel } from '@/config/module-pages'
import type { ModuleId } from '@/config/modules'

/**
 * Extrait le pageId à partir d'un chemin de route.
 * Ex: '/finance/accounts' → 'accounts', '/store/flash-sales' → 'flash-sales'
 * Routes spéciales: '/dashboard' → 'dashboard', '/analytics' → 'analytics'
 */
function pathToPageId(moduleId: ModuleId, path: string): string | null {
  if (!path) return null
  // Routes home spéciales (pas de préfixe /home/)
  if (moduleId === 'home') {
    if (path === '/dashboard') return 'dashboard'
    if (path === '/analytics') return 'analytics'
    if (path === '/dashboard/subscriptions') return 'subscriptions'
    if (path === '/settings') return 'settings'
    if (path === '/settings/security') return 'security'
    if (path === '/settings/team') return 'team'
    return null
  }
  // Routes standard: /<module>/<page>
  const prefix = `/${moduleId}/`
  if (path.startsWith(prefix)) {
    return path.slice(prefix.length).split('/')[0] ?? null
  }
  // Route racine du module: /<module> → 'dashboard'
  if (path === `/${moduleId}`) return 'dashboard'
  return null
}

/**
 * Hook pour vérifier les permissions utilisateur basées sur les groupes backend
 * et les permissions custom (Manager → User).
 *
 * Logique : Si des permissions custom existent → les utiliser.
 * Sinon → fallback sur les groupes backend (compatibilité existante).
 */
export function usePermissions() {
  const { user } = useAuth()

  const MODULE_GROUP_MAP: Record<ModuleId, string[]> = {
    'home': ['Quelyos Home User', 'Quelyos Home Manager'],
    'finance': ['Quelyos Finance User', 'Quelyos Finance Manager'],
    'invoicing': ['Quelyos Finance User', 'Quelyos Finance Manager'],
    'store': ['Quelyos Store User', 'Quelyos Store Manager'],
    'stock': ['Quelyos Stock User', 'Quelyos Stock Manager'],
    'crm': ['Quelyos CRM User', 'Quelyos CRM Manager'],
    'marketing': ['Quelyos Marketing User', 'Quelyos Marketing Manager'],
    'hr': ['Quelyos HR User', 'Quelyos HR Manager'],
    'pos': ['Quelyos POS User', 'Quelyos POS Manager'],
    'support': ['Quelyos Store User', 'Quelyos Store Manager'],
    'maintenance': ['Quelyos Maintenance User', 'Quelyos Maintenance Manager', 'Quelyos Maintenance Technician'],
  }

  // Récupérer les permissions custom depuis le profil utilisateur
  const permissions = user?.permissions ?? null
  const hasCustomPermissions = permissions !== null && Object.keys(permissions.modules).length > 0

  const hasGroup = (groupName: string): boolean => {
    if (!user || !user.groups) return false
    return user.groups.includes(groupName)
  }

  const isSuperAdmin = (): boolean => {
    if (!user || !user.groups) return false
    return user.groups.includes('Access Rights')
  }

  /**
   * Vérifie si l'utilisateur est Manager du tenant.
   * Basé sur les permissions custom ou les groupes Manager.
   */
  const isTenantManager = (): boolean => {
    if (permissions?.is_manager) return true
    if (!user || !user.groups) return false
    return user.groups.some(g => g.includes('Manager') && g.includes('Quelyos'))
  }

  /**
   * Retourne le niveau d'accès d'un module.
   * Priorité : permissions custom > groupes backend > aucun accès
   */
  const getAccessLevel = (moduleId: ModuleId): AccessLevel => {
    if (!user) return 'none'
    if (isSuperAdmin() || isTenantManager()) return 'full'

    // Permissions custom
    if (hasCustomPermissions && permissions) {
      const modulePerm = permissions.modules[moduleId]
      if (modulePerm) return (modulePerm.level as AccessLevel) || 'none'
      return 'none'
    }

    // Fallback groupes backend
    const requiredGroups = MODULE_GROUP_MAP[moduleId]
    if (!requiredGroups) return 'none'

    const hasManager = requiredGroups.some(g => g.includes('Manager') && user.groups.includes(g))
    if (hasManager) return 'full'

    const hasUser = requiredGroups.some(g => user.groups.includes(g))
    if (hasUser) return 'read'

    return 'none'
  }

  /**
   * Vérifie si l'utilisateur peut accéder à un module.
   * Combine filtrage édition + permissions.
   */
  const canAccessModule = (moduleId: ModuleId): boolean => {
    if (!user || !user.groups) return false

    // 1. Filtrage édition
    const edition = getCurrentEdition()
    if (!edition.modules.includes(moduleId)) return false

    // 2. Super-admin / Manager : accès complet
    if (isSuperAdmin() || isTenantManager()) return true

    // 3. Permissions custom
    if (hasCustomPermissions && permissions) {
      const modulePerm = permissions.modules[moduleId]
      return modulePerm !== undefined && (modulePerm.level as AccessLevel) !== 'none'
    }

    // 4. Fallback groupes backend
    const requiredGroups = MODULE_GROUP_MAP[moduleId]
    if (!requiredGroups) return false
    return requiredGroups.some(group => user.groups.includes(group))
  }

  /**
   * Vérifie si l'utilisateur peut accéder à une page spécifique dans un module.
   */
  const canAccessPage = (moduleId: ModuleId, pageId: string): boolean => {
    if (!user) return false
    if (isSuperAdmin() || isTenantManager()) return true

    // Sans permissions custom, toutes les pages du module sont accessibles
    if (!hasCustomPermissions || !permissions) {
      return canAccessModule(moduleId)
    }

    const modulePerm = permissions.modules[moduleId]
    if (!modulePerm || (modulePerm.level as AccessLevel) === 'none') return false

    // Vérifier les permissions par page si définies
    const pagePerms = modulePerm.pages
    if (pagePerms && Object.keys(pagePerms).length > 0) {
      const pageLevel = pagePerms[pageId] as AccessLevel | undefined
      if (pageLevel !== undefined) return pageLevel !== 'none'
    }

    // Si pas de permission spécifique par page, utiliser le niveau du module
    return (modulePerm.level as AccessLevel) !== 'none'
  }

  /**
   * Retourne le niveau d'accès d'une page spécifique.
   */
  const getPageAccessLevel = (moduleId: ModuleId, pageId: string): AccessLevel => {
    if (!user) return 'none'
    if (isSuperAdmin() || isTenantManager()) return 'full'

    if (!hasCustomPermissions || !permissions) {
      return getAccessLevel(moduleId)
    }

    const modulePerm = permissions.modules[moduleId]
    if (!modulePerm || (modulePerm.level as AccessLevel) === 'none') return 'none'

    const pagePerms = modulePerm.pages
    if (pagePerms && pagePerms[pageId] !== undefined) {
      return pagePerms[pageId] as AccessLevel
    }

    return modulePerm.level as AccessLevel
  }

  const isManager = (moduleId: ModuleId): boolean => {
    if (!user || !user.groups) return false
    const managerGroup = `Quelyos ${moduleId.charAt(0).toUpperCase() + moduleId.slice(1)} Manager`
    return user.groups.includes(managerGroup)
  }

  const getAccessibleModules = (): ModuleId[] => {
    const edition = getCurrentEdition()
    const allModules: ModuleId[] = ['home', 'finance', 'store', 'stock', 'crm', 'marketing', 'hr', 'pos', 'support', 'maintenance']
    const editionModules = allModules.filter(module => edition.modules.includes(module))
    if (isSuperAdmin() || isTenantManager()) return editionModules
    return editionModules.filter(module => canAccessModule(module))
  }

  /**
   * Vérifie si l'utilisateur peut accéder à une page via son chemin de route.
   */
  const canAccessPageByPath = (moduleId: ModuleId, path: string): boolean => {
    const pageId = pathToPageId(moduleId, path)
    if (!pageId) return true // Pages non mappées : autoriser par défaut
    return canAccessPage(moduleId, pageId)
  }

  /**
   * Retourne le niveau d'accès d'une page via son chemin de route.
   */
  const getPageAccessLevelByPath = (moduleId: ModuleId, path: string): AccessLevel => {
    const pageId = pathToPageId(moduleId, path)
    if (!pageId) return getAccessLevel(moduleId)
    return getPageAccessLevel(moduleId, pageId)
  }

  return {
    hasGroup,
    canAccessModule,
    canAccessPage,
    canAccessPageByPath,
    getAccessLevel,
    getPageAccessLevel,
    getPageAccessLevelByPath,
    isManager,
    isSuperAdmin,
    isTenantManager,
    getAccessibleModules,
    pathToPageId,
    userGroups: user?.groups || [],
    permissions,
    hasCustomPermissions,
  }
}
