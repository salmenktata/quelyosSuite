import { Navigate, useLocation } from 'react-router-dom'
import { useRequireAuth } from '@/lib/finance/compat/auth'
import { usePermissions } from '@/hooks/usePermissions'
import type { ModuleId } from '@/config/modules'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/** Détecte le moduleId depuis le pathname */
function detectModuleFromPath(pathname: string): ModuleId | null {
  const moduleMap: Record<string, ModuleId> = {
    '/store': 'store',
    '/finance': 'finance',
    '/stock': 'stock',
    '/crm': 'crm',
    '/marketing': 'marketing',
    '/hr': 'hr',
    '/pos': 'pos',
    '/support': 'support',
    '/maintenance': 'maintenance',
  }
  for (const [prefix, moduleId] of Object.entries(moduleMap)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return moduleId
    }
  }
  // Routes home spéciales
  if (pathname === '/dashboard' || pathname === '/analytics' || pathname.startsWith('/settings') || pathname.startsWith('/dashboard/')) {
    return 'home'
  }
  // Routes stock legacy
  if (pathname === '/inventory' || pathname.startsWith('/warehouses')) {
    return 'stock'
  }
  return null
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, isLoading } = useRequireAuth()
  const { canAccessModule, canAccessPageByPath } = usePermissions()

  // Afficher un loader pendant la vérification
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    )
  }

  // Rediriger vers /login si non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Vérifier permissions module + page
  const moduleId = detectModuleFromPath(location.pathname)
  if (moduleId) {
    if (!canAccessModule(moduleId)) {
      return <Navigate to="/dashboard" replace />
    }
    if (!canAccessPageByPath(moduleId, location.pathname)) {
      // Rediriger vers la page racine du module
      const moduleBase = moduleId === 'home' ? '/dashboard' : `/${moduleId}`
      return <Navigate to={moduleBase} replace />
    }
  }

  return <>{children}</>
}
