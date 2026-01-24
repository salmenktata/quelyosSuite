import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from './common'
import { useUpdateOrderStatus } from '../hooks/useOrders'
import { useToast } from '../hooks/useToast'
import type { Order } from '../types'

interface OrdersKanbanProps {
  orders: Order[]
  onOrderUpdate: () => void
}

interface KanbanColumn {
  id: string
  title: string
  color: string
  bgColor: string
  orders: Order[]
}

export function OrdersKanban({ orders, onOrderUpdate }: OrdersKanbanProps) {
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null)
  const updateStatus = useUpdateOrderStatus()
  const toast = useToast()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
    })
  }

  const columns: KanbanColumn[] = [
    {
      id: 'draft',
      title: '📝 Brouillons',
      color: 'text-gray-700',
      bgColor: 'bg-gray-50 dark:bg-gray-900',
      orders: orders.filter((o) => o.state === 'draft'),
    },
    {
      id: 'sent',
      title: '📧 Envoyés',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      orders: orders.filter((o) => o.state === 'sent'),
    },
    {
      id: 'sale',
      title: '✅ Confirmés',
      color: 'text-green-700',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      orders: orders.filter((o) => o.state === 'sale'),
    },
    {
      id: 'done',
      title: '🎉 Terminés',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      orders: orders.filter((o) => o.state === 'done'),
    },
    {
      id: 'cancel',
      title: '❌ Annulés',
      color: 'text-red-700',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      orders: orders.filter((o) => o.state === 'cancel'),
    },
  ]

  const handleDragStart = (order: Order) => {
    setDraggedOrder(order)
  }

  const handleDragEnd = () => {
    setDraggedOrder(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (targetState: string) => {
    if (!draggedOrder || draggedOrder.state === targetState) {
      setDraggedOrder(null)
      return
    }

    const actionMap: Record<string, 'confirm' | 'cancel' | 'done' | null> = {
      draft: null, // Ne peut pas déplacer vers draft via API simple
      sent: null, // sent se fait via action_quotation_send
      sale: 'confirm',
      done: 'done',
      cancel: 'cancel',
    }

    const action = actionMap[targetState]

    if (!action) {
      toast.error('Impossible de déplacer la commande vers cet état')
      setDraggedOrder(null)
      return
    }

    try {
      await updateStatus.mutateAsync({
        id: draggedOrder.id,
        action,
      })
      toast.success(`Commande déplacée vers "${targetState}" avec succès`)
      onOrderUpdate()
    } catch (err) {
      toast.error('Erreur lors du déplacement de la commande')
    } finally {
      setDraggedOrder(null)
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-4 pb-4 min-w-full">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex-1 min-w-[280px]"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            {/* Column Header */}
            <div className={`rounded-t-lg p-3 ${column.bgColor}`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${column.color} dark:text-white`}>
                  {column.title}
                </h3>
                <Badge variant="neutral" className="text-xs">
                  {column.orders.length}
                </Badge>
              </div>
            </div>

            {/* Column Body */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-b-lg p-2 min-h-[400px]">
              <div className="space-y-2">
                {column.orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                    Aucune commande
                  </div>
                ) : (
                  column.orders.map((order) => (
                    <div
                      key={order.id}
                      draggable
                      onDragStart={() => handleDragStart(order)}
                      onDragEnd={handleDragEnd}
                      className={`bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm cursor-move hover:shadow-md transition-shadow duration-150 ${
                        draggedOrder?.id === order.id ? 'opacity-50' : ''
                      }`}
                    >
                      <Link
                        to={`/orders/${order.id}`}
                        className="block hover:no-underline"
                        onClick={(e) => {
                          // Allow drag without triggering link
                          if (draggedOrder) {
                            e.preventDefault()
                          }
                        }}
                      >
                        <div className="space-y-2">
                          {/* Order Number */}
                          <div className="font-semibold text-indigo-600 dark:text-indigo-400 text-sm">
                            {order.name}
                          </div>

                          {/* Customer */}
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {order.customer?.name || 'Client inconnu'}
                          </div>

                          {/* Date & Amount */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400">
                              {formatDate(order.date_order)}
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatPrice(order.amount_total)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
