import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { Layout } from '../../components/Layout'
import {
  useOrder,
  useUpdateOrderStatus,
  useOrderTracking,
  useUpdateOrderTracking,
  useOrderHistory,
  useSendQuotation,
  useCreateInvoice,
  useUnlockOrder,
} from '../../hooks/useOrders'
import { Breadcrumbs, Skeleton, Modal } from '../../components/common'
import { useToast } from '../../contexts/ToastContext'
import { api } from '../../lib/api'
import { OrderHeader } from '../../components/orders/OrderHeader'
import { OrderCustomerInfo } from '../../components/orders/OrderCustomerInfo'
import { OrderTracking } from '../../components/orders/OrderTracking'
import { OrderLineItems } from '../../components/orders/OrderLineItems'
import { OrderSummary } from '../../components/orders/OrderSummary'
import { OrderHistory } from '../../components/orders/OrderHistory'
import { OrderActions } from '../../components/orders/OrderActions'

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const orderId = parseInt(id || '0', 10)
  const { data, isLoading, error } = useOrder(orderId)
  const { data: trackingData, isLoading: trackingLoading } = useOrderTracking(orderId)
  const { data: historyData, isLoading: historyLoading } = useOrderHistory(orderId)
  const updateStatus = useUpdateOrderStatus()
  const updateTracking = useUpdateOrderTracking()
  const sendQuotation = useSendQuotation()
  const createInvoice = useCreateInvoice()
  const unlockOrder = useUnlockOrder()
  const toast = useToast()

  const [actionModal, setActionModal] = useState<{ action: 'confirm' | 'cancel' | 'done'; message: string } | null>(
    null
  )

  const handleUpdateStatusConfirm = async () => {
    if (!orderId || !actionModal) return

    try {
      await updateStatus.mutateAsync({ id: orderId, action: actionModal.action })
      toast.success('Statut mis à jour avec succès')
      setActionModal(null)
    } catch (err) {
      toast.error('Erreur lors de la mise à jour du statut')
    }
  }

  const openActionModal = (action: 'confirm' | 'cancel' | 'done') => {
    const message = action === 'confirm' ? 'confirmer' : action === 'cancel' ? 'annuler' : 'marquer comme terminée'
    setActionModal({ action, message })
  }

  const handleDownloadDeliverySlip = async () => {
    if (!orderId) return

    try {
      const blob = await api.getDeliverySlipPDF(orderId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bon_livraison_${order?.name.replace('/', '_')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Bon de livraison téléchargé avec succès')
    } catch (err) {
      toast.error('Erreur lors du téléchargement du bon de livraison')
    }
  }

  const handleUpdateTracking = async (pickingId: number, trackingRef: string) => {
    if (!orderId) return

    try {
      await updateTracking.mutateAsync({
        orderId,
        pickingId,
        trackingRef,
      })
      toast.success('Numéro de suivi mis à jour avec succès')
    } catch (err) {
      toast.error('Erreur lors de la mise à jour du numéro de suivi')
    }
  }

  const handleSendQuotation = async () => {
    if (!orderId) return

    try {
      await sendQuotation.mutateAsync(orderId)
      toast.success('Devis envoyé par email avec succès')
    } catch (err) {
      toast.error("Erreur lors de l'envoi du devis")
    }
  }

  const handleCreateInvoice = async () => {
    if (!orderId) return

    try {
      const response = await createInvoice.mutateAsync(orderId)
      toast.success(`Facture ${response.data?.invoice?.name} créée avec succès`)
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Erreur lors de la création de la facture'
      toast.error(errorMsg)
    }
  }

  const handleUnlockOrder = async () => {
    if (!orderId) return

    try {
      await unlockOrder.mutateAsync(orderId)
      toast.success('Commande remise en brouillon avec succès')
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Erreur lors du déverrouillage de la commande'
      toast.error(errorMsg)
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8">
          <Breadcrumbs
            items={[
              { label: 'Tableau de bord', href: '/dashboard' },
              { label: 'Commandes', href: '/orders' },
              { label: 'Chargement...' },
            ]}
          />
          <div className="space-y-4 mt-8">
            <Skeleton variant="text" width="40%" height={36} />
            <Skeleton variant="text" width="60%" height={20} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              <div className="lg:col-span-2">
                <Skeleton height={300} />
              </div>
              <div>
                <Skeleton height={200} />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !data?.data?.order) {
    return (
      <Layout>
        <div className="p-4 md:p-8">
          <div className="text-center text-red-600 dark:text-red-400" role="alert">
            Erreur lors du chargement de la commande
          </div>
        </div>
      </Layout>
    )
  }

  const order = data.data.order

  return (
    <Layout>
      <div className="p-4 md:p-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Commandes', href: '/orders' },
            { label: order.name },
          ]}
        />

        {/* Header */}
        <OrderHeader orderName={order.name} orderDate={order.date_order} orderState={order.state} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche : Infos, tracking, articles */}
          <div className="lg:col-span-2 space-y-6">
            <OrderCustomerInfo customer={order.customer} />

            <OrderTracking
              trackingInfo={trackingData?.data?.tracking_info || []}
              isLoading={trackingLoading}
              onUpdateTracking={handleUpdateTracking}
              isUpdating={updateTracking.isPending}
            />

            <OrderLineItems lines={order.lines as any} />
          </div>

          {/* Colonne droite : Résumé, historique, actions */}
          <div className="space-y-6">
            <OrderSummary
              amountUntaxed={order.amount_untaxed ?? 0}
              amountTax={order.amount_tax ?? 0}
              amountTotal={order.amount_total ?? 0}
            />

            <OrderHistory history={historyData?.data?.history || []} isLoading={historyLoading} />

            <OrderActions
              orderState={order.state}
              onConfirm={() => openActionModal('confirm')}
              onCancel={() => openActionModal('cancel')}
              onMarkDone={() => openActionModal('done')}
              onSendQuotation={handleSendQuotation}
              onCreateInvoice={handleCreateInvoice}
              onDownloadDeliverySlip={handleDownloadDeliverySlip}
              onUnlock={handleUnlockOrder}
              isUpdating={updateStatus.isPending}
              isSendingQuote={sendQuotation.isPending}
              isCreatingInvoice={createInvoice.isPending}
              isUnlocking={unlockOrder.isPending}
            />
          </div>
        </div>

        {/* Modal de confirmation */}
        <Modal
          isOpen={!!actionModal}
          onClose={() => setActionModal(null)}
          onConfirm={handleUpdateStatusConfirm}
          title="Confirmer l'action"
          description={`Êtes-vous sûr de vouloir ${actionModal?.message} cette commande ?`}
          confirmText="Confirmer"
          cancelText="Annuler"
          variant={actionModal?.action === 'cancel' ? 'danger' : 'default'}
          loading={updateStatus.isPending}
        />
      </div>
    </Layout>
  )
}
