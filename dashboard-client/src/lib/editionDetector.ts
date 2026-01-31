import { EDITIONS, type EditionId, type Edition } from '@/config/editions'

/**
 * Détecte l'édition active selon stratégie hybride :
 * 1. Build-time : Variable d'env VITE_EDITION (prioritaire)
 * 2. Runtime : Détection subdomain (finance.quelyos.com → finance)
 * 3. Fallback : 'full' (ERP complet)
 *
 * @returns ID de l'édition active
 */
export function detectEdition(): EditionId {
  // 1. Variable d'env build-time (recommandé)
  const buildEdition = import.meta.env.VITE_EDITION
  if (buildEdition && buildEdition in EDITIONS) {
    return buildEdition as EditionId
  }

  // 2. Subdomain detection (runtime)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname

    // finance.quelyos.com → finance
    if (hostname.startsWith('finance.')) return 'finance'
    if (hostname.startsWith('store.')) return 'store'
    if (hostname.startsWith('copilote.')) return 'copilote'
    if (hostname.startsWith('sales.')) return 'sales'
    if (hostname.startsWith('retail.')) return 'retail'
    if (hostname.startsWith('team.')) return 'team'
    if (hostname.startsWith('support.')) return 'support'

    // Ports dev (localhost:3010 → finance)
    const port = window.location.port
    switch (port) {
      case '3010': return 'finance'
      case '3011': return 'store'
      case '3012': return 'copilote'
      case '3013': return 'sales'
      case '3014': return 'retail'
      case '3015': return 'team'
      case '3016': return 'support'
      case '5175': return 'full'
    }
  }

  // 3. Default : full (ERP complet)
  return 'full'
}

/**
 * Récupère la configuration de l'édition active
 *
 * @returns Configuration complète de l'édition
 */
export function getCurrentEdition(): Edition {
  return EDITIONS[detectEdition()]
}

/**
 * Vérifie si l'édition courante est l'ERP complet
 */
export function isFullEdition(): boolean {
  return detectEdition() === 'full'
}

/**
 * Vérifie si l'édition courante est une édition SaaS spécialisée
 */
export function isSaasEdition(): boolean {
  return detectEdition() !== 'full'
}

/**
 * Récupère le nom de l'édition courante (ex: "Quelyos Finance")
 */
export function getEditionName(): string {
  return getCurrentEdition().name
}

/**
 * Récupère le nom court de l'édition courante (ex: "Finance")
 */
export function getEditionShortName(): string {
  return getCurrentEdition().shortName
}

/**
 * Récupère la couleur primaire de l'édition courante
 */
export function getEditionColor(): string {
  return getCurrentEdition().color
}
