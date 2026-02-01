/**
 * Page Tableau de Bord Finance
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
 */

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { Layout } from "@/components/Layout";
import { Breadcrumbs, PageNotice, Button } from "@/components/common";
import { financeNotices } from "@/lib/notices";
import { useAuth } from "@/lib/finance/compat/auth";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { FadeInUp } from "@/lib/finance/compat/animated";
import { useDashboardData } from "@/hooks/finance/useDashboardData";

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

        {/* Dashboard Header with Time Range Selector & Comparison Toggle */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord Finance</h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Vue d'ensemble de votre activité financière
              {comparisonMode && <span className="ml-2 text-violet-600 dark:text-violet-400">• Mode comparaison</span>}
            </p>
          </div>
        <div className="flex items-center gap-2">
          <ComparisonToggle
            enabled={comparisonMode}
            onChange={setComparisonMode}
          />
          <TimeRangeSelector
            value={timeRange}
            onChange={setTimeRange}
            storageKey="dashboard-time-range"
          />
        </div>
      </div>

      <PageNotice config={financeNotices.dashboard} className="mb-6" />

      {/* 1. Hero Section - KPIs Vitaux */}
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

      {/* 2. Alertes & Actions (moved up for urgency) */}
      {loading ? (
        <AlertsRowSkeleton />
      ) : (
        <AlertsRow actions={dashboardData.actions} />
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

      {/* 5. Insights AI & Activité Récente */}
      <FadeInUp delay={0.25}>
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <Suspense fallback={<InsightsSectionSkeleton />}>
            {loading ? (
              <InsightsSectionSkeleton />
            ) : (
              <InsightsSection insights={dashboardData.insights} />
            )}
          </Suspense>

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
      </FadeInUp>

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
