/**
 * Modal d'ajustement stock avec raison et notes
 *
 * Remplace l'édition inline simple par un formulaire riche avec :
 * - Validation quantité >= 0
 * - Warning si écart > 20%
 * - Confirmation si écart < -50%
 * - Raison de l'ajustement (select)
 * - Notes optionnelles (textarea)
 */

import { useState, useEffect } from 'react'
import { Modal } from '../common/Modal'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { useUpdateProductStock } from '../../hooks/useStock'
import { useToast } from '../../contexts/ToastContext'
import { logger } from '@quelyos/logger'
import type { StockProduct } from '@/types'

interface StockAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  product: StockProduct
  onSuccess: () => void
}

type AdjustmentReason =
  | 'manual'
  | 'loss'
  | 'theft'
  | 'customer_return'
  | 'inventory_error'
  | 'other'

const REASONS: { value: AdjustmentReason; label: string }[] = [
  { value: 'manual', label: 'Ajustement manuel' },
  { value: 'loss', label: 'Perte' },
  { value: 'theft', label: 'Vol' },
  { value: 'customer_return', label: 'Retour client' },
  { value: 'inventory_error', label: 'Erreur inventaire' },
  { value: 'other', label: 'Autre' },
]

export function StockAdjustmentModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: StockAdjustmentModalProps) {
  const [newQuantity, setNewQuantity] = useState<string>('')
  const [reason, setReason] = useState<AdjustmentReason>('manual')
  const [notes, setNotes] = useState<string>('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [error, setError] = useState<string>('')

  const updateStockMutation = useUpdateProductStock()
  const toast = useToast()

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewQuantity('')
      setReason('manual')
      setNotes('')
      setShowConfirmation(false)
      setError('')
    }
  }, [isOpen, product.id])

  const currentQty = product.qty_available
  const parsedNewQty = parseFloat(newQuantity)
  const diff = isNaN(parsedNewQty) ? 0 : parsedNewQty - currentQty
  const diffPercent = currentQty !== 0 ? (diff / currentQty) * 100 : 0

  const isLargeDecrease = diffPercent < -50
  const isSignificantChange = Math.abs(diffPercent) > 20

  const getStockBadgeVariant = (
    status: 'in_stock' | 'low_stock' | 'out_of_stock'
  ): 'success' | 'warning' | 'error' => {
    if (status === 'in_stock') return 'success'
    if (status === 'low_stock') return 'warning'
    return 'error'
  }

  const getStockLabel = (status: 'in_stock' | 'low_stock' | 'out_of_stock') => {
    if (status === 'in_stock') return 'En stock'
    if (status === 'low_stock') return 'Stock faible'
    return 'Rupture'
  }

  const validateQuantity = (): boolean => {
    if (newQuantity === '') {
      setError('La nouvelle quantité est requise')
      return false
    }

    if (isNaN(parsedNewQty)) {
      setError('Quantité invalide')
      return false
    }

    if (parsedNewQty < 0) {
      setError('La quantité ne peut pas être négative')
      return false
    }

    setError('')
    return true
  }

  const handleSubmit = async () => {
    if (!validateQuantity()) {
      return
    }

    // Si c'est une grosse diminution et qu'on n'a pas encore confirmé
    if (isLargeDecrease && !showConfirmation) {
      setShowConfirmation(true)
      return
    }

    try {
      await updateStockMutation.mutateAsync({
        productId: product.id,
        quantity: parsedNewQty,
      })

      toast.success('Stock mis à jour avec succès')

      // Note : raison et notes stockées côté frontend uniquement (localStorage)
      // Pour MVP rapide. Migration future : API backend avec stock.move documenté
      const adjustmentLog = {
        productId: product.id,
        productName: product.name,
        oldQty: currentQty,
        newQty: parsedNewQty,
        reason,
        notes,
        timestamp: new Date().toISOString(),
      }

      try {
        const existingLogs = JSON.parse(localStorage.getItem('stock_adjustments') || '[]')
        existingLogs.push(adjustmentLog)
        localStorage.setItem('stock_adjustments', JSON.stringify(existingLogs))
      } catch (storageError) {
        logger.error('Failed to log adjustment to localStorage:', storageError)
      }

      onSuccess()
      onClose()
    } catch (err) {
      logger.error('Stock adjustment error:', err)
      toast.error('Erreur lors de la mise à jour du stock')
    }
  }

  const handleCancel = () => {
    if (showConfirmation) {
      setShowConfirmation(false)
    } else {
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title={showConfirmation ? 'Confirmer l\'ajustement' : 'Ajuster le stock'}
      confirmText={showConfirmation ? 'Confirmer quand même' : 'Valider'}
      cancelText={showConfirmation ? 'Retour' : 'Annuler'}
      loading={updateStockMutation.isPending}
      variant={showConfirmation ? 'danger' : 'default'}
      size="md"
      hideDefaultActions={showConfirmation}
    >
      {showConfirmation ? (
        <div className="py-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                Attention : Réduction importante
              </h4>
              <p className="text-sm text-red-800 dark:text-red-200">
                Vous êtes sur le point de retirer plus de 50% du stock actuel ({Math.abs(diff).toFixed(0)} unités, soit {Math.abs(diffPercent).toFixed(1)}%).
              </p>
              <p className="text-sm text-red-800 dark:text-red-200 mt-2">
                Êtes-vous certain de vouloir continuer ?
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCancel}>
              Retour
            </Button>
            <Button variant="danger" onClick={handleSubmit} loading={updateStockMutation.isPending}>
              Confirmer quand même
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Produit */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-12 h-12 object-cover rounded"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                <span className="text-gray-400 dark:text-gray-500 text-xs">N/A</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                {product.name}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {product.sku || 'Sans SKU'} • <Badge variant={getStockBadgeVariant(product.stock_status)}>
                  {getStockLabel(product.stock_status)}
                </Badge>
              </p>
            </div>
          </div>

          {/* Quantité actuelle */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
              Quantité actuelle
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={currentQty}
                disabled
                className="flex-1"
              />
              <Badge variant={getStockBadgeVariant(product.stock_status)}>
                {currentQty} unités
              </Badge>
            </div>
          </div>

          {/* Nouvelle quantité */}
          <div>
            <label htmlFor="newQuantity" className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
              Nouvelle quantité <span className="text-red-500">*</span>
            </label>
            <Input
              id="newQuantity"
              type="number"
              min="0"
              step="1"
              value={newQuantity}
              onChange={(e) => {
                setNewQuantity(e.target.value)
                setError('')
              }}
              placeholder="Entrez la nouvelle quantité"
              required
              aria-label="Nouvelle quantité"
              aria-describedby={error ? 'quantity-error' : 'quantity-helper'}
              className={error ? 'border-red-300 dark:border-red-700' : ''}
            />
            {error && (
              <p id="quantity-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
            {!error && newQuantity && !isNaN(parsedNewQty) && (
              <div id="quantity-helper" className="mt-2 flex items-center gap-2">
                <Badge variant={diff > 0 ? 'success' : diff < 0 ? 'error' : 'neutral'}>
                  {diff > 0 ? '+' : ''}{diff.toFixed(0)} unités
                </Badge>
                {isSignificantChange && (
                  <Badge variant="warning">
                    Écart important : {diffPercent > 0 ? '+' : ''}{diffPercent.toFixed(1)}%
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Raison */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
              Raison de l'ajustement <span className="text-red-500">*</span>
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as AdjustmentReason)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              aria-label="Raison de l'ajustement"
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
              Notes (optionnel)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              maxLength={500}
              rows={3}
              placeholder="Ajoutez des détails sur cet ajustement..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              aria-label="Notes"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
              {notes.length}/500 caractères
            </p>
          </div>
        </div>
      )}
    </Modal>
  )
}
