/**
 * Reporting Financier - Hub central des rapports et analyses
 *
 * Fonctionnalités :
 * - Accès à tous les rapports financiers en un seul endroit
 * - KPIs essentiels : DSO, EBITDA, BFR, point mort, trésorerie
 * - Analyses détaillées : par catégorie, flux, compte, portefeuille
 * - Rentabilité : marges, ratios, profitabilité par segment
 * - Qualité données : détection anomalies et rapprochements
 */
import { useRequireAuth } from '@/lib/finance/compat/auth'
import { Link } from 'react-router-dom'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice } from '@/components/common'
import { financeNotices } from '@/lib/notices/finance-notices'
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Wallet,
  Target,
  ArrowRight,
  Sparkles,
  Briefcase,
  Clock,
  ShieldCheck,
} from 'lucide-react'
import { GlassPanel } from '@/components/ui/glass'

const reports = [
  {
    id: 'by-category',
    title: 'Par catégorie',
    description: 'Breakdown revenus/dépenses, drill-down transactions',
    icon: PieChart,
    href: '/finance/reporting/by-category',
    badge: null,
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'by-flow',
    title: 'Par flux',
    description: 'Récurrent vs one-shot, fixes vs variables',
    icon: TrendingUp,
    href: '/finance/reporting/by-flow',
    badge: null,
    color: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'by-account',
    title: 'Par compte',
    description: 'Performance bancaire, soldes, mouvements',
    icon: Wallet,
    href: '/finance/reporting/by-account',
    badge: null,
    color: 'from-violet-500 to-purple-500',
  },
  {
    id: 'by-portfolio',
    title: 'Par portefeuille',
    description: 'Vue consolidée par groupes de comptes',
    icon: Briefcase,
    href: '/finance/reporting/by-portfolio',
    badge: null,
    color: 'from-fuchsia-500 to-violet-500',
  },
  {
    id: 'profitability',
    title: 'Rentabilité',
    description: 'Marges, ratios, coûts par catégorie',
    icon: Target,
    href: '/finance/reporting/profitability',
    badge: null,
    color: 'from-rose-500 to-pink-500',
  },
  {
    id: 'dso',
    title: 'DSO - Délai d\'encaissement',
    description: 'Days Sales Outstanding, créances clients',
    icon: Clock,
    href: '/finance/reporting/dso',
    badge: 'KPI',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'ebitda',
    title: 'EBITDA',
    description: 'Rentabilité avant amortissements',
    icon: TrendingUp,
    href: '/finance/reporting/ebitda',
    badge: 'KPI',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'bfr',
    title: 'BFR - Besoin en Fonds de Roulement',
    description: 'Working Capital, cycle d\'exploitation',
    icon: Wallet,
    href: '/finance/reporting/bfr',
    badge: 'KPI',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'breakeven',
    title: 'Point mort (Break-even)',
    description: 'Seuil de rentabilité, coûts fixes/variables',
    icon: Target,
    href: '/finance/reporting/breakeven',
    badge: 'KPI',
    color: 'from-purple-500 to-indigo-500',
  },
  {
    id: 'data-quality',
    title: 'Qualité des Données KPIs',
    description: 'Fiabilité, prérequis et recommandations d\'amélioration',
    icon: ShieldCheck,
    href: '/finance/reporting/data-quality',
    badge: 'Nouveau',
    color: 'from-emerald-500 to-teal-500',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
}

export default function ReportingHubPage() {
  useRequireAuth()

  return (
    <LazyMotion features={domAnimation}>
    <Layout>
      <div className="![animation:none] p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Finance', href: '/finance' },
            { label: 'Reporting' },
          ]}
        />

        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="![animation:none] flex items-center gap-3 mb-4">
            <div className="![animation:none] rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-3 shadow-lg shadow-indigo-500/30 dark:shadow-indigo-500/20">
              <BarChart3 className="![animation:none] h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="![animation:none] text-3xl font-bold text-gray-900 dark:text-white">Reporting</h1>
              <p className="![animation:none] text-sm text-gray-500 dark:text-gray-400">
                Analysez vos finances sous tous les angles
              </p>
            </div>
          </div>
        </m.div>

        <PageNotice config={financeNotices.reporting} className="![animation:none]" />

        <m.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          data-guide="reports-grid"
          className="![animation:none] grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {reports.map(report => {
            const Icon = report.icon
            return (
              <m.div key={report.id} variants={itemVariants}>
                <Link to={report.href}>
                  <GlassPanel
                    className="![animation:none] group relative h-full cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                    gradient="none"
                  >
                    {report.badge && (
                      <div className="![animation:none] absolute right-4 top-4">
                        <span className="![animation:none] inline-flex items-center gap-1 rounded-full bg-indigo-500/20 dark:bg-indigo-500/30 px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                          <Sparkles className="![animation:none] h-3 w-3" />
                          {report.badge}
                        </span>
                      </div>
                    )}

                    <div
                      className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${report.color} shadow-lg`}
                    >
                      <Icon className="![animation:none] h-6 w-6 text-white" />
                    </div>

                    <h3 className="![animation:none] mb-2 text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                      {report.title}
                    </h3>
                    <p className="![animation:none] text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {report.description}
                    </p>

                    <div className="![animation:none] flex items-center gap-2 text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="![animation:none] text-sm font-medium">Accéder</span>
                      <ArrowRight className="![animation:none] h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>

                    <div className="![animation:none] absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-indigo-500/0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
                  </GlassPanel>
                </Link>
              </m.div>
            )
          })}
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <GlassPanel gradient="purple" className="![animation:none] p-6">
            <div className="![animation:none] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="![animation:none] text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Rapport complet
                </h2>
                <p className="![animation:none] text-sm text-gray-600 dark:text-gray-300">
                  Générez un PDF consolidé de tous vos rapports
                </p>
              </div>
              <button
                data-guide="report-export"
                className="![animation:none] flex items-center gap-2 rounded-lg bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 transition-all hover:scale-105 hover:shadow-md"
              >
                Télécharger PDF
                <ArrowRight className="![animation:none] h-4 w-4" />
              </button>
            </div>
          </GlassPanel>
        </m.div>
      </div>
    </Layout>
    </LazyMotion>
  )
}
