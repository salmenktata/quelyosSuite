import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { X, Package, Warehouse, TrendingUp, Info } from 'lucide-react'
import { useCreateReorderingRule, useUpdateReorderingRule } from '@/hooks/finance/useReorderingRules'
import { useWarehouses } from '@/hooks/useWarehouses'
import { useProducts } from '@/hooks/useProducts'
import type { ReorderingRule } from '@/types/stock'
import { logger } from '@quelyos/logger'

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA DE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

const schema = z.object({
  product_id: z.number().min(1, 'Sélectionnez un produit'),
  warehouse_id: z.number().min(1, 'Sélectionnez un entrepôt'),
  product_min_qty: z.number().min(0, 'Quantité minimum doit être ≥ 0'),
  product_max_qty: z.number().min(1, 'Quantité maximum doit être ≥ 1'),
  qty_multiple: z.number().min(1, 'Multiple doit être ≥ 1').default(1),
}).refine(data => data.product_min_qty < data.product_max_qty, {
  message: 'Seuil minimum doit être inférieur au seuil maximum',
  path: ['product_max_qty']
})

type FormData = z.infer<typeof schema>

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface ReorderingRuleFormModalProps {
  isOpen: boolean
  onClose: () => void
  rule?: ReorderingRule
  onSuccess?: () => void
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export function ReorderingRuleFormModal({
  isOpen,
  onClose,
  rule,
  onSuccess
}: ReorderingRuleFormModalProps) {
  const mode = rule ? 'edit' : 'create'

  const { mutate: createRule, isPending: isCreating } = useCreateReorderingRule()
  const { mutate: updateRule, isPending: isUpdating } = useUpdateReorderingRule()
  const { data: warehousesData } = useWarehouses({ active_only: true })
  const { data: productsData } = useProducts({ active_only: true })

  const warehouses = warehousesData || []
  const products = productsData?.products || []

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      product_id: rule?.product_id || undefined,
      warehouse_id: rule?.warehouse_id || undefined,
      product_min_qty: rule?.min_qty || 10,
      product_max_qty: rule?.max_qty || 50,
      qty_multiple: rule?.qty_multiple || 1,
    }
  })

  // Reset form quand la modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      form.reset({
        product_id: rule?.product_id || undefined,
        warehouse_id: rule?.warehouse_id || undefined,
        product_min_qty: rule?.min_qty || 10,
        product_max_qty: rule?.max_qty || 50,
        qty_multiple: rule?.qty_multiple || 1,
      })
    }
  }, [isOpen, rule, form])

  const selectedProductId = form.watch('product_id')
  const selectedWarehouseId = form.watch('warehouse_id')
  const minQty = form.watch('product_min_qty')
  const maxQty = form.watch('product_max_qty')
  const multiple = form.watch('qty_multiple')

  // Récupérer le produit sélectionné
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId)
  }, [products, selectedProductId])

  // Simuler le stock actuel (dans une vraie implémentation, on ferait un appel API)
  const currentStock = rule?.current_stock || selectedProduct?.qty_available || 0

  // Calculer preview quantité à commander
  const willTrigger = currentStock < minQty
  const qtyToOrder = useMemo(() => {
    if (!willTrigger) return 0
    const qtyNeeded = maxQty - currentStock
    if (multiple > 1) {
      return Math.ceil(qtyNeeded / multiple) * multiple
    }
    return qtyNeeded
  }, [willTrigger, maxQty, currentStock, multiple])

  const onSubmit = (data: FormData) => {
    if (mode === 'create') {
      createRule(
        data,
        {
          onSuccess: () => {
            logger.info('[ReorderingRuleFormModal] Rule created')
            onClose()
            if (onSuccess) onSuccess()
          },
          onError: (error: any) => {
            logger.error('[ReorderingRuleFormModal] Create error:', error)
            alert(error.message || 'Erreur lors de la création')
          }
        }
      )
    } else if (rule) {
      updateRule(
        {
          id: rule.id,
          product_min_qty: data.product_min_qty,
          product_max_qty: data.product_max_qty,
          qty_multiple: data.qty_multiple,
        },
        {
          onSuccess: () => {
            logger.info('[ReorderingRuleFormModal] Rule updated')
            onClose()
            if (onSuccess) onSuccess()
          },
          onError: (error: any) => {
            logger.error('[ReorderingRuleFormModal] Update error:', error)
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {mode === 'create' ? 'Créer une règle de réapprovisionnement' : 'Modifier la règle'}
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
              {/* Produit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Package className="inline mr-2 h-4 w-4" />
                  Produit *
                </label>
                <select
                  {...form.register('product_id', { valueAsNumber: true })}
                  disabled={mode === 'edit'}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">-- Sélectionner un produit --</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} {product.default_code ? `(${product.default_code})` : ''}
                    </option>
                  ))}
                </select>
                {form.formState.errors.product_id && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {form.formState.errors.product_id.message}
                  </p>
                )}
                {mode === 'edit' && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Le produit ne peut pas être modifié après création
                  </p>
                )}
              </div>

              {/* Afficher stock actuel */}
              {selectedProductId && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    Stock actuel : <strong className={currentStock < minQty ? 'text-orange-600 dark:text-orange-400' : ''}>
                      {currentStock} unités
                    </strong>
                  </p>
                </div>
              )}

              {/* Entrepôt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Warehouse className="inline mr-2 h-4 w-4" />
                  Entrepôt *
                </label>
                <select
                  {...form.register('warehouse_id', { valueAsNumber: true })}
                  disabled={mode === 'edit'}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">-- Sélectionner un entrepôt --</option>
                  {warehouses.map((wh) => (
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

              {/* Seuils */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <TrendingUp className="inline mr-2 h-4 w-4" />
                    Seuil minimum *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...form.register('product_min_qty', { valueAsNumber: true })}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="10"
                  />
                  {form.formState.errors.product_min_qty && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {form.formState.errors.product_min_qty.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Déclenche la commande si stock &lt; seuil
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Seuil maximum *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...form.register('product_max_qty', { valueAsNumber: true })}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="50"
                  />
                  {form.formState.errors.product_max_qty && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {form.formState.errors.product_max_qty.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Quantité cible après réapprovisionnement
                  </p>
                </div>
              </div>

              {/* Quantité multiple */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantité multiple (optionnel)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...form.register('qty_multiple', { valueAsNumber: true })}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="1"
                  defaultValue={1}
                />
                {form.formState.errors.qty_multiple && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {form.formState.errors.qty_multiple.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Commander par lots de X unités (ex: 12 pour cartons de 12)
                </p>
              </div>

              {/* Preview calcul */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Simulation</h4>
                    <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                      <p>Stock actuel : <strong>{currentStock}</strong> unités</p>
                      <p>Seuil alerte : <strong>{minQty}</strong> unités</p>
                      <p>Seuil maximum : <strong>{maxQty}</strong> unités</p>
                      {multiple > 1 && <p>Multiple commande : <strong>{multiple}</strong></p>}

                      <div className="mt-3 pt-3 border-t border-blue-300 dark:border-blue-700">
                        {willTrigger ? (
                          <p className="font-semibold text-orange-600 dark:text-orange-400">
                            ⚠️ Une commande de <strong>{qtyToOrder} unités</strong> sera automatiquement déclenchée
                          </p>
                        ) : (
                          <p className="text-green-700 dark:text-green-400">
                            ✅ Stock suffisant, aucune commande nécessaire
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
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
                  ? 'Créer la règle'
                  : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
