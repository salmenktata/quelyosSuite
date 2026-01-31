import { ReactNode } from 'react'

/**
 * Configuration d'une colonne du DataTable
 */
export interface DataTableColumn<T> {
  /** Identifiant unique de la colonne */
  id: string
  /** Label affiché dans le header */
  label: string
  /** Fonction pour extraire la valeur à afficher */
  accessor: (row: T) => ReactNode
  /** La colonne est-elle triable ? */
  sortable?: boolean
  /** Fonction de tri personnalisée (par défaut : tri alphabétique/numérique) */
  sortFn?: (a: T, b: T) => number
  /** Largeur de la colonne (CSS class ou style) */
  width?: string
  /** Alignement du contenu */
  align?: 'left' | 'center' | 'right'
  /** Afficher sur mobile ? (par défaut : false pour économiser espace) */
  showOnMobile?: boolean
  /** Classe CSS personnalisée pour la cellule */
  cellClassName?: string
  /** Classe CSS personnalisée pour le header */
  headerClassName?: string
}

/**
 * Action bulk sélectionnable
 */
export interface BulkAction<T> {
  /** Identifiant unique de l'action */
  id: string
  /** Label affiché */
  label: string
  /** Icône (composant React) */
  icon?: ReactNode
  /** Fonction exécutée avec les éléments sélectionnés */
  onExecute: (selectedItems: T[]) => void | Promise<void>
  /** Variante du bouton */
  variant?: 'primary' | 'secondary' | 'danger'
  /** L'action est-elle désactivée ? */
  disabled?: boolean
}

/**
 * Configuration du rendu mobile (cards)
 */
export interface MobileCardConfig<T> {
  /** Fonction pour rendre le contenu de la card */
  renderCard: (row: T) => ReactNode
  /** Fonction pour rendre les actions de la card */
  renderActions?: (row: T) => ReactNode
}

/**
 * Props du DataTable
 */
export interface DataTableProps<T> {
  /** Données à afficher */
  data: T[]
  /** Configuration des colonnes */
  columns: DataTableColumn<T>[]
  /** Clé unique pour chaque ligne (function ou nom de propriété) */
  keyExtractor: (row: T) => string | number
  /** État de chargement */
  isLoading?: boolean
  /** Message d'erreur */
  error?: string | null
  /** Configuration mobile (si non fournie, utilise le tableau en scroll horizontal) */
  mobileConfig?: MobileCardConfig<T>

  // Tri
  /** Champ actuellement trié */
  sortField?: string
  /** Ordre de tri */
  sortOrder?: 'asc' | 'desc'
  /** Callback changement de tri */
  onSortChange?: (field: string, order: 'asc' | 'desc') => void

  // Pagination
  /** Pagination activée ? */
  pagination?: {
    /** Page actuelle (0-indexed) */
    currentPage: number
    /** Nombre d'éléments par page */
    pageSize: number
    /** Nombre total d'éléments */
    totalItems: number
    /** Callback changement de page */
    onPageChange: (page: number) => void
  }

  // Bulk actions
  /** Actions bulk disponibles */
  bulkActions?: BulkAction<T>[]
  /** Éléments actuellement sélectionnés */
  selectedItems?: T[]
  /** Callback changement de sélection */
  onSelectionChange?: (selectedItems: T[]) => void

  // Empty state
  /** Message si aucune donnée */
  emptyMessage?: string
  /** Composant custom pour empty state */
  emptyComponent?: ReactNode

  // Skeleton
  /** Nombre de lignes skeleton à afficher pendant loading */
  skeletonRows?: number

  // Classes CSS personnalisées
  /** Classe CSS du conteneur principal */
  className?: string
  /** Classe CSS de la table */
  tableClassName?: string
}

/**
 * Type pour le tri
 */
export type SortOrder = 'asc' | 'desc'

/**
 * État interne du DataTable
 */
export interface DataTableState {
  sortField: string | null
  sortOrder: SortOrder
  selectedItems: Set<string | number>
}
