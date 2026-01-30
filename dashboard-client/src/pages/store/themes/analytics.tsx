/**
 * Page Analytics Marketplace Thèmes - Dashboard Admin
 *
 * Fonctionnalités:
 * - Métriques générales (revenus, ventes, thèmes, designers)
 * - Top 5 thèmes les plus vendus
 * - Top 5 designers par revenus
 * - Statistiques par catégorie
 * - Graphique évolution ventes/revenus
 * - Tâches en attente (validation, payouts, onboarding)
 */

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, PageNotice, SkeletonTable } from '@/components/common';
import { logger } from '@quelyos/logger';
import {
  TrendingUp,
  DollarSign,
  Users,
  Palette,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
} from 'lucide-react';

interface Overview {
  total_themes: number;
  total_designers: number;
  total_sales: number;
  total_revenue: number;
  platform_revenue: number;
  designer_revenue: number;
  pending_submissions: number;
  pending_payouts: number;
  avg_theme_price: number;
  conversion_rate: number;
}

interface TopTheme {
  id: number;
  submission_id: number;
  name: string;
  sales_count: number;
  total_revenue: number;
  designer_name: string;
  category: string;
  thumbnail: string | null;
  average_rating: number;
}

interface TopDesigner {
  id: number;
  display_name: string;
  email: string;
  themes_count: number;
  total_sales: number;
  total_revenue: number;
  average_rating: number;
  pending_balance: number;
  stripe_payouts_enabled: boolean;
}

interface CategoryStat {
  category: string;
  themes_count: number;
  sales_count: number;
  total_revenue: number;
  avg_rating: number;
}

interface TimelineData {
  month: string;
  sales_count: number;
  revenue: number;
  avg_price: number;
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [topThemes, setTopThemes] = useState<TopTheme[]>([]);
  const [topDesigners, setTopDesigners] = useState<TopDesigner[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [timeline, setTimeline] = useState<TimelineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer toutes les données en parallèle
      const [overviewRes, themesRes, designersRes, categoriesRes, timelineRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/themes/analytics/overview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: {}, id: 1 }),
        }),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/themes/analytics/top-themes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { limit: 5 }, id: 2 }),
        }),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/themes/analytics/top-designers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { limit: 5 }, id: 3 }),
        }),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/themes/analytics/category-stats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: {}, id: 4 }),
        }),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/themes/analytics/sales-timeline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { months: 6 }, id: 5 }),
        }),
      ]);

      const [overviewData, themesData, designersData, categoriesData, timelineData] =
        await Promise.all([
          overviewRes.json(),
          themesRes.json(),
          designersRes.json(),
          categoriesRes.json(),
          timelineRes.json(),
        ]);

      if (overviewData.result?.success) setOverview(overviewData.result.overview);
      if (themesData.result?.success) setTopThemes(themesData.result.themes);
      if (designersData.result?.success) setTopDesigners(designersData.result.designers);
      if (categoriesData.result?.success) setCategories(categoriesData.result.categories);
      if (timelineData.result?.success) setTimeline(timelineData.result.timeline);
    } catch (err) {
      logger.error('[ThemeAnalytics] Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      fashion: 'Mode',
      tech: 'High-Tech',
      food: 'Alimentaire',
      beauty: 'Beauté',
      sports: 'Sports',
      home: 'Maison',
      general: 'Général',
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <SkeletonTable rows={8} columns={4} />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <Breadcrumbs
            items={[
              { label: 'Boutique', href: '/store' },
              { label: 'Thèmes', href: '/store/themes' },
              { label: 'Analytics', href: '/store/themes/analytics' },
            ]}
          />

          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analytics Marketplace
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Statistiques et performances de la marketplace thèmes
            </p>
          </div>

          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">Erreur</h3>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* 1. Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Boutique', href: '/store' },
            { label: 'Thèmes', href: '/store/themes' },
            { label: 'Analytics', href: '/store/themes/analytics' },
          ]}
        />

        {/* 2. Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analytics Marketplace
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Statistiques et performances de la marketplace thèmes
            </p>
          </div>
        </div>

        {/* 3. PageNotice */}
        <PageNotice
          config={{
            pageId: 'themes-analytics',
            title: 'Analytics Marketplace',
            purpose: 'Visualisez les performances globales de la marketplace de thèmes',
            icon: TrendingUp,
            moduleColor: 'indigo',
            sections: [
              {
                title: 'Métriques Disponibles',
                items: [
                  'Revenus totaux et commission plateforme (30%)',
                  'Top 5 thèmes les plus vendus avec notes',
                  'Top 5 designers par chiffre d\'affaires',
                  'Statistiques par catégorie (Mode, Tech, etc.)',
                  'Évolution des ventes sur 6 mois',
                ],
              },
            ],
          }}
        />

      {/* Métriques principales */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Revenus totaux
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(overview.total_revenue)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Platform: {formatCurrency(overview.platform_revenue)} (30%)
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ventes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {overview.total_sales}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Taux conversion: {overview.conversion_rate}%
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Thèmes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {overview.total_themes}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Prix moyen: {formatCurrency(overview.avg_theme_price)}
                </p>
              </div>
              <Palette className="h-10 w-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Designers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {overview.total_designers}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Payouts: {formatCurrency(overview.pending_payouts)}
                </p>
              </div>
              <Users className="h-10 w-10 text-indigo-500" />
            </div>
          </div>
        </div>
      )}

      {/* Top thèmes et designers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top thèmes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top 5 Thèmes
            </h2>
          </div>
          <div className="p-6">
            {topThemes.length === 0 ? (
              <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                Aucun thème vendu
              </p>
            ) : (
              <div className="space-y-4">
                {topThemes.map((theme, index) => (
                  <div
                    key={theme.submission_id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{theme.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {theme.designer_name} • {theme.sales_count} ventes
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(theme.total_revenue)}
                      </p>
                      <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400">
                        <Star className="h-3 w-3 mr-1" />
                        {theme.average_rating.toFixed(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top designers */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top 5 Designers
            </h2>
          </div>
          <div className="p-6">
            {topDesigners.length === 0 ? (
              <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                Aucun designer
              </p>
            ) : (
              <div className="space-y-4">
                {topDesigners.map((designer, index) => (
                  <div
                    key={designer.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {designer.display_name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {designer.themes_count} thèmes • {designer.total_sales} ventes
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(designer.total_revenue)}
                      </p>
                      <div className="flex items-center justify-end space-x-2 text-xs">
                        {designer.stripe_payouts_enabled ? (
                          <span className="text-green-600 dark:text-green-400">
                            <CheckCircle className="h-3 w-3 inline mr-1" />
                            Payouts OK
                          </span>
                        ) : (
                          <span className="text-yellow-600 dark:text-yellow-400">
                            <Clock className="h-3 w-3 inline mr-1" />
                            Onboarding
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistiques par catégorie */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Statistiques par Catégorie
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Thèmes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ventes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Revenus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Note
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {categories.map((cat) => (
                <tr key={cat.category}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {getCategoryLabel(cat.category)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {cat.themes_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {cat.sales_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(cat.total_revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      {cat.avg_rating.toFixed(1)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timeline évolution */}
      {timeline.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Évolution des ventes (6 derniers mois)
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {timeline.map((month) => (
                <div
                  key={month.month}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{month.month}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {month.sales_count} ventes • Moyenne: {formatCurrency(month.avg_price)}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(month.revenue)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
}
