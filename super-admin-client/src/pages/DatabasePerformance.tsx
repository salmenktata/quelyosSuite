/**
 * Database Performance - Page de monitoring des performances PostgreSQL
 *
 * Fonctionnalités :
 * - Affichage utilisation des 15 indexes composites tenant
 * - Top 10 requêtes lentes (si pg_stat_statements activé)
 * - Statistiques des 6 tables volumineuses principales
 * - Cache hit ratio PostgreSQL (devrait être >99%)
 * - Auto-refresh toutes les 30 secondes
 * - Export données en CSV
 * - Indicateurs visuels de performance (badges colorés)
 * - Dark mode intégral
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/gateway'
import { DatabasePerformanceSchema, type DatabasePerformance } from '@/lib/validators'
import { Database, Zap, HardDrive, Activity, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/common/Button'

export function DatabasePerformance() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['database-performance'],
    queryFn: async () => {
      const response = await api.request<DatabasePerformance>({
        method: 'GET',
        path: '/api/super-admin/database/performance',
      })
      return DatabasePerformanceSchema.parse(response)
    },
    refetchInterval: 30000, // Auto-refresh toutes les 30s
  })

  const handleExportCSV = () => {
    if (!data) return

    // Exporter les tables volumineuses en CSV
    const csv = [
      'Table,Taille Totale,Taille Indexes,Opérations,Seq Scans,Index Scans,% Index Usage',
      ...data.large_tables.map(t =>
        `${t.table},${t.total_size},${t.indexes_size},${t.operations},${t.seq_scans},${t.index_scans},${t.index_usage_pct}`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `database-performance-${new Date().toISOString()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getIndexUsageBadge = (pct: number) => {
    if (pct >= 80) return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Excellent</span>
    if (pct >= 50) return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Bon</span>
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">À optimiser</span>
  }

  const getCacheRatioBadge = (ratio: number) => {
    if (ratio >= 99) return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Excellent</span>
    if (ratio >= 90) return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Bon</span>
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Critique</span>
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <p className="text-red-800 dark:text-red-200">
            ❌ Erreur lors du chargement des métriques database
          </p>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Database className="w-8 h-8" />
            Database Performance
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitoring temps réel des performances PostgreSQL (auto-refresh 30s)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportCSV}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Cache Hit Ratio */}
      <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-teal-100 font-medium">Cache Hit Ratio PostgreSQL</p>
            <p className="text-4xl font-bold mt-2">{data.cache_hit_ratio_pct.toFixed(2)}%</p>
            <p className="text-teal-100 text-sm mt-2">
              Objectif : &gt;99% (actuellement {getCacheRatioBadge(data.cache_hit_ratio_pct)})
            </p>
          </div>
          <Activity className="w-16 h-16 opacity-20" />
        </div>
      </div>

      {/* Indexes Composites Tenant */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Indexes Composites Tenant ({data.tenant_indexes.length}/15)
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Utilisation des indexes créés pour optimisation multi-tenant
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Index
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Utilisations
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tuples Lus
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tuples Retournés
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Efficacité
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.tenant_indexes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Aucun index tenant trouvé
                  </td>
                </tr>
              ) : (
                data.tenant_indexes.map((idx, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-mono">
                      {idx.table}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-mono">
                      {idx.index_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-gray-100 font-medium">
                      {idx.scans.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">
                      {idx.tuples_read.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">
                      {idx.tuples_fetched.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {idx.efficiency_pct.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tables Volumineuses */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Tables Volumineuses ({data.large_tables.length})
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Statistiques des tables principales avec indexes tenant
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Taille Totale
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Taille Indexes
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Seq Scans
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Index Scans
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  % Index Usage
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.large_tables.map((table, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-mono font-medium">
                    {table.table}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">
                    {table.total_size}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">
                    {table.indexes_size}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">
                    {table.seq_scans.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">
                    {table.index_scans.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {table.index_usage_pct.toFixed(2)}%
                      </span>
                      {getIndexUsageBadge(table.index_usage_pct)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slow Queries */}
      {data.slow_queries.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              Top 10 Requêtes Lentes
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Nécessite extension pg_stat_statements
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Temps Moyen (ms)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nb Appels
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Temps Total (s)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Requête
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.slow_queries.map((query, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-right text-orange-600 dark:text-orange-400 font-semibold">
                      {query.avg_time_ms.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">
                      {query.calls.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">
                      {query.total_time_sec.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-mono">
                      {query.query}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 Interprétation des Métriques
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li><strong>Cache Hit Ratio</strong> : &gt;99% = excellent, &lt;90% = augmenter shared_buffers</li>
          <li><strong>% Index Usage</strong> : &gt;80% = optimal, &lt;50% = trop de sequential scans</li>
          <li><strong>Efficacité Index</strong> : &gt;80% = excellent, &lt;50% = index mal utilisé</li>
          <li><strong>Utilisations = 0</strong> : Normal après création, attendre trafic réel</li>
        </ul>
      </div>
    </div>
  )
}
