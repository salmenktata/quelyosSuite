/**
 * Page Tableau de Bord Finance - VERSION SIMPLIFIÉE
 *
 * Fonctionnalités :
 * - 4 KPIs essentiels : solde actuel, revenus, dépenses, ratio
 * - Liste transactions récentes (15 dernières)
 * - Actions rapides : ajouter revenu/dépense
 * - Interface épurée sans animations
 * - Conforme standards UI_PATTERNS.md
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, PageNotice, Button } from '@/components/common';
import { financeNotices } from '@/lib/notices/finance-notices';
import { useAuth } from '@/lib/finance/compat/auth';
import { useCurrency } from '@/lib/finance/CurrencyContext';
import { useDashboardData } from '@/hooks/finance/useDashboardData';
import {
  Plus,
  Minus,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

// Import simplified dashboard components
import { KPICard } from '@/components/finance/dashboard/KPICard';
import { SimpleTransactionList } from '@/components/finance/dashboard/SimpleTransactionList';
import { SkeletonKPIGrid } from '@/components/finance/dashboard/SkeletonKPIGrid';
import { TreasuryForecast } from '@/components/finance/dashboard/TreasuryForecast';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { baseCurrency, formatAmount } = useCurrency();

  // Fetch dashboard data (30 days, no auto-refresh)
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch,
  } = useDashboardData({
    days: 30,
    enableAutoRefetch: false,
  });

  // Fetch previous period data for trends comparison (60 days total, use last 30)
  const { data: previousPeriodData } = useDashboardData({
    days: 60,
    enableAutoRefetch: false,
  });

  // Memoized format function
  const money0 = useMemo(
    () => (amount: number) => formatAmount(amount, baseCurrency),
    [formatAmount, baseCurrency]
  );

  // Calculate KPIs with trends and sparklines
  const kpiData = useMemo(() => {
    if (!dashboardData) return null;

    const currentBalance = dashboardData.balances.total;

    const monthlyIncome = dashboardData.forecast.historical.reduce(
      (sum, day) => sum + day.income,
      0
    );

    const monthlyExpenses = dashboardData.forecast.historical.reduce(
      (sum, day) => sum + day.expenses,
      0
    );

    const ratio = monthlyExpenses > 0 ? monthlyIncome / monthlyExpenses : 0;
    const ratioBadge =
      ratio >= 1.2
        ? { label: 'Excellent', variant: 'success' as const }
        : ratio >= 0.8
          ? { label: 'Correct', variant: 'warning' as const }
          : { label: 'Attention', variant: 'danger' as const };

    // Calculate trends vs previous period
    let incomeTrend, expensesTrend, ratioTrend;
    if (previousPeriodData && previousPeriodData.forecast.historical.length >= 60) {
      // Previous period = days 31-60 (second half of 60-day data)
      const prevPeriodData = previousPeriodData.forecast.historical.slice(30, 60);

      const prevIncome = prevPeriodData.reduce((sum, day) => sum + day.income, 0);
      const prevExpenses = prevPeriodData.reduce((sum, day) => sum + day.expenses, 0);
      const prevRatio = prevExpenses > 0 ? prevIncome / prevExpenses : 0;

      // Calculate percentage changes
      const incomeChange = prevIncome > 0 ? ((monthlyIncome - prevIncome) / prevIncome) * 100 : 0;
      const expensesChange = prevExpenses > 0 ? ((monthlyExpenses - prevExpenses) / prevExpenses) * 100 : 0;
      const ratioChange = prevRatio > 0 ? ((ratio - prevRatio) / prevRatio) * 100 : 0;

      incomeTrend = {
        direction: incomeChange > 0 ? 'up' as const : incomeChange < 0 ? 'down' as const : 'neutral' as const,
        value: `${incomeChange > 0 ? '+' : ''}${incomeChange.toFixed(1)}%`,
      };

      expensesTrend = {
        direction: expensesChange > 0 ? 'up' as const : expensesChange < 0 ? 'down' as const : 'neutral' as const,
        value: `${expensesChange > 0 ? '+' : ''}${expensesChange.toFixed(1)}%`,
      };

      ratioTrend = {
        direction: ratioChange > 0 ? 'up' as const : ratioChange < 0 ? 'down' as const : 'neutral' as const,
        value: `${ratioChange > 0 ? '+' : ''}${ratioChange.toFixed(1)}%`,
      };
    }

    // Calculate sparkline data for balance (cumulative balance over time)
    const balanceSparkline = dashboardData.forecast.historical.map((day, index) => {
      const previousDays = dashboardData.forecast.historical.slice(0, index);
      const cumulativeChange = previousDays.reduce(
        (sum, d) => sum + (d.income - d.expenses),
        0
      );
      return currentBalance - (monthlyIncome - monthlyExpenses) + cumulativeChange;
    });

    // Calculate daily averages for treasury forecast
    const numDays = dashboardData.forecast.historical.length;
    const averageDailyIncome = numDays > 0 ? monthlyIncome / numDays : 0;
    const averageDailyExpenses = numDays > 0 ? monthlyExpenses / numDays : 0;

    return {
      currentBalance,
      monthlyIncome,
      monthlyExpenses,
      ratio,
      ratioBadge,
      incomeTrend,
      expensesTrend,
      ratioTrend,
      balanceSparkline,
      averageDailyIncome,
      averageDailyExpenses,
    };
  }, [dashboardData, previousPeriodData]);

  // Auth is handled by ProtectedRoute wrapper

  const loading = isDashboardLoading || !dashboardData;

  return (
    <Layout>
      <div className="![animation:none] p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Finance' },
          ]}
        />

        <div className="![animation:none] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="![animation:none] text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Tableau de bord Finance
            </h1>
            <p className="![animation:none] text-sm text-gray-600 dark:text-gray-400 mt-1">
              Vue d&apos;ensemble de votre activité financière
            </p>
          </div>

          <div className="![animation:none] flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus className="![animation:none] w-4 h-4" />}
              onClick={() => navigate('/finance/incomes/new')}
            >
              Revenu
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Minus className="![animation:none] w-4 h-4" />}
              onClick={() => navigate('/finance/expenses/new')}
            >
              Dépense
            </Button>
          </div>
        </div>

        <PageNotice config={financeNotices.dashboard} className="![animation:none]" />

        {dashboardError && user && (
          <div
            role="alert"
            className="![animation:none] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="![animation:none] flex items-center gap-3">
              <AlertCircle className="![animation:none] w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="![animation:none] flex-1 text-red-800 dark:text-red-200">
                Erreur lors du chargement du tableau de bord
              </p>
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw className="![animation:none] w-4 h-4" />}
                onClick={() => refetch()}
              >
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <SkeletonKPIGrid />
        ) : (
          kpiData && (
            <>
              <div className="![animation:none] grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                  title="Solde Actuel"
                  value={money0(kpiData.currentBalance)}
                  icon={Wallet}
                  sparklineData={kpiData.balanceSparkline}
                />
                <KPICard
                  title="Revenus du Mois"
                  value={money0(kpiData.monthlyIncome)}
                  icon={ArrowUpCircle}
                  trend={kpiData.incomeTrend}
                />
                <KPICard
                  title="Dépenses du Mois"
                  value={money0(kpiData.monthlyExpenses)}
                  icon={ArrowDownCircle}
                  trend={kpiData.expensesTrend}
                />
                <KPICard
                  title="Ratio Revenus/Dépenses"
                  value={kpiData.ratio.toFixed(2)}
                  icon={TrendingUp}
                  badge={kpiData.ratioBadge}
                  trend={kpiData.ratioTrend}
                />
              </div>

              <TreasuryForecast
                currentBalance={kpiData.currentBalance}
                averageDailyIncome={kpiData.averageDailyIncome}
                averageDailyExpenses={kpiData.averageDailyExpenses}
                formatAmount={money0}
              />

              <div className="![animation:none] bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="![animation:none] text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Activité Récente
                </h2>
                <SimpleTransactionList
                  transactions={dashboardData.recentTransactions}
                  formatAmount={money0}
                />
                <Button
                  variant="ghost"
                  className="![animation:none] w-full mt-4"
                  onClick={() => navigate('/finance/transactions')}
                >
                  Voir toutes les transactions
                </Button>
              </div>
            </>
          )
        )}
      </div>
    </Layout>
  );
}
