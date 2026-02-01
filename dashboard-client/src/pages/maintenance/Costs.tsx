/**
 * Coûts Maintenance - Analyse des dépenses de maintenance
 *
 * Fonctionnalités :
 * - Vue d'ensemble des coûts (total, par catégorie, par équipement)
 * - Graphiques d'évolution mensuelle
 * - Répartition préventif vs correctif
 * - Top équipements les plus coûteux
 * - Export des données
 */
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common'
import { maintenanceNotices } from '@/lib/notices/maintenance-notices'
import { Coins, TrendingUp, Download, RefreshCw, AlertCircle, Calendar } from 'lucide-react'
import { useMaintenanceCosts } from '@/hooks/useMaintenanceCosts'

export default function MaintenanceCosts() {
  // Récupération des données de coûts (12 derniers mois par défaut)
  const { data, isLoading, isError } = useMaintenanceCosts()
  const costsData = data?.data || {
    total_cost: 0,
    preventive_cost: 0,
    corrective_cost: 0,
    top_equipment: [],
    monthly_costs: [],
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <SkeletonTable rows={6} columns={4} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'GMAO', href: '/maintenance' },
            { label: 'Coûts Maintenance' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Coins className="w-6 h-6 text-amber-600" />
              Coûts de Maintenance
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Analyse et suivi des dépenses de maintenance
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<Calendar className="w-4 h-4" />}
            >
              Période
            </Button>
            <Button
              variant="outline"
              icon={<Download className="w-4 h-4" />}
            >
              Exporter
            </Button>
          </div>
        </div>

        <PageNotice config={maintenanceNotices.costs} className="mb-2" />

        {isError && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Erreur lors du chargement des données de coûts.
              </p>
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => window.location.reload()}
              >
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Coûts Total</span>
              <Coins className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {costsData.total_cost.toLocaleString('fr-FR')} €
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 mt-2">
              <TrendingUp className="w-4 h-4" />
              <span>Mois en cours</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Préventif</span>
              <Coins className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {costsData.preventive_cost.toLocaleString('fr-FR')} €
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Maintenance planifiée
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Correctif</span>
              <Coins className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {costsData.corrective_cost.toLocaleString('fr-FR')} €
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Réparations urgentes
            </div>
          </div>
        </div>

        {/* Tableau des coûts détaillés */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top 10 équipements les plus coûteux
            </h2>
            {costsData.top_equipment.length === 0 ? (
              <div className="text-center py-12">
                <Coins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Aucune donnée de coûts disponible pour cette période
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Équipement
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Coût Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {costsData.top_equipment.map((equipment) => (
                      <tr key={equipment.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4 text-gray-900 dark:text-white">
                          {equipment.name}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                          {equipment.cost.toLocaleString('fr-FR')} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
