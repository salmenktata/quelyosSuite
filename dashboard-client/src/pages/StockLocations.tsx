/**
 * Page de visualisation des emplacements stock
 *
 * Affiche la liste des emplacements (locations) des entrepôts
 * avec filtres par type et entrepôt. Lecture seule (géré depuis Odoo).
 */

import { useState, useMemo } from 'react'
import { Layout } from '../components/Layout'
import { Breadcrumbs, Badge, SkeletonTable, Input } from '../components/common'
import { useStockLocations } from '../hooks/useStockTransfers'
import { useWarehouses } from '../hooks/useWarehouses'

const USAGE_LABELS: Record<string, string> = {
  internal: 'Interne',
  view: 'Vue',
  supplier: 'Fournisseur',
  customer: 'Client',
  inventory: 'Inventaire',
  transit: 'Transit',
}

const USAGE_VARIANTS: Record<string, 'success' | 'neutral' | 'info' | 'warning' | 'error'> = {
  internal: 'success',
  view: 'neutral',
  supplier: 'info',
  customer: 'warning',
  inventory: 'error',
  transit: 'neutral',
}

export default function StockLocations() {
  const [search, setSearch] = useState('')
  const [usageFilter, setUsageFilter] = useState<string>('all')
  const [warehouseFilter, setWarehouseFilter] = useState<number | undefined>()

  const { data, isLoading, error } = useStockLocations({
    usage: usageFilter !== 'all' ? usageFilter : undefined,
    warehouse_id: warehouseFilter,
  })

  const { data: warehousesData, isLoading: isLoadingWarehouses } = useWarehouses()

  const locations = data?.data?.locations || []
  const warehouses = warehousesData?.data?.warehouses || []

  // Filtrage local par recherche
  const filteredLocations = useMemo(() => {
    if (!search) return locations

    const searchLower = search.toLowerCase()
    return locations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(searchLower) ||
        loc.complete_name.toLowerCase().includes(searchLower)
    )
  }, [locations, search])

  return (
    <Layout>
      <div className="p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Stock', href: '/stock' },
            { label: 'Emplacements' },
          ]}
        />

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Emplacements Stock
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Visualisez les emplacements (locations) de vos entrepôts
            </p>
            <Badge variant="info" className="mt-3">
              🔒 Lecture seule - Géré depuis Odoo
            </Badge>
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="text"
            placeholder="Rechercher un emplacement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
            aria-label="Rechercher un emplacement"
          />

          <select
            value={usageFilter}
            onChange={(e) => setUsageFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            aria-label="Filtrer par type"
          >
            <option value="all">Tous les types</option>
            <option value="internal">Interne</option>
            <option value="view">Vue</option>
            <option value="supplier">Fournisseur</option>
            <option value="customer">Client</option>
            <option value="inventory">Inventaire</option>
            <option value="transit">Transit</option>
          </select>

          <select
            value={warehouseFilter || ''}
            onChange={(e) => setWarehouseFilter(e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={isLoadingWarehouses}
            aria-label="Filtrer par entrepôt"
          >
            <option value="">Tous les entrepôts</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtres actifs */}
        {(search || usageFilter !== 'all' || warehouseFilter) && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 dark:text-gray-400">Filtres actifs:</span>
            {search && (
              <Badge variant="info" className="flex items-center gap-1">
                Recherche: {search}
                <button
                  onClick={() => setSearch('')}
                  className="ml-1 hover:text-red-600"
                  aria-label="Supprimer le filtre de recherche"
                >
                  ×
                </button>
              </Badge>
            )}
            {usageFilter !== 'all' && (
              <Badge variant="info" className="flex items-center gap-1">
                Type: {USAGE_LABELS[usageFilter] || usageFilter}
                <button
                  onClick={() => setUsageFilter('all')}
                  className="ml-1 hover:text-red-600"
                  aria-label="Supprimer le filtre de type"
                >
                  ×
                </button>
              </Badge>
            )}
            {warehouseFilter && (
              <Badge variant="info" className="flex items-center gap-1">
                Entrepôt:{' '}
                {warehouses.find((w) => w.id === warehouseFilter)?.name || warehouseFilter}
                <button
                  onClick={() => setWarehouseFilter(undefined)}
                  className="ml-1 hover:text-red-600"
                  aria-label="Supprimer le filtre d'entrepôt"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Tableau */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <SkeletonTable rows={10} columns={4} />
          ) : error ? (
            <div className="p-8 text-center text-red-600 dark:text-red-400">
              Erreur lors du chargement des emplacements
            </div>
          ) : filteredLocations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nom Complet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Entrepôt
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredLocations.map((location) => (
                    <tr
                      key={location.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {location.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {location.complete_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={USAGE_VARIANTS[location.usage] || 'neutral'}>
                          {USAGE_LABELS[location.usage] || location.usage}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {location.warehouse_name || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-2xl">📍</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Aucun emplacement trouvé
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {search
                  ? 'Aucun emplacement ne correspond à votre recherche.'
                  : 'Aucun emplacement disponible.'}
              </p>
            </div>
          )}
        </div>

        {/* Statistiques */}
        {!isLoading && filteredLocations.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Affichage de {filteredLocations.length} emplacement
            {filteredLocations.length > 1 ? 's' : ''}{' '}
            {locations.length !== filteredLocations.length &&
              `sur ${locations.length} au total`}
          </div>
        )}
      </div>
    </Layout>
  )
}
