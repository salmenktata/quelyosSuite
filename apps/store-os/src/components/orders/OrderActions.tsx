import { Button } from '../common'
import { Download, Mail, FileText, Undo2 } from 'lucide-react'
import {
  canConfirmOrder,
  canCancelOrder,
  canMarkAsDone,
  canSendQuotation,
  canCreateInvoice,
  canDownloadDeliverySlip,
  canUnlockOrder,
} from '../../lib/utils/order-status'

interface OrderActionsProps {
  orderState: string
  onConfirm: () => void
  onCancel: () => void
  onMarkDone: () => void
  onSendQuotation: () => void
  onCreateInvoice: () => void
  onDownloadDeliverySlip: () => void
  onUnlock: () => void
  isUpdating: boolean
  isSendingQuote: boolean
  isCreatingInvoice: boolean
  isUnlocking: boolean
}

/**
 * Boutons d'actions contextuels selon l'état de la commande
 * Affiche uniquement les actions disponibles pour l'état actuel
 */
export function OrderActions({
  orderState,
  onConfirm,
  onCancel,
  onMarkDone,
  onSendQuotation,
  onCreateInvoice,
  onDownloadDeliverySlip,
  onUnlock,
  isUpdating,
  isSendingQuote,
  isCreatingInvoice,
  isUnlocking,
}: OrderActionsProps) {
  const hasActions =
    canConfirmOrder(orderState) ||
    canCancelOrder(orderState) ||
    canMarkAsDone(orderState) ||
    canSendQuotation(orderState) ||
    canCreateInvoice(orderState) ||
    canDownloadDeliverySlip(orderState) ||
    canUnlockOrder(orderState)

  if (!hasActions) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6">
      <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h2>

      <div className="space-y-3">
        {/* Confirmer la commande */}
        {canConfirmOrder(orderState) && (
          <Button
            variant="primary"
            className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
            onClick={onConfirm}
            disabled={isUpdating}
            loading={isUpdating}
          >
            Confirmer la commande
          </Button>
        )}

        {/* Annuler la commande */}
        {canCancelOrder(orderState) && (
          <Button
            variant="danger"
            className="w-full"
            onClick={onCancel}
            disabled={isUpdating}
            loading={isUpdating}
          >
            Annuler la commande
          </Button>
        )}

        {/* Marquer comme terminée */}
        {canMarkAsDone(orderState) && (
          <Button variant="primary" className="w-full" onClick={onMarkDone} disabled={isUpdating} loading={isUpdating}>
            Marquer comme terminée
          </Button>
        )}

        {/* Envoyer devis par email */}
        {canSendQuotation(orderState) && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={onSendQuotation}
            disabled={isSendingQuote}
            loading={isSendingQuote}
            icon={<Mail className="h-5 w-5" />}
          >
            Envoyer devis par email
          </Button>
        )}

        {/* Créer facture */}
        {canCreateInvoice(orderState) && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={onCreateInvoice}
            disabled={isCreatingInvoice}
            loading={isCreatingInvoice}
            icon={<FileText className="h-5 w-5" />}
          >
            Créer facture
          </Button>
        )}

        {/* Télécharger bon de livraison */}
        {canDownloadDeliverySlip(orderState) && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={onDownloadDeliverySlip}
            icon={<Download className="h-5 w-5" />}
          >
            Télécharger bon de livraison
          </Button>
        )}

        {/* Remettre en brouillon */}
        {canUnlockOrder(orderState) && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={onUnlock}
            disabled={isUnlocking}
            loading={isUnlocking}
            icon={<Undo2 className="h-5 w-5" />}
          >
            Remettre en brouillon
          </Button>
        )}
      </div>
    </div>
  )
}
