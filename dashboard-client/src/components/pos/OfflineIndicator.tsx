/**
 * Indicateur de statut offline POS
 * Affiche l'état de connexion et les commandes en attente de synchronisation
 */

import { useState } from 'react'
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, AlertTriangle, X, Loader2 } from 'lucide-react'
import { usePOSSync } from '../../hooks/pos/usePOSSync'
import { usePOSOfflineStore, selectFailedOrders } from '../../stores/pos'

interface OfflineIndicatorProps {
  compact?: boolean
}

export function OfflineIndicator({ compact = false }: OfflineIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false)
  const { isOnline, isSyncing, pendingCount, triggerSync, lastSyncAt } = usePOSSync()
  const failedOrders = usePOSOfflineStore(selectFailedOrders)

  const hasIssues = failedOrders.length > 0
  const hasPending = pendingCount > 0

  // Compact mode - just an icon
  if (compact) {
    return (
      <button
        onClick={() => setShowDetails(true)}
        className={`relative p-2 rounded-lg transition-colors ${
          !isOnline
            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            : hasIssues
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
            : hasPending
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
        }`}
      >
        {isOnline ? (
          isSyncing ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <Cloud className="h-5 w-5" />
          )
        ) : (
          <CloudOff className="h-5 w-5" />
        )}
        {(hasPending || hasIssues) && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {pendingCount + failedOrders.length}
          </span>
        )}
      </button>
    )
  }

  return (
    <>
      {/* Status bar */}
      <div
        onClick={() => setShowDetails(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all ${
          !isOnline
            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            : hasIssues
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
            : hasPending
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
        }`}
      >
        {isOnline ? (
          isSyncing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Wifi className="h-4 w-4" />
          )
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">
          {!isOnline
            ? 'Hors ligne'
            : isSyncing
            ? 'Synchronisation...'
            : hasPending
            ? `${pendingCount} en attente`
            : hasIssues
            ? `${failedOrders.length} erreurs`
            : 'Connecté'}
        </span>
      </div>

      {/* Details modal */}
      {showDetails && (
        <OfflineDetailsModal
          onClose={() => setShowDetails(false)}
          isOnline={isOnline}
          isSyncing={isSyncing}
          pendingCount={pendingCount}
          failedOrders={failedOrders}
          lastSyncAt={lastSyncAt}
          onSync={triggerSync}
        />
      )}
    </>
  )
}

interface OfflineDetailsModalProps {
  onClose: () => void
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  failedOrders: { id: string; syncError?: string }[]
  lastSyncAt: string | null
  onSync: () => Promise<{ synced: number; failed: number }>
}

function OfflineDetailsModal({
  onClose,
  isOnline,
  isSyncing,
  pendingCount,
  failedOrders,
  lastSyncAt,
  onSync,
}: OfflineDetailsModalProps) {
  const [syncResult, setSyncResult] = useState<{ synced: number; failed: number } | null>(null)
  const { removeOrder } = usePOSOfflineStore()

  const handleSync = async () => {
    const result = await onSync()
    setSyncResult(result)
    setTimeout(() => setSyncResult(null), 3000)
  }

  const handleRetry = async (orderId: string) => {
    // Reset status and trigger sync
    await usePOSOfflineStore.getState().updateOrderStatus(orderId, 'pending')
    handleSync()
  }

  const handleDelete = async (orderId: string) => {
    if (confirm('Supprimer cette commande ? Elle ne sera pas synchronisée.')) {
      await removeOrder(orderId)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <WifiOff className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            )}
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">
                État de la connexion
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isOnline ? 'Connecté au serveur' : 'Mode hors ligne actif'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Status summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">En attente</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{failedOrders.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Erreurs</p>
            </div>
          </div>

          {/* Last sync */}
          {lastSyncAt && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Dernière sync: {new Date(lastSyncAt).toLocaleTimeString('fr-FR')}
            </p>
          )}

          {/* Sync result */}
          {syncResult && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
              <p className="text-green-700 dark:text-green-300">
                {syncResult.synced} synchronisées, {syncResult.failed} erreurs
              </p>
            </div>
          )}

          {/* Failed orders list */}
          {failedOrders.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Commandes en erreur
              </h3>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {failedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.id.slice(0, 20)}...
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {order.syncError || 'Erreur inconnue'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleRetry(order.id)}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                        title="Réessayer"
                      >
                        <RefreshCw className="h-4 w-4 text-red-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                        title="Supprimer"
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Offline info */}
          {!isOnline && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div className="text-sm text-amber-700 dark:text-amber-300">
                  <p className="font-medium">Mode hors ligne</p>
                  <p className="mt-1">
                    Les ventes sont enregistrées localement et seront synchronisées
                    automatiquement au retour de la connexion.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sync button */}
          {isOnline && pendingCount > 0 && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Synchronisation...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5" />
                  Synchroniser maintenant
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
