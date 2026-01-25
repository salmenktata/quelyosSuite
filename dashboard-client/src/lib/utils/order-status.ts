/**
 * Utilitaires pour gérer les statuts de commande Odoo
 */

export type OrderState = 'draft' | 'sent' | 'sale' | 'done' | 'cancel'

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

/**
 * Retourne le variant de badge approprié pour un état de commande
 */
export function getOrderStatusVariant(state: OrderState | string): BadgeVariant {
  switch (state) {
    case 'sale':
    case 'done':
      return 'success'
    case 'sent':
      return 'info'
    case 'cancel':
      return 'error'
    case 'draft':
    default:
      return 'neutral'
  }
}

/**
 * Retourne le label français pour un état de commande
 */
export function getOrderStatusLabel(state: OrderState | string): string {
  switch (state) {
    case 'draft':
      return 'Brouillon'
    case 'sent':
      return 'Envoyé'
    case 'sale':
      return 'Confirmé'
    case 'done':
      return 'Terminé'
    case 'cancel':
      return 'Annulé'
    default:
      return state
  }
}

/**
 * Vérifie si une commande peut être confirmée
 */
export function canConfirmOrder(state: OrderState | string): boolean {
  return state === 'draft'
}

/**
 * Vérifie si une commande peut être annulée
 */
export function canCancelOrder(state: OrderState | string): boolean {
  return state === 'draft' || state === 'sent' || state === 'sale'
}

/**
 * Vérifie si une commande peut être marquée comme terminée
 */
export function canMarkAsDone(state: OrderState | string): boolean {
  return state === 'sale'
}

/**
 * Vérifie si un devis peut être envoyé
 */
export function canSendQuotation(state: OrderState | string): boolean {
  return state === 'draft' || state === 'sent'
}

/**
 * Vérifie si une facture peut être créée
 */
export function canCreateInvoice(state: OrderState | string): boolean {
  return state === 'sale' || state === 'done'
}

/**
 * Vérifie si un bon de livraison peut être téléchargé
 */
export function canDownloadDeliverySlip(state: OrderState | string): boolean {
  return state === 'sale' || state === 'done'
}

/**
 * Vérifie si une commande peut être remise en brouillon
 */
export function canUnlockOrder(state: OrderState | string): boolean {
  return state === 'sent' || state === 'sale' || state === 'done'
}
