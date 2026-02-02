/**
 * Click & Collect POS
 * Gestion des commandes web à retirer en magasin
 *
 * Fonctionnalités :
 * - Liste des commandes Click & Collect par statut
 * - Filtrage par état (en attente, prêt, retiré)
 * - Recherche par numéro, nom ou code de retrait
 * - Marquage des commandes comme prêtes avec notification client
 * - Vérification du code de retrait et remise au client
 * - Scanner QR code pour recherche rapide
 */

import { useState, useMemo } from 'react'
import {
  Package,
  Clock,
  Check,
  X,
  Phone,
  Mail,
  QrCode,
  Search,
  Bell,
  MapPin,
  User,
  ShoppingBag,
  CheckCircle2,
  Timer,
} from 'lucide-react'
import { Layout } from '../../components/Layout'
import { Breadcrumbs, Button, PageNotice } from '../../components/common'
import { posNotices } from '../../lib/notices/pos-notices'

// Types
interface ClickCollectOrder {
  id: number
  orderNumber: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  items: { name: string; quantity: number; price: number }[]
  total: number
  status: 'pending' | 'ready' | 'collected' | 'cancelled'
  createdAt: string
  readyAt?: string
  collectedAt?: string
  pickupCode: string
  notes?: string
  estimatedPickup: string
}

// Mock data
const mockOrders: ClickCollectOrder[] = [
  {
    id: 1,
    orderNumber: 'WEB-2024-001',
    customerName: 'Ahmed Ben Salem',
    customerEmail: 'ahmed@email.com',
    customerPhone: '+216 98 123 456',
    items: [
      { name: 'Pizza Margherita', quantity: 2, price: 16.00 },
      { name: 'Tiramisu', quantity: 1, price: 4.50 },
    ],
    total: 20.50,
    status: 'pending',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    pickupCode: 'AB12',
    estimatedPickup: '14:30',
  },
  {
    id: 2,
    orderNumber: 'WEB-2024-002',
    customerName: 'Fatma Trabelsi',
    customerPhone: '+216 55 987 654',
    items: [
      { name: 'Sandwich Club', quantity: 3, price: 16.50 },
      { name: 'Jus Orange', quantity: 3, price: 9.00 },
    ],
    total: 25.50,
    status: 'ready',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    readyAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    pickupCode: 'FT34',
    estimatedPickup: '14:00',
  },
  {
    id: 3,
    orderNumber: 'WEB-2024-003',
    customerName: 'Mohamed Gharbi',
    customerEmail: 'mohamed.g@email.com',
    items: [
      { name: 'Café Expresso', quantity: 2, price: 5.00 },
      { name: 'Croissant', quantity: 2, price: 3.60 },
    ],
    total: 8.60,
    status: 'collected',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    readyAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    collectedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    pickupCode: 'MG56',
    estimatedPickup: '12:00',
  },
  {
    id: 4,
    orderNumber: 'WEB-2024-004',
    customerName: 'Sarah Bouazizi',
    customerPhone: '+216 22 456 789',
    items: [
      { name: 'Salade César', quantity: 1, price: 6.50 },
      { name: 'Eau Minérale', quantity: 1, price: 1.00 },
    ],
    total: 7.50,
    status: 'pending',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    pickupCode: 'SB78',
    notes: 'Sans croûtons SVP',
    estimatedPickup: '15:00',
  },
]

type FilterStatus = 'all' | 'pending' | 'ready' | 'collected'

export default function POSClickCollect() {
  const now = useMemo(() => Date.now(), [])
  const [orders, setOrders] = useState<ClickCollectOrder[]>(mockOrders)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<ClickCollectOrder | null>(null)
  const [showQRScanner, setShowQRScanner] = useState(false)

  // Filtrer les commandes
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filterStatus !== 'all' && order.status !== filterStatus) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          order.orderNumber.toLowerCase().includes(query) ||
          order.customerName.toLowerCase().includes(query) ||
          order.pickupCode.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [orders, filterStatus, searchQuery])

  // Stats
  const stats = useMemo(() => ({
    pending: orders.filter(o => o.status === 'pending').length,
    ready: orders.filter(o => o.status === 'ready').length,
    collected: orders.filter(o => o.status === 'collected').length,
    total: orders.length,
  }), [orders])

  // Actions
  const markAsReady = (orderId: number) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, status: 'ready' as const, readyAt: new Date().toISOString() }
        : o
    ))
    // Simuler notification client
    alert('Client notifié par SMS/Email !')
  }

  const markAsCollected = (orderId: number) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, status: 'collected' as const, collectedAt: new Date().toISOString() }
        : o
    ))
    setSelectedOrder(null)
  }

  const cancelOrder = (orderId: number) => {
    if (confirm('Annuler cette commande ?')) {
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: 'cancelled' as const } : o
      ))
    }
  }

  // Time elapsed
  const getTimeElapsed = (dateStr: string) => {
    const mins = Math.floor((now - new Date(dateStr).getTime()) / 60000)
    if (mins < 60) return `${mins} min`
    const hours = Math.floor(mins / 60)
    return `${hours}h ${mins % 60}min`
  }

  const statusColors = {
    pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    ready: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
    collected: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600',
    cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
  }

  const statusLabels = {
    pending: 'En préparation',
    ready: 'Prêt',
    collected: 'Retiré',
    cancelled: 'Annulé',
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'POS', href: '/pos' },
            { label: 'Click & Collect' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
              <Package className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Click & Collect</h1>
              <p className="text-gray-500 dark:text-gray-400">Commandes web à retirer en magasin</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick stats */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <Timer className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-amber-700 dark:text-amber-300 font-medium">{stats.pending} en attente</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-green-700 dark:text-green-300 font-medium">{stats.ready} prêts</span>
            </div>
            <Button
              variant="primary"
              icon={<QrCode className="h-4 w-4" />}
              onClick={() => setShowQRScanner(true)}
            >
              Scanner QR
            </Button>
            <button className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg relative">
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              {stats.pending > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {stats.pending}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* PageNotice */}
        <PageNotice config={posNotices.clickCollect} className="mb-6" />

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par n° commande, nom, code..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'ready', 'collected'] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-teal-600 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {status === 'all' ? 'Tous' : statusLabels[status]}
                {status !== 'all' && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                    {status === 'pending' ? stats.pending : status === 'ready' ? stats.ready : stats.collected}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Orders grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={`bg-white dark:bg-gray-800 rounded-xl border-2 overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                statusColors[order.status]
              }`}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {order.orderNumber}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'pending' ? 'bg-amber-500 text-white' :
                    order.status === 'ready' ? 'bg-green-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {statusLabels[order.status]}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {getTimeElapsed(order.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Retrait: {order.estimatedPickup}
                  </span>
                </div>
              </div>

              {/* Customer */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{order.customerName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {order.customerPhone || order.customerEmail}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {order.items.length} article{order.items.length > 1 ? 's' : ''}
                </p>
                <div className="space-y-1">
                  {order.items.slice(0, 2).map((item, idx) => (
                    <p key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                      {item.quantity}x {item.name}
                    </p>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-sm text-gray-400">+{order.items.length - 2} autres...</p>
                  )}
                </div>
                {order.notes && (
                  <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-sm text-amber-700 dark:text-amber-300">
                    Note: {order.notes}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{order.total.toFixed(2)} TND</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-center px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Code</p>
                    <p className="text-lg font-mono font-bold text-teal-600 dark:text-teal-400">
                      {order.pickupCode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {order.status !== 'collected' && order.status !== 'cancelled' && (
                <div className="px-4 pb-4">
                  {order.status === 'pending' ? (
                    <Button
                      variant="primary"
                      className="w-full bg-green-600 hover:bg-green-700"
                      icon={<Check className="h-4 w-4" />}
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsReady(order.id)
                      }}
                    >
                      Marquer Prêt
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      className="w-full"
                      icon={<ShoppingBag className="h-4 w-4" />}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedOrder(order)
                      }}
                    >
                      Remettre au client
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredOrders.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">Aucune commande trouvée</p>
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onMarkCollected={() => markAsCollected(selectedOrder.id)}
          onCancel={() => cancelOrder(selectedOrder.id)}
        />
      )}

      {/* QR Scanner modal */}
      {showQRScanner && (
        <QRScannerModal
          onClose={() => setShowQRScanner(false)}
          onScan={(code) => {
            const order = orders.find(o => o.pickupCode === code)
            if (order) {
              setSelectedOrder(order)
            } else {
              alert('Code non trouvé')
            }
            setShowQRScanner(false)
          }}
        />
      )}
    </Layout>
  )
}

// Modal détail commande
function OrderDetailModal({
  order,
  onClose,
  onMarkCollected,
  onCancel,
}: {
  order: ClickCollectOrder
  onClose: () => void
  onMarkCollected: () => void
  onCancel: () => void
}) {
  const [verifyCode, setVerifyCode] = useState('')

  const handleCollect = () => {
    if (verifyCode.toUpperCase() === order.pickupCode) {
      onMarkCollected()
    } else {
      alert('Code incorrect !')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{order.orderNumber}</h2>
              <p className="text-gray-500 dark:text-gray-400">{order.customerName}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" aria-label="Fermer">
              <X className="h-5 w-5 text-gray-500" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Contact */}
          <div className="flex gap-3">
            {order.customerPhone && (
              <a
                href={`tel:${order.customerPhone}`}
                className="flex-1 flex items-center justify-center gap-2 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg"
              >
                <Phone className="h-5 w-5" />
                Appeler
              </a>
            )}
            {order.customerEmail && (
              <a
                href={`mailto:${order.customerEmail}`}
                className="flex-1 flex items-center justify-center gap-2 p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg"
              >
                <Mail className="h-5 w-5" />
                Email
              </a>
            )}
          </div>

          {/* Items */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Articles</h3>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {(item.price * item.quantity).toFixed(2)} TND
                  </span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                <span className="font-medium text-gray-900 dark:text-white">Total</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">{order.total.toFixed(2)} TND</span>
              </div>
            </div>
          </div>

          {/* Code verification */}
          {order.status === 'ready' && (
            <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4">
              <p className="text-sm text-teal-700 dark:text-teal-300 mb-3">
                Demandez le code de retrait au client
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                  placeholder="Code client"
                  maxLength={4}
                  className="flex-1 px-4 py-3 text-center text-2xl font-mono font-bold bg-white dark:bg-gray-800 border border-teal-300 dark:border-teal-700 rounded-lg uppercase text-gray-900 dark:text-white"
                />
                <Button
                  variant="primary"
                  onClick={handleCollect}
                  disabled={verifyCode.length !== 4}
                  icon={<Check className="h-4 w-4" />}
                >
                  Valider
                </Button>
              </div>
              <p className="text-xs text-teal-600 dark:text-teal-400 mt-2 text-center">
                Code attendu: <span className="font-mono font-bold">{order.pickupCode}</span>
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <Button
            variant="danger"
            onClick={onCancel}
            icon={<X className="h-4 w-4" />}
            className="flex-1"
          >
            Annuler commande
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Fermer
          </Button>
        </div>
      </div>
    </div>
  )
}

// Modal scanner QR (simulé)
function QRScannerModal({
  onClose,
  onScan,
}: {
  onClose: () => void
  onScan: (code: string) => void
}) {
  const [manualCode, setManualCode] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <QrCode className="h-6 w-6 text-teal-600" />
              Scanner QR Code
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" aria-label="Fermer">
              <X className="h-5 w-5 text-gray-500" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Camera placeholder */}
          <div className="aspect-square bg-gray-900 rounded-xl flex items-center justify-center mb-6">
            <div className="text-center text-gray-500">
              <QrCode className="h-16 w-16 mx-auto mb-3 opacity-50" />
              <p>Caméra active</p>
              <p className="text-sm">Présentez le QR code du client</p>
            </div>
          </div>

          {/* Manual input */}
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Ou entrez le code manuellement</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="CODE"
                maxLength={4}
                className="flex-1 px-4 py-3 text-center text-xl font-mono font-bold bg-gray-100 dark:bg-gray-700 rounded-lg uppercase text-gray-900 dark:text-white"
              />
              <Button
                variant="primary"
                onClick={() => onScan(manualCode)}
                disabled={manualCode.length !== 4}
                icon={<Check className="h-4 w-4" />}
              >
                Valider
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
