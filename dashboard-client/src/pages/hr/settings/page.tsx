/**
 * Paramètres RH - Configuration du module Ressources Humaines
 *
 * Fonctionnalités :
 * - Onglets : Général, Présences, Congés, Notifications
 * - Format des matricules employés
 * - Règles de pointage et présences
 * - Types de congés et allocations
 * - Notifications et alertes RH
 */
import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice } from '@/components/common'
import { useMyTenant } from '@/hooks/useMyTenant'
import { hrNotices } from '@/lib/notices'
import {
  Settings,
  Clock,
  Calendar,
  Bell,
} from 'lucide-react'

export default function HRSettingsPage() {
  const { tenant } = useMyTenant()
  const [activeTab, setActiveTab] = useState('general')

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'attendance', label: 'Présences', icon: Clock },
    { id: 'leaves', label: 'Congés', icon: Calendar },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'RH', href: '/hr' },
            { label: 'Paramètres' },
          ]}
        />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Paramètres RH
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Configurez le module Ressources Humaines
          </p>
        </div>

        {/* PageNotice */}
        <PageNotice config={hrNotices.settings} className="mb-2" />

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'general' && <GeneralSettings />}
        {activeTab === 'attendance' && <AttendanceSettings />}
        {activeTab === 'leaves' && <LeavesSettings />}
        {activeTab === 'notifications' && <NotificationsSettings />}
      </div>
    </Layout>
  )
}

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  )
}

function GeneralSettings() {
  return (
    <div className="space-y-6">
      <SettingsCard title="Format des matricules">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
              Préfixe matricule
            </label>
            <input
              type="text"
              defaultValue="EMP"
              className="w-full max-w-xs px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Exemple : EMP-0001
            </p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Paramètres généraux">
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-cyan-600" />
            <span className="text-gray-900 dark:text-white dark:text-gray-300">
              Activer la validation hiérarchique des congés
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-cyan-600" />
            <span className="text-gray-900 dark:text-white dark:text-gray-300">
              Afficher le solde de congés aux employés
            </span>
          </label>
        </div>
      </SettingsCard>
    </div>
  )
}

function AttendanceSettings() {
  return (
    <div className="space-y-6">
      <SettingsCard title="Règles de pointage">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                Heure de début (matin)
              </label>
              <input
                type="time"
                defaultValue="08:00"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                Heure de fin (soir)
              </label>
              <input
                type="time"
                defaultValue="18:00"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
              Tolérance retard (minutes)
            </label>
            <input
              type="number"
              defaultValue={15}
              className="w-full max-w-xs px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Options">
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-cyan-600" />
            <span className="text-gray-900 dark:text-white dark:text-gray-300">
              Activer le pointage automatique
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-5 h-5 rounded text-cyan-600" />
            <span className="text-gray-900 dark:text-white dark:text-gray-300">
              Exiger la géolocalisation
            </span>
          </label>
        </div>
      </SettingsCard>
    </div>
  )
}

function LeavesSettings() {
  return (
    <div className="space-y-6">
      <SettingsCard title="Allocations par défaut">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
              Congés payés annuels (jours)
            </label>
            <input
              type="number"
              defaultValue={25}
              className="w-full max-w-xs px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
              RTT annuels (jours)
            </label>
            <input
              type="number"
              defaultValue={10}
              className="w-full max-w-xs px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Règles">
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-cyan-600" />
            <span className="text-gray-900 dark:text-white dark:text-gray-300">
              Autoriser le report des congés non pris
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-5 h-5 rounded text-cyan-600" />
            <span className="text-gray-900 dark:text-white dark:text-gray-300">
              Exiger un délai minimum de demande (7 jours)
            </span>
          </label>
        </div>
      </SettingsCard>
    </div>
  )
}

function NotificationsSettings() {
  return (
    <div className="space-y-6">
      <SettingsCard title="Notifications email">
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-cyan-600" />
            <span className="text-gray-900 dark:text-white dark:text-gray-300">
              Nouvelle demande de congé
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-cyan-600" />
            <span className="text-gray-900 dark:text-white dark:text-gray-300">
              Contrat arrivant à échéance
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-5 h-5 rounded text-cyan-600" />
            <span className="text-gray-900 dark:text-white dark:text-gray-300">
              Rappel d'évaluation à planifier
            </span>
          </label>
        </div>
      </SettingsCard>

      <SettingsCard title="Alertes">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
              Alerte contrat (jours avant échéance)
            </label>
            <input
              type="number"
              defaultValue={30}
              className="w-full max-w-xs px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </SettingsCard>
    </div>
  )
}
