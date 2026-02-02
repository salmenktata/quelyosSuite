/**
 * Feature Flags System
 *
 * Permet d'activer/désactiver des fonctionnalités sans redéploiement:
 * - Dark launches (test en prod invisible)
 * - A/B testing
 * - Rollout progressif
 * - Kill switch
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// =============================================================================
// TYPES
// =============================================================================

export interface FeatureFlag {
  /** Identifiant unique du flag */
  key: string
  /** Nom lisible */
  name: string
  /** Description de la fonctionnalité */
  description: string
  /** Activé par défaut */
  defaultValue: boolean
  /** Valeur actuelle (override) */
  enabled?: boolean
  /** Environnements où le flag s'applique */
  environments?: ('development' | 'staging' | 'production')[]
  /** Pourcentage de rollout (0-100) */
  rolloutPercentage?: number
  /** Date d'expiration (après quoi le flag sera toujours true) */
  expiresAt?: string
  /** Tags pour filtrage */
  tags?: string[]
}

export interface FeatureFlagsState {
  flags: Record<string, FeatureFlag>
  overrides: Record<string, boolean>
  initialized: boolean
  lastSync: number | null
}

// =============================================================================
// FLAGS DÉFINITION
// =============================================================================

/**
 * Définition de tous les feature flags de l'application.
 * Ajouter ici les nouveaux flags.
 */
export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // UI/UX
  DARK_MODE: {
    key: 'DARK_MODE',
    name: 'Mode Sombre',
    description: 'Activer le thème sombre',
    defaultValue: true,
    tags: ['ui'],
  },
  NEW_SIDEBAR: {
    key: 'NEW_SIDEBAR',
    name: 'Nouvelle Sidebar',
    description: 'Utiliser le nouveau design de la sidebar',
    defaultValue: true,
    environments: ['development', 'staging'],
    tags: ['ui', 'beta'],
  },

  // Modules
  MODULE_MARKETING: {
    key: 'MODULE_MARKETING',
    name: 'Module Marketing',
    description: 'Activer le module marketing automation',
    defaultValue: true,
    tags: ['module'],
  },
  MODULE_POS: {
    key: 'MODULE_POS',
    name: 'Module Point de Vente',
    description: 'Activer le module POS',
    defaultValue: false,
    rolloutPercentage: 50,
    tags: ['module', 'beta'],
  },
  MODULE_HR: {
    key: 'MODULE_HR',
    name: 'Module RH',
    description: 'Activer le module Ressources Humaines',
    defaultValue: true,
    tags: ['module'],
  },

  // Fonctionnalités
  REAL_TIME_STOCK: {
    key: 'REAL_TIME_STOCK',
    name: 'Stock Temps Réel',
    description: 'Afficher les mises à jour stock en temps réel (WebSocket)',
    defaultValue: false,
    environments: ['development'],
    tags: ['feature', 'experimental'],
  },
  BATCH_OPERATIONS: {
    key: 'BATCH_OPERATIONS',
    name: 'Opérations en Lot',
    description: 'Permettre les actions en masse sur les listes',
    defaultValue: true,
    tags: ['feature'],
  },
  EXPORT_CSV: {
    key: 'EXPORT_CSV',
    name: 'Export CSV',
    description: 'Activer l\'export CSV des données',
    defaultValue: true,
    tags: ['feature'],
  },
  ADVANCED_FILTERS: {
    key: 'ADVANCED_FILTERS',
    name: 'Filtres Avancés',
    description: 'Afficher les options de filtrage avancé',
    defaultValue: true,
    tags: ['feature'],
  },

  // Performance
  LAZY_LOADING: {
    key: 'LAZY_LOADING',
    name: 'Chargement Paresseux',
    description: 'Charger les composants à la demande',
    defaultValue: true,
    tags: ['perf'],
  },
  CACHE_AGGRESSIVE: {
    key: 'CACHE_AGGRESSIVE',
    name: 'Cache Agressif',
    description: 'Cacher plus de données pour améliorer les performances',
    defaultValue: false,
    tags: ['perf', 'experimental'],
  },

  // Debug
  DEBUG_MODE: {
    key: 'DEBUG_MODE',
    name: 'Mode Debug',
    description: 'Afficher les informations de debug',
    defaultValue: false,
    environments: ['development'],
    tags: ['debug'],
  },
  API_LOGGING: {
    key: 'API_LOGGING',
    name: 'Logging API',
    description: 'Logger toutes les requêtes API dans la console',
    defaultValue: false,
    environments: ['development'],
    tags: ['debug'],
  },
}

// =============================================================================
// STORE ZUSTAND
// =============================================================================

interface FeatureFlagsStore extends FeatureFlagsState {
  isEnabled: (key: string) => boolean
  setOverride: (key: string, enabled: boolean) => void
  clearOverride: (key: string) => void
  clearAllOverrides: () => void
  syncFromBackend: () => Promise<void>
  getFlag: (key: string) => FeatureFlag | undefined
  getAllFlags: () => FeatureFlag[]
  getFlagsByTag: (tag: string) => FeatureFlag[]
}

export const useFeatureFlags = create<FeatureFlagsStore>()(
  persist(
    (set, get) => ({
      flags: FEATURE_FLAGS,
      overrides: {},
      initialized: true,
      lastSync: null,

      /**
       * Vérifie si un feature flag est activé
       */
      isEnabled: (key: string): boolean => {
        const state = get()
        const flag = state.flags[key]

        if (!flag) {
          // Feature flag not found
          return false
        }

        // Override local a la priorité
        if (key in state.overrides) {
          return state.overrides[key]
        }

        // Vérifier l'environnement
        const env = import.meta.env.MODE as 'development' | 'staging' | 'production'
        if (flag.environments && !flag.environments.includes(env)) {
          return false
        }

        // Vérifier l'expiration
        if (flag.expiresAt && new Date(flag.expiresAt) < new Date()) {
          return true // Après expiration, toujours activé
        }

        // Vérifier le rollout
        if (flag.rolloutPercentage !== undefined) {
          const userId = getUserIdForRollout()
          const hash = simpleHash(`${key}:${userId}`)
          const percentage = hash % 100
          if (percentage >= flag.rolloutPercentage) {
            return false
          }
        }

        // Valeur par défaut
        return flag.enabled ?? flag.defaultValue
      },

      setOverride: (key: string, enabled: boolean) => {
        set((state) => ({
          overrides: { ...state.overrides, [key]: enabled },
        }))
      },

      clearOverride: (key: string) => {
        set((state) => {
          const { [key]: _, ...rest } = state.overrides
          return { overrides: rest }
        })
      },

      clearAllOverrides: () => {
        set({ overrides: {} })
      },

      syncFromBackend: async () => {
        try {
          const response = await fetch('/api/backoffice/feature-flags')
          if (response.ok) {
            const data = await response.json()
            if (data.result?.flags) {
              set({
                flags: { ...FEATURE_FLAGS, ...data.result.flags },
                lastSync: Date.now(),
              })
            }
          }
        } catch (error) {
          // Failed to sync feature flags from backend - silently continue
        }
      },

      getFlag: (key: string) => get().flags[key],

      getAllFlags: () => Object.values(get().flags),

      getFlagsByTag: (tag: string) =>
        Object.values(get().flags).filter((f) => f.tags?.includes(tag)),
    }),
    {
      name: 'quelyos-feature-flags',
      partialize: (state) => ({ overrides: state.overrides }),
    }
  )
)

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Hook simple pour vérifier un flag
 */
export function useFeatureFlag(key: string): boolean {
  return useFeatureFlags((state) => state.isEnabled(key))
}

/**
 * Récupère un ID utilisateur stable pour le rollout
 */
function getUserIdForRollout(): string {
  // Essayer de récupérer depuis localStorage
  let userId = localStorage.getItem('ff_user_id')
  if (!userId) {
    userId = Math.random().toString(36).substring(2, 15)
    localStorage.setItem('ff_user_id', userId)
  }
  return userId
}

/**
 * Hash simple pour le rollout
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

// =============================================================================
// COMPOSANT REACT
// =============================================================================

interface FeatureProps {
  flag: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Composant pour afficher conditionnellement selon un feature flag
 */
export function Feature({ flag, children, fallback = null }: FeatureProps) {
  const isEnabled = useFeatureFlag(flag)
  return isEnabled ? <>{children}</> : <>{fallback}</>
}

// =============================================================================
// DEV TOOLS
// =============================================================================

/**
 * Panel de debug pour les feature flags (dev only)
 */
export function FeatureFlagsDevPanel() {
  const { getAllFlags, isEnabled, setOverride, clearOverride, overrides } =
    useFeatureFlags()

  if (import.meta.env.PROD) return null

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-4 max-w-sm max-h-96 overflow-auto z-50">
      <h3 className="font-bold mb-2">Feature Flags</h3>
      <div className="space-y-2">
        {getAllFlags().map((flag) => (
          <label
            key={flag.key}
            className="flex items-center gap-2 text-sm cursor-pointer"
          >
            <input
              type="checkbox"
              checked={isEnabled(flag.key)}
              onChange={(e) => {
                if (flag.key in overrides) {
                  clearOverride(flag.key)
                } else {
                  setOverride(flag.key, e.target.checked)
                }
              }}
              className="rounded"
            />
            <span className={flag.key in overrides ? 'font-bold' : ''}>
              {flag.name}
            </span>
            {flag.tags?.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded"
              >
                {tag}
              </span>
            ))}
          </label>
        ))}
      </div>
    </div>
  )
}
