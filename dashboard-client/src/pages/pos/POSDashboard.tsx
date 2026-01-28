/**
 * Dashboard POS - Vue d'ensemble pour managers
 *
 * Fonctionnalités :
 * - Affichage des KPIs du jour (ventes, commandes, panier moyen)
 * - Liste des sessions de caisse actives
 * - Accès rapide aux terminaux configurés
 * - Actions rapides (terminal, commandes, rapports)
 * - Statistiques temps réel
 */

import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  Clock,
  Monitor,
  PlayCircle,
  BarChart3,
  CreditCard,
  Loader2,
  ArrowRight,
} from 'lucide-react'
import { Layout } from '../../components/Layout'
import { Breadcrumbs, Button } from '../../components/common'
import { usePOSDashboard, usePOSActiveSessions } from '../../hooks/pos/usePOSDashboard'
import { usePOSConfigs } from '../../hooks/pos/usePOSConfigs'

export default function POSDashboard() {
  const { data: dashboard, isLoading: dashboardLoading } = usePOSDashboard()
  const { data: activeSessions = [], isLoading: sessionsLoading } = usePOSActiveSessions()
  const { data: configs = [] } = usePOSConfigs()

  const kpis = dashboard?.kpis || {
    totalSales: 0,
    orderCount: 0,
    averageBasket: 0,
    uniqueCustomers: 0,
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'POS', href: '/pos' },
            { label: 'Tableau de bord' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Point de Vente
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Vue d'ensemble des ventes et sessions
            </p>
          </div>
          <Link to="/pos/session/open">
            <Button variant="primary" icon={<PlayCircle className="h-4 w-4" />}>
              Ouvrir une session
            </Button>
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Ventes du jour"
            value={`${kpis.totalSales.toFixed(2)} TND`}
            icon={TrendingUp}
            color="teal"
            loading={dashboardLoading}
          />
          <KPICard
            title="Commandes"
            value={kpis.orderCount.toString()}
            icon={ShoppingCart}
            color="blue"
            loading={dashboardLoading}
          />
          <KPICard
            title="Panier moyen"
            value={`${kpis.averageBasket.toFixed(2)} TND`}
            icon={CreditCard}
            color="purple"
            loading={dashboardLoading}
          />
          <KPICard
            title="Sessions actives"
            value={activeSessions.length.toString()}
            icon={Clock}
            color="amber"
            loading={sessionsLoading}
          />
        </div>

        {/* Quick actions & Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick actions */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Actions rapides
              </h2>
              <div className="space-y-3">
                <QuickActionLink
                  to="/pos/terminal"
                  icon={Monitor}
                  label="Terminal de caisse"
                  description="Accéder à l'interface caissier"
                />
                <QuickActionLink
                  to="/pos/orders"
                  icon={ShoppingCart}
                  label="Commandes"
                  description="Historique des ventes"
                />
                <QuickActionLink
                  to="/pos/reports/sales"
                  icon={BarChart3}
                  label="Rapports"
                  description="Statistiques et analyses"
                />
                <QuickActionLink
                  to="/pos/settings"
                  icon={LayoutDashboard}
                  label="Configuration"
                  description="Paramètres POS"
                />
              </div>
            </div>
          </div>

          {/* Active sessions */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Sessions actives
                </h2>
                <Link
                  to="/pos/sessions"
                  className="text-sm text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                >
                  Voir tout <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {sessionsLoading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                </div>
              ) : activeSessions.length === 0 ? (
                <div className="p-8 text-center">
                  <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Aucune session active</p>
                  <Link
                    to="/pos/session/open"
                    className="mt-3 inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Ouvrir une session
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {activeSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <Monitor className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {session.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {session.userName} • Depuis {session.openedAt ? new Date(session.openedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {session.totalAmount.toFixed(2)} TND
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {session.orderCount} commandes
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Terminals */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Terminaux configurés
            </h2>
            <Link
              to="/pos/settings/terminals"
              className="text-sm text-teal-600 dark:text-teal-400 hover:underline"
            >
              Gérer les terminaux
            </Link>
          </div>

          {configs.length === 0 ? (
            <div className="p-8 text-center">
              <Monitor className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Aucun terminal configuré
              </p>
              <Link to="/pos/settings/terminals">
                <Button variant="primary">
                  Configurer un terminal
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {config.name}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      config.hasOpenSession
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                    }`}>
                      {config.hasOpenSession ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {config.warehouse?.name || 'Aucun entrepôt'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {config.paymentMethods.length} méthodes de paiement
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

// KPI Card component
interface KPICardProps {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  color: 'teal' | 'blue' | 'purple' | 'amber'
  loading?: boolean
}

function KPICard({ title, value, icon: Icon, color, loading }: KPICardProps) {
  const colorClasses = {
    teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Quick action link component
interface QuickActionLinkProps {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
}

function QuickActionLink({ to, icon: Icon, label, description }: QuickActionLinkProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
    >
      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-teal-100 dark:group-hover:bg-teal-900/30 transition-colors">
        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400" />
      </div>
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </Link>
  )
}
