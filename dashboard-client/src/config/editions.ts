import type { ModuleId } from './modules'

/**
 * Identifiants des éditions Quelyos
 * - full : ERP complet (dashboard-client)
 * - 7 éditions SaaS spécialisées
 */
export type EditionId =
  | 'full'      // ERP complet (5175)
  | 'finance'   // Quelyos Finance (3010)
  | 'store'     // Quelyos Store (3011)
  | 'copilote'  // Quelyos Copilote (3012)
  | 'sales'     // Quelyos Sales (3013)
  | 'retail'    // Quelyos Retail (3014)
  | 'team'      // Quelyos Team (3015)
  | 'support'   // Quelyos Support (3016)

/**
 * Configuration d'une édition Quelyos
 */
export interface Edition {
  id: EditionId
  name: string              // "Quelyos Finance"
  shortName: string         // "Finance"
  description: string       // Description courte
  color: string             // Couleur primaire (hex)
  logo: string              // Path du logo
  favicon: string           // Path du favicon
  modules: ModuleId[]       // Modules whitelistés
  port: number              // Port dev (3010-3016)
  features?: {
    multiTenant?: boolean    // Support multi-tenant
    appLauncher?: boolean    // Launcher apps (édition full uniquement)
    moduleSwitch?: boolean   // Switch entre modules
  }
}

/**
 * Définition des 8 éditions Quelyos
 * Source : branding.ts de chaque SaaS
 */
export const EDITIONS: Record<EditionId, Edition> = {
  // ============================================================================
  // ÉDITION FULL - ERP COMPLET
  // ============================================================================
  full: {
    id: 'full',
    name: 'Quelyos Suite',
    shortName: 'Suite',
    description: 'ERP complet multi-modules',
    color: '#6366F1', // Indigo
    logo: '/favicon.svg',
    favicon: '/favicon.svg',
    modules: ['home', 'finance', 'store', 'stock', 'crm', 'marketing', 'hr', 'pos', 'support'],
    port: 5175,
    features: {
      multiTenant: true,
      appLauncher: true,
      moduleSwitch: true,
    },
  },

  // ============================================================================
  // 7 ÉDITIONS SAAS SPÉCIALISÉES
  // ============================================================================

  finance: {
    id: 'finance',
    name: 'Quelyos Finance',
    shortName: 'Finance',
    description: 'Gestion financière, trésorerie et budgets',
    color: '#059669', // Vert émeraude
    logo: '/favicon.svg',
    favicon: '/favicon.svg',
    modules: ['finance'],
    port: 3010,
    features: {
      multiTenant: false,
      appLauncher: false,
      moduleSwitch: false,
    },
  },

  store: {
    id: 'store',
    name: 'Quelyos Store',
    shortName: 'Store',
    description: 'E-commerce et gestion boutique en ligne',
    color: '#7C3AED', // Violet
    logo: '/favicon.svg',
    favicon: '/favicon.svg',
    modules: ['store', 'marketing'],
    port: 3011,
    features: {
      multiTenant: false,
      appLauncher: false,
      moduleSwitch: true, // Store peut switcher vers marketing
    },
  },

  copilote: {
    id: 'copilote',
    name: 'Quelyos Copilote',
    shortName: 'Copilote',
    description: 'GMAO, gestion des stocks et maintenance',
    color: '#EA580C', // Orange
    logo: '/favicon.svg',
    favicon: '/favicon.svg',
    modules: ['stock', 'hr'],
    port: 3012,
    features: {
      multiTenant: false,
      appLauncher: false,
      moduleSwitch: true, // Copilote peut switcher stock ↔ hr
    },
  },

  sales: {
    id: 'sales',
    name: 'Quelyos Sales',
    shortName: 'Sales',
    description: 'CRM et gestion commerciale',
    color: '#2563EB', // Bleu
    logo: '/favicon.svg',
    favicon: '/favicon.svg',
    modules: ['crm', 'marketing'],
    port: 3013,
    features: {
      multiTenant: false,
      appLauncher: false,
      moduleSwitch: true, // Sales peut switcher crm ↔ marketing
    },
  },

  retail: {
    id: 'retail',
    name: 'Quelyos Retail',
    shortName: 'Retail',
    description: 'Point de vente omnicanal',
    color: '#DC2626', // Rouge
    logo: '/favicon.svg',
    favicon: '/favicon.svg',
    modules: ['pos', 'store', 'stock'],
    port: 3014,
    features: {
      multiTenant: false,
      appLauncher: false,
      moduleSwitch: true, // Retail peut switcher entre pos/store/stock
    },
  },

  team: {
    id: 'team',
    name: 'Quelyos Team',
    shortName: 'Team',
    description: 'Gestion des ressources humaines',
    color: '#0891B2', // Cyan
    logo: '/favicon.svg',
    favicon: '/favicon.svg',
    modules: ['hr'],
    port: 3015,
    features: {
      multiTenant: false,
      appLauncher: false,
      moduleSwitch: false,
    },
  },

  support: {
    id: 'support',
    name: 'Quelyos Support',
    shortName: 'Support',
    description: 'Helpdesk et support client',
    color: '#9333EA', // Violet foncé
    logo: '/favicon.svg',
    favicon: '/favicon.svg',
    modules: ['support', 'crm'],
    port: 3016,
    features: {
      multiTenant: false,
      appLauncher: false,
      moduleSwitch: true, // Support peut switcher support ↔ crm
    },
  },
}

/**
 * Liste des éditions (pour itération)
 */
export const EDITION_LIST: Edition[] = Object.values(EDITIONS)

/**
 * Vérifier si un module appartient à une édition
 */
export function isModuleInEdition(moduleId: ModuleId, editionId: EditionId): boolean {
  return EDITIONS[editionId].modules.includes(moduleId)
}

/**
 * Récupérer les éditions qui contiennent un module spécifique
 */
export function getEditionsForModule(moduleId: ModuleId): Edition[] {
  return EDITION_LIST.filter(edition => edition.modules.includes(moduleId))
}
