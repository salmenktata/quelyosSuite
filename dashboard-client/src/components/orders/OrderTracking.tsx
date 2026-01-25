import { useState } from 'react'
import { Badge, Button, Skeleton } from '../common'
import { TruckIcon, PencilIcon } from '@heroicons/react/24/outline'

interface TrackingInfo {
  picking_id: number
  picking_name: string
  state: string
  state_label: string
  carrier_tracking_ref?: string | null
  carrier_tracking_url?: string | null
  carrier_name?: string | null
}

interface OrderTrackingProps {
  trackingInfo: TrackingInfo[]
  isLoading: boolean
  onUpdateTracking: (pickingId: number, trackingRef: string) => Promise<void>
  isUpdating: boolean
}

/**
 * Section suivi de colis avec édition inline du numéro de suivi
 * Responsive mobile avec cartes empilées
 */
export function OrderTracking({ trackingInfo, isLoading, onUpdateTracking, isUpdating }: OrderTrackingProps) {
  const [editingTracking, setEditingTracking] = useState<{ pickingId: number; trackingRef: string } | null>(null)

  const handleSave = async () => {
    if (!editingTracking) return

    await onUpdateTracking(editingTracking.pickingId, editingTracking.trackingRef)
    setEditingTracking(null)
  }

  const handleCancel = () => {
    setEditingTracking(null)
  }

  if (isLoading) {
    return <Skeleton height={150} />
  }

  if (!trackingInfo || trackingInfo.length === 0) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6">
      <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <TruckIcon className="h-5 w-5" aria-hidden="true" />
        Suivi colis
      </h2>
      <div className="space-y-4">
        {trackingInfo.map((tracking) => (
          <div
            key={tracking.picking_id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{tracking.picking_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{tracking.state_label}</p>
              </div>
              <Badge variant={tracking.state === 'done' ? 'success' : 'info'}>{tracking.state_label}</Badge>
            </div>

            {editingTracking?.pickingId === tracking.picking_id ? (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
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
                  className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                  autoFocus
                  aria-label="Numéro de suivi"
                />
                <Button size="sm" variant="primary" onClick={handleSave} disabled={isUpdating}>
                  Enregistrer
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isUpdating}>
                  Annuler
                </Button>
              </div>
            ) : (
              <div className="mt-3">
                {tracking.carrier_tracking_ref ? (
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Numéro de suivi :</p>
                      {tracking.carrier_tracking_url ? (
                        <a
                          href={tracking.carrier_tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-mono text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                        >
                          {tracking.carrier_tracking_ref}
                        </a>
                      ) : (
                        <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
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
                          trackingRef: tracking.carrier_tracking_ref || '',
                        })
                      }
                      aria-label="Modifier le numéro de suivi"
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
  )
}
