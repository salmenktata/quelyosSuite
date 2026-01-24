import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { Layout } from '../components/Layout'
import {
  useOrder,
  useUpdateOrderStatus,
  useOrderTracking,
  useUpdateOrderTracking,
  useOrderHistory,
  useSendQuotation,
  useCreateInvoice,
  useUnlockOrder,
} from '../hooks/useOrders'
import { Badge, Button, Breadcrumbs, Skeleton, Modal } from '../components/common'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/common/Toast'
import { api } from '../lib/api'
import {
  DocumentArrowDownIcon,
  TruckIcon,
  PencilIcon,
  ClockIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline'

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
  const [editingTracking, setEditingTracking] = useState<{ pickingId: number; trackingRef: string } | null>(null)

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
    const message =
      action === 'confirm'
        ? 'confirmer'
        : action === 'cancel'
        ? 'annuler'
        : 'marquer comme terminée'
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

  const handleSaveTracking = async () => {
    if (!editingTracking || !orderId) return

    try {
      await updateTracking.mutateAsync({
        orderId,
        pickingId: editingTracking.pickingId,
        trackingRef: editingTracking.trackingRef,
      })
      setEditingTracking(null)
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
      toast.error('Erreur lors de l\'envoi du devis')
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

  const getStatusVariant = (state: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
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

  const getStatusLabel = (state: string) => {
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
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
        <div className="p-8">
          <div className="text-center text-red-600 dark:text-red-400">
            Erreur lors du chargement de la commande
          </div>
        </div>
      </Layout>
    )
  }

  const order = data.data.order

  return (
    <Layout>
      <div className="p-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Commandes', href: '/orders' },
            { label: order.name },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Commande {order.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Passée le {formatDate(order.date_order)}</p>
            </div>

            <Badge variant={getStatusVariant(order.state)} size="lg">
              {getStatusLabel(order.state)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations client */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations client</h2>
              {order.customer ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Nom</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{order.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{order.customer.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Téléphone</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.customer.phone || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Adresse</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.customer.street || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Ville</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.customer.zip} {order.customer.city}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pays</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.customer.country || '-'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-300">Aucune information client</p>
              )}
            </div>

            {/* Suivi colis */}
            {trackingLoading ? (
              <Skeleton height={150} />
            ) : trackingData?.data?.tracking_info && trackingData.data.tracking_info.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <TruckIcon className="h-5 w-5" />
                  Suivi colis
                </h2>
                <div className="space-y-4">
                  {trackingData.data.tracking_info.map((tracking: any) => (
                    <div
                      key={tracking.picking_id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {tracking.picking_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {tracking.state_label}
                          </p>
                        </div>
                        <Badge variant={tracking.state === 'done' ? 'success' : 'info'}>
                          {tracking.state_label}
                        </Badge>
                      </div>

                      {editingTracking?.pickingId === tracking.picking_id && editingTracking ? (
                        <div className="flex items-center gap-2 mt-3">
                          <input
                            type="text"
                            value={editingTracking.trackingRef}
                            onChange={(e) =>
                              setEditingTracking({
                                pickingId: editingTracking.pickingId,
                                trackingRef: e.target.value,
                              })
                            }
                            placeholder="Numéro de suivi"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                          />
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={handleSaveTracking}
                            disabled={updateTracking.isPending}
                          >
                            Enregistrer
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingTracking(null)}
                          >
                            Annuler
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-3">
                          {tracking.carrier_tracking_ref ? (
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Numéro de suivi :
                                </p>
                                {tracking.carrier_tracking_url ? (
                                  <a
                                    href={tracking.carrier_tracking_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-mono text-indigo-600 dark:text-indigo-400 hover:underline"
                                  >
                                    {tracking.carrier_tracking_ref}
                                  </a>
                                ) : (
                                  <p className="text-sm font-mono text-gray-900 dark:text-white">
                                    {tracking.carrier_tracking_ref}
                                  </p>
                                )}
                                {tracking.carrier_name && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Transporteur : {tracking.carrier_name}
                                  </p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={<PencilIcon className="h-4 w-4" />}
                                onClick={() =>
                                  setEditingTracking({
                                    pickingId: tracking.picking_id,
                                    trackingRef: tracking.carrier_tracking_ref,
                                  })
                                }
                              >
                                Modifier
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setEditingTracking({
                                  pickingId: tracking.picking_id,
                                  trackingRef: '',
                                })
                              }
                            >
                              Ajouter un numéro de suivi
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Lignes de commande */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Articles</h2>
              </div>

              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Prix unitaire
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                  {order.lines.map((line) => (
                    <tr key={line.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {line.product.image && (
                            <img
                              src={line.product.image}
                              alt={line.product.name}
                              className="w-12 h-12 rounded-lg object-cover mr-4"
                            />
                          )}
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {line.product.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{formatPrice(line.price_unit)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{line.quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatPrice(line.price_total)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Résumé et actions */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Résumé</h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Sous-total</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(order.amount_untaxed)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">TVA</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(order.amount_tax)}
                  </span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
                  <span className="text-base font-semibold text-gray-900 dark:text-white">Total</span>
                  <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                    {formatPrice(order.amount_total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Historique */}
            {historyLoading ? (
              <Skeleton height={300} />
            ) : historyData?.data?.history && historyData.data.history.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  Historique
                </h2>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {historyData.data.history.map((item) => (
                    <div
                      key={item.id}
                      className="border-l-2 border-gray-200 dark:border-gray-700 pl-4 pb-4"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.author}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.date ? formatDate(item.date) : '-'}
                        </p>
                      </div>

                      {item.tracking_values && item.tracking_values.length > 0 ? (
                        <div className="space-y-1">
                          {item.tracking_values.map((tracking, idx) => (
                            <div key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-medium">{tracking.field_desc} : </span>
                              <span className="line-through text-red-600 dark:text-red-400">
                                {tracking.old_value || '(vide)'}
                              </span>
                              {' → '}
                              <span className="text-green-600 dark:text-green-400">
                                {tracking.new_value || '(vide)'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : item.body ? (
                        <div
                          className="text-xs text-gray-600 dark:text-gray-400 prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: item.body.replace(/<[^>]*>/g, '').substring(0, 200),
                          }}
                        />
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                          {item.subtype || item.message_type}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h2>

              <div className="space-y-3">
                {order.state === 'draft' && (
                  <Button
                    variant="primary"
                    className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                    onClick={() => openActionModal('confirm')}
                    disabled={updateStatus.isPending}
                  >
                    Confirmer la commande
                  </Button>
                )}

                {(order.state === 'draft' || order.state === 'sent' || order.state === 'sale') && (
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={() => openActionModal('cancel')}
                    disabled={updateStatus.isPending}
                  >
                    Annuler la commande
                  </Button>
                )}

                {order.state === 'sale' && (
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => openActionModal('done')}
                    disabled={updateStatus.isPending}
                  >
                    Marquer comme terminée
                  </Button>
                )}

                {/* Envoyer devis par email */}
                {(order.state === 'draft' || order.state === 'sent') && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={handleSendQuotation}
                    disabled={sendQuotation.isPending}
                    loading={sendQuotation.isPending}
                    icon={<EnvelopeIcon className="h-5 w-5" />}
                  >
                    Envoyer devis par email
                  </Button>
                )}

                {/* Créer facture */}
                {(order.state === 'sale' || order.state === 'done') && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={handleCreateInvoice}
                    disabled={createInvoice.isPending}
                    loading={createInvoice.isPending}
                    icon={<DocumentTextIcon className="h-5 w-5" />}
                  >
                    Créer facture
                  </Button>
                )}

                {/* Télécharger bon de livraison */}
                {(order.state === 'sale' || order.state === 'done') && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={handleDownloadDeliverySlip}
                    icon={<DocumentArrowDownIcon className="h-5 w-5" />}
                  >
                    Télécharger bon de livraison
                  </Button>
                )}

                {/* Remettre en brouillon */}
                {(order.state === 'sent' || order.state === 'sale' || order.state === 'done') && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={handleUnlockOrder}
                    disabled={unlockOrder.isPending}
                    loading={unlockOrder.isPending}
                    icon={<ArrowUturnLeftIcon className="h-5 w-5" />}
                  >
                    Remettre en brouillon
                  </Button>
                )}
              </div>
            </div>
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

        {/* ToastContainer */}
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} position="top-right" />
      </div>
    </Layout>
  )
}
