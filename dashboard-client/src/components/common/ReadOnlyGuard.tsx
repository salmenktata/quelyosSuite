import { createContext, useContext } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import type { ModuleId } from '@/config/modules'
import type { AccessLevel } from '@/config/module-pages'
import { Eye } from 'lucide-react'

interface ReadOnlyContextType {
  isReadOnly: boolean
  accessLevel: AccessLevel
}

const ReadOnlyContext = createContext<ReadOnlyContextType>({
  isReadOnly: false,
  accessLevel: 'full',
})

// eslint-disable-next-line react-refresh/only-export-components
export const useReadOnly = () => useContext(ReadOnlyContext)

/**
 * Provider qui détecte le mode lecture seule pour un module/page.
 * Wrap une page entière pour propager le mode read-only aux enfants.
 */
export function ReadOnlyProvider({
  moduleId,
  pageId,
  children,
}: {
  moduleId: ModuleId
  pageId?: string
  children: React.ReactNode
}) {
  const { getAccessLevel, getPageAccessLevel } = usePermissions()

  const accessLevel = pageId
    ? getPageAccessLevel(moduleId, pageId)
    : getAccessLevel(moduleId)

  const isReadOnly = accessLevel === 'read'

  return (
    <ReadOnlyContext.Provider value={{ isReadOnly, accessLevel }}>
      {children}
    </ReadOnlyContext.Provider>
  )
}

/**
 * Affiche une bannière "Lecture seule" en haut de la page.
 * A placer après les Breadcrumbs.
 */
export function ReadOnlyBanner() {
  const { isReadOnly } = useReadOnly()
  if (!isReadOnly) return null

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm">
      <Eye className="w-4 h-4 flex-shrink-0" />
      <span>Mode lecture seule — les modifications sont désactivées</span>
    </div>
  )
}

/**
 * Wrapper qui désactive les actions (boutons, liens) en mode lecture seule.
 * Les enfants sont rendus mais les interactions sont bloquées.
 */
export function ReadOnlyBlock({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { isReadOnly } = useReadOnly()
  if (!isReadOnly) return <>{children}</>

  if (fallback) return <>{fallback}</>

  return (
    <div className="pointer-events-none opacity-50 select-none" aria-disabled="true">
      {children}
    </div>
  )
}
