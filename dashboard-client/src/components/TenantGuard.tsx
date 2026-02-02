/**
 * TenantGuard - Composant de protection tenant
 *
 * Vérifie que le tenant courant est valide et redirige si nécessaire.
 *
 * Cas de redirection :
 * - Tenant introuvable (404)
 * - Tenant invalide ou désactivé
 * - Erreur API (5xx)
 * - Pas de tenant_id après chargement
 *
 * Usage:
 *   <TenantGuard>
 *     <App />
 *   </TenantGuard>
 */

import { useEffect, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTenantContext } from '@/contexts/TenantContext'
import { tokenService } from '@/lib/tokenService'
import { logger } from '@quelyos/logger'
import { Loader2 } from 'lucide-react'

interface TenantGuardProps {
  children: ReactNode
  /** Routes publiques qui ne nécessitent pas de tenant */
  publicRoutes?: string[]
}

/**
 * Routes publiques par défaut (pas de tenant requis)
 */
const DEFAULT_PUBLIC_ROUTES = [
  '/',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/register',
  '/auth-callback',
  '/satisfaction',
]

export function TenantGuard({ children, publicRoutes = DEFAULT_PUBLIC_ROUTES }: TenantGuardProps) {
  const { tenantId, tenantDomain, isLoading, error } = useTenantContext()
  const navigate = useNavigate()
  const location = useLocation()

  // Vérifier si la route courante est publique
  const isPublicRoute = publicRoutes.some((route) =>
    route === '/' ? location.pathname === '/' : location.pathname.startsWith(route)
  )

  const isAuthenticated = tokenService.isAuthenticated()

  useEffect(() => {
    // Ne rien faire pour les routes publiques
    if (isPublicRoute) {
      return
    }

    // Pas de session valide → redirection directe sans vérifier le tenant
    if (!isAuthenticated) {
      logger.debug('[TenantGuard] Pas de session valide → redirection /login')
      navigate('/login', {
        replace: true,
        state: {
          from: location.pathname,
        },
      })
      return
    }

    // Attendre la fin du chargement
    if (isLoading) {
      return
    }

    // Erreur critique : tenant introuvable ou invalide
    if (error) {
      logger.error('[TenantGuard] Erreur tenant:', error)

      // 404 = Tenant introuvable
      if (error.message.includes('404') || error.message.includes('Aucun tenant')) {
        navigate('/login', {
          replace: true,
          state: {
            from: location.pathname,
            error: 'Aucun tenant associé à ce domaine. Veuillez contacter le support.',
          },
        })
        return
      }

      // 401 = Session expirée
      if (error.message.includes('401') || error.message.includes('Session expirée')) {
        navigate('/login', {
          replace: true,
          state: {
            from: location.pathname,
            error: 'Session expirée. Veuillez vous reconnecter.',
          },
        })
        return
      }

      // Autre erreur = Erreur serveur
      navigate('/login', {
        replace: true,
        state: {
          from: location.pathname,
          error: 'Erreur de connexion au serveur. Veuillez réessayer.',
        },
      })
      return
    }

    // Vérification tenant_id et tenant_domain présents
    if (!tenantId || !tenantDomain) {
      logger.warn('[TenantGuard] Tenant manquant (id:', tenantId, 'domain:', tenantDomain, ')')
      if (!location.pathname.startsWith('/login')) {
        const timer = setTimeout(() => {
          navigate('/login', {
            replace: true,
            state: {
              from: location.pathname,
              error: 'Contexte tenant manquant. Veuillez vous reconnecter.',
            },
          })
        }, 5000)

        return () => clearTimeout(timer)
      }
    }
  }, [tenantId, tenantDomain, isLoading, error, isPublicRoute, isAuthenticated, location.pathname, navigate])

  // Pas authentifié sur route protégée → laisser le useEffect rediriger
  if (!isPublicRoute && !isAuthenticated) {
    return null
  }

  // Afficher un loader pendant le chargement du tenant (sauf routes publiques)
  if (!isPublicRoute && isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Chargement de votre espace...
          </p>
        </div>
      </div>
    )
  }

  // Afficher une erreur si tenant introuvable (sauf routes publiques)
  if (!isPublicRoute && error && !isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Erreur de chargement
              </h3>
              <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error.message}
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 dark:bg-red-700 dark:hover:bg-red-600"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Tout est OK, afficher les enfants
  return <>{children}</>
}
