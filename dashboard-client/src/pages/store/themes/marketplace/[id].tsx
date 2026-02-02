/**
 * Page Détail Thème Marketplace - Vue détaillée avec achat
 *
 * Fonctionnalités :
 * - Affichage détails complets thème
 * - Screenshots et preview
 * - Informations designer
 * - Avis et ratings
 * - Bouton achat (gratuit/premium)
 * - Confirmation après achat
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, Button } from '@/components/common';
import { Star, Download, DollarSign, User, Check, ExternalLink, ShoppingCart, Sparkles } from 'lucide-react';
import type { ThemeCategory } from '@/types/theme';
import { logger } from '@quelyos/logger';

interface ThemeDetail {
  id: string;
  name: string;
  description: string;
  category: ThemeCategory;
  version: string;
  thumbnail?: string;
  preview_url?: string;
  designer: {
    id: number;
    name: string;
    avatar?: string;
    themes_count: number;
    average_rating: number;
  };
  is_premium: boolean;
  price: number;
  rating: number;
  downloads: number;
  reviews_count: number;
  config: unknown;
  created_at: string;
  updated_at: string;
}

export default function MarketplaceThemeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<ThemeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);

  const loadTheme = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/themes/${id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {},
            id: 1,
          }),
        }
      );

      const data = await response.json();
      if (data.result?.success && data.result.theme) {
        setTheme(data.result.theme);
      }
    } catch (_error) {
      logger.error("Erreur:", _error);
      // Error loading theme - silently fail
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  const handlePurchase = async () => {
    if (!theme) return;

    setPurchasing(true);
    try {
      // TODO: Get tenant_id from context
      const tenantId = 1; // Placeholder

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/themes/${theme.id}/purchase`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {
              theme_id: theme.id,
              tenant_id: tenantId,
              payment_method: theme.is_premium ? 'stripe' : 'free',
            },
            id: 1,
          }),
        }
      );

      const data = await response.json();

      if (data.result?.success) {
        if (data.result.payment_url) {
          // Redirect vers Stripe
          window.location.href = data.result.payment_url;
        } else {
          // Thème gratuit, achat instantané
          setPurchased(true);
        }
      } else {
        alert(data.result?.error || 'Erreur lors de l\'achat');
      }
    } catch (_error) {
      logger.error("Erreur:", _error);
      // Error purchasing theme
      alert('Erreur lors de l\'achat. Réessayez.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Layout>
    );
  }

  if (!theme) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Thème introuvable</p>
          <Button variant="outline" onClick={() => navigate('/store/themes/marketplace')} className="mt-4">
            Retour au Marketplace
          </Button>
        </div>
      </Layout>
    );
  }

  if (purchased) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-6">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Thème Acheté avec Succès !
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Le thème <strong>{theme.name}</strong> a été ajouté à votre collection.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/store/themes/marketplace')}>
              Retour au Marketplace
            </Button>
            <Button variant="primary" onClick={() => navigate('/store/themes')}>
              Mes Thèmes
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Breadcrumbs
        items={[
          { label: 'Boutique', href: '/store' },
          { label: 'Thèmes', href: '/store/themes' },
          { label: 'Marketplace', href: '/store/themes/marketplace' },
          { label: theme.name, href: `/store/themes/marketplace/${theme.id}` },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {theme.name}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {theme.description}
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold text-gray-900 dark:text-white">
                {theme.rating.toFixed(1)}
              </span>
              <span className="text-gray-500 dark:text-gray-500">
                ({theme.reviews_count} avis)
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Download className="h-5 w-5" />
              <span>{theme.downloads} téléchargements</span>
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Version {theme.version}
            </div>
          </div>

          {/* Thumbnail/Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {theme.thumbnail ? (
              <img
                src={theme.thumbnail}
                alt={theme.name}
                className="w-full aspect-video object-cover"
              />
            ) : (
              <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-gray-400 text-6xl font-bold">
                  {theme.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Preview Live */}
          {theme.preview_url && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Preview Live
              </h2>
              <a
                href={theme.preview_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Voir la démo</span>
              </a>
            </div>
          )}

          {/* Description détaillée */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Description
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                {theme.description}
              </p>
            </div>
          </div>

          {/* Features */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Caractéristiques
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Design responsive',
                'Dark mode intégré',
                'Optimisé SEO',
                'Performance élevée',
                'Sections personnalisables',
                'Support multilingue',
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Prix et achat */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
            <div className="mb-6">
              {theme.is_premium ? (
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-8 w-8 text-primary-600" />
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {theme.price.toFixed(2)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">TND</span>
                </div>
              ) : (
                <div className="text-3xl font-bold text-green-600 mb-4">
                  Gratuit
                </div>
              )}
              <Button
                variant="primary"
                onClick={handlePurchase}
                disabled={purchasing}
                className="w-full"
                icon={<ShoppingCart className="h-5 w-5" />}
              >
                {purchasing ? 'Achat...' : theme.is_premium ? 'Acheter Maintenant' : 'Obtenir Gratuitement'}
              </Button>
            </div>

            {theme.is_premium && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Paiement sécurisé</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Licence commerciale</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Mises à jour gratuites</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Support premium</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Designer */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Designer
            </h3>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {theme.designer.avatar ? (
                  <img
                    src={theme.designer.avatar}
                    alt={theme.designer.name}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {theme.designer.name}
                </h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span>{theme.designer.themes_count} thèmes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{theme.designer.average_rating.toFixed(1)} note moyenne</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Catégorie */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Catégorie
            </h3>
            <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full text-sm font-medium">
              {theme.category}
            </span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
