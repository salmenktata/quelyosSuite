import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useWarehouseDetail, useWarehouseStock, useArchiveWarehouse } from '../hooks/useWarehouses'
import { Badge, Button, Breadcrumbs, SkeletonTable } from '../components/common'
import {
  ArrowLeftIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  ArchiveBoxIcon,
  ArchiveBoxArrowDownIcon,
} from '@heroicons/react/24/outline'

type TabType = 'locations' | 'stock'

export default function WarehouseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const warehouseId = parseInt(id || '0', 10)

  const [activeTab, setActiveTab] = useState<TabType>('stock')
  const [stockPage, setStockPage] = useState(0)
  const [stockSearch, setStockSearch] = useState('')
  const [stockSearchInput, setStockSearchInput] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const stockLimit = 20

  const { data: warehouse, isLoading, error, refetch } = useWarehouseDetail(warehouseId)
  const {
    data: stockData,
    isLoading: stockLoading,
  } = useWarehouseStock(warehouseId, {
    limit: stockLimit,
    offset: stockPage * stockLimit,
    search: stockSearch || undefined,
    low_stock_only: lowStockOnly || undefined,
  })

  const { mutate: archiveWarehouse, isPending: isArchiving } = useArchiveWarehouse()

  const handleStockSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setStockSearch(stockSearchInput)
    setStockPage(0)
  }

  const getStockStatus = (freeQty: number, reorderMin: number) => {
    if (freeQty <= 0) return { label: 'Rupture', variant: 'error' as const }
    if (freeQty < reorderMin || freeQty < 10) return { label: 'Stock faible', variant: 'warning' as const }
    return { label: 'En stock', variant: 'success' as const }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !warehouse) {
    return (
      <Layout>
        <div className="p-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-800 dark:text-red-200">Entrepôt introuvable</p>
            <Button
              variant="secondary"
              onClick={() => navigate('/warehouses')}
              className="mt-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Retour aux entrepôts
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  const stockProducts = stockData?.products || []
  const stockTotal = stockData?.total || 0

  return (
    <Layout>
      <div className="p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Stock', href: '/stock' },
            { label: 'Entrepôts', href: '/warehouses' },
            { label: warehouse.name },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <BuildingStorefrontIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  {warehouse.name}
                  <Badge variant={warehouse.active ? 'success' : 'neutral'}>
                    {warehouse.active ? 'Actif' : 'Inactif'}
                  </Badge>
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  Code: {warehouse.code} • {warehouse.company_name || 'Aucune société'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // TODO: Ouvrir modal d'édition
                  alert('Fonctionnalité de modification à venir')
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Modifier
              </button>
              <button
                onClick={() => {
                  if (!warehouse.active) {
                    alert('Réactivation non encore implémentée')
                    return
                  }
                  if (confirm(`Êtes-vous sûr de vouloir archiver l'entrepôt "${warehouse.name}" ?`)) {
                    archiveWarehouse(warehouseId, {
                      onSuccess: () => {
                        refetch()
                        alert('Entrepôt archivé avec succès')
                      },
                      onError: (error: any) => {
                        alert(error.message || 'Erreur lors de l\'archivage')
                      }
                    })
                  }
                }}
                disabled={isArchiving}
                className={`inline-flex items-center px-3 py-2 border rounded-lg shadow-sm text-sm font-medium transition-colors duration-200 ${
                  warehouse.active
                    ? 'border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {warehouse.active ? (
                  <>
                    <ArchiveBoxIcon className="h-4 w-4 mr-2" />
                    {isArchiving ? 'Archivage...' : 'Archiver'}
                  </>
                ) : (
                  <>
                    <ArchiveBoxArrowDownIcon className="h-4 w-4 mr-2" />
                    Réactiver
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Locations</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{warehouse.location_count}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Produits en stock</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stockTotal}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Société</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {warehouse.company_name || 'N/A'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <Link
              to="/stock/transfers"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Créer un transfert →
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('stock')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'stock'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <CubeIcon className="h-5 w-5 inline mr-2" />
              Stock ({stockTotal})
            </button>
            <button
              onClick={() => setActiveTab('locations')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'locations'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <MapPinIcon className="h-5 w-5 inline mr-2" />
              Locations ({warehouse.location_count})
            </button>
          </nav>
        </div>

        {/* Tab Content: Stock */}
        {activeTab === 'stock' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            {/* Filtres */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center">
              <form onSubmit={handleStockSearch} className="flex gap-2 flex-1 min-w-[200px] max-w-md">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={stockSearchInput}
                    onChange={(e) => setStockSearchInput(e.target.value)}
                    placeholder="Rechercher un produit..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <Button type="submit" variant="secondary" size="sm">
                  Rechercher
                </Button>
              </form>

              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => {
                    setLowStockOnly(e.target.checked)
                    setStockPage(0)
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Stock faible uniquement
              </label>
            </div>

            {/* Table */}
            {stockLoading ? (
              <div className="p-4">
                <SkeletonTable rows={5} columns={5} />
              </div>
            ) : stockProducts.length === 0 ? (
              <div className="p-12 text-center">
                <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-500 dark:text-gray-400">
                  {stockSearch || lowStockOnly
                    ? 'Aucun produit ne correspond à vos critères'
                    : 'Aucun produit en stock dans cet entrepôt'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Produit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          SKU
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Disponible
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Réservé
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          État
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {stockProducts.map((product) => {
                        const status = getStockStatus(product.free_qty, product.reorder_min)
                        return (
                          <tr
                            key={product.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {product.image_url ? (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                    <CubeIcon className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <Link
                                    to={`/products/${product.id}`}
                                    className="font-medium text-gray-900 dark:text-white hover:text-indigo-600"
                                  >
                                    {product.name}
                                  </Link>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {product.category}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {product.sku || '-'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {product.free_qty}
                              </span>
                              {product.free_qty < 10 && (
                                <ExclamationTriangleIcon className="inline ml-1 h-4 w-4 text-amber-500" />
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-gray-500 dark:text-gray-400">
                              {product.reserved_qty}
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {stockTotal > stockLimit && (
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stockPage * stockLimit + 1} - {Math.min((stockPage + 1) * stockLimit, stockTotal)} sur {stockTotal}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={stockPage === 0}
                        onClick={() => setStockPage((p) => p - 1)}
                      >
                        Précédent
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={(stockPage + 1) * stockLimit >= stockTotal}
                        onClick={() => setStockPage((p) => p + 1)}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab Content: Locations */}
        {activeTab === 'locations' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            {warehouse.locations && warehouse.locations.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {warehouse.locations.map((location) => (
                  <div
                    key={location.id}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <MapPinIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {location.complete_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Type: {location.usage}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ID: {location.id}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-500 dark:text-gray-400">
                  Aucune location dans cet entrepôt
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
