/**
 * Dashboard CRM - Vue d'ensemble
 *
 * Fonctionnalités :
 * - KPIs globaux (leads actifs, taux conversion, valeur pipeline, revenus du mois)
 * - Graphique évolution leads/opportunités sur 6 mois
 * - Actions rapides (nouveau lead, nouvelle opportunité, segmentation)
 * - Liste des dernières activités CRM (leads récents, opportunités gagnées/perdues)
 * - Alertes leads inactifs nécessitant relance
 * - Distribution pipeline par étape
 * - Top 5 clients par revenu
 */

import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button } from '@/components/common'
import { crmNotices } from '@/lib/notices'
import { Users, Target, TrendingUp, DollarSign, Plus, UserPlus, Layers } from 'lucide-react'

export default function CRMDashboard() {
  // Mock data
  const kpis = [
    { label: 'Leads Actifs', value: '147', change: '+12%', icon: Users, color: 'blue' },
    { label: 'Taux Conversion', value: '24.5%', change: '+3.2%', icon: Target, color: 'green' },
    { label: 'Valeur Pipeline', value: '€847K', change: '+18%', icon: TrendingUp, color: 'purple' },
    { label: 'Revenus Mois', value: '€124K', change: '+8%', icon: DollarSign, color: 'orange' },
  ]

  const recentActivities = [
    { type: 'lead', name: 'Acme Corp', status: 'Nouveau', date: 'Il y a 2h' },
    { type: 'opportunity', name: 'TechStart SAS', status: 'Gagné', amount: '€45K', date: 'Il y a 4h' },
    { type: 'lead', name: 'Global Industries', status: 'Qualifié', date: 'Il y a 6h' },
    { type: 'opportunity', name: 'Digital Partners', status: 'Perdu', date: 'Hier' },
  ]

  const alertes = [
    { lead: 'InnovateTech', lastContact: '12 jours', risk: 'high' },
    { lead: 'FutureVision', lastContact: '8 jours', risk: 'medium' },
    { lead: 'SmartSolutions', lastContact: '15 jours', risk: 'high' },
  ]

  return (
    <Layout>
      <Breadcrumbs
        items={[
          { label: 'CRM', path: '/crm' },
        ]}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard CRM
            </h1>
          </div>
          <div className="flex gap-3">
            <Button
              href="/crm/leads/new"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Nouveau Lead
            </Button>
            <Button
              href="/crm/pipeline"
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Target className="h-4 w-4" />
              Pipeline
            </Button>
          </div>
        </div>

        <PageNotice notices={crmNotices} currentPath="/crm" />

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{kpi.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {kpi.value}
                  </p>
                  <p className={`text-sm mt-1 ${
                    kpi.change.startsWith('+')
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {kpi.change} vs mois dernier
                  </p>
                </div>
                <kpi.icon className={`h-10 w-10 text-${kpi.color}-600 dark:text-${kpi.color}-400`} />
              </div>
            </div>
          ))}
        </div>

        {/* Graphique Évolution (Placeholder) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Évolution Leads & Opportunités (6 derniers mois)
          </h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              Graphique à venir (Chart.js ou Recharts)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Actions Rapides */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Actions Rapides
            </h2>
            <div className="space-y-3">
              <Button
                href="/crm/leads/new"
                className="w-full justify-start bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
              >
                <UserPlus className="h-5 w-5" />
                Créer un Lead
              </Button>
              <Button
                href="/crm/pipeline"
                className="w-full justify-start bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40"
              >
                <Target className="h-5 w-5" />
                Voir le Pipeline
              </Button>
              <Button
                href="/crm/segmentation"
                className="w-full justify-start bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40"
              >
                <Layers className="h-5 w-5" />
                Segmentation Clients
              </Button>
            </div>
          </div>

          {/* Dernières Activités */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Dernières Activités
            </h2>
            <div className="space-y-3">
              {recentActivities.map((activity, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{activity.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.type === 'lead' ? 'Lead' : 'Opportunité'} • {activity.status}
                      {activity.amount && ` • ${activity.amount}`}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{activity.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alertes Leads Inactifs */}
        {alertes.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-lg border border-amber-200 dark:border-amber-700">
            <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-200 mb-4">
              ⚠️ Alertes Relance ({alertes.length})
            </h2>
            <div className="space-y-2">
              {alertes.map((alerte, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{alerte.lead}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Dernier contact : {alerte.lastContact}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    alerte.risk === 'high'
                      ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                      : 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                  }`}>
                    {alerte.risk === 'high' ? 'Urgent' : 'Attention'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
