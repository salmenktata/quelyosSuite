/**
 * Page de gestion des Calendriers Entrepôts
 *
 * Fonctionnalités :
 * - Liste entrepôts avec calendriers assignés
 * - Assignation calendrier à un entrepôt
 * - Création calendriers ressources avec horaires
 * - Simulateur dates livraison selon jours ouvrables
 * - Gestion horaires travail par jour de semaine
 * - Timezones et heures/jour configurables
 */

import { useState } from 'react'
import { Layout } from '../../components/Layout'
import { Breadcrumbs, Badge, PageNotice, SkeletonTable, Button } from '../../components/common'
import { stockNotices } from '@/lib/notices'
import {
  useWarehouses,
  useCalendars,
  useSetWarehouseCalendar,
  useCreateCalendar,
  usePlanDeliveryDate,
  getStandardWorkingHours,
} from '../../hooks/useWarehouseCalendars'
import { Plus, Calendar, Clock, MapPin } from 'lucide-react'
import { logger } from '@quelyos/logger'

export default function WarehouseCalendars() {
  const [_showCreateCalendar, _setShowCreateCalendar] = useState(false)
  const [_showDeliverySimulator, _setShowDeliverySimulator] = useState(false)

  const { warehouses, loading: loadingWarehouses, error: errorWarehouses, refetch: refetchWarehouses } = useWarehouses()
  const { calendars, loading: loadingCalendars, error: errorCalendars, refetch: refetchCalendars } = useCalendars()
  const { setCalendar, setting } = useSetWarehouseCalendar()
  const { createCalendar, creating } = useCreateCalendar()
  const { planDelivery, planning } = usePlanDeliveryDate()

  const warehousesWithCalendar = warehouses.filter((w) => w.calendar_id !== null)
  const _warehousesWithoutCalendar = warehouses.filter((w) => w.calendar_id === null)

  const handleAssignCalendar = async (warehouseId: number, warehouseName: string) => {
    const calendarIdStr = prompt(
      'Assigner calendrier à "' + warehouseName + '"\nEntrez ID calendrier (ou 0 pour retirer) :'
    )
    if (calendarIdStr === null) return

    const calendarId = parseInt(calendarIdStr, 10)

    const result = await setCalendar(warehouseId, calendarId === 0 ? null : calendarId)
    if (result) {
      refetchWarehouses()
      logger.info('[WarehouseCalendars] Calendar assigned', { warehouseId, calendarId })
    }
  }

  const handleCreateCalendar = async () => {
    const name = prompt('Nom du calendrier (ex: "Lun-Ven 8h-17h") :')
    if (!name) return

    const tz = prompt('Fuseau horaire (ex: "Africa/Tunis", "Europe/Paris") :', 'UTC')
    if (!tz) return

    const attendances = getStandardWorkingHours()

    const result = await createCalendar({ name, tz, hours_per_day: 8.0, attendances })
    if (result) {
      refetchCalendars()
      logger.info('[WarehouseCalendars] Calendar created', { calendarId: result.id })
      alert('Calendrier "' + result.name + '" créé avec succès')
    }
  }

  const handleSimulateDelivery = async () => {
    const warehouseIdStr = prompt('ID entrepôt :')
    if (!warehouseIdStr) return

    const warehouseId = parseInt(warehouseIdStr, 10)

    const dateFromStr = prompt('Date départ (format ISO, ex: 2026-02-01T10:00:00) :')
    if (!dateFromStr) return

    const deltaDaysStr = prompt('Nombre de jours à ajouter (ex: 5) :')
    if (!deltaDaysStr) return

    const deltaDays = parseInt(deltaDaysStr, 10)

    const result = await planDelivery(warehouseId, dateFromStr, deltaDays)
    if (result) {
      const deliveryDateObj = new Date(result.deliveryDate)
      const formattedDate = deliveryDateObj.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      alert(
        'Date livraison : ' + formattedDate + '\n\nCalendrier utilisé : ' + (result.usedCalendar || 'Aucun (jours calendaires)')
      )
    }
  }

  const loading = loadingWarehouses || loadingCalendars
  const error = errorWarehouses || errorCalendars

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Stock', href: '/stock' },
            { label: 'Calendriers Entrepôts' },
          ]}
        />

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendriers Entrepôts</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gestion jours ouvrables et dates livraison
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Clock className="h-5 w-5" />} onClick={handleSimulateDelivery} disabled={planning}>
              Simuler Livraison
            </Button>
            <Button variant="primary" icon={<Plus className="h-5 w-5" />} onClick={handleCreateCalendar} disabled={creating}>
              {creating ? 'Création...' : 'Créer Calendrier'}
            </Button>
          </div>
        </div>

        <PageNotice config={stockNotices.warehouseCalendars} className="mb-6" />

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Entrepôts totaux</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{warehouses.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Avec calendrier</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{warehousesWithCalendar.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Calendriers disponibles</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{calendars.length}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {loading && <SkeletonTable rows={5} />}

        {!loading && !error && (
          <>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Entrepôts</h2>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-8">
              {warehouses.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">Aucun entrepôt trouvé</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Nom
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Calendrier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Timezone
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {warehouses.map((warehouse) => (
                        <tr key={warehouse.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900 dark:text-white">{warehouse.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {warehouse.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {warehouse.calendar_id ? (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm text-gray-900 dark:text-white">{warehouse.calendar_name}</span>
                              </div>
                            ) : (
                              <Badge variant="neutral">Aucun calendrier</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {warehouse.calendar_tz || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleAssignCalendar(warehouse.id, warehouse.name)}
                              disabled={setting}
                            >
                              {warehouse.calendar_id ? 'Changer' : 'Assigner'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Calendriers Disponibles</h2>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {calendars.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  Aucun calendrier disponible. Créez-en un avec le bouton ci-dessus.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Nom
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Timezone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Heures/jour
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Plages horaires
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {calendars.map((calendar) => (
                        <tr key={calendar.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {calendar.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <span className="font-medium text-gray-900 dark:text-white">{calendar.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {calendar.tz}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {calendar.hours_per_day}h
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {calendar.attendances.length} plages
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
