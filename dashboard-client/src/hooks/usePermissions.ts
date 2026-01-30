import { useAuth } from '@/lib/finance/compat/auth'

type ModuleId = 'home' | 'finance' | 'store' | 'stock' | 'crm' | 'marketing' | 'hr' | 'pos' | 'support'

/**
 * Hook pour vérifier les permissions utilisateur basées sur les groupes backend.
 *
 * Les groupes sont récupérés depuis l'API backend et stockés dans le profil utilisateur.
 * Chaque module du backoffice nécessite un groupe minimum pour être accessible.
 */
export function usePermissions() {
  const { user } = useAuth()

  /**
   * Mapping des modules aux groupes de sécurité requis.
   * Un utilisateur doit avoir AU MOINS un des groupes listés (User OU Manager).
   */
  const MODULE_GROUP_MAP: Record<ModuleId, string[]> = {
    'home': ['Quelyos Home User', 'Quelyos Home Manager'],
    'finance': ['Quelyos Finance User', 'Quelyos Finance Manager'],
    'store': ['Quelyos Store User', 'Quelyos Store Manager'],
    'stock': ['Quelyos Stock User', 'Quelyos Stock Manager'],
    'crm': ['Quelyos CRM User', 'Quelyos CRM Manager'],
    'marketing': ['Quelyos Marketing User', 'Quelyos Marketing Manager'],
    'hr': ['Quelyos HR User', 'Quelyos HR Manager'],
    'pos': ['Quelyos POS User', 'Quelyos POS Manager'],
    'support': ['Quelyos Store User', 'Quelyos Store Manager'], // Support accessible aux utilisateurs Store
  }

  /**
   * Vérifie si l'utilisateur possède un groupe spécifique.
   *
   * @param groupName - Nom exact du groupe (ex: 'Quelyos Stock User')
   * @returns true si l'utilisateur a le groupe, false sinon
   */
  const hasGroup = (groupName: string): boolean => {
    if (!user || !user.groups) return false
    return user.groups.includes(groupName)
  }

  /**
   * Vérifie si l'utilisateur est super-admin (accès complet à tout).
   *
   * @returns true si l'utilisateur a le groupe Access Rights (super-admin)
   */
  const isSuperAdmin = (): boolean => {
    if (!user || !user.groups) return false
    // Le groupe "Access Rights" donne un accès complet à TOUT (existant et futur)
    return user.groups.includes('Access Rights')
  }

  /**
   * Vérifie si l'utilisateur peut accéder à un module.
   *
   * @param moduleId - Identifiant du module (ex: 'stock', 'crm')
   * @returns true si l'utilisateur a les permissions, false sinon
   */
  const canAccessModule = (moduleId: ModuleId): boolean => {
    if (!user || !user.groups) return false

    // Super-admin : accès complet à TOUS les modules (existant et futur)
    if (isSuperAdmin()) return true

    const requiredGroups = MODULE_GROUP_MAP[moduleId]
    if (!requiredGroups) return false

    // L'utilisateur doit avoir AU MOINS un des groupes requis
    return requiredGroups.some(group => user.groups.includes(group))
  }

  /**
   * Vérifie si l'utilisateur est Manager d'un domaine fonctionnel.
   *
   * @param moduleId - Identifiant du module
   * @returns true si l'utilisateur a le groupe Manager, false sinon
   */
  const isManager = (moduleId: ModuleId): boolean => {
    if (!user || !user.groups) return false

    const managerGroup = `Quelyos ${moduleId.charAt(0).toUpperCase() + moduleId.slice(1)} Manager`
    return user.groups.includes(managerGroup)
  }

  /**
   * Retourne la liste des modules accessibles par l'utilisateur.
   *
   * @returns Array des IDs de modules accessibles
   */
  const getAccessibleModules = (): ModuleId[] => {
    const allModules: ModuleId[] = ['home', 'finance', 'store', 'stock', 'crm', 'marketing', 'hr', 'pos']

    // Super-admin : accès à TOUS les modules (existant et futur)
    if (isSuperAdmin()) return allModules

    return allModules.filter(module => canAccessModule(module))
  }

  return {
    hasGroup,
    canAccessModule,
    isManager,
    isSuperAdmin,
    getAccessibleModules,
    userGroups: user?.groups || [],
  }
}
