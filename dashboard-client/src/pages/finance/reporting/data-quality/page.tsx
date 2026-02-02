/**
 * Qualité des Données KPIs - Fiabilité et Recommandations
 *
 * Fonctionnalités :
 * - Vérification intégrité et qualité données financières
 * - Détection anomalies, doublons et incohérences
 * - Transactions non catégorisées et comptes orphelins
 * - Rapprochement bancaire : écarts soldes système vs relevés
 * - Recommandations d'amélioration qualité données pour KPIs fiables
 */
import { useRequireAuth } from '@/lib/finance/compat/auth'
import { useState } from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice } from '@/components/common'
import { ShieldCheck } from 'lucide-react'
import { GlassPanel } from '@/components/ui/glass'
import { ReliabilityBadge } from '@/components/kpis/ReliabilityBadge'
import { reportingClient } from '@/lib/finance/reporting'
import { useApiData } from '@/hooks/finance/useApiData'
import { financeNotices } from '@/lib/notices/finance-notices'
import type { DSOResponse, EBITDAResponse, BFRResponse, BreakEvenResponse } from '@/lib/finance/reporting'

export default function DataQualityPage() {
  useRequireAuth();
  const [timeRange, _setTimeRange] = useState("30");

  const dsoQuery = useApiData<DSOResponse>({
    fetcher: () => reportingClient.dso({ days: parseInt(timeRange) }),
    cacheKey: `dso-quality-${timeRange}`,
    deps: [timeRange],
  });

  const ebitdaQuery = useApiData<EBITDAResponse>({
    fetcher: () => reportingClient.ebitda({ days: parseInt(timeRange) }),
    cacheKey: `ebitda-quality-${timeRange}`,
    deps: [timeRange],
  });

  const bfrQuery = useApiData<BFRResponse>({
    fetcher: () => reportingClient.bfr({}),
    cacheKey: `bfr-quality-${timeRange}`,
    deps: [timeRange],
  });

  const breakevenQuery = useApiData<BreakEvenResponse>({
    fetcher: () => reportingClient.breakeven({ days: parseInt(timeRange) }),
    cacheKey: `breakeven-quality-${timeRange}`,
    deps: [timeRange],
  });

  const allQueries = [dsoQuery, ebitdaQuery, bfrQuery, breakevenQuery];
  const loading = allQueries.some(q => q.loading);
  const error = allQueries.find(q => q.error);

  // Global score
  const globalScore = !loading && !error
    ? Math.round(
        [dsoQuery.data?.reliability, ebitdaQuery.data?.reliability, bfrQuery.data?.reliability, breakevenQuery.data?.reliability]
          .filter(Boolean)
          .reduce((sum, r) => sum + (r?.score || 0), 0) / 4
      )
    : 0;

  return (
    <LazyMotion features={domAnimation}>
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Finance', href: '/finance' },
            { label: 'Reporting', href: '/finance/reporting' },
            { label: 'Qualité Données' },
          ]}
        />

        <m.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 p-3 shadow-lg shadow-emerald-500/30 dark:shadow-emerald-500/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Qualité des Données KPIs</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Fiabilité et prérequis des indicateurs financiers</p>
            </div>
          </div>
        </m.div>

        <PageNotice config={financeNotices.dataQuality} />

        {/* Global Score */}
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <GlassPanel gradient="emerald" className="p-6">
            <div className="text-center">
              <p className="text-sm text-emerald-200 mb-2">Score de Fiabilité Global</p>
              <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">{globalScore}%</div>
              <p className="text-sm text-emerald-100">
                {globalScore >= 80 && "Données de très bonne qualité"}
                {globalScore >= 60 && globalScore < 80 && "Données fiables - améliorations possibles"}
                {globalScore >= 40 && globalScore < 60 && "Qualité modérée"}
                {globalScore < 40 && "Amélioration urgente nécessaire"}
              </p>
            </div>
          </GlassPanel>
        </m.div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
            <p className="mt-4 text-slate-400">Chargement des données de fiabilité...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-center">
            <p className="text-rose-300">Erreur: {error.error?.message || "Une erreur est survenue"}</p>
          </div>
        )}

        {/* KPIs Grid */}
        {!loading && !error && (
          <div className="grid gap-6 md:grid-cols-2">
            <GlassPanel className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">DSO - Délai d&apos;Encaissement</h3>
              {dsoQuery.data?.reliability && (
                <ReliabilityBadge
                  reliability={dsoQuery.data.reliability}
                  showDetails={true}
                  reportId="dso-overview"
                />
              )}
            </GlassPanel>

            <GlassPanel className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">EBITDA - Rentabilité Opérationnelle</h3>
              {ebitdaQuery.data?.reliability && (
                <ReliabilityBadge
                  reliability={ebitdaQuery.data.reliability}
                  showDetails={true}
                  reportId="ebitda-overview"
                />
              )}
            </GlassPanel>

            <GlassPanel className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">BFR - Besoin en Fonds de Roulement</h3>
              {bfrQuery.data?.reliability && (
                <ReliabilityBadge
                  reliability={bfrQuery.data.reliability}
                  showDetails={true}
                  reportId="bfr-overview"
                />
              )}
            </GlassPanel>

            <GlassPanel className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Point Mort - Seuil de Rentabilité</h3>
              {breakevenQuery.data?.reliability && (
                <ReliabilityBadge
                  reliability={breakevenQuery.data.reliability}
                  showDetails={true}
                  reportId="breakeven-overview"
                />
              )}
            </GlassPanel>
          </div>
        )}
      </div>
    </Layout>
    </LazyMotion>
    );
}
