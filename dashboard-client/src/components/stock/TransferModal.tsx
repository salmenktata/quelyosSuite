import { useState, useMemo } from 'react'
import { Modal, Button, Input } from '../common'
import { useStockLocations, useCreateTransfer } from '../../hooks/useStockTransfers'
import { useWarehouses } from '../../hooks/useWarehouses'
import { useStockProducts } from '../../hooks/useStock'
import { useToast } from '../../contexts/ToastContext'
import { ArrowLeftRight, Search, AlertTriangle } from 'lucide-react'
import type { StockProduct, StockLocation } from '@/types'

interface TransferModalProps {
  onClose: () => void
  onSuccess: () => void
}

type Step = 'product' | 'locations' | 'confirm'

export function TransferModal({ onClose, onSuccess }: TransferModalProps) {
  const [step, setStep] = useState<Step>('product')
  const [productSearch, setProductSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<StockProduct | null>(null)
  const [quantity, setQuantity] = useState('')
  const [fromWarehouseId, setFromWarehouseId] = useState<number | null>(null)
  const [fromLocationId, setFromLocationId] = useState<number | null>(null)
  const [toWarehouseId, setToWarehouseId] = useState<number | null>(null)
  const [toLocationId, setToLocationId] = useState<number | null>(null)
  const [note, setNote] = useState('')

  const toast = useToast()
  const createMutation = useCreateTransfer()

  // Données
  const { data: productsData, isLoading: loadingProducts } = useStockProducts({
    limit: 20,
    search: productSearch || undefined,
  })

  const { data: warehouses } = useWarehouses({ active_only: true })

  const { data: fromLocationsData } = useStockLocations({
    warehouse_id: fromWarehouseId || undefined,
    internal_only: true,
  })

  const { data: toLocationsData } = useStockLocations({
    warehouse_id: toWarehouseId || undefined,
    internal_only: true,
  })

  const products = ((productsData?.items || productsData?.data) as StockProduct[]) || []
  const fromLocations = useMemo(() =>
    fromLocationsData?.data?.locations || [],
    [fromLocationsData]
  )
  const toLocations = useMemo(() =>
    toLocationsData?.data?.locations || [],
    [toLocationsData]
  )

  // Validation
  const quantityNum = parseFloat(quantity) || 0
  const isQuantityValid = quantityNum > 0
  const isOverStock = selectedProduct && quantityNum > selectedProduct.qty_available
  const canProceedToLocations = selectedProduct && isQuantityValid
  const canProceedToConfirm = fromLocationId && toLocationId && fromLocationId !== toLocationId

  const selectedFromLocation = useMemo(
    () => fromLocations.find((l: StockLocation) => l.id === fromLocationId),
    [fromLocations, fromLocationId]
  )

  const selectedToLocation = useMemo(
    () => toLocations.find((l: StockLocation) => l.id === toLocationId),
    [toLocations, toLocationId]
  )

  const handleSelectProduct = (product: StockProduct) => {
    setSelectedProduct(product)
    setQuantity('1')
  }

  const handleSubmit = async () => {
    if (!selectedProduct || !fromLocationId || !toLocationId) return

    try {
      const result = await createMutation.mutateAsync({
        product_id: selectedProduct.id,
        quantity: quantityNum,
        from_location_id: fromLocationId,
        to_location_id: toLocationId,
        note: note || undefined,
      })

      if (result.success) {
        onSuccess()
      } else {
        toast.error(result.error || 'Erreur lors de la création')
      }
    } catch {
      toast.error('Erreur lors de la création du transfert')
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {(['product', 'locations', 'confirm'] as Step[]).map((s, i) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === s
                ? 'bg-indigo-600 text-white'
                : i < ['product', 'locations', 'confirm'].indexOf(step)
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            {i + 1}
          </div>
          {i < 2 && (
            <div
              className={`w-12 h-1 mx-1 ${
                i < ['product', 'locations', 'confirm'].indexOf(step)
                  ? 'bg-green-600'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )

  return (
    <Modal isOpen={true} onClose={onClose} title="Nouveau transfert" size="lg">
      {renderStepIndicator()}

      {/* Étape 1 : Sélection produit */}
      {step === 'product' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          {selectedProduct && (
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center gap-4">
                {selectedProduct.image_url && (
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedProduct.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Stock: {selectedProduct.qty_available} | SKU: {selectedProduct.sku || '-'}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  Quantité à transférer
                </label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  max={selectedProduct.qty_available}
                  className="w-32"
                />
                {isOverStock && (
                  <p className="mt-1 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Quantité supérieure au stock disponible
                  </p>
                )}
              </div>
            </div>
          )}

          {!selectedProduct && (
            <div className="max-h-64 overflow-y-auto space-y-1">
              {loadingProducts ? (
                <p className="text-center py-4 text-gray-500">Chargement...</p>
              ) : products.length === 0 ? (
                <p className="text-center py-4 text-gray-500">Aucun produit trouvé</p>
              ) : (
                products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className="w-full p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                  >
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Stock: {product.qty_available}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button
              variant="primary"
              disabled={!canProceedToLocations}
              onClick={() => setStep('locations')}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Étape 2 : Sélection locations */}
      {step === 'locations' && (
        <div className="space-y-6">
          {/* Source */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
              Entrepôt source
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Entrepôt</label>
                <select
                  value={fromWarehouseId || ''}
                  onChange={(e) => {
                    setFromWarehouseId(e.target.value ? parseInt(e.target.value) : null)
                    setFromLocationId(null)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Sélectionner...</option>
                  {warehouses?.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Emplacement</label>
                <select
                  value={fromLocationId || ''}
                  onChange={(e) => setFromLocationId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  disabled={!fromWarehouseId}
                >
                  <option value="">Sélectionner...</option>
                  {fromLocations.map((l: StockLocation) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowLeftRight className="h-6 w-6 text-gray-400 rotate-90" />
          </div>

          {/* Destination */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
              Entrepôt destination
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Entrepôt</label>
                <select
                  value={toWarehouseId || ''}
                  onChange={(e) => {
                    setToWarehouseId(e.target.value ? parseInt(e.target.value) : null)
                    setToLocationId(null)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Sélectionner...</option>
                  {warehouses?.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Emplacement</label>
                <select
                  value={toLocationId || ''}
                  onChange={(e) => setToLocationId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  disabled={!toWarehouseId}
                >
                  <option value="">Sélectionner...</option>
                  {toLocations
                    .filter((l: StockLocation) => l.id !== fromLocationId)
                    .map((l: StockLocation) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
              Note (optionnel)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              placeholder="Raison du transfert..."
            />
          </div>

          <div className="flex justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" onClick={() => setStep('product')}>
              Retour
            </Button>
            <Button
              variant="primary"
              disabled={!canProceedToConfirm}
              onClick={() => setStep('confirm')}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Étape 3 : Confirmation */}
      {step === 'confirm' && selectedProduct && (
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-gray-900 dark:text-white">Récapitulatif</h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Produit</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedProduct.name}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Quantité</p>
                <p className="font-medium text-gray-900 dark:text-white">{quantity}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">De</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedFromLocation?.complete_name}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Vers</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedToLocation?.complete_name}
                </p>
              </div>
            </div>

            {note && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Note</p>
                <p className="text-gray-900 dark:text-white text-sm">{note}</p>
              </div>
            )}
          </div>

          {isOverStock && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-lg text-sm">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p>
                La quantité demandée dépasse le stock disponible. Le transfert sera créé mais pourrait échouer à la validation.
              </p>
            </div>
          )}

          <div className="flex justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" onClick={() => setStep('locations')}>
              Retour
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Création...' : 'Créer le transfert'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
