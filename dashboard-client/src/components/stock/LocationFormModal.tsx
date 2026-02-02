import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { X, MapPin, Package, Folder, Barcode } from 'lucide-react'
import { useCreateLocation, useUpdateLocation, useLocationsTree } from '@/hooks/finance/useStockLocations'
import { useWarehouses } from '@/hooks/useWarehouses'
import type { StockLocation, LocationTreeNode } from '@/types/stock'
import { formatNodePath } from '@/lib/stock/tree-utils'
import { logger } from '@quelyos/logger'
import { useMemo } from 'react'

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA DE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

const schema = z.object({
  name: z.string().min(1, 'Nom requis'),
  usage: z.enum(['internal', 'view', 'supplier', 'customer', 'inventory', 'transit']),
  warehouse_id: z.number().min(1, 'Entrepôt requis'),
  parent_id: z.number().optional(),
  barcode: z.string().optional(),
})

type FormData = z.infer<typeof schema>

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANT SELECT HIÉRARCHIQUE
// ═══════════════════════════════════════════════════════════════════════════

interface LocationTreeSelectProps {
  value?: number
  onChange: (value?: number) => void
  tree: LocationTreeNode[]
  excludeId?: number
  warehouseId?: number
  label: string
}

function LocationTreeSelect({ value, onChange, tree, excludeId, warehouseId, label }: LocationTreeSelectProps) {
  // Filtrer les locations par warehouse si spécifié
  const filteredTree = useMemo(() => {
    if (!warehouseId) return tree

    const filterByWarehouse = (nodes: LocationTreeNode[]): LocationTreeNode[] => {
      return nodes
        .filter(node => node.warehouse_id === warehouseId)
        .map(node => ({
          ...node,
          children: node.children ? filterByWarehouse(node.children as LocationTreeNode[]) : []
        }))
    }

    return filterByWarehouse(tree)
  }, [tree, warehouseId])

  // Aplatir l'arbre pour le select
  const flattenedOptions = useMemo(() => {
    const options: Array<{ value: number; label: string; level: number; disabled: boolean }> = []

    const traverse = (nodes: LocationTreeNode[], level = 0) => {
      nodes.forEach(node => {
        // Exclure le node lui-même (on ne peut pas être son propre parent)
        const isExcluded = excludeId === node.id

        options.push({
          value: node.id,
          label: node.name,
          level,
          disabled: isExcluded
        })

        if (node.children && node.children.length > 0) {
          traverse(node.children as LocationTreeNode[], level + 1)
        }
      })
    }

    traverse(filteredTree)
    return options
  }, [filteredTree, excludeId])

  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
        {label}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
      >
        <option value="">-- Aucun parent (racine) --</option>
        {flattenedOptions.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            style={{ paddingLeft: `${option.level * 20}px` }}
          >
            {'—'.repeat(option.level)} {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface LocationFormModalProps {
  isOpen: boolean
  onClose: () => void
  location?: StockLocation
  parentId?: number
  warehouseId?: number
  onSuccess?: () => void
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export function LocationFormModal({
  isOpen,
  onClose,
  location,
  parentId,
  warehouseId,
  onSuccess
}: LocationFormModalProps) {
  const mode = location ? 'edit' : 'create'

  const { mutate: createLocation, isPending: isCreating } = useCreateLocation()
  const { mutate: updateLocation, isPending: isUpdating } = useUpdateLocation()
  const { data: warehouses } = useWarehouses({ active_only: true })
  const { tree } = useLocationsTree()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: location?.name || '',
      usage: location?.usage || 'internal',
      warehouse_id: location?.warehouse_id || warehouseId || undefined,
      parent_id: location?.parent_id || parentId || undefined,
      barcode: location?.barcode || '',
    }
  })

  // Reset form quand la modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: location?.name || '',
        usage: location?.usage || 'internal',
        warehouse_id: location?.warehouse_id || warehouseId || undefined,
        parent_id: location?.parent_id || parentId || undefined,
        barcode: location?.barcode || '',
      })
    }
  }, [isOpen, location, parentId, warehouseId, form])

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedWarehouseId = form.watch('warehouse_id')
   
  const selectedParentId = form.watch('parent_id')

  // Construire la map pour preview path
  const locationMap = useMemo(() => {
    const map = new Map<number, LocationTreeNode>()
    const traverse = (nodes: LocationTreeNode[]) => {
      nodes.forEach(node => {
        map.set(node.id, node)
        if (node.children) traverse(node.children as LocationTreeNode[])
      })
    }
    traverse(tree)
    return map
  }, [tree])

  const previewPath = useMemo(() => {
    if (!selectedParentId) return null
    return formatNodePath(selectedParentId, locationMap)
  }, [selectedParentId, locationMap])

  const onSubmit = (data: FormData) => {
    if (mode === 'create') {
      // Validation : CreateLocationParams n'accepte que 'internal' | 'view'
      if (data.usage !== 'internal' && data.usage !== 'view') {
        alert('Type d\'emplacement invalide. Seuls "Stock physique" et "Catégorie" sont supportés.')
        return
      }

      createLocation(
        {
          name: data.name,
          usage: data.usage as 'internal' | 'view',
          warehouse_id: data.warehouse_id,
          parent_id: data.parent_id,
          barcode: data.barcode,
        },
        {
          onSuccess: () => {
            logger.info('[LocationFormModal] Location created')
            onClose()
            if (onSuccess) onSuccess()
          },
          onError: (error: Error) => {
            logger.error('[LocationFormModal] Create error:', error)
            alert(error.message || 'Erreur lors de la création')
          }
        }
      )
    } else if (location) {
      updateLocation(
        {
          id: location.id,
          name: data.name,
          parent_id: data.parent_id,
          barcode: data.barcode,
          // usage et warehouse_id sont immutables en mode edit
        },
        {
          onSuccess: () => {
            logger.info('[LocationFormModal] Location updated')
            onClose()
            if (onSuccess) onSuccess()
          },
          onError: (error: Error) => {
            logger.error('[LocationFormModal] Update error:', error)
            alert(error.message || 'Erreur lors de la mise à jour')
          }
        }
      )
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-gray-100">
              {mode === 'create' ? 'Créer un emplacement' : 'Modifier l\'emplacement'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 py-4 space-y-4">
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  <MapPin className="inline mr-2 h-4 w-4" />
                  Nom de l'emplacement *
                </label>
                <input
                  type="text"
                  {...form.register('name')}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Rayon A"
                />
                {form.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  Type d'emplacement *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`
                    flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors
                    ${form.watch('usage') === 'internal'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }
                    ${mode === 'edit' ? 'opacity-50 cursor-not-allowed' : ''}
                  `}>
                    <input
                      type="radio"
                      value="internal"
                      {...form.register('usage')}
                      disabled={mode === 'edit'}
                      className="sr-only"
                    />
                    <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white dark:text-gray-100">Stock physique</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Contient des produits</div>
                    </div>
                  </label>

                  <label className={`
                    flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors
                    ${form.watch('usage') === 'view'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }
                    ${mode === 'edit' ? 'opacity-50 cursor-not-allowed' : ''}
                  `}>
                    <input
                      type="radio"
                      value="view"
                      {...form.register('usage')}
                      disabled={mode === 'edit'}
                      className="sr-only"
                    />
                    <Folder className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white dark:text-gray-100">Catégorie</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Dossier organisationnel</div>
                    </div>
                  </label>
                </div>
                {mode === 'edit' && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Le type ne peut pas être modifié après création
                  </p>
                )}
              </div>

              {/* Entrepôt */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  Entrepôt *
                </label>
                <select
                  {...form.register('warehouse_id', { valueAsNumber: true })}
                  disabled={mode === 'edit'}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">-- Sélectionner --</option>
                  {warehouses?.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))}
                </select>
                {form.formState.errors.warehouse_id && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {form.formState.errors.warehouse_id.message}
                  </p>
                )}
                {mode === 'edit' && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    L'entrepôt ne peut pas être modifié après création
                  </p>
                )}
              </div>

              {/* Parent (sélecteur hiérarchique) */}
              {selectedWarehouseId && (
                <LocationTreeSelect
                  label="Emplacement parent (optionnel)"
                  value={selectedParentId}
                  onChange={(value) => form.setValue('parent_id', value)}
                  tree={tree}
                  excludeId={location?.id}
                  warehouseId={selectedWarehouseId}
                />
              )}

              {/* Preview path */}
              {previewPath && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <span className="font-semibold">Chemin complet :</span>
                    <br />
                    {previewPath} / {form.watch('name') || '...'}
                  </p>
                </div>
              )}

              {/* Code-barres */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  <Barcode className="inline mr-2 h-4 w-4" />
                  Code-barres (optionnel)
                </label>
                <input
                  type="text"
                  {...form.register('barcode')}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
                  placeholder="123456789"
                />
              </div>

              {/* Help text */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                <p className="font-semibold mb-1">💡 Type 'Catégorie' vs 'Stock physique'</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Stock physique</strong> : contient réellement des produits</li>
                  <li><strong>Catégorie</strong> : dossier organisationnel sans stock direct</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isCreating || isUpdating}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating || isUpdating
                  ? 'Enregistrement...'
                  : mode === 'create'
                  ? 'Créer'
                  : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
