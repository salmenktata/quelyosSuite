/**
 * Configuration des tickets de caisse POS
 *
 * Fonctionnalités :
 * - Sélection du type d'imprimante
 * - Personnalisation de l'en-tête
 * - Configuration du pied de page
 * - Upload du logo boutique
 * - Aperçu du ticket en temps réel
 */

import { Printer, FileText } from 'lucide-react'
import { Layout } from '../../../../components/Layout'
import { Breadcrumbs, Button } from '../../../../components/common'

export default function POSSettingsReceipts() {
  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'POS', href: '/pos' },
            { label: 'Paramètres', href: '/pos/settings' },
            { label: 'Tickets' },
          ]}
        />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tickets de Caisse
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Personnalisation de l'impression des reçus
          </p>
        </div>

        {/* Receipt settings form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
          {/* Printer settings */}
          <div className="p-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Printer className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              Imprimante
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Type d'imprimante
                </label>
                <select className="w-full md:w-64 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                  <option value="browser">Navigateur (PDF)</option>
                  <option value="epson">Epson TM</option>
                  <option value="star">Star TSP</option>
                </select>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="p-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              En-tête du ticket
            </h3>
            <textarea
              rows={3}
              placeholder="Nom de la boutique&#10;Adresse&#10;Téléphone"
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>

          {/* Footer */}
          <div className="p-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              Pied de page
            </h3>
            <textarea
              rows={2}
              placeholder="Merci de votre visite !&#10;www.votresite.com"
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <Button variant="primary">
            Enregistrer
          </Button>
        </div>
      </div>
    </Layout>
  )
}
