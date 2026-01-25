

import { useRequireAuth } from "@/lib/finance/compat/auth";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/finance/compat/routes";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart,
  Wallet,
  Target,
  ArrowRight,
  Sparkles,
  Briefcase,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/glass";

const reports = [
  {
    id: "overview",
    title: "Vue d'ensemble",
    description: "KPIs principaux, tendances et synthèse globale",
    icon: BarChart3,
    href: "/dashboard/reporting/overview",
    badge: "Populaire",
    color: "from-indigo-500 to-purple-500",
  },
  {
    id: "cashflow",
    title: "Trésorerie",
    description: "Analyse waterfall, balance et prévisions 90j",
    icon: DollarSign,
    href: "/dashboard/reporting/cashflow",
    badge: null,
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "by-category",
    title: "Par catégorie",
    description: "Breakdown revenus/dépenses, drill-down transactions",
    icon: PieChart,
    href: "/dashboard/reporting/by-category",
    badge: "Nouveau",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "by-flow",
    title: "Par flux",
    description: "Récurrent vs one-shot, fixes vs variables",
    icon: TrendingUp,
    href: "/dashboard/reporting/by-flow",
    badge: null,
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "by-account",
    title: "Par compte",
    description: "Performance bancaire, soldes, mouvements",
    icon: Wallet,
    href: "/dashboard/reporting/by-account",
    badge: null,
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "by-portfolio",
    title: "Par portefeuille",
    description: "Vue consolidée par groupes de comptes",
    icon: Briefcase,
    href: "/dashboard/reporting/by-portfolio",
    badge: "Nouveau",
    color: "from-fuchsia-500 to-violet-500",
  },
  {
    id: "profitability",
    title: "Rentabilité",
    description: "Marges, ratios, coûts par catégorie",
    icon: Target,
    href: "/dashboard/reporting/profitability",
    badge: null,
    color: "from-rose-500 to-pink-500",
  },
  {
    id: "dso",
    title: "DSO - Délai d'encaissement",
    description: "Days Sales Outstanding, créances clients",
    icon: Clock,
    href: "/dashboard/reporting/dso",
    badge: "KPI",
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "ebitda",
    title: "EBITDA",
    description: "Rentabilité avant amortissements",
    icon: TrendingUp,
    href: "/dashboard/reporting/ebitda",
    badge: "KPI",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "bfr",
    title: "BFR - Besoin en Fonds de Roulement",
    description: "Working Capital, cycle d'exploitation",
    icon: Wallet,
    href: "/dashboard/reporting/bfr",
    badge: "KPI",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "breakeven",
    title: "Point mort (Break-even)",
    description: "Seuil de rentabilité, coûts fixes/variables",
    icon: Target,
    href: "/dashboard/reporting/breakeven",
    badge: "KPI",
    color: "from-purple-500 to-indigo-500",
  },
  {
    id: "forecasts",
    title: "Prédictions ML des KPIs",
    description: "Prévisions intelligentes avec Prophet (Machine Learning)",
    icon: TrendingUp,
    href: "/dashboard/reporting/forecasts",
    badge: "AI",
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "data-quality",
    title: "Qualité des Données KPIs",
    description: "Fiabilité, prérequis et recommandations d'amélioration",
    icon: ShieldCheck,
    href: "/dashboard/reporting/data-quality",
    badge: "Nouveau",
    color: "from-emerald-500 to-teal-500",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

export default function ReportingHubPage() {
  useRequireAuth();

  return (
    <div className="min-h-screen p-6 pt-24">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-3 shadow-lg shadow-indigo-500/30">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Reporting</h1>
              <p className="text-sm text-slate-400">
                Analysez vos finances sous tous les angles
              </p>
            </div>
          </div>
        </motion.div>

        {/* Reports Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          data-guide="reports-grid"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <motion.div key={report.id} variants={itemVariants}>
                <Link to={report.href}>
                  <GlassPanel
                    className="group relative h-full cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                    gradient="none"
                  >
                    {/* Badge */}
                    {report.badge && (
                      <div className="absolute right-4 top-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2 py-1 text-xs font-medium text-indigo-300">
                          <Sparkles className="h-3 w-3" />
                          {report.badge}
                        </span>
                      </div>
                    )}

                    {/* Icon */}
                    <div
                      className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${report.color} shadow-lg`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      {report.title}
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">
                      {report.description}
                    </p>

                    {/* Arrow */}
                    <div className="flex items-center gap-2 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm font-medium">Accéder</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>

                    {/* Hover gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-indigo-500/0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
                  </GlassPanel>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <GlassPanel gradient="purple" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">
                  Rapport complet
                </h2>
                <p className="text-sm text-indigo-200">
                  Générez un PDF consolidé de tous vos rapports
                </p>
              </div>
              <button data-guide="report-export" className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-all hover:scale-105">
                Télécharger PDF
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </div>
  );
}
