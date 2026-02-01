/**
 * Kitchen Display System (KDS) - Écran Cuisine
 * Affiche les commandes en attente pour préparation
 */

import { useState, useEffect, useMemo } from 'react'
import {
  Clock,
  Bell,
  Check,
  ChefHat,
  AlertTriangle,
  Volume2,
  VolumeX,
  RefreshCw,
  Maximize2,
  Filter,
  Settings,
} from 'lucide-react'

// Types
interface KDSOrderLine {
  id: number
  productName: string
  quantity: number
  notes?: string
  modifiers?: string[]
}

interface KDSOrder {
  id: number
  orderNumber: string
  tableName?: string
  customerName?: string
  orderType: 'dine_in' | 'takeaway' | 'delivery'
  lines: KDSOrderLine[]
  status: 'new' | 'preparing' | 'ready' | 'done'
  createdAt: string
  acceptedAt?: string
  readyAt?: string
  priority: 'normal' | 'rush'
}

// Mock data pour démo
const mockOrders: KDSOrder[] = [
  {
    id: 1,
    orderNumber: 'POS-001',
    tableName: 'Table 5',
    orderType: 'dine_in',
    lines: [
      { id: 1, productName: 'Burger Classic', quantity: 2, notes: 'Sans oignons' },
      { id: 2, productName: 'Frites Maison', quantity: 2 },
      { id: 3, productName: 'Coca-Cola', quantity: 2 },
    ],
    status: 'new',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    priority: 'normal',
  },
  {
    id: 2,
    orderNumber: 'POS-002',
    customerName: 'Ahmed B.',
    orderType: 'takeaway',
    lines: [
      { id: 4, productName: 'Pizza Margherita', quantity: 1 },
      { id: 5, productName: 'Salade César', quantity: 1, notes: 'Sauce à part' },
    ],
    status: 'preparing',
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    acceptedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    priority: 'rush',
  },
  {
    id: 3,
    orderNumber: 'POS-003',
    tableName: 'Table 2',
    orderType: 'dine_in',
    lines: [
      { id: 6, productName: 'Steak Frites', quantity: 1, notes: 'Cuisson saignante' },
      { id: 7, productName: 'Tiramisu', quantity: 1 },
    ],
    status: 'preparing',
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    acceptedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    priority: 'normal',
  },
  {
    id: 4,
    orderNumber: 'POS-004',
    orderType: 'delivery',
    customerName: 'Livraison Glovo',
    lines: [
      { id: 8, productName: 'Wrap Poulet', quantity: 3 },
      { id: 9, productName: 'Brownie', quantity: 3 },
    ],
    status: 'ready',
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    acceptedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    readyAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    priority: 'normal',
  },
]

// Composant Timer
function OrderTimer({ startTime, warningMinutes = 10, criticalMinutes = 15 }: {
  startTime: string
  warningMinutes?: number
  criticalMinutes?: number
}) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const updateElapsed = () => {
      const start = new Date(startTime).getTime()
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }

    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60

  const colorClass =
    minutes >= criticalMinutes
      ? 'text-red-500 animate-pulse'
      : minutes >= warningMinutes
      ? 'text-amber-500'
      : 'text-gray-400'

  return (
    <div className={`flex items-center gap-1 font-mono text-lg ${colorClass}`}>
      <Clock className="h-4 w-4" />
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  )
}

// Carte de commande KDS
function KDSOrderCard({
  order,
  onAccept,
  onReady,
  onDone,
  onBump: _onBump,
}: {
  order: KDSOrder
  onAccept: () => void
  onReady: () => void
  onDone: () => void
  onBump: () => void
}) {
  const statusColors = {
    new: 'border-blue-500 bg-blue-500/5',
    preparing: 'border-amber-500 bg-amber-500/5',
    ready: 'border-green-500 bg-green-500/5',
    done: 'border-gray-500 bg-gray-500/5',
  }

  const orderTypeLabels = {
    dine_in: 'Sur place',
    takeaway: 'À emporter',
    delivery: 'Livraison',
  }

  const orderTypeColors = {
    dine_in: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    takeaway: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    delivery: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  }

  return (
    <div
      className={`rounded-xl border-2 ${statusColors[order.status]} overflow-hidden transition-all hover:shadow-lg`}
    >
      {/* Header */}
      <div className="p-3 bg-gray-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-white">{order.orderNumber}</span>
          {order.priority === 'rush' && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded animate-pulse">
              RUSH
            </span>
          )}
        </div>
        <OrderTimer startTime={order.createdAt} />
      </div>

      {/* Order info */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            {order.tableName && (
              <p className="text-lg font-semibold text-white">{order.tableName}</p>
            )}
            {order.customerName && (
              <p className="text-gray-400">{order.customerName}</p>
            )}
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${orderTypeColors[order.orderType]}`}>
            {orderTypeLabels[order.orderType]}
          </span>
        </div>
      </div>

      {/* Order lines */}
      <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
        {order.lines.map((line) => (
          <div key={line.id} className="flex items-start gap-2">
            <span className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-lg text-white font-bold">
              {line.quantity}
            </span>
            <div className="flex-1">
              <p className="text-white font-medium">{line.productName}</p>
              {line.notes && (
                <p className="text-amber-400 text-sm flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {line.notes}
                </p>
              )}
              {line.modifiers?.map((mod, i) => (
                <p key={i} className="text-gray-400 text-sm">+ {mod}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="p-3 bg-gray-900/50">
        {order.status === 'new' && (
          <button
            onClick={onAccept}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <ChefHat className="h-5 w-5" />
            ACCEPTER
          </button>
        )}
        {order.status === 'preparing' && (
          <button
            onClick={onReady}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Bell className="h-5 w-5" />
            PRÊT
          </button>
        )}
        {order.status === 'ready' && (
          <button
            onClick={onDone}
            className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Check className="h-5 w-5" />
            TERMINÉ
          </button>
        )}
      </div>
    </div>
  )
}

// Page principale KDS
export default function POSKDS() {
  const [orders, setOrders] = useState<KDSOrder[]>(mockOrders)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [filterStatus, setFilterStatus] = useState<KDSOrder['status'] | 'all'>('all')
  const [filterType, setFilterType] = useState<KDSOrder['orderType'] | 'all'>('all')
  const [_isFullscreen, setIsFullscreen] = useState(false)

  // Son de notification
  const playNotification = () => {
    if (soundEnabled) {
      // Utiliser Web Audio API pour un beep
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3

      oscillator.start()
      setTimeout(() => {
        oscillator.stop()
        audioCtx.close()
      }, 200)
    }
  }

  // Filtrer les commandes
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filterStatus !== 'all' && order.status !== filterStatus) return false
      if (filterType !== 'all' && order.orderType !== filterType) return false
      return true
    })
  }, [orders, filterStatus, filterType])

  // Grouper par statut
  const ordersByStatus = useMemo(() => {
    return {
      new: filteredOrders.filter((o) => o.status === 'new'),
      preparing: filteredOrders.filter((o) => o.status === 'preparing'),
      ready: filteredOrders.filter((o) => o.status === 'ready'),
    }
  }, [filteredOrders])

  // Actions
  const handleAccept = (orderId: number) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: 'preparing' as const, acceptedAt: new Date().toISOString() }
          : o
      )
    )
  }

  const handleReady = (orderId: number) => {
    playNotification()
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: 'ready' as const, readyAt: new Date().toISOString() }
          : o
      )
    )
  }

  const handleDone = (orderId: number) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: 'done' as const } : o
      )
    )
  }

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Stats
  const stats = {
    total: orders.filter((o) => o.status !== 'done').length,
    new: ordersByStatus.new.length,
    preparing: ordersByStatus.preparing.length,
    ready: ordersByStatus.ready.length,
    avgTime: '8:42',
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ChefHat className="h-8 w-8 text-teal-500" />
            <div>
              <h1 className="text-xl font-bold">Kitchen Display System</h1>
              <p className="text-sm text-gray-400">Cuisine principale</p>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.new}</p>
              <p className="text-xs text-gray-400">Nouvelles</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{stats.preparing}</p>
              <p className="text-xs text-gray-400">En cours</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{stats.ready}</p>
              <p className="text-xs text-gray-400">Prêtes</p>
            </div>
            <div className="text-center border-l border-gray-700 pl-6">
              <p className="text-2xl font-bold text-gray-300">{stats.avgTime}</p>
              <p className="text-xs text-gray-400">Temps moy.</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-700 text-gray-400'
              }`}
              title={soundEnabled ? 'Son activé' : 'Son désactivé'}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title="Plein écran"
            >
              <Maximize2 className="h-5 w-5" />
            </button>

            <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">Filtres:</span>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as KDSOrder['status'] | 'all')}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm"
          >
            <option value="all">Tous les statuts</option>
            <option value="new">Nouvelles</option>
            <option value="preparing">En préparation</option>
            <option value="ready">Prêtes</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as KDSOrder['orderType'] | 'all')}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm"
          >
            <option value="all">Tous les types</option>
            <option value="dine_in">Sur place</option>
            <option value="takeaway">À emporter</option>
            <option value="delivery">Livraison</option>
          </select>

          <button className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>
        </div>
      </header>

      {/* Main grid - 3 colonnes */}
      <main className="p-4">
        <div className="grid grid-cols-3 gap-4 h-[calc(100vh-140px)]">
          {/* Colonne Nouvelles */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-blue-500/30">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              <h2 className="font-bold text-blue-400">NOUVELLES ({ordersByStatus.new.length})</h2>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-200px)]">
              {ordersByStatus.new.map((order) => (
                <KDSOrderCard
                  key={order.id}
                  order={order}
                  onAccept={() => handleAccept(order.id)}
                  onReady={() => handleReady(order.id)}
                  onDone={() => handleDone(order.id)}
                  onBump={() => {}}
                />
              ))}
              {ordersByStatus.new.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune nouvelle commande</p>
                </div>
              )}
            </div>
          </div>

          {/* Colonne En préparation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-amber-500/30">
              <div className="w-3 h-3 bg-amber-500 rounded-full" />
              <h2 className="font-bold text-amber-400">EN PRÉPARATION ({ordersByStatus.preparing.length})</h2>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-200px)]">
              {ordersByStatus.preparing.map((order) => (
                <KDSOrderCard
                  key={order.id}
                  order={order}
                  onAccept={() => handleAccept(order.id)}
                  onReady={() => handleReady(order.id)}
                  onDone={() => handleDone(order.id)}
                  onBump={() => {}}
                />
              ))}
              {ordersByStatus.preparing.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <ChefHat className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune commande en cours</p>
                </div>
              )}
            </div>
          </div>

          {/* Colonne Prêtes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-green-500/30">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <h2 className="font-bold text-green-400">PRÊTES ({ordersByStatus.ready.length})</h2>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-200px)]">
              {ordersByStatus.ready.map((order) => (
                <KDSOrderCard
                  key={order.id}
                  order={order}
                  onAccept={() => handleAccept(order.id)}
                  onReady={() => handleReady(order.id)}
                  onDone={() => handleDone(order.id)}
                  onBump={() => {}}
                />
              ))}
              {ordersByStatus.ready.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Check className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune commande prête</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
