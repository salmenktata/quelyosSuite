/**
 * Page Marketplace Thèmes - Liste thèmes disponibles
 *
 * Fonctionnalités :
 * - Liste thèmes gratuits et premium
 * - Filtres par catégorie, prix, note
 * - Preview et achat thèmes
 * - Recherche thèmes
 * - Statistiques designers
 */

import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, Button, PageNotice } from '@/components/common';
import { Search, Filter, Star, Download, DollarSign, User, Palette } from 'lucide-react';
import { logger } from '@quelyos/logger';
import type { ThemeCategory } from '@/types/theme';

interface MarketplaceTheme {
  id: string;
  name: string;
  description: string;
  category: ThemeCategory;
  thumbnail?: string;
  designer: {
    id: number;
    name: string;
    avatar?: string;
  };
  is_premium: boolean;
  price: number;
  rating: number;
  downloads: number;
  reviews_count: number;
}

const CATEGORIES: { value: ThemeCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'fashion', label: 'Mode' },
  { value: 'tech', label: 'High-Tech' },
  { value: 'food', label: 'Alimentaire' },
  { value: 'beauty', label: 'Beauté' },
  { value: 'sports', label: 'Sports' },
  { value: 'home', label: 'Maison' },
  { value: 'general', label: 'Général' },
];

export default function MarketplacePage() {
  const [themes, setThemes] = useState<MarketplaceTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'premium'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating'>('popular');

  const loadThemes = useCallback(async () => {
    setLoading(true);
    try {
      const apiParams: {
        category?: string;
        is_premium?: boolean;
        sort: string;
      } = {
        sort: sortBy,
      };

      if (selectedCategory !== 'all') {
        apiParams.category = selectedCategory;
      }

      if (priceFilter === 'free') {
        apiParams.is_premium = false;
      } else if (priceFilter === 'premium') {
        apiParams.is_premium = true;
      }

      const response = await fetch(
        '/api/themes/marketplace',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: apiParams,
            id: 1,
          }),
        }
      );

      const data = await response.json();
      if (data.result?.success && data.result.themes) {
        setThemes(data.result.themes);
      }
    } catch (error) {
      logger.error('[ThemeMarketplace] Error loading marketplace themes:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, priceFilter, sortBy]);

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  const filteredThemes = themes.filter((theme) =>
    theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    theme.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* 1. Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Boutique', href: '/store' },
            { label: 'Thèmes', href: '/store/themes' },
            { label: 'Marketplace', href: '/store/themes/marketplace' },
          ]}
        />

        {/* 2. Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Marketplace de Thèmes
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Découvrez des thèmes créés par notre communauté de designers
            </p>
          </div>
          <Button variant="primary" onClick={() => (window.location.href = '/store/themes/submit')}>
            Soumettre un Thème
          </Button>
        </div>

        {/* 3. PageNotice */}
        <PageNotice
          config={{
            pageId: 'themes-marketplace',
            title: 'Marketplace Thèmes',
            purpose: 'Explorez et achetez des thèmes créés par notre communauté de designers',
            icon: Palette,
            moduleColor: 'indigo',
            sections: [
              {
                title: 'Fonctionnalités',
                items: [
                  'Thèmes gratuits et premium disponibles',
                  'Filtrage par catégorie, prix et popularité',
                  'Notes et avis utilisateurs',
                  'Preview avant achat',
                  'Installation en un clic',
                ],
              },
            ],
          }}
        />

        {/* Filtres et recherche */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un thème..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Catégorie */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Prix */}
            <div>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as typeof priceFilter)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Tous les prix</option>
                <option value="free">Gratuit</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>

          {/* Tri */}
          <div className="flex items-center gap-2 mt-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Trier par :</span>
            <div className="flex gap-2">
              {[
                { value: 'popular', label: 'Populaires' },
                { value: 'recent', label: 'Récents' },
                { value: 'rating', label: 'Mieux notés' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value as typeof sortBy)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    sortBy === option.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grille thèmes */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredThemes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Aucun thème trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredThemes.map((theme) => (
            <div
              key={theme.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all group"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                {theme.thumbnail ? (
                  <img
                    src={theme.thumbnail}
                    alt={theme.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    {theme.name.charAt(0)}
                  </div>
                )}
                {theme.is_premium && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded">
                    Premium
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                  {theme.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {theme.description}
                </p>

                {/* Designer */}
                <div className="flex items-center gap-2 mb-4 text-sm">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{theme.designer.name}</span>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between mb-4 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {theme.rating.toFixed(1)}
                      </span>
                      <span className="text-gray-500 dark:text-gray-500">
                        ({theme.reviews_count})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Download className="h-4 w-4" />
                      <span>{theme.downloads}</span>
                    </div>
                  </div>
                </div>

                {/* Prix et CTA */}
                <div className="flex items-center justify-between">
                  {theme.is_premium ? (
                    <div className="flex items-center gap-1 text-xl font-bold text-primary-600">
                      <DollarSign className="h-5 w-5" />
                      <span>{theme.price.toFixed(2)}</span>
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-green-600">Gratuit</span>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => (window.location.href = `/store/themes/marketplace/${theme.id}`)}
                  >
                    Voir Détails
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </Layout>
  );
}
