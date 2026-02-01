/**
 * Configuration des modules Quelyos
 * Définition centralisée des 9 modules disponibles
 */

// Définition des 9 modules Quelyos
export const QUELYOS_MODULES = [
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

export type ModuleKey = (typeof QUELYOS_MODULES)[number]['key']
