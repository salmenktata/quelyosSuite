/**
 * useTenantGuard - Hook de protection tenant multi-apps
 *
 * Centralise la logique de validation tenant utilisée dans :
 * - dashboard-client
 * - vitrine-client
 * - super-admin-client
 * - vitrine-quelyos
 *
 * Évite duplication et garantit cohérence sécurité.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authLogger } from './logger'
import { tokenService } from './tokenService'

export interface TenantData {
  id: number
  domain: string
  name?: string
  logo?: string
  primaryColor?: string
}

export interface UseTenantGuardOptions {
  /**
   * Rediriger vers /login si aucun tenant trouvé
   * @default true
   */
  redirectOnMissing?: boolean

  /**
   * Chemin de redirection si tenant manquant
   * @default '/login'
   */
  redirectPath?: string

  /**
   * Clé localStorage pour le tenant
   * @default 'tenant_data'
   */
  storageKey?: string

  /**
   * Callback appelé si tenant invalide/manquant
   */
  onTenantMissing?: () => void

  /**
   * Callback appelé quand tenant chargé
   */
  onTenantLoaded?: (tenant: TenantData) => void

  /**
   * Utiliser window.location.hostname comme fallback
   * @default true
   */
  useDomainFallback?: boolean
}

export interface UseTenantGuardReturn {
  tenant: TenantData | null
  isLoading: boolean
  error: string | null
  setTenant: (tenant: TenantData | null) => void
  clearTenant: () => void
}

/**
 * Hook de protection et gestion tenant
 *
 * @example
 * ```tsx
 * function App() {
 *   const { tenant, isLoading } = useTenantGuard({
 *     redirectOnMissing: true,
 *     onTenantLoaded: (t) => console.log('Tenant loaded:', t.name)
 *   })
 *
 *   if (isLoading) return <Loader />
 *   if (!tenant) return null // Redirect en cours
 *
 *   return <Dashboard tenant={tenant} />
 * }
 * ```
 */
export function useTenantGuard(options: UseTenantGuardOptions = {}): UseTenantGuardReturn {
  const {
    redirectOnMissing = true,
    redirectPath = '/login',
    storageKey = 'tenant_data',
    onTenantMissing,
    onTenantLoaded,
    useDomainFallback = true,
  } = options

  const navigate = useNavigate()
  const [tenant, setTenantState] = useState<TenantData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTenant()
  }, [])

  async function loadTenant() {
    try {
      setIsLoading(true)
      setError(null)

      // 1. Essayer de charger depuis localStorage
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        try {
          const tenantData = JSON.parse(stored) as TenantData
          if (tenantData && tenantData.id && tenantData.domain) {
            authLogger.info('[TenantGuard] Tenant loaded from storage:', tenantData.domain)
            setTenantState(tenantData)
            onTenantLoaded?.(tenantData)
            setIsLoading(false)
            return
          }
        } catch (parseError) {
          authLogger.error('[TenantGuard] Failed to parse tenant data:', parseError)
          localStorage.removeItem(storageKey)
        }
      }

      // 2. Essayer de récupérer depuis tokenService (user.tenantId)
      const user = tokenService.getUser()
      if (user?.tenantId) {
        const domain = user.tenantDomain || (useDomainFallback ? window.location.hostname : '')
        if (domain) {
          const tenantData: TenantData = {
            id: user.tenantId,
            domain,
            name: user.name, // Fallback
          }
          authLogger.info('[TenantGuard] Tenant loaded from user token:', domain)
          setTenantState(tenantData)
          saveTenant(tenantData)
          onTenantLoaded?.(tenantData)
          setIsLoading(false)
          return
        }
      }

      // 3. Essayer d'utiliser window.location.hostname comme fallback
      if (useDomainFallback) {
        const hostname = window.location.hostname
        // Ignorer localhost/127.0.0.1
        if (hostname !== 'localhost' && !hostname.startsWith('127.')) {
          authLogger.info('[TenantGuard] Using hostname as tenant domain:', hostname)
          // On ne peut pas créer un tenant complet sans API
          // Marquer comme "partial" et laisser l'app décider
          const partialTenant: TenantData = {
            id: 0, // Invalide, à compléter par l'app
            domain: hostname,
          }
          setTenantState(partialTenant)
          setIsLoading(false)
          return
        }
      }

      // 4. Aucun tenant trouvé
      authLogger.warn('[TenantGuard] No tenant found')
      setError('Aucun tenant trouvé')
      onTenantMissing?.()

      if (redirectOnMissing) {
        authLogger.info('[TenantGuard] Redirecting to:', redirectPath)
        navigate(redirectPath)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur chargement tenant'
      authLogger.error('[TenantGuard] Error loading tenant:', err)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  function setTenant(newTenant: TenantData | null) {
    if (newTenant) {
      authLogger.info('[TenantGuard] Setting tenant:', newTenant.domain)
      setTenantState(newTenant)
      saveTenant(newTenant)
      onTenantLoaded?.(newTenant)
    } else {
      clearTenant()
    }
  }

  function saveTenant(tenantData: TenantData) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(tenantData))
    } catch (err) {
      authLogger.error('[TenantGuard] Failed to save tenant to storage:', err)
    }
  }

  function clearTenant() {
    authLogger.info('[TenantGuard] Clearing tenant')
    setTenantState(null)
    localStorage.removeItem(storageKey)
  }

  return {
    tenant,
    isLoading,
    error,
    setTenant,
    clearTenant,
  }
}

/**
 * Hook simplifié qui throw si pas de tenant
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const tenant = useRequireTenant()
 *   // tenant est garanti non-null ici
 *   return <div>Tenant: {tenant.name}</div>
 * }
 * ```
 */
export function useRequireTenant(options?: UseTenantGuardOptions): TenantData {
  const { tenant, isLoading, error } = useTenantGuard(options)

  if (isLoading) {
    throw new Promise(() => {}) // Suspense
  }

  if (error) {
    throw new Error(error)
  }

  if (!tenant || tenant.id === 0) {
    throw new Error('Tenant requis mais non trouvé')
  }

  return tenant
}
