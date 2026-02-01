/**
 * Paramètres GMAO - Configuration du module de maintenance
 *
 * Fonctionnalités :
 * - Paramètres généraux (workflow, notifications)
 * - Gestion des types d'interventions
 * - Configuration des SLA et priorités
 * - Modèles de tâches de maintenance
 * - Intégrations externes
 */
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button } from '@/components/common'
import { maintenanceNotices } from '@/lib/notices/maintenance-notices'
import { Settings as SettingsIcon, Save, Bell, Workflow, Clock, Zap } from 'lucide-react'
import { useState } from 'react'

export default function MaintenanceSettings() {
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'workflow' | 'sla'>('general')

  const tabs = [
    { id: 'general', label: 'Général', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'workflow', label: 'Workflow', icon: Workflow },
    { id: 'sla', label: 'SLA & Priorités', icon: Clock },
  ]

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'GMAO', href: '/maintenance' },
            { label: 'Paramètres' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <SettingsIcon className="w-6 h-6 text-amber-600" />
              Paramètres GMAO
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Configuration du module de gestion de maintenance
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Save className="w-4 h-4" />}
            onClick={() => alert('Fonctionnalité à venir : Sauvegarder les paramètres')}
          >
            Enregistrer
          </Button>
        </div>

        <PageNotice config={maintenanceNotices.settings} className="mb-2" />

        {/* Tabs navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex gap-1 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Paramètres Généraux
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Préfixe des codes équipements
                    </label>
                    <input
                      type="text"
                      placeholder="EQP-"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Préfixe des demandes de maintenance
                    </label>
                    <input
                      type="text"
                      placeholder="MNT-"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="autoAssign"
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <label htmlFor="autoAssign" className="text-sm text-gray-700 dark:text-gray-300">
                      Assignation automatique des demandes selon disponibilité
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="preventiveMaintenance"
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <label htmlFor="preventiveMaintenance" className="text-sm text-gray-700 dark:text-gray-300">
                      Activer la maintenance préventive automatique
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Configuration des alertes et notifications de maintenance
                </p>
              </div>
            )}

            {activeTab === 'workflow' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Workflow className="w-5 h-5" />
                  Workflow
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Définition des étapes et validations des demandes de maintenance
                </p>
              </div>
            )}

            {activeTab === 'sla' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  SLA & Priorités
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Configuration des accords de niveau de service et niveaux de priorité
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
