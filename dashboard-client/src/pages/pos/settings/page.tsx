/**
 * Paramètres généraux POS
 *
 * Fonctionnalités :
 * - Accès aux configurations terminaux
 * - Gestion des méthodes de paiement
 * - Personnalisation des tickets
 * - Configuration globale du module
 * - Raccourcis vers toutes les sections
 */

import { Monitor, Banknote, Printer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Layout } from '../../../components/Layout'
import { Breadcrumbs } from '../../../components/common'

const settingsSections = [
  {
    title: 'Terminaux',
    description: 'Configurer les points de vente',
    icon: Monitor,
    path: '/pos/settings/terminals',
    color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
  },
  {
    title: 'Méthodes de Paiement',
    description: 'Gérer les moyens de paiement acceptés',
    icon: Banknote,
    path: '/pos/settings/payments',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  },
  {
    title: 'Tickets de Caisse',
    description: 'Personnaliser l\'impression des reçus',
    icon: Printer,
    path: '/pos/settings/receipts',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  },
]

export default function POSSettings() {
  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'POS', href: '/pos' },
            { label: 'Paramètres' },
          ]}
        />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Paramètres POS
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Configuration du module Point de Vente
          </p>
        </div>

        {/* Settings sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {settingsSections.map((section) => {
            const Icon = section.icon
            return (
              <Link
                key={section.path}
                to={section.path}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:border-teal-500 dark:hover:border-teal-500 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${section.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {section.description}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
