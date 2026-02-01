import { useState, useMemo } from 'react'
import { Shield, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

// Définition des 9 modules Quelyos
const QUELYOS_MODULES = [
  { key: 'home', label: 'Accueil' },
  { key: 'finance', label: 'Finance' },
  { key: 'store', label: 'Boutique' },
  { key: 'stock', label: 'Stock' },
  { key: 'crm', label: 'CRM' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'hr', label: 'RH' },
  { key: 'support', label: 'Support' },
  { key: 'pos', label: 'Caisse' },
] as const

type ModuleKey = (typeof QUELYOS_MODULES)[number]['key']
type AccessLevel = 'none' | 'user' | 'manager'

interface SecurityGroup {
  id: number
  name: string
  full_name: string
  category?: string
}

interface ModuleGroupSelectorProps {
  securityGroups: SecurityGroup[]
  selectedGroupIds: number[]
  onChange: (groupIds: number[]) => void
  isLoading?: boolean
  error?: boolean
}

// Parse le nom du groupe pour extraire module + niveau
function parseQuelyosGroup(group: SecurityGroup): { module: ModuleKey; level: 'user' | 'manager' } | null {
  const name = group.name.toLowerCase()
  const fullName = group.full_name.toLowerCase()

  for (const mod of QUELYOS_MODULES) {
    // Pattern: "Quelyos [Module] User" ou "Quelyos [Module] Manager"
    const userPattern = new RegExp(`quelyos\\s+${mod.key}\\s+user`, 'i')
    const managerPattern = new RegExp(`quelyos\\s+${mod.key}\\s+manager`, 'i')

    if (userPattern.test(name) || userPattern.test(fullName)) {
      return { module: mod.key, level: 'user' }
    }
    if (managerPattern.test(name) || managerPattern.test(fullName)) {
      return { module: mod.key, level: 'manager' }
    }
  }

  return null
}

// Vérifie si un groupe est un groupe Quelyos
function isQuelyosGroup(group: SecurityGroup): boolean {
  return parseQuelyosGroup(group) !== null
}

export function ModuleGroupSelector({
  securityGroups,
  selectedGroupIds,
  onChange,
  isLoading = false,
  error = false,
}: ModuleGroupSelectorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Créer une map groupe -> id pour chaque module/niveau
  const groupMap = useMemo(() => {
    const map: Record<ModuleKey, { user?: number; manager?: number }> = {
      home: {},
      finance: {},
      store: {},
      stock: {},
      crm: {},
      marketing: {},
      hr: {},
      support: {},
      pos: {},
    }

    for (const group of securityGroups) {
      const parsed = parseQuelyosGroup(group)
      if (parsed) {
        map[parsed.module][parsed.level] = group.id
      }
    }

    return map
  }, [securityGroups])

  // Groupes non-Quelyos pour le mode avancé
  const nonQuelyosGroups = useMemo(() => {
    return securityGroups.filter((g) => !isQuelyosGroup(g))
  }, [securityGroups])

  // Calculer le niveau actuel pour chaque module
  const moduleLevels = useMemo(() => {
    const levels: Record<ModuleKey, AccessLevel> = {
      home: 'none',
      finance: 'none',
      store: 'none',
      stock: 'none',
      crm: 'none',
      marketing: 'none',
      hr: 'none',
      support: 'none',
      pos: 'none',
    }

    for (const mod of QUELYOS_MODULES) {
      const moduleGroups = groupMap[mod.key]
      if (!moduleGroups) continue // Skip si module non trouvé dans groupMap

      const managerId = moduleGroups.manager
      const userId = moduleGroups.user

      if (managerId && selectedGroupIds.includes(managerId)) {
        levels[mod.key] = 'manager'
      } else if (userId && selectedGroupIds.includes(userId)) {
        levels[mod.key] = 'user'
      }
    }

    return levels
  }, [groupMap, selectedGroupIds])

  // IDs non-Quelyos sélectionnés
  const selectedNonQuelyosIds = useMemo(() => {
    const quelyosIds = new Set<number>()
    for (const mod of QUELYOS_MODULES) {
      if (groupMap[mod.key].user) quelyosIds.add(groupMap[mod.key].user!)
      if (groupMap[mod.key].manager) quelyosIds.add(groupMap[mod.key].manager!)
    }
    return selectedGroupIds.filter((id) => !quelyosIds.has(id))
  }, [groupMap, selectedGroupIds])

  // Changer le niveau d'un module
  const setModuleLevel = (module: ModuleKey, level: AccessLevel) => {
    const userId = groupMap[module].user
    const managerId = groupMap[module].manager

    // Retirer les anciens IDs de ce module
    let newIds = selectedGroupIds.filter((id) => id !== userId && id !== managerId)

    // Ajouter le nouveau si pas "none"
    if (level === 'user' && userId) {
      newIds.push(userId)
    } else if (level === 'manager' && managerId) {
      newIds.push(managerId)
    }

    onChange(newIds)
  }

  // Toggle groupe non-Quelyos
  const toggleNonQuelyosGroup = (groupId: number) => {
    if (selectedGroupIds.includes(groupId)) {
      onChange(selectedGroupIds.filter((id) => id !== groupId))
    } else {
      onChange([...selectedGroupIds, groupId])
    }
  }

  if (isLoading) {
    return (
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Modules Quelyos</h3>
        </div>
        <div className="p-4 text-center">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
          <p className="text-sm text-gray-500 mt-2">Chargement des groupes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Modules Quelyos</h3>
        </div>
        <div className="p-4 text-center">
          <p className="text-sm text-red-500">Erreur lors du chargement des groupes</p>
        </div>
      </div>
    )
  }

  const selectedCount = selectedGroupIds.length

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Modules Quelyos</h3>
        <span className="text-xs text-gray-500">({selectedCount} sélectionnés)</span>
      </div>

      {/* Grille des modules */}
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-4 bg-gray-50 dark:bg-gray-700/50 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
          <div className="px-3 py-2">Module</div>
          <div className="px-3 py-2 text-center">Aucun</div>
          <div className="px-3 py-2 text-center">User</div>
          <div className="px-3 py-2 text-center">Manager</div>
        </div>

        {/* Lignes modules */}
        {QUELYOS_MODULES.map((mod) => {
          const level = moduleLevels[mod.key]
          const moduleGroups = groupMap[mod.key] || {}
          const hasUser = !!moduleGroups.user
          const hasManager = !!moduleGroups.manager

          return (
            <div
              key={mod.key}
              className="grid grid-cols-4 border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30"
            >
              <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">{mod.label}</div>
              <div className="px-3 py-2 flex justify-center">
                <input
                  type="radio"
                  name={`module-${mod.key}`}
                  checked={level === 'none'}
                  onChange={() => setModuleLevel(mod.key, 'none')}
                  className="w-4 h-4 text-gray-400 border-gray-300 dark:border-gray-600 focus:ring-teal-500"
                />
              </div>
              <div className="px-3 py-2 flex justify-center">
                <input
                  type="radio"
                  name={`module-${mod.key}`}
                  checked={level === 'user'}
                  onChange={() => setModuleLevel(mod.key, 'user')}
                  disabled={!hasUser}
                  className="w-4 h-4 text-teal-600 border-gray-300 dark:border-gray-600 focus:ring-teal-500 disabled:opacity-30"
                />
              </div>
              <div className="px-3 py-2 flex justify-center">
                <input
                  type="radio"
                  name={`module-${mod.key}`}
                  checked={level === 'manager'}
                  onChange={() => setModuleLevel(mod.key, 'manager')}
                  disabled={!hasManager}
                  className="w-4 h-4 text-teal-600 border-gray-300 dark:border-gray-600 focus:ring-teal-500 disabled:opacity-30"
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Mode avancé */}
      {nonQuelyosGroups.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Mode avancé ({nonQuelyosGroups.length} autres groupes)
            {selectedNonQuelyosIds.length > 0 && (
              <span className="px-1.5 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs rounded-full">
                {selectedNonQuelyosIds.length}
              </span>
            )}
          </button>

          {showAdvanced && (
            <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-2">
              {nonQuelyosGroups.map((group) => (
                <label
                  key={group.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedGroupIds.includes(group.id)}
                    onChange={() => toggleNonQuelyosGroup(group.id)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{group.full_name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
