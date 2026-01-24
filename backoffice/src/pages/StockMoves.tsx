import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useStockMoves } from '../hooks/useStock'
import { Badge, Button, Breadcrumbs, SkeletonTable, Input } from '../components/common'
import { useToast } from '../contexts/ToastContext'
import { api } from '../lib/api'
import {
  ArrowsRightLeftIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import type { StockMove } from '../types'

export default function StockMoves() {
  const [page, setPage] = useState(0)
  const [productFilter, setProductFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [stateFilter, setStateFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('') // all, inventory, customer, supplier, internal
  const [showFilters, setShowFilters] = useState(false)
  const limit = 20

  const toast = useToast()

  // Query
  const {
    data: movesData,
    isLoading,
    error,
  } = useStockMoves({
    limit,
    offset: page * limit,
  })

  // Helpers
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString))
  }

  const getStateBadgeVariant = (state: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (state) {
      case 'done':
        return 'success'
      case 'assigned':
      case 'confirmed':
        return 'info'
      case 'waiting':
        return 'warning'
      case 'cancel':
        return 'error'
      default:
        return 'info'
    }
  }

  const getStateLabel = (state: string) => {
    const labels: Record<string, string> = {
      draft: 'Brouillon',
      waiting: 'En attente',
      confirmed: 'Confirmé',
      assigned: 'Assigné',
      done: 'Terminé',
      cancel: 'Annulé',
    }
    return labels[state] || state
  }

  const handleExportCSV = async () => {
    try {
      toast.info('Génération du fichier CSV en cours...')

      // Récupérer toutes les données
      const response = await api.getStockMoves({ limit: 10000, offset: 0 })
      const allMoves = (response?.data?.moves as StockMove[]) || []

      if (allMoves.length === 0) {
        toast.warning('Aucune donnée à exporter')
        return
      }

      // Générer le CSV
      const headers = [
        'Date',
        'Produit',
        'Quantité',
        'Origine',
        'Destination',
        'Référence',
        'État',
      ]
      const rows = allMoves.map(m => [
        formatDate(m.date),
        m.product.name,
        m.quantity.toString(),
        m.location_src,
        m.location_dest,
        m.reference || '-',
        getStateLabel(m.state),
      ])

      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
      ].join('\n')

      // Télécharger le fichier
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `mouvements_stock_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(`${allMoves.length} mouvements exportés avec succès`)
    } catch (error) {
      console.error('Export CSV error:', error)
      toast.error('Erreur lors de l\'export CSV')
    }
  }

  const getMoveType = (move: StockMove) => {
    const ref = move.reference?.toLowerCase() || ''
    const srcLower = move.location_src.toLowerCase()
    const destLower = move.location_dest.toLowerCase()

    // Inventory adjustments
    if (ref.includes('inv') || ref.includes('inventaire') ||
        srcLower.includes('inventory') || destLower.includes('inventory')) {
      return 'inventory'
    }
    // Customer deliveries (outgoing)
    if (srcLower.includes('stock') && (destLower.includes('customer') || destLower.includes('client'))) {
      return 'customer'
    }
    // Supplier receipts (incoming)
    if (srcLower.includes('supplier') || srcLower.includes('fournisseur')) {
      return 'supplier'
    }
    // Internal transfers
    if (srcLower.includes('stock') && destLower.includes('stock')) {
      return 'internal'
    }
    return 'other'
  }

  const clearFilters = () => {
    setProductFilter('')
    setDateFrom('')
    setDateTo('')
    setStateFilter('')
    setTypeFilter('')
    setPage(0)
  }

  const hasActiveFilters = productFilter || dateFrom || dateTo || stateFilter || typeFilter

  // Data
  const moves = (movesData?.data?.moves as StockMove[]) || []
  const total = (movesData?.data?.total as number) || 0

  // Apply client-side filters
  const filteredMoves = moves.filter(move => {
    if (productFilter && !move.product.name.toLowerCase().includes(productFilter.toLowerCase())) {
      return false
    }
    if (stateFilter && move.state !== stateFilter) {
      return false
    }
    if (typeFilter && getMoveType(move) !== typeFilter) {
      return false
    }
    if (dateFrom && move.date && new Date(move.date) < new Date(dateFrom)) {
      return false
    }
    if (dateTo && move.date && new Date(move.date) > new Date(dateTo)) {
      return false
    }
    return true
  })

  return (
    <Layout>
      <div className="p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Stock', href: '/stock' },
            { label: 'Mouvements' },
          ]}
        />

        <div className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <ArrowsRightLeftIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                Mouvements de Stock
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Historique complet des mouvements de stock (entrées, sorties, transferts)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <FunnelIcon className="h-5 w-5" />
                Filtres
                {hasActiveFilters && (
                  <Badge variant="info" className="ml-1">
                    {[productFilter, dateFrom, dateTo, stateFilter].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={handleExportCSV}
                className="flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Exporter CSV
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Filtres avancés
                </h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Réinitialiser
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Produit
                  </label>
                  <Input
                    type="text"
                    placeholder="Nom du produit..."
                    value={productFilter}
                    onChange={(e) => setProductFilter(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  >
                    <option value="">Tous types</option>
                    <option value="inventory">Ajustements</option>
                    <option value="customer">Livraisons clients</option>
                    <option value="supplier">Réceptions fournisseurs</option>
                    <option value="internal">Transferts internes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date début
                  </label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date fin
                  </label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    État
                  </label>
                  <select
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  >
                    <option value="">Tous les états</option>
                    <option value="draft">Brouillon</option>
                    <option value="waiting">En attente</option>
                    <option value="confirmed">Confirmé</option>
                    <option value="assigned">Assigné</option>
                    <option value="done">Terminé</option>
                    <option value="cancel">Annulé</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {isLoading ? (
              <SkeletonTable columns={7} rows={10} />
            ) : error ? (
              <div className="p-12 text-center">
                <p className="text-red-600 dark:text-red-400">
                  Erreur lors du chargement des mouvements
                </p>
              </div>
            ) : filteredMoves.length === 0 ? (
              <div className="p-12 text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Aucun mouvement trouvé
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {hasActiveFilters
                    ? 'Aucun mouvement ne correspond à vos filtres.'
                    : 'Aucun mouvement de stock enregistré.'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Produit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Quantité
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Origine
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Destination
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Référence
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          État
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredMoves.map((move) => (
                        <tr
                          key={move.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {formatDate(move.date)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Link
                              to={`/products/${move.product.id}`}
                              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              {move.product.name}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {move.quantity} unités
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {move.location_src}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {move.location_dest}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 dark:text-white font-mono">
                              {move.reference || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={getStateBadgeVariant(move.state)}>
                              {getStateLabel(move.state)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Affichage{' '}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {page * limit + 1}
                    </span>{' '}
                    à{' '}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Math.min((page + 1) * limit, total)}
                    </span>{' '}
                    sur{' '}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {total}
                    </span>{' '}
                    mouvements
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setPage(page + 1)}
                      disabled={(page + 1) * limit >= total}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
