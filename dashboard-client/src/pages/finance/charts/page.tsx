/**
 * Page Graphiques Financiers
 *
 * Fonctionnalités :
 * - Visualisation flux financiers (graphiques interactifs)
 * - Évolution mensuelle recettes/dépenses
 * - Répartition par catégories
 * - Cash-flow projeté 90 jours
 */

import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice } from '@/components/common'
import { financeNotices } from '@/lib/notices'
import { BarChart3, PieChart, LineChart } from 'lucide-react'

export default function ChartsPage() {
  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Finance', href: '/finance' },
            { label: 'Graphiques' },
          ]}
        />

        <PageNotice config={financeNotices.charts} className="mb-6" />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Graphiques Financiers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Visualisez vos flux financiers sous forme de graphiques interactifs
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Évolution mensuelle</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Recettes et dépenses</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <PieChart className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Répartition catégories</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Vue par poste</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <LineChart className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Cash-flow projeté</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Prévisions 90 jours</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
