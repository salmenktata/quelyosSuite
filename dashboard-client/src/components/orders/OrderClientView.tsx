/**
 * OrderClientView - Vue de la commande côté client
 *
 * Affiche ce que le client voit :
 * - Timeline simplifiée des statuts
 * - Preview des emails transactionnels
 *
 * @module components/orders
 */

import { CustomerViewTooltip } from '@quelyos/preview-components'
import { Package, Truck, CheckCircle, Mail, Clock } from 'lucide-react'
import { Badge } from '@/components/common'

interface OrderData {
  name: string
  state: string
  amount_total: number
  date_order: string
  partner_name: string
  partner_email: string
  tracking_reference?: string
}

interface OrderClientViewProps {
  order: OrderData
}

export function OrderClientView({ order }: OrderClientViewProps) {
  // Mapping des états Odoo vers états affichés au client
  const getClientStatus = (state: string) => {
    const statusMap: Record<string, { label: string; icon: JSX.Element; color: string }> = {
      draft: {
        label: 'Devis en attente',
        icon: <Clock className="w-5 h-5" />,
        color: 'text-gray-500 dark:text-gray-400',
      },
      sent: {
        label: 'Devis envoyé',
        icon: <Mail className="w-5 h-5" />,
        color: 'text-blue-500 dark:text-blue-400',
      },
      sale: {
        label: 'Commande confirmée',
        icon: <Package className="w-5 h-5" />,
        color: 'text-indigo-500 dark:text-indigo-400',
      },
      done: {
        label: 'Livré',
        icon: <Truck className="w-5 h-5" />,
        color: 'text-green-500 dark:text-green-400',
      },
      cancel: {
        label: 'Annulé',
        icon: <CheckCircle className="w-5 h-5" />,
        color: 'text-red-500 dark:text-red-400',
      },
    }

    return statusMap[state] || statusMap['draft']
  }

  const status = getClientStatus(order.state)

  // Timeline des étapes
  const steps = [
    { id: 'confirmed', label: 'Commande confirmée', completed: ['sale', 'done'].includes(order.state) },
    { id: 'processing', label: 'En préparation', completed: order.state === 'done' },
    { id: 'shipped', label: 'Expédiée', completed: order.state === 'done' && !!order.tracking_reference },
    { id: 'delivered', label: 'Livrée', completed: order.state === 'done' },
  ]

  return (
    <div className="space-y-8">
      {/* Header avec tooltip */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Vue Client</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Ce que vos clients voient sur leur espace compte
          </p>
        </div>
        <CustomerViewTooltip>
          Cette section montre exactement ce que le client voit sur son espace personnel,
          incluant la timeline de sa commande et les emails qu&apos;il reçoit.
        </CustomerViewTooltip>
      </div>

      {/* Timeline Client */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Suivi de commande
        </h4>

        {/* Status actuel */}
        <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className={status.color}>{status.icon}</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{status.label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Commande {order.name} • {new Date(order.date_order).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <Badge
            className={
              order.state === 'done'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
            }
          >
            {status.label}
          </Badge>
        </div>

        {/* Progress steps */}
        <div className="relative">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-start gap-4 mb-6 last:mb-0">
              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div
                  className={`absolute left-[15px] top-[30px] w-0.5 h-[50px] ${
                    step.completed
                      ? 'bg-indigo-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}

              {/* Step indicator */}
              <div
                className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  step.completed
                    ? 'bg-indigo-500 border-indigo-500'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                }`}
              >
                {step.completed && <CheckCircle className="w-5 h-5 text-white" />}
              </div>

              {/* Step content */}
              <div className="flex-1 pt-1">
                <p
                  className={`text-sm font-medium ${
                    step.completed
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {step.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tracking reference si disponible */}
        {order.tracking_reference && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Numéro de suivi :</strong> {order.tracking_reference}
            </p>
          </div>
        )}
      </div>

      {/* Preview Email Confirmation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">
            Email de confirmation envoyé
          </h4>
        </div>

        {/* Mockup email */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {/* Email header */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">À : {order.partner_email}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              Confirmation de votre commande {order.name}
            </p>
          </div>

          {/* Email body */}
          <div className="p-6 bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300 space-y-3">
            <p>Bonjour {order.partner_name},</p>

            <p>
              Nous avons bien reçu votre commande <strong>{order.name}</strong> d&apos;un
              montant de <strong>{order.amount_total.toFixed(2)} €</strong>.
            </p>

            <p>
              Votre commande est en cours de préparation et vous recevrez un email de confirmation
              d&apos;expédition dès qu&apos;elle sera envoyée.
            </p>

            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded">
              <p className="font-medium text-gray-900 dark:text-white mb-2">
                Récapitulatif de commande
              </p>
              <p className="text-sm">
                Commande : {order.name}
                <br />
                Date : {new Date(order.date_order).toLocaleDateString('fr-FR')}
                <br />
                Total : {order.amount_total.toFixed(2)} €
              </p>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Vous pouvez suivre votre commande depuis votre espace client.
            </p>
          </div>
        </div>
      </div>

      {/* Notice informative */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Impact client</strong> : Cette prévisualisation montre l&apos;expérience
          complète du client, de la confirmation de commande jusqu&apos;à la livraison.
          Les emails sont envoyés automatiquement à chaque changement de statut.
        </p>
      </div>
    </div>
  )
}
