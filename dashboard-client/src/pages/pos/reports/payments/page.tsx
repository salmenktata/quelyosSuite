/**
 * Rapports de paiements POS
 *
 * Fonctionnalités :
 * - Répartition par méthode de paiement
 * - Totaux espèces, cartes, digital
 * - Graphiques de tendances
 * - Historique détaillé des transactions
 * - Export des données de paiement
 */

import { CreditCard, Banknote, Wallet, Calendar, Download } from 'lucide-react'
import { Layout } from '../../../../components/Layout'
import { Breadcrumbs, Button } from '../../../../components/common'

export default function POSReportsPayments() {
  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'POS', href: '/pos' },
            { label: 'Rapports', href: '/pos/reports/sales' },
            { label: 'Paiements' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Rapports de Paiements
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Analyse par méthode de paiement
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

        {/* Payment method summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Banknote className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Espèces</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">0 TND</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Cartes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">0 TND</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Wallet className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Digital</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">0 TND</p>
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center justify-center text-center">
            <CreditCard className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Détails des paiements
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Graphiques de répartition et historique détaillé par méthode de paiement.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
