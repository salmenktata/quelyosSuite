/**
 * Dashboard Support - Vue d'ensemble
 *
 * Fonctionnalités :
 * - KPIs support (tickets ouverts, temps réponse moyen, satisfaction client, taux résolution)
 * - Graphique évolution tickets (7 derniers jours)
 * - Actions rapides (nouveau ticket, base connaissance, FAQ)
 * - Liste des derniers tickets par priorité
 * - Alertes tickets en attente > 24h
 * - Distribution tickets par statut et catégorie
 */

import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button } from '@/components/common'
import { supportNotices } from '@/lib/notices'
import { Headphones, Clock, Star, CheckCircle, Plus, FileQuestion, Book, AlertCircle } from 'lucide-react'

export default function SupportDashboard() {
  // Mock data
  const kpis = [
    { label: 'Tickets Ouverts', value: '34', change: '-5', icon: Headphones, color: 'blue' },
    { label: 'Temps Réponse Moyen', value: '2.4h', change: '-0.3h', icon: Clock, color: 'orange' },
    { label: 'Satisfaction', value: '4.7/5', change: '+0.2', icon: Star, color: 'yellow' },
    { label: 'Taux Résolution', value: '92%', change: '+4%', icon: CheckCircle, color: 'green' },
  ]

  const recentTickets = [
    { id: '#T-1247', title: 'Problème connexion compte', priority: 'high', status: 'open', date: 'Il y a 15min' },
    { id: '#T-1246', title: 'Question facturation', priority: 'medium', status: 'in_progress', date: 'Il y a 1h' },
    { id: '#T-1245', title: 'Demande fonctionnalité', priority: 'low', status: 'pending', date: 'Il y a 3h' },
    { id: '#T-1244', title: 'Bug interface admin', priority: 'high', status: 'resolved', date: 'Il y a 4h' },
  ]

  const alertes = [
    { ticket: '#T-1238', title: 'Paiement non validé', waiting: '26 heures', priority: 'high' },
    { ticket: '#T-1234', title: 'Accès API bloqué', waiting: '30 heures', priority: 'high' },
    { ticket: '#T-1230', title: 'Export données', waiting: '48 heures', priority: 'medium' },
  ]

  const statusDistribution = [
    { status: 'Ouverts', count: 12, color: 'blue' },
    { status: 'En cours', count: 18, color: 'orange' },
    { status: 'En attente', count: 4, color: 'yellow' },
    { status: 'Résolus', count: 142, color: 'green' },
  ]

  return (
    <Layout>
      <Breadcrumbs
        items={[
          { label: 'Support', path: '/support' },
        ]}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Headphones className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard Support
            </h1>
          </div>
          <div className="flex gap-3">
            <Button
              href="/support/tickets/new"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Nouveau Ticket
            </Button>
            <Button
              href="/support/faq"
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <FileQuestion className="h-4 w-4" />
              FAQ
            </Button>
          </div>
        </div>

        <PageNotice notices={supportNotices} currentPath="/support" />

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
                    kpi.change.startsWith('+') || kpi.change.startsWith('-')
                      ? kpi.change.startsWith('-') && kpi.label.includes('Temps')
                        ? 'text-green-600 dark:text-green-400'
                        : kpi.change.startsWith('+')
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {kpi.change} vs semaine dernière
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
            Évolution Tickets (7 derniers jours)
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
                href="/support/tickets/new"
                className="w-full justify-start bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
              >
                <Plus className="h-5 w-5" />
                Créer un Ticket
              </Button>
              <Button
                href="/support/faq"
                className="w-full justify-start bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40"
              >
                <FileQuestion className="h-5 w-5" />
                Gérer FAQ
              </Button>
              <Button
                href="/support/knowledge-base"
                className="w-full justify-start bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40"
              >
                <Book className="h-5 w-5" />
                Base de Connaissance
              </Button>
            </div>
          </div>

          {/* Distribution par Statut */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Distribution par Statut
            </h2>
            <div className="space-y-3">
              {statusDistribution.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full bg-${item.color}-500`} />
                    <span className="text-gray-700 dark:text-gray-300">{item.status}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Derniers Tickets */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Derniers Tickets
          </h2>
          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm font-medium text-gray-600 dark:text-gray-400">
                    {ticket.id}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{ticket.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    ticket.priority === 'high'
                      ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                      : ticket.priority === 'medium'
                      ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {ticket.priority === 'high' ? 'Élevée' : ticket.priority === 'medium' ? 'Moyenne' : 'Faible'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    ticket.status === 'resolved'
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                      : ticket.status === 'in_progress'
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                      : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {ticket.status === 'resolved' ? 'Résolu' : ticket.status === 'in_progress' ? 'En cours' : 'Ouvert'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertes Tickets en Attente */}
        {alertes.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-700">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <h2 className="text-lg font-semibold text-red-900 dark:text-red-200">
                Tickets en Attente Critique ({alertes.length})
              </h2>
            </div>
            <div className="space-y-2">
              {alertes.map((alerte, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-mono text-sm font-medium text-gray-600 dark:text-gray-400">
                      {alerte.ticket}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">{alerte.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      En attente : {alerte.waiting}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    alerte.priority === 'high'
                      ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                      : 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                  }`}>
                    {alerte.priority === 'high' ? 'Urgent' : 'Attention'}
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
