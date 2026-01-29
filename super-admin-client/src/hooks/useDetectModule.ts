import { useMemo } from 'react'
import { MODULES, type Module } from '@/config/modules'

/**
 * Détecte le module actif depuis le pathname
 *
 * CRITIQUE: L'ordre de vérification est important
 * - /finance/stock doit être vérifié AVANT /finance
 * - Sinon /finance/stock serait incorrectement détecté comme module finance
 *
 * @param accessibleModules - Liste des modules accessibles à l'utilisateur (filtrés par permissions)
 * @param pathname - Chemin URL actuel (location.pathname)
 * @returns Module actif détecté depuis l'URL
 */
export function useDetectModule(
  accessibleModules: Module[],
  pathname: string
): Module {
  return useMemo(() => {
    // CRITICAL: Check /finance/stock BEFORE /finance to avoid incorrect detection
    if (pathname.startsWith('/finance/stock'))
      return accessibleModules.find(m => m.id === 'stock') || accessibleModules[0] || MODULES[0]

    if (pathname.startsWith('/finance'))
      return accessibleModules.find(m => m.id === 'finance') || accessibleModules[0] || MODULES[0]

    if (pathname.startsWith('/stock') || pathname.startsWith('/warehouses') || pathname.startsWith('/inventory'))
      return accessibleModules.find(m => m.id === 'stock') || accessibleModules[0] || MODULES[0]

    if (pathname.startsWith('/crm') || pathname.startsWith('/invoices') || pathname.startsWith('/payments') || pathname.startsWith('/pricelists'))
      return accessibleModules.find(m => m.id === 'crm') || accessibleModules[0] || MODULES[0]

    if (pathname.startsWith('/store'))
      return accessibleModules.find(m => m.id === 'store') || accessibleModules[0] || MODULES[0]

    if (pathname.startsWith('/marketing'))
      return accessibleModules.find(m => m.id === 'marketing') || accessibleModules[0] || MODULES[0]

    if (pathname.startsWith('/hr'))
      return accessibleModules.find(m => m.id === 'hr') || accessibleModules[0] || MODULES[0]

    if (pathname.startsWith('/pos'))
      return accessibleModules.find(m => m.id === 'pos') || accessibleModules[0] || MODULES[0]

    // Fallback: Home module
    return accessibleModules.find(m => m.id === 'home') || accessibleModules[0] || MODULES[0]
  }, [accessibleModules, pathname])
}
