'use client'

import { useState, useEffect } from 'react'
import { useDeliveryZones, useDeliveryPrice } from '@/hooks/useDeliveryZones'
import { MapPin, Truck, Clock, CheckCircle } from 'lucide-react'

interface DeliverySelectorProps {
  orderAmount: number
  onSelect: (carrierId: number, zoneCode: string, price: number) => void
  selectedCarrierId?: number | null
  selectedZoneCode?: string | null
}

export function DeliverySelector({
  orderAmount,
  onSelect,
  selectedCarrierId = null,
  selectedZoneCode = null,
}: DeliverySelectorProps) {
  const { zones, loading: zonesLoading } = useDeliveryZones()
  const [zoneCode, setZoneCode] = useState<string | null>(selectedZoneCode)
  const [carrierId, setCarrierId] = useState<number | null>(selectedCarrierId)

  const { price, deliveryTime, isFree, loading: priceLoading } = useDeliveryPrice(
    carrierId,
    zoneCode,
    orderAmount
  )

  useEffect(() => {
    if (carrierId && zoneCode && price !== null) {
      onSelect(carrierId, zoneCode, price)
    }
  }, [carrierId, zoneCode, price, onSelect])

  if (zonesLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-gray-200 rounded-lg" />
        <div className="h-32 bg-gray-200 rounded-lg" />
      </div>
    )
  }

  const selectedZone = zones.find((z) => z.code === zoneCode)

  return (
    <div className="space-y-6">
      {/* Sélection zone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="inline h-4 w-4 mr-1" />
          Zone de livraison
        </label>
        <select
          value={zoneCode || ''}
          onChange={(e) => {
            setZoneCode(e.target.value)
            setCarrierId(null) // Reset méthode
          }}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Sélectionnez votre zone</option>
          {zones.map((zone) => (
            <option key={zone.code} value={zone.code}>
              {zone.label} ({zone.methods.length} méthode{zone.methods.length > 1 && 's'})
            </option>
          ))}
        </select>
      </div>

      {/* Méthodes de livraison disponibles */}
      {selectedZone && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Truck className="inline h-4 w-4 mr-1" />
            Méthode de livraison
          </label>
          <div className="space-y-3">
            {selectedZone.methods.map((method) => {
              const isSelected = carrierId === method.carrier_id
              const methodPrice =
                method.free_over > 0 && orderAmount >= method.free_over ? 0 : method.price

              return (
                <button
                  key={method.carrier_id}
                  type="button"
                  onClick={() => setCarrierId(method.carrier_id)}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{method.carrier_name}</h3>
                        {isSelected && <CheckCircle className="h-5 w-5 text-primary" />}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {method.delivery_time}
                        </span>
                        {method.free_over > 0 && orderAmount < method.free_over && (
                          <span className="text-green-600 font-medium">
                            Gratuit dès {method.free_over.toFixed(2)}€
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {methodPrice === 0 ? (
                        <span className="text-lg font-bold text-green-600">GRATUIT</span>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">
                          {methodPrice.toFixed(2)}€
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Prix calculé avec délai */}
      {carrierId && zoneCode && !priceLoading && price !== null && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-800">
                <strong>Livraison :</strong>{' '}
                {isFree ? (
                  <span className="font-bold">GRATUITE</span>
                ) : (
                  <span className="font-bold">{price.toFixed(2)}€</span>
                )}
              </p>
              {deliveryTime && (
                <p className="text-xs text-green-700 mt-1">
                  <Clock className="inline h-3 w-3 mr-1" />
                  Délai estimé : {deliveryTime}
                </p>
              )}
            </div>
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </div>
      )}
    </div>
  )
}
