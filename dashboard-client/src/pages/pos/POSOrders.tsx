/**
 * Historique des commandes POS
 *
 * Fonctionnalités :
 * - Liste des commandes avec pagination
 * - Recherche par référence ou client
 * - Filtrage par date, statut, terminal
 * - Export des données (CSV, Excel)
 * - Détail commande avec remboursement
 */

import { useState } from 'react'
import { ClipboardList, Search, Filter, Download, RefreshCw, AlertCircle } from 'lucide-react'
import { Layout } from '../../components/Layout'
import { Breadcrumbs, Button, SkeletonTable } from '../../components/common'
import { usePOSOrders } from '../../hooks/pos/usePOSOrders'

export default function POSOrders() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: orders = [], isLoading, error, refetch } = usePOSOrders()

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'POS', href: '/pos' },
            { label: 'Commandes' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Commandes POS
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Historique des ventes en caisse
            </p>
          </div>
          <Button variant="secondary" icon={<Download className="h-4 w-4" />}>
            Exporter
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par référence, client..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <Button variant="secondary" icon={<Filter className="h-4 w-4" />}>
            Filtres
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div
            role="alert"
            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-red-700 dark:text-red-300 flex-1">
              Erreur lors du chargement des commandes
            </p>
            <Button variant="secondary" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={() => refetch()}>
              Réessayer
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <SkeletonTable rows={5} columns={6} />
        ) : (
          /* Table */
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Référence</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Articles</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">État</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <ClipboardList className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">Aucune commande pour le moment</p>
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{order.reference}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(order.date).toLocaleDateString('fr-FR')}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{order.customerName || 'Client anonyme'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{order.itemCount} articles</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{order.total.toFixed(2)} TND</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            order.state === 'paid'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : order.state === 'refunded'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {order.state === 'paid' ? 'Payée' : order.state === 'refunded' ? 'Remboursée' : order.state}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
