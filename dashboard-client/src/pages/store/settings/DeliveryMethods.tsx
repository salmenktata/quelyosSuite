/**
 * Delivery Methods Manager Page
 *
 * Gestion avancée des méthodes de livraison avec tarification par zone
 *
 * Features principales:
 * - Liste méthodes de livraison existantes
 * - Configuration tarifs par zone géographique (Grand Tunis, Nord, Centre, Sud, International)
 * - Seuil livraison gratuite par zone
 * - Délais de livraison estimés par zone
 * - Activation/désactivation par zone
 * - Preview calcul prix selon zone + montant
 *
 * API Endpoints:
 * - POST /api/admin/delivery-methods (get methods avec zones)
 * - POST /api/admin/delivery-methods/:id/zones/save (save zone prices)
 */

import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, PageNotice, Badge } from '@/components/common'
import { Save, Package, MapPin, DollarSign, Clock, Eye } from 'lucide-react'
import { storeNotices } from '@/lib/notices'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import clsx from 'clsx'

interface ZonePrice {
  zone_code: string
  zone_label: string
  price: number
  free_over: number
  min_days: number
  max_days: number
  active: boolean
}

interface DeliveryMethod {
  id: number
  name: string
  delivery_type: string
  fixed_price: number
  active: boolean
  zones: ZonePrice[]
}

const AVAILABLE_ZONES = [
  { code: 'grand-tunis', label: 'Grand Tunis' },
  { code: 'nord', label: 'Nord' },
  { code: 'centre', label: 'Centre' },
  { code: 'sud', label: 'Sud' },
  { code: 'international', label: 'International' },
]

export default function DeliveryMethodsPage() {
  const queryClient = useQueryClient()
  const [selectedMethod, setSelectedMethod] = useState<DeliveryMethod | null>(null)
  const [zonePrices, setZonePrices] = useState<Record<string, ZonePrice>>({})

  const breadcrumbItems = [
    { label: 'Tableau de bord', path: '/dashboard' },
    { label: 'Store', path: '/store' },
    { label: 'Paramètres', path: '/store/settings' },
    { label: 'Méthodes de Livraison' },
  ]

  // Fetch methods
  const { data: methods = [], isLoading } = useQuery<DeliveryMethod[]>({
    queryKey: ['delivery-methods-with-zones'],
    queryFn: async () => {
      const response = await api.post('/api/admin/delivery-methods', {})
      return response.data.methods || []
    },
  })

  // Save zones mutation
  const saveZonesMutation = useMutation({
    mutationFn: async ({ carrierId, zones }: { carrierId: number; zones: ZonePrice[] }) => {
      const response = await api.post(`/api/admin/delivery-methods/${carrierId}/zones/save`, { zones })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-methods-with-zones'] })
      setSelectedMethod(null)
    },
  })

  const handleSelectMethod = (method: DeliveryMethod) => {
    setSelectedMethod(method)

    // Initialiser zonePrices avec les zones existantes ou valeurs par défaut
    const prices: Record<string, ZonePrice> = {}
    AVAILABLE_ZONES.forEach((zone) => {
      const existing = method.zones.find((z) => z.zone_code === zone.code)
      prices[zone.code] = existing || {
        zone_code: zone.code,
        zone_label: zone.label,
        price: method.fixed_price || 10,
        free_over: 0,
        min_days: 2,
        max_days: 5,
        active: true,
      }
    })
    setZonePrices(prices)
  }

  const handleSaveZones = () => {
    if (!selectedMethod) return
    const zonesArray = Object.values(zonePrices)
    saveZonesMutation.mutate({ carrierId: selectedMethod.id, zones: zonesArray })
  }

  const handleZoneChange = (zoneCode: string, field: keyof ZonePrice, value: string | boolean | number) => {
    setZonePrices((prev) => ({
      ...prev,
      [zoneCode]: {
        ...prev[zoneCode],
        [field]: value,
      },
    }))
  }

  if (isLoading) {
    return (
      <Layout>
        <Breadcrumbs items={breadcrumbItems} />
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Breadcrumbs items={breadcrumbItems} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Méthodes de Livraison
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configurez les tarifs et délais de livraison par zone géographique
        </p>
      </div>

      <PageNotice config={storeNotices.deliveryMethods} className="mb-6" />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Liste des méthodes */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="h-5 w-5" />
                Méthodes disponibles
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {methods.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  Aucune méthode de livraison configurée
                </div>
              ) : (
                methods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handleSelectMethod(method)}
                    className={clsx(
                      'w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                      selectedMethod?.id === method.id && 'bg-indigo-50 dark:bg-indigo-900/20'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{method.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {method.zones.length} zone{method.zones.length > 1 && 's'} configurée{method.zones.length > 1 && 's'}
                        </p>
                      </div>
                      <Badge variant={method.active ? 'success' : 'default'}>
                        {method.active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Configuration zones */}
        <div className="lg:col-span-2">
          {!selectedMethod ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
              <MapPin className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Sélectionnez une méthode de livraison pour configurer ses tarifs par zone
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedMethod.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Configuration des tarifs par zone géographique
                  </p>
                </div>
                <Button
                  icon={<Save className="h-4 w-4" />}
                  onClick={handleSaveZones}
                  disabled={saveZonesMutation.isPending}
                >
                  {saveZonesMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>

              {/* Zones */}
              <div className="space-y-4">
                {AVAILABLE_ZONES.map((zone) => {
                  const zonePrice = zonePrices[zone.code]
                  if (!zonePrice) return null

                  return (
                    <div
                      key={zone.code}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {zone.label}
                          </h3>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={zonePrice.active}
                            onChange={(e) => handleZoneChange(zone.code, 'active', e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Prix */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <DollarSign className="h-4 w-4 inline mr-1" />
                            Prix de livraison (€)
                          </label>
                          <input
                            type="number"
                            value={zonePrice.price}
                            onChange={(e) => handleZoneChange(zone.code, 'price', parseFloat(e.target.value) || 0)}
                            disabled={!zonePrice.active}
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
                          />
                        </div>

                        {/* Gratuit si > */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Gratuit si montant {'>'}
                          </label>
                          <input
                            type="number"
                            value={zonePrice.free_over}
                            onChange={(e) => handleZoneChange(zone.code, 'free_over', parseFloat(e.target.value) || 0)}
                            disabled={!zonePrice.active}
                            step="0.01"
                            placeholder="0 = jamais gratuit"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
                          />
                        </div>

                        {/* Délai min */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <Clock className="h-4 w-4 inline mr-1" />
                            Délai min (jours)
                          </label>
                          <input
                            type="number"
                            value={zonePrice.min_days}
                            onChange={(e) => handleZoneChange(zone.code, 'min_days', parseInt(e.target.value) || 2)}
                            disabled={!zonePrice.active}
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
                          />
                        </div>

                        {/* Délai max */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Délai max (jours)
                          </label>
                          <input
                            type="number"
                            value={zonePrice.max_days}
                            onChange={(e) => handleZoneChange(zone.code, 'max_days', parseInt(e.target.value) || 5)}
                            disabled={!zonePrice.active}
                            min={zonePrice.min_days}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
                          />
                        </div>
                      </div>

                      {/* Preview */}
                      {zonePrice.active && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-sm text-blue-900 dark:text-blue-100">
                            <Eye className="h-4 w-4 inline mr-1" />
                            <strong>Preview :</strong> {zonePrice.price}€
                            {zonePrice.free_over > 0 && ` (gratuit si > ${zonePrice.free_over}€)`}
                            {' · '}
                            Livraison en {zonePrice.min_days}-{zonePrice.max_days} jours
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
