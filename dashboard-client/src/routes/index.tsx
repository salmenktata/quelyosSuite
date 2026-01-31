import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { getCurrentEdition } from '@/lib/editionDetector'
import type { ModuleId } from '@/config/modules'

/**
 * Générateur de routes conditionnelles par édition
 * 
 * Importe uniquement les pages des modules de l'édition active
 * → Tree-shaking optimal (Finance n'inclut pas code Marketing)
 */

const edition = getCurrentEdition()

// Helper : vérifier si module dans édition
const hasModule = (moduleId: ModuleId): boolean => {
  return edition.modules.includes(moduleId)
}

/**
 * Routes conditionnelles
 * 
 * Chaque tableau est vide si le module n'est pas dans l'édition
 * → Les imports lazy() ne sont jamais exécutés
 */

// Finance routes
export const financeRoutesEnabled = hasModule('finance')
export const marketingRoutesEnabled = hasModule('marketing')
export const storeRoutesEnabled = hasModule('store')
export const posRoutesEnabled = hasModule('pos')
export const crmRoutesEnabled = hasModule('crm')
export const stockRoutesEnabled = hasModule('stock')
export const hrRoutesEnabled = hasModule('hr')
export const supportRoutesEnabled = hasModule('support')
