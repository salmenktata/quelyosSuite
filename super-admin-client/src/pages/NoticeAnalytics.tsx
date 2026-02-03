/**
 * Page Admin - Analytics des Notices
 * Visualise statistiques d'utilisation et feedback utilisateurs
 */

import { useState, useEffect } from 'react';
import { Breadcrumbs, Button } from '../components/common';
import {
  getAllNoticeAnalytics,
  getNoticeHelpfulnessRate,
  exportNoticeAnalyticsCSV,
  type NoticeAnalytics
} from '@/lib/notices/analytics';
import { DownloadIcon, TrendingUpIcon, TrendingDownIcon, MinusIcon } from 'lucide-react';
import { logger } from '@/lib/logger';

export function NoticeAnalytics() {
  const [analytics, setAnalytics] = useState<Record<string, NoticeAnalytics>>({});
  const [sortBy, setSortBy] = useState<'views' | 'feedback' | 'helpfulness'>('views');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    // Charger les analytics au montage
    const data = getAllNoticeAnalytics();
    queueMicrotask(() => setAnalytics(data));
  }, []);

  const handleExport = () => {
    try {
      const csv = exportNoticeAnalyticsCSV();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `notice_analytics_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      logger.error('Export failed:', error);
    }
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Transformer et trier les données
  const sortedAnalytics = Object.values(analytics).sort((a, b) => {
    let aValue: number, bValue: number;

    switch (sortBy) {
      case 'views':
        aValue = a.views;
        bValue = b.views;
        break;
      case 'feedback':
        aValue = a.feedbackPositive + a.feedbackNegative;
        bValue = b.feedbackPositive + b.feedbackNegative;
        break;
      case 'helpfulness':
        aValue = getNoticeHelpfulnessRate(a.pageId);
        bValue = getNoticeHelpfulnessRate(b.pageId);
        break;
      default:
        return 0;
    }

    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  // Stats globales
  const totalViews = Object.values(analytics).reduce((sum, a) => sum + a.views, 0);
  const totalExpansions = Object.values(analytics).reduce((sum, a) => sum + a.expansions, 0);
  const totalFeedback = Object.values(analytics).reduce(
    (sum, a) => sum + a.feedbackPositive + a.feedbackNegative,
    0
  );
  const avgHelpfulness = Object.values(analytics).reduce(
    (sum, a) => sum + getNoticeHelpfulnessRate(a.pageId),
    0
  ) / (Object.values(analytics).length || 1);

  const getHelpfulnessColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 dark:text-green-400';
    if (rate >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getHelpfulnessIcon = (rate: number) => {
    if (rate >= 80) return <TrendingUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />;
    if (rate >= 50) return <MinusIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
    return <TrendingDownIcon className="h-4 w-4 text-red-600 dark:text-red-400" />;
  };

  return (
    <div className="p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Analytics Notices' },
          ]}
        />

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Analytics des Notices
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Statistiques d'utilisation et feedback utilisateurs
            </p>
          </div>
          <Button onClick={handleExport} className="flex items-center gap-2">
            <DownloadIcon className="h-4 w-4" />
            Exporter CSV
          </Button>
        </div>

        {/* KPIs Globaux */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Vues</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalViews}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expansions</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalExpansions}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Feedbacks</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalFeedback}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">% Utilité Moy.</p>
            <p className={`text-3xl font-bold ${getHelpfulnessColor(avgHelpfulness)}`}>
              {avgHelpfulness.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Tableau Analytics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Page ID
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => handleSort('views')}
                  >
                    Vues {sortBy === 'views' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Expansions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Collapses
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => handleSort('feedback')}
                  >
                    Feedback {sortBy === 'feedback' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => handleSort('helpfulness')}
                  >
                    % Utilité {sortBy === 'helpfulness' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Dernière Vue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedAnalytics.map((item) => {
                  const helpfulnessRate = getNoticeHelpfulnessRate(item.pageId);
                  const totalFeedbackItem = item.feedbackPositive + item.feedbackNegative;

                  return (
                    <tr key={item.pageId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {item.pageId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {item.views}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {item.expansions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {item.collapses}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="text-green-600 dark:text-green-400">{item.feedbackPositive}</span>
                        {' / '}
                        <span className="text-red-600 dark:text-red-400">{item.feedbackNegative}</span>
                        {' '}
                        <span className="text-gray-500 dark:text-gray-400">
                          ({totalFeedbackItem} total)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          {getHelpfulnessIcon(helpfulnessRate)}
                          <span className={getHelpfulnessColor(helpfulnessRate)}>
                            {helpfulnessRate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {new Date(item.lastViewed).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {sortedAnalytics.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Aucune donnée d'analytics disponible.
                <br />
                Les statistiques apparaîtront après utilisation des notices.
              </p>
            </div>
          )}
        </div>

        {/* Légende */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📊 Interprétation des données
          </h3>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li><strong>Vues</strong> : Nombre de fois où la page contenant la notice a été chargée</li>
            <li><strong>Expansions</strong> : Nombre de fois où l&apos;utilisateur a déplié la notice</li>
            <li><strong>Collapses</strong> : Nombre de fois où l&apos;utilisateur a replié la notice</li>
            <li><strong>Feedback</strong> : Vert = Utile (👍) / Rouge = Pas utile (👎)</li>
            <li><strong>% Utilité</strong> : Pourcentage de feedback positif (Vert ≥80%, Jaune ≥50%, Rouge &lt;50%)</li>
          </ul>
        </div>
      </div>
  );
}
