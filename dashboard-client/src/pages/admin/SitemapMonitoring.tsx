/**
 * Page Suivi Sitemap - Super Admin
 *
 * Fonctionnalités principales :
 * - Visualisation de toutes les URLs du sitemap vitrine-quelyos
 * - Statistiques : total URLs, priorités, fréquences
 * - Filtres : recherche, priorité, fréquence
 * - Liens directs vers chaque page
 * - Export vers sitemap.xml
 */

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, Button } from '@/components/common';
import { Search, ExternalLink, RefreshCw, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import { logger } from '@quelyos/logger';
import { getAppUrl } from '@quelyos/config';

const SITE_URL = import.meta.env.VITE_VITRINE_URL || getAppUrl('vitrine', import.meta.env.MODE as 'development' | 'production' | 'staging');

interface SitemapEntry {
  path: string;
  url: string;
  lastModified: string;
  changeFrequency: string;
  priority: number;
}

interface SitemapStats {
  total: number;
  byPriority: { [key: string]: number };
  byFrequency: { [key: string]: number };
  lastUpdate: string;
}

export default function SitemapMonitoring() {
  const [entries, setEntries] = useState<SitemapEntry[]>([]);
  const [stats, setStats] = useState<SitemapStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterFrequency, setFilterFrequency] = useState<string>('all');

  useEffect(() => {
    fetchSitemap();
  }, []);

  async function fetchSitemap() {
    try {
      setLoading(true);
      // Appel à l'API du site vitrine
      const response = await fetch(`${SITE_URL}/api/superadmin/sitemap`);
      if (!response.ok) throw new Error('Failed to fetch sitemap');

      const data = await response.json();
      setEntries(data.entries);
      setStats(data.stats);
    } catch (error) {
      logger.error('Erreur lors du chargement du sitemap:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.path.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || entry.priority.toString() === filterPriority;
    const matchesFrequency = filterFrequency === 'all' || entry.changeFrequency === filterFrequency;
    return matchesSearch && matchesPriority && matchesFrequency;
  });

  const getPriorityColor = (priority: number) => {
    if (priority >= 0.9) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (priority >= 0.7) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    if (priority >= 0.5) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const getFrequencyColor = (freq: string) => {
    switch (freq) {
      case 'daily': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'weekly': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'monthly': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'yearly': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <Layout>
        <Breadcrumbs
          items={[
            { label: 'Administration', href: '/admin' },
            { label: 'Suivi Sitemap' },
          ]}
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600 dark:text-gray-400">Chargement du sitemap...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Breadcrumbs
        items={[
          { label: 'Administration', href: '/admin' },
          { label: 'Suivi Sitemap' },
        ]}
      />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suivi Sitemap</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Monitoring du sitemap du site vitrine Quelyos
          </p>
        </div>
        <Button onClick={fetchSitemap} variant="outline" icon={<RefreshCw className="h-4 w-4" />}>
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-100 p-3 dark:bg-violet-900/30">
                <FileText className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total URLs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Haute priorité</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(stats.byPriority['0.9'] || 0) + (stats.byPriority['1'] || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-3 dark:bg-orange-900/30">
                <RefreshCw className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Hebdomadaire</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.byFrequency['weekly'] || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Dernière MAJ</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(stats.lastUpdate).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">Toutes priorités</option>
            <option value="1">Priorité 1.0</option>
            <option value="0.9">Priorité 0.9</option>
            <option value="0.8">Priorité 0.8</option>
            <option value="0.7">Priorité 0.7</option>
            <option value="0.6">Priorité 0.6</option>
          </select>

          <select
            value={filterFrequency}
            onChange={(e) => setFilterFrequency(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">Toutes fréquences</option>
            <option value="daily">Quotidienne</option>
            <option value="weekly">Hebdomadaire</option>
            <option value="monthly">Mensuelle</option>
            <option value="yearly">Annuelle</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  URL
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Priorité
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Fréquence
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Dernière MAJ
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEntries.map((entry, index) => (
                <tr key={index} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <code className="text-sm text-violet-600 dark:text-violet-400">{entry.path}</code>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getPriorityColor(entry.priority)}`}>
                      {entry.priority.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getFrequencyColor(entry.changeFrequency)}`}>
                      {entry.changeFrequency}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(entry.lastModified).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Voir
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEntries.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Aucune URL trouvée</p>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="mt-6 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <p>
          Affichage de {filteredEntries.length} sur {entries.length} URLs
        </p>
        <a
          href={`${SITE_URL}/sitemap.xml`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
        >
          <FileText className="h-4 w-4" />
          Voir le sitemap.xml
        </a>
      </div>
    </Layout>
  );
}
