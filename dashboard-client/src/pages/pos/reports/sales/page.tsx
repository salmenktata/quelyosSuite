/**
 * Rapports de ventes POS
 *
 * Fonctionnalités :
 * - Graphiques de ventes par période
 * - Analyse des tendances
 * - Top produits vendus
 * - Comparaison par terminal/caissier
 * - Export PDF/Excel des rapports
 */

import { BarChart3, Calendar, Download } from 'lucide-react'
import { Layout } from '../../../../components/Layout'
import { Breadcrumbs, Button } from '../../../../components/common'

export default function POSReportsSales() {
  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'POS', href: '/pos' },
            { label: 'Rapports', href: '/pos/reports/sales' },
            { label: 'Ventes' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Rapports de Ventes
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Analyse des performances POS
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={<Calendar className="h-4 w-4" />}>
              Ce mois
            </Button>
            <Button variant="secondary" icon={<Download className="h-4 w-4" />}>
              Exporter
            </Button>
          </div>
        </div>

        {/* Placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center justify-center text-center">
            <BarChart3 className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Rapports en développement
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Graphiques de ventes, tendances, top produits et analyse par période seront disponibles ici.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
