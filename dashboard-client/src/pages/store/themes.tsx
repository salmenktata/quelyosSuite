/**
 * Page de sélection et gestion des thèmes e-commerce
 *
 * Fonctionnalités :
 * - Afficher la galerie de thèmes disponibles
 * - Filtrer par catégorie (fashion, tech, food, etc.)
 * - Activer un thème pour le tenant
 * - Preview du thème actif
 * - Badges Premium/Gratuit
 */

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { logger } from '@quelyos/logger';
import { Breadcrumbs, Button, PageNotice, SkeletonTable } from '@/components/common';
import { storeNotices } from '@/lib/notices';
import { Palette, Check, Eye, Tag, RefreshCw } from 'lucide-react';
import type { Theme, ThemeCategory } from '@/types/theme';
import { tenantFetch } from '@/lib/tenantFetch';

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

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les thèmes disponibles
  useEffect(() => {
    const controller = new AbortController();

    async function loadThemes() {
      try {
        setLoading(true);
        setError(null);

        const response = await tenantFetch(`${import.meta.env.VITE_BACKEND_URL}/api/themes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: { category: selectedCategory === 'all' ? null : selectedCategory },
            id: 1,
          }),
          signal: controller.signal,
        });

        const data = await response.json();

        if (data.result?.success) {
          setThemes(data.result.themes);
        } else {
          setError('Erreur lors du chargement des thèmes');
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError('Impossible de charger les thèmes');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadThemes();
    return () => controller.abort();
  }, [selectedCategory]);

  // Charger le thème actif du tenant
  useEffect(() => {
    async function loadActiveTheme() {
      try {
        const tenantId = 1; // TODO: Récupérer depuis le contexte
        const response = await tenantFetch(`${import.meta.env.VITE_BACKEND_URL}/api/tenants/${tenantId}/theme`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {},
            id: 1,
          }),
        });

        const data = await response.json();

        if (data.result?.config) {
          setActiveTheme(data.result.config.id);
        }
      } catch (err) {
        logger.error('[StoreThemes] Erreur chargement thème actif');
      }
    }

    loadActiveTheme();
  }, []);

  const handleActivateTheme = async (themeCode: string) => {
    try {
      const tenantId = 1; // TODO: Récupérer depuis le contexte
      const response = await tenantFetch(`${import.meta.env.VITE_BACKEND_URL}/api/tenants/${tenantId}/theme/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important pour l'auth
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: { theme_code: themeCode },
          id: 1,
        }),
      });

      const data = await response.json();

      if (data.result?.success) {
        setActiveTheme(themeCode);
      } else {
        setError('Erreur lors de l\'activation du thème');
      }
    } catch (err) {
      setError('Impossible d\'activer le thème');
    }
  };

  const filteredThemes = themes.filter(
    theme => selectedCategory === 'all' || theme.category === selectedCategory
  );

  // Loading State
  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <SkeletonTable rows={6} columns={3} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* 1. Breadcrumbs - TOUJOURS en premier */}
        <Breadcrumbs
          items={[
            { label: 'Boutique', href: '/store' },
            { label: 'Thèmes', href: '/store/themes' },
          ]}
        />

        {/* 2. Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Thèmes
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Personnalisez l&apos;apparence de votre boutique
            </p>
          </div>
          <Button
            variant="ghost"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => window.location.reload()}
          >
            Actualiser
          </Button>
        </div>

        {/* 3. PageNotice - APRÈS le header */}
        <PageNotice config={storeNotices.themes} />

        {/* 4. Error State */}
        {error && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                {error}
              </p>
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => window.location.reload()}
              >
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {/* 5. Filtres catégories */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* 6. Liste des thèmes */}
        {!error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredThemes.map(theme => (
              <div
                key={theme.id}
                className={`relative rounded-lg border-2 p-6 transition-all hover:shadow-lg ${
                  activeTheme === theme.id
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                {/* Badge actif */}
                {activeTheme === theme.id && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full bg-primary-600 text-white text-xs font-medium">
                    <Check className="h-3 w-3" />
                    Actif
                  </div>
                )}

                {/* Badge premium */}
                {theme.is_premium && (
                  <div className="absolute top-4 left-4 flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500 text-white text-xs font-medium">
                    <Tag className="h-3 w-3" />
                    Premium
                  </div>
                )}

                {/* Thumbnail (placeholder) */}
                <div className="mb-4 aspect-video rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                  <Palette className="h-12 w-12 text-gray-400" />
                </div>

                {/* Infos thème */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {theme.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {theme.description}
                </p>

                {/* Catégorie et prix */}
                <div className="flex items-center justify-between mb-4 text-sm">
                  <span className="text-gray-500 dark:text-gray-400 capitalize">
                    {theme.category}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {theme.is_premium ? `${theme.price}€` : 'Gratuit'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {activeTheme !== theme.id ? (
                    <Button
                      variant="primary"
                      onClick={() => handleActivateTheme(theme.id)}
                      className="flex-1"
                    >
                      Activer
                    </Button>
                  ) : (
                    <Button variant="outline" className="flex-1" disabled>
                      Activé
                    </Button>
                  )}
                  <Button variant="outline" className="px-3">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 7. Empty State */}
        {!error && filteredThemes.length === 0 && (
          <div className="text-center py-12">
            <Palette className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Aucun thème disponible
            </h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Aucun thème trouvé dans cette catégorie
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
