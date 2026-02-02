/**
 * TenantContext - Gestion globale du tenant multi-tenant
 *
 * Ce contexte gère le tenant courant pour toute l'application.
 * Il initialise automatiquement le tenant_id dans le client API.
 * Il extrait automatiquement le tenant domain depuis l'URL (sous-domaine).
 *
 * SÉCURITÉ CRITIQUE :
 * - Injecte automatiquement X-Tenant-Domain dans tous les appels API
 * - Isole les données localStorage par tenant (via tenantStorage)
 * - Empêche l'accès cross-tenant
 *
 * Usage:
 * - Wrapper l'app avec <TenantProvider>
 * - Utiliser useTenantContext() pour accéder au tenant courant
 * - Utiliser tenantStorage au lieu de localStorage
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useMyTenant } from '@/hooks/useMyTenant'
import { api } from '@/lib/api'
import { tokenService } from '@/lib/tokenService'
import { tenantStorage } from '@/lib/tenantStorage'
import { logger } from '@quelyos/logger'

interface TenantContextValue {
  tenantId: number | null
  tenantName: string | null
  tenantCode: string | null
  tenantDomain: string | null
  isLoading: boolean
  error: Error | null
  setTenantId: (id: number | null) => void
  setTenantDomain: (domain: string | null) => void
  /** Nettoie toutes les données du tenant courant (logout) */
  clearTenantData: () => void
}

const TenantContext = createContext<TenantContextValue | null>(null)

/**
 * Extrait le tenant domain depuis window.location.hostname
 * Ex: tenant1.quelyos.local:5175 → tenant1.quelyos.local
 * Ex: localhost:5175 → localhost
 */
function extractTenantDomain(): string {
  return window.location.hostname
}

interface TenantProviderProps {
  children: ReactNode
}

export function TenantProvider({ children }: TenantProviderProps) {
  const { tenant, isLoading, error } = useMyTenant()
  const [manualTenantId, setManualTenantId] = useState<number | null>(() => {
    // 1. Essayer localStorage
    const storedTenantId = localStorage.getItem('tenant_id')
    if (storedTenantId && storedTenantId !== 'null') {
      const id = parseInt(storedTenantId, 10)
      if (!isNaN(id)) return id
    }
    // 2. Fallback: récupérer depuis le token JWT (tokenService)
    const user = tokenService.getUser()
    if (user?.tenantId) {
      // Synchroniser dans localStorage pour les prochains chargements
      localStorage.setItem('tenant_id', String(user.tenantId))
      return user.tenantId
    }
    return null
  })
  const [tenantDomain, setTenantDomainState] = useState<string | null>(() => extractTenantDomain())

  // Synchroniser le tenant avec le client API
  useEffect(() => {
    if (tenant?.id) {
      api.setTenantId(tenant.id)
    } else if (manualTenantId) {
      api.setTenantId(manualTenantId)
    }
  }, [tenant?.id, manualTenantId])

  // Synchroniser le tenant domain avec le client API
  useEffect(() => {
    if (tenantDomain) {
      api.setTenantDomain(tenantDomain)
    }
  }, [tenantDomain])

  // Re-hydrater manualTenantId quand le JWT devient disponible après login
  useEffect(() => {
    const unsubscribe = tokenService.subscribe((event) => {
      if (event === 'login') {
        const user = tokenService.getUser()
        if (user?.tenantId) {
          localStorage.setItem('tenant_id', String(user.tenantId))
          setManualTenantId(user.tenantId)
        }
      }
      if (event === 'logout') {
        setManualTenantId(null)
      }
    })
    return unsubscribe
  }, [])

  const setTenantId = (id: number | null) => {
    setManualTenantId(id)
    api.setTenantId(id)

    // Nettoyer les données du tenant précédent si changement de tenant
    if (id && tenant?.id && id !== tenant.id) {
      logger.warn('[TenantContext] Changement de tenant détecté, nettoyage localStorage')
      tenantStorage.clear()
    }
  }

  const setTenantDomain = (domain: string | null) => {
    setTenantDomainState(domain)
    if (domain) {
      api.setTenantDomain(domain)
    }
  }

  /**
   * Nettoie toutes les données du tenant courant
   * Appelé lors du logout ou du changement de tenant
   */
  const clearTenantData = () => {
    logger.info('[TenantContext] Nettoyage données tenant')
    tenantStorage.clear()
    setManualTenantId(null)
    api.setTenantId(null)
  }

  const resolvedTenantId = tenant?.id ?? manualTenantId

  const value: TenantContextValue = {
    tenantId: resolvedTenantId,
    tenantName: tenant?.name ?? null,
    tenantCode: tenant?.code ?? null,
    tenantDomain,
    isLoading: isLoading && !resolvedTenantId,
    // Ne pas propager l'erreur si on a un tenantId valide en fallback
    error: resolvedTenantId ? null : (error as Error | null),
    setTenantId,
    setTenantDomain,
    clearTenantData,
  }

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenantContext(): TenantContextValue {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenantContext must be used within a TenantProvider')
  }
  return context
}

/**
 * Hook simplifié pour récupérer juste le tenant_id
 */
export function useCurrentTenantId(): number | null {
  const { tenantId } = useTenantContext()
  return tenantId
}

/**
 * Hook simplifié pour récupérer juste le tenant domain
 */
export function useCurrentTenantDomain(): string | null {
  const { tenantDomain } = useTenantContext()
  return tenantDomain
}
