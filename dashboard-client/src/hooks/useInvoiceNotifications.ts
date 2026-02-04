/**
 * Hook notifications temps réel factures via WebSocket
 *
 * Écoute les événements factures et invalide le cache TanStack Query automatiquement :
 * - invoice.created : Nouvelle facture créée
 * - invoice.validated : Facture validée (brouillon → posted)
 * - invoice.paid : Facture payée
 * - invoice.overdue : Facture en retard
 * - invoice.cancelled : Facture annulée
 *
 * @example
 * useInvoiceNotifications({
 *   onInvoiceCreated: (data) => toast.info(`Facture ${data.name} créée`),
 *   onInvoicePaid: (data) => toast.success(`Paiement reçu !`),
 * })
 */

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { wsClient, type WSMessage } from '@/lib/websocket'

// Types événements
interface InvoiceEventData {
  id: number
  name: string
  partner_name?: string
  amount_total?: number
  state?: string
  payment_state?: string
  user_name?: string // Utilisateur ayant fait l'action
}

interface InvoiceNotificationCallbacks {
  onInvoiceCreated?: (data: InvoiceEventData) => void
  onInvoiceValidated?: (data: InvoiceEventData) => void
  onInvoicePaid?: (data: InvoiceEventData) => void
  onInvoiceOverdue?: (data: InvoiceEventData) => void
  onInvoiceCancelled?: (data: InvoiceEventData) => void
  onInvoiceUpdated?: (data: InvoiceEventData) => void
}

/**
 * Hook notifications factures temps réel
 */
export function useInvoiceNotifications(callbacks: InvoiceNotificationCallbacks = {}) {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Connexion WebSocket si pas déjà connecté
    if (!wsClient.isConnected()) {
      wsClient.connect()
    }

    // Handler messages WebSocket
    const handleInvoiceEvent = (message: WSMessage) => {
      if (message.channel !== 'invoices') return

      const data = message.data as InvoiceEventData

      // Invalider cache TanStack Query (force refresh)
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice', data.id] })
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] })

      // Traiter selon type événement
      switch (message.event) {
        case 'invoice.created':
          callbacks.onInvoiceCreated?.(data)
          // Toast par défaut si pas de callback custom
          if (!callbacks.onInvoiceCreated) {
            toast.info(`Nouvelle facture créée : ${data.name}`, {
              description: data.user_name ? `Par ${data.user_name}` : undefined,
            })
          }
          break

        case 'invoice.validated':
          callbacks.onInvoiceValidated?.(data)
          if (!callbacks.onInvoiceValidated) {
            toast.success(`Facture validée : ${data.name}`, {
              description: data.partner_name || undefined,
            })
          }
          break

        case 'invoice.paid':
          callbacks.onInvoicePaid?.(data)
          if (!callbacks.onInvoicePaid) {
            toast.success(`Paiement reçu : ${data.name}`, {
              description: data.amount_total
                ? `Montant : ${data.amount_total.toFixed(2)} €`
                : undefined,
              duration: 5000,
            })
          }
          break

        case 'invoice.overdue':
          callbacks.onInvoiceOverdue?.(data)
          if (!callbacks.onInvoiceOverdue) {
            toast.warning(`Facture en retard : ${data.name}`, {
              description: data.partner_name || undefined,
              duration: 10000, // 10s pour les alertes importantes
            })
          }
          break

        case 'invoice.cancelled':
          callbacks.onInvoiceCancelled?.(data)
          if (!callbacks.onInvoiceCancelled) {
            toast.error(`Facture annulée : ${data.name}`)
          }
          break

        case 'invoice.updated':
          callbacks.onInvoiceUpdated?.(data)
          // Pas de toast par défaut pour les updates (trop verbeux)
          break

        default:
          break
      }
    }

    // S'abonner au channel 'invoices'
    const unsubscribe = wsClient.subscribe('invoices', handleInvoiceEvent)

    // Nettoyage
    return () => {
      unsubscribe()
    }
  }, [queryClient, callbacks])
}

/**
 * Hook status connexion WebSocket
 */
export function useWebSocketStatus() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(wsClient.isConnected())
    }

    // Check initial
    checkConnection()

    // Check toutes les 5 secondes
    const interval = setInterval(checkConnection, 5000)

    return () => clearInterval(interval)
  }, [])

  return { isConnected }
}

// Fix import manquant
import { useState } from 'react'
