import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'

export interface DeliveryMethod {
  carrier_id: number
  carrier_name: string
  price: number
  free_over: number
  delivery_time: string
}

export interface DeliveryZone {
  code: string
  label: string
  methods: DeliveryMethod[]
}

export function useDeliveryZones() {
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/delivery-zones')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.zones) {
          setZones(data.zones)
        } else {
          setError(data.error || 'Erreur de chargement')
        }
      })
      .catch((err) => {
        logger.error('Failed to load delivery zones:', err)
        setError('Erreur de chargement')
      })
      .finally(() => setLoading(false))
  }, [])

  return { zones, loading, error }
}

export function useDeliveryPrice(
  carrierId: number | null,
  zoneCode: string | null,
  orderAmount: number
) {
  const [price, setPrice] = useState<number | null>(null)
  const [deliveryTime, setDeliveryTime] = useState<string | null>(null)
  const [isFree, setIsFree] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!carrierId || !zoneCode) {
      setPrice(null)
      setDeliveryTime(null)
      setIsFree(false)
      return
    }

    setLoading(true)
    fetch('/api/delivery-calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        carrier_id: carrierId,
        zone_code: zoneCode,
        order_amount: orderAmount,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPrice(data.price)
          setDeliveryTime(data.delivery_time)
          setIsFree(data.is_free)
        }
      })
      .catch((err) => {
        logger.error('Failed to calculate delivery price:', err)
      })
      .finally(() => setLoading(false))
  }, [carrierId, zoneCode, orderAmount])

  return { price, deliveryTime, isFree, loading }
}
