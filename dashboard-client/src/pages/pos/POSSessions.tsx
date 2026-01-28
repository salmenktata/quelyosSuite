/**
 * Gestion des sessions POS
 *
 * Fonctionnalités :
 * - Liste des sessions de caisse (ouvertes/fermées)
 * - Recherche par caissier ou terminal
 * - Filtrage par état et date
 * - Détail session avec rapport Z
 * - Export des données de session
 */

import { useState } from 'react'
import { Clock, Search, AlertCircle, RefreshCw, PlayCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { Breadcrumbs, Button, SkeletonTable } from '../../components/common'
import { usePOSSessions } from '../../hooks/pos/usePOSSessions'

export default function POSSessions() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { data: sessions = [], isLoading, error, refetch } = usePOSSessions()

  const filteredSessions = sessions.filter((session) => {
    if (statusFilter && session.state !== statusFilter) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        session.name?.toLowerCase().includes(query) ||
        session.userName?.toLowerCase().includes(query) ||
        session.configName?.toLowerCase().includes(query)
      )
    }
    return true
  })

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'POS', href: '/pos' },
            { label: 'Sessions' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Sessions de caisse
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Historique et gestion des sessions
            </p>
          </div>
          <Link to="/pos/session/open">
            <Button variant="primary" icon={<PlayCircle className="h-4 w-4" />}>
              Nouvelle session
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par caissier, terminal..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="">Tous les états</option>
            <option value="opened">Ouvertes</option>
            <option value="closed">Fermées</option>
          </select>
        </div>

        {/* Error State */}
        {error && (
          <div
            role="alert"
            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-red-700 dark:text-red-300 flex-1">
              Erreur lors du chargement des sessions
            </p>
            <Button variant="secondary" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={() => refetch()}>
              Réessayer
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <SkeletonTable rows={5} columns={7} />
        ) : (
          /* Table */
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Session</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Terminal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Caissier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ouverture</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Commandes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">État</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Aucune session enregistrée</p>
                        <Link to="/pos/session/open">
                          <Button variant="primary" icon={<PlayCircle className="h-4 w-4" />}>
                            Ouvrir une session
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{session.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{session.configName}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{session.userName}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {session.openedAt ? new Date(session.openedAt).toLocaleString('fr-FR') : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{session.orderCount}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {session.totalAmount?.toFixed(2) || '0.00'} TND
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            session.state === 'opened'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {session.state === 'opened' ? 'Ouverte' : 'Fermée'}
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
