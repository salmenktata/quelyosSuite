/**
 * TenantContext - Gestion globale du tenant multi-tenant
 *
 * Ce contexte gère le tenant courant pour toute l'application.
 * Il initialise automatiquement le tenant_id dans le client API.
 *
 * Usage:
 * - Wrapper l'app avec <TenantProvider>
 * - Utiliser useTenantContext() pour accéder au tenant courant
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useMyTenant } from '@/hooks/useMyTenant'
import { api } from '@/lib/api'

interface TenantContextValue {
  tenantId: number | null
  tenantName: string | null
  tenantCode: string | null
  isLoading: boolean
  error: Error | null
  setTenantId: (id: number | null) => void
}

const TenantContext = createContext<TenantContextValue | null>(null)

interface TenantProviderProps {
  children: ReactNode
}

export function TenantProvider({ children }: TenantProviderProps) {
  const { tenant, isLoading, error } = useMyTenant()
  const [manualTenantId, setManualTenantId] = useState<number | null>(null)

  // Synchroniser le tenant avec le client API
  useEffect(() => {
    if (tenant?.id) {
      api.setTenantId(tenant.id)
    } else if (manualTenantId) {
      api.setTenantId(manualTenantId)
    }
  }, [tenant?.id, manualTenantId])

  // Charger le tenant_id depuis localStorage au démarrage
  useEffect(() => {
    const storedTenantId = localStorage.getItem('tenant_id')
    if (storedTenantId && storedTenantId !== 'null') {
      const id = parseInt(storedTenantId, 10)
      if (!isNaN(id)) {
        setManualTenantId(id)
      }
    }
  }, [])

  const setTenantId = (id: number | null) => {
    setManualTenantId(id)
    api.setTenantId(id)
  }

  const value: TenantContextValue = {
    tenantId: tenant?.id ?? manualTenantId,
    tenantName: tenant?.name ?? null,
    tenantCode: tenant?.code ?? null,
    isLoading,
    error: error as Error | null,
    setTenantId,
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
