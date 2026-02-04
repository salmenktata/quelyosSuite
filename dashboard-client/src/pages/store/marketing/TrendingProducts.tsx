/**
 * Page de gestion des produits tendance
 *
 * Fonctionnalités :
 * - Liste des produits avec statut tendance
 * - Toggle rapide pour activer/désactiver
 * - Édition du score et mentions sociales
 * - Filtrage par statut tendance
 * - Recherche par nom
 */

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common';
import { storeNotices } from '@/lib/notices';
import {
  TrendingUp,
  Search,
  Star,
  Heart,
  Edit2,
  Check,
  X,
  Filter,
} from 'lucide-react';
import {
  useTrendingProducts,
  useToggleTrending,
  useUpdateTrendingData,
  type TrendingProduct,
} from '@/hooks/useTrendingProducts';
import { useToast } from '@/hooks/useToast';
import { formatPrice } from '@/lib/utils/formatters';
import { logger } from '@quelyos/logger';

export default function TrendingProducts() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [trendingOnly, setTrendingOnly] = useState(false);
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [editData, setEditData] = useState<{
    trending_score: number;
    social_mentions: number;
  }>({ trending_score: 0, social_mentions: 0 });

  const { data, isLoading, error } = useTrendingProducts({
    trending_only: trendingOnly,
    search: search || undefined,
    limit: 100,
  });

  const toggleTrending = useToggleTrending();
  const updateTrendingData = useUpdateTrendingData();

  const handleToggle = async (productId: number) => {
    try {
      await toggleTrending.mutateAsync(productId);
      toast.success('Statut mis à jour');
    } catch (err) {
      logger.error("Erreur:", err);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleStartEdit = (product: TrendingProduct) => {
    setEditingProduct(product.id);
    setEditData({
      trending_score: product.trending_score,
      social_mentions: product.social_mentions,
    });
  };

  const handleSaveEdit = async (productId: number) => {
    try {
      await updateTrendingData.mutateAsync({
        productId,
        data: editData,
      });
      setEditingProduct(null);
      toast.success('Données mises à jour');
    } catch (err) {
      logger.error("Erreur:", err);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditData({ trending_score: 0, social_mentions: 0 });
  };

  const breadcrumbItems = [
    { label: 'Boutique', href: '/store' },
    { label: 'Produits Tendance' },
  ];

  const trendingCount = data?.products?.filter((p) => p.is_trending).length || 0;

  if (error) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4" role="alert">
            <p className="text-red-800 dark:text-red-200">Erreur lors du chargement des produits</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-pink-500" />
              Produits Tendance
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gérez les produits affichés dans la section "Tendances sur les réseaux"
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm font-medium">
              {trendingCount} produit{trendingCount > 1 ? 's' : ''} tendance
            </span>
          </div>
        </div>

        <PageNotice config={storeNotices.trendingProducts} />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          <Button
            variant={trendingOnly ? 'primary' : 'secondary'}
            onClick={() => setTrendingOnly(!trendingOnly)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {trendingOnly ? 'Tous les produits' : 'Tendances uniquement'}
          </Button>
        </div>

        {/* Products Table */}
        {isLoading ? (
          <SkeletonTable rows={8} columns={6} />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Prix
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Tendance
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Mentions
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Badges
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data?.products?.map((product) => (
                    <tr
                      key={product.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        product.is_trending ? 'bg-pink-50/50 dark:bg-pink-900/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={`${import.meta.env.VITE_BACKEND_URL}${product.image_url}`}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              <TrendingUp className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggle(product.id)}
                          disabled={toggleTrending.isPending}
                          className={`p-2 rounded-full transition-colors ${
                            product.is_trending
                              ? 'bg-pink-100 text-pink-600 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-400'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-500'
                          }`}
                        >
                          <TrendingUp className="w-5 h-5" />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {editingProduct === product.id ? (
                          <input
                            type="number"
                            value={editData.trending_score}
                            onChange={(e) =>
                              setEditData({ ...editData, trending_score: parseInt(e.target.value) || 0 })
                            }
                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        ) : (
                          <span className="font-medium text-gray-900 dark:text-white">
                            {product.trending_score}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {editingProduct === product.id ? (
                          <input
                            type="number"
                            value={editData.social_mentions}
                            onChange={(e) =>
                              setEditData({ ...editData, social_mentions: parseInt(e.target.value) || 0 })
                            }
                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        ) : (
                          <div className="flex items-center justify-center gap-1 text-pink-600 dark:text-pink-400">
                            <Heart className="w-4 h-4" />
                            <span>{product.social_mentions}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {product.is_bestseller && (
                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-xs">
                              Best-seller
                            </span>
                          )}
                          {product.is_featured && (
                            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded text-xs flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              Vedette
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingProduct === product.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSaveEdit(product.id)}
                              disabled={updateTrendingData.isPending}
                              className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(product)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data?.products?.length === 0 && (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {trendingOnly
                    ? 'Aucun produit tendance pour le moment'
                    : 'Aucun produit trouvé'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info box */}
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border border-pink-200 dark:border-pink-800 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pink-500" />
            Comment fonctionnent les produits tendance ?
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Activez le statut "Tendance" pour afficher un produit dans la section homepage</li>
            <li>• Le score de tendance détermine l&apos;ordre d&apos;affichage (plus élevé = plus visible)</li>
            <li>• Les mentions sociales sont affichées sur chaque carte produit</li>
            <li>• Maximum 6 produits sont affichés sur la page d&apos;accueil</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
