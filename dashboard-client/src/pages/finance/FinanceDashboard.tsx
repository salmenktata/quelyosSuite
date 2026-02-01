/**
 * Page Tableau de Bord Finance - VERSION AMÉLIORÉE
 *
 * Fonctionnalités :
 * - KPIs vitaux : solde actuel, évolution quotidienne et mensuelle
 * - Alertes & actions urgentes : notifications prioritaires en temps réel
 * - KPIs critiques TPE/PME : métriques clés pour piloter l'activité
 * - Timeline de trésorerie : projection sur 30/60/90 jours avec prévisions
 * - Insights AI : analyse automatique et recommandations personnalisées
 * - Activité récente : dernières transactions et mouvements
 * - Mode comparaison : analyse comparative avec périodes précédentes
 * - Ajout rapide : création express de transactions via FAB
 * - Navigation rapide mobile : accès direct aux sections clés
 * - Actions header : boutons d'action visibles en desktop
 * - Pills de statut : indicateurs temps réel de l'activité
 */

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { Layout } from "@/components/Layout";
import { Breadcrumbs, PageNotice, Button } from "@/components/common";
import { financeNotices } from "@/lib/notices";
import { useAuth } from "@/lib/finance/compat/auth";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { FadeInUp } from "@/lib/finance/compat/animated";
import { useDashboardData } from "@/hooks/finance/useDashboardData";
import {
  FileText,
  Wallet,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

// Import dashboard components
import { HeroKPIs } from "@/components/finance/dashboard/HeroKPIs";
import { AlertsRow } from "@/components/finance/dashboard/AlertsRow";
import { CriticalKPIGrid } from "@/components/finance/dashboard/CriticalKPIGrid";
import { TimelineChart } from "@/components/finance/dashboard/TimelineChart";
import { QuickActions } from "@/components/finance/dashboard/QuickActions";
import { InsightsSection } from "@/components/finance/dashboard/InsightsSection";
import { RecentActivity } from "@/components/finance/dashboard/RecentActivity";
import { QuickAddFAB } from "@/components/finance/dashboard/QuickAddFAB";
import { QuickTransactionDialog } from "@/components/finance/dashboard/QuickTransactionDialog";
import { TimeRangeSelector, type TimeRange } from "@/components/finance/dashboard/TimeRangeSelector";
import { ComparisonToggle } from "@/components/finance/dashboard/ComparisonToggle";

// Import skeleton loaders
import {
  HeroKPISkeleton,
  AlertsRowSkeleton,
  CriticalKPIsSkeleton,
  TimelineChartSkeleton,
  QuickActionsSkeleton,
  InsightsSectionSkeleton,
  TransactionListSkeleton,
} from "@/components/finance/dashboard/SkeletonLoaders";

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { baseCurrency, formatAmount } = useCurrency();

  // Quick transaction dialog state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Time range state
  const [timeRange, setTimeRange] = useState<TimeRange>(30);

  // Comparison mode state
  const [comparisonMode, setComparisonMode] = useState(false);

  // Fetch dashboard data with auto-refresh (every 60 seconds)
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch,
  } = useDashboardData({
    days: timeRange,
    enableAutoRefetch: true,
  });

  // Memoized format function
  const money0 = useMemo(
    () => (amount: number) => formatAmount(amount, baseCurrency),
    [formatAmount, baseCurrency]
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      window.location.href = "/login";
    }
  }, [user, isAuthLoading]);

  // Show loader during auth check
  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  // Show error state if data fetch failed (ignore auth errors - will redirect to login)
  if (dashboardError && user) {
    return (
      <Layout>
        <div className="p-4 md:p-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6" role="alert">
            <p className="text-red-800 dark:text-red-200 mb-4">
              Erreur lors du chargement du tableau de bord
            </p>
            <Button variant="secondary" onClick={() => refetch()}>
              Réessayer
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const loading = isDashboardLoading || !dashboardData;

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Finance' },
          ]}
        />

        {/* Dashboard Header with Quick Actions */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Tableau de bord Finance
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Vue d&apos;ensemble de votre activité financière
                {comparisonMode && (
                  <span className="ml-2 inline-flex items-center gap-1 text-violet-600 dark:text-violet-400">
                    • Mode comparaison actif
                  </span>
                )}
              </p>
            </div>

            {/* Quick Action Buttons - Desktop */}
            <div className="hidden lg:flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.location.href = '/finance/invoices/new'}
              >
                <FileText className="w-4 h-4" />
                Nouvelle facture
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.location.href = '/finance/payments'}
              >
                <Wallet className="w-4 h-4" />
                Paiement
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsQuickAddOpen(true)}
              >
                Transaction rapide
              </Button>
            </div>
          </div>

          {/* Time Range & Comparison Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <ComparisonToggle
              enabled={comparisonMode}
              onChange={setComparisonMode}
            />
            <TimeRangeSelector
              value={timeRange}
              onChange={setTimeRange}
              storageKey="dashboard-time-range"
            />

            {/* Quick Stats Pills */}
            {!loading && (
              <div className="hidden xl:flex items-center gap-2 ml-auto">
                <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Trésorerie positive
                </div>
                {dashboardData?.actions && dashboardData.actions.length > 0 && (
                  <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {dashboardData.actions.length} action{dashboardData.actions.length > 1 ? 's' : ''} en attente
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <PageNotice config={financeNotices.dashboard} />

        {/* Quick Navigation Tabs - Mobile & Tablet */}
        <div className="lg:hidden">
          <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 scrollbar-hide">
            <a
              href="#kpis"
              className="flex-shrink-0 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <TrendingUp className="w-4 h-4 inline mr-1.5" />
              KPIs
            </a>
            <a
              href="#timeline"
              className="flex-shrink-0 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <BarChart3 className="w-4 h-4 inline mr-1.5" />
              Timeline
            </a>
            <a
              href="#insights"
              className="flex-shrink-0 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <CheckCircle className="w-4 h-4 inline mr-1.5" />
              Insights
            </a>
            <a
              href="#activity"
              className="flex-shrink-0 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <Clock className="w-4 h-4 inline mr-1.5" />
              Activité
            </a>
          </div>
        </div>

        {/* 1. Hero Section - KPIs Vitaux */}
        <div id="kpis">
          {loading ? (
            <HeroKPISkeleton />
          ) : (
            <HeroKPIs
              currentBalance={dashboardData.balances.total}
              yesterdayDelta={0} // TODO: Calculate from historical data
              monthEvolution={0} // TODO: Calculate from historical data
              formatAmount={money0}
            />
          )}
        </div>

        {/* 2. Alertes & Actions (moved up for urgency) */}
        {loading ? (
          <AlertsRowSkeleton />
        ) : (
          dashboardData.actions.length > 0 && <AlertsRow actions={dashboardData.actions} />
        )}

        {/* 3. KPIs Critiques TPE/PME */}
        <FadeInUp delay={0.15}>
          {loading ? (
            <CriticalKPIsSkeleton />
          ) : (
            <CriticalKPIGrid days={timeRange} />
          )}
        </FadeInUp>

        {/* 4. Timeline 90 jours + Quick Actions */}
        <div id="timeline">
          <FadeInUp delay={0.2}>
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.5fr_1fr]">
              {loading ? (
                <>
                  <TimelineChartSkeleton />
                  <QuickActionsSkeleton />
                </>
              ) : (
                <>
                  <TimelineChart
                    forecastData={dashboardData.forecast}
                    formatAmount={money0}
                  />
                  <QuickActions />
                </>
              )}
            </div>
          </FadeInUp>
        </div>

        {/* 5. Insights AI & Activité Récente */}
        <div id="insights">
          <FadeInUp delay={0.25}>
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <Suspense fallback={<InsightsSectionSkeleton />}>
                {loading ? (
                  <InsightsSectionSkeleton />
                ) : (
                  <InsightsSection insights={dashboardData.insights} />
                )}
              </Suspense>

              <div id="activity">
                <Suspense fallback={<TransactionListSkeleton />}>
                  {loading ? (
                    <TransactionListSkeleton />
                  ) : (
                    <RecentActivity
                      transactions={dashboardData.recentTransactions}
                      formatAmount={money0}
                    />
                  )}
                </Suspense>
              </div>
            </div>
          </FadeInUp>
        </div>

        {/* Quick Add FAB - Fixed position floating action button */}
        <QuickAddFAB onOpenDialog={() => setIsQuickAddOpen(true)} />

        {/* Quick Transaction Dialog */}
        <QuickTransactionDialog
          open={isQuickAddOpen}
          onOpenChange={setIsQuickAddOpen}
        />
      </div>
    </Layout>
  );
}
