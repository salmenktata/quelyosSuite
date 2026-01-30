/**
 * Page PricelistDetail - Détails d'une liste de prix
 *
 * Fonctionnalités :
 * - Affichage détaillé de la pricelist
 * - Liste des règles de prix (items)
 * - CRUD complet des règles (création, modification, suppression)
 * - Filtrage et tri des règles
 * - Dark mode complet
 * - Accessibilité WCAG 2.1 AA
 * - Skeleton loading
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  usePricelistDetail,
  useDeletePricelistItem,
  type PricelistItem,
} from '../hooks/usePricelists';
import { Layout } from '../components/Layout';
import { PricelistItemFormModal } from '../components/pricelists/PricelistItemFormModal';
import {
  ArrowLeft,
  DollarSign,
  CheckCircle,
  XCircle,
  Tag,
  Calculator,
  Package,
  Folder,
  Globe,
  Search,
  X,
  Info,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';

export default function PricelistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const _pricelistId = parseInt(id || '0', 10);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PricelistItem | null>(null);

  const { data: pricelist, isLoading, error } = usePricelistDetail(pricelistId);
  const deleteItemMutation = useDeletePricelistItem();

  // Filtrage des règles
  const filteredItems = useMemo(() => {
    if (!pricelist?.items) return [];

    let items = [...pricelist.items];

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.product_name?.toLowerCase().includes(query) ||
          item.category_name?.toLowerCase().includes(query) ||
          getAppliedOnLabel(item.applied_on).toLowerCase().includes(query)
      );
    }

    // Filtre par type
    if (filterType !== 'all') {
      items = items.filter((item) => item.applied_on === filterType);
    }

    return items;
  }, [pricelist?.items, searchQuery, filterType]);

  // Labels pour les types de règles
  const getAppliedOnLabel = (appliedOn: string) => {
    switch (appliedOn) {
      case '3_global':
        return 'Tous les produits';
      case '2_product_category':
        return 'Catégorie';
      case '1_product':
        return 'Produit';
      case '0_product_variant':
        return 'Variante';
      default:
        return appliedOn;
    }
  };

  const getAppliedOnIcon = (appliedOn: string) => {
    switch (appliedOn) {
      case '3_global':
        return <Globe className="w-5 h-5" />;
      case '2_product_category':
        return <Folder className="w-5 h-5" />;
      case '1_product':
        return <Package className="w-5 h-5" />;
      case '0_product_variant':
        return <Tag className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getComputePriceLabel = (computePrice: string) => {
    switch (computePrice) {
      case 'fixed':
        return 'Prix fixe';
      case 'percentage':
        return 'Pourcentage';
      case 'formula':
        return 'Formule';
      default:
        return computePrice;
    }
  };

  const getComputePriceColor = (computePrice: string) => {
    switch (computePrice) {
      case 'fixed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'percentage':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      case 'formula':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6 p-4 md:p-8">
          {/* Back button skeleton */}
          <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>

          {/* Header skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-4">
              <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Table skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error || !pricelist) {
    return (
      <Layout>
        <div className="p-4 md:p-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Liste de prix introuvable
            </h2>
            <p className="text-red-600 dark:text-red-300 mb-4">
              {error?.message || 'La liste de prix demandée n\'existe pas.'}
            </p>
            <button
              onClick={() => navigate('/pricelists')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux listes de prix
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-4 md:p-8">
        {/* Bouton retour */}
        <button
          onClick={() => navigate('/pricelists')}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour aux listes de prix
        </button>

        {/* En-tête */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <DollarSign className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{pricelist.name}</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">ID: {pricelist.id}</p>
              </div>
            </div>

            {/* Badge statut */}
            {pricelist.active ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                <XCircle className="w-4 h-4" />
                Inactive
              </span>
            )}
          </div>

          {/* Informations clés */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Devise</p>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-2xl">{pricelist.currency_symbol}</span>
                {pricelist.currency_name}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Politique de remise</p>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {pricelist.discount_policy === 'with_discount' ? 'Avec remises affichées' : 'Sans remises affichées'}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre de règles</p>
              <p className="mt-1 text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                {pricelist.item_count} règle{pricelist.item_count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Section règles de prix */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {/* En-tête avec filtres */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Règles de prix
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {filteredItems.length} règle{filteredItems.length !== 1 ? 's' : ''} de tarification
                  {filterType !== 'all' || searchQuery ? ' (filtré)' : ''}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Bouton Ajouter règle */}
                <button
                  onClick={() => setIsAddRuleModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm shadow-sm hover:shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une règle
                </button>
                {/* Recherche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-48 pl-9 pr-8 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filtre par type */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">Tous les types</option>
                  <option value="3_global">Global</option>
                  <option value="2_product_category">Catégorie</option>
                  <option value="1_product">Produit</option>
                  <option value="0_product_variant">Variante</option>
                </select>
              </div>
            </div>
          </div>

          {/* Liste des règles */}
          {filteredItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Appliqué sur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cible
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Valeur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Qté min
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredItems.map((item) => (
                    <PricelistItemRow
                      key={item.id}
                      item={item}
                      pricelistId={pricelistId}
                      currencySymbol={pricelist.currency_symbol}
                      getAppliedOnLabel={getAppliedOnLabel}
                      getAppliedOnIcon={getAppliedOnIcon}
                      getComputePriceLabel={getComputePriceLabel}
                      getComputePriceColor={getComputePriceColor}
                      onEdit={(item) => {
                        setEditingItem(item);
                        setIsAddRuleModalOpen(true);
                      }}
                      onDelete={(itemId) => {
                        if (confirm('Confirmer la suppression de cette règle ?')) {
                          deleteItemMutation.mutate({ _pricelistId, itemId });
                        }
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Calculator className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery || filterType !== 'all'
                  ? 'Aucune règle correspondante'
                  : 'Aucune règle de prix configurée'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery || filterType !== 'all'
                  ? 'Essayez de modifier vos critères de recherche.'
                  : "Les règles de prix sont configurées dans l'interface d'administration."}
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Modal ajout/édition règle */}
      {pricelist && (
        <PricelistItemFormModal
          isOpen={isAddRuleModalOpen}
          onClose={() => {
            setIsAddRuleModalOpen(false);
            setEditingItem(null);
          }}
          pricelistId={pricelistId}
          currencySymbol={pricelist.currency_symbol}
          item={editingItem || undefined}
        />
      )}
    </Layout>
  );
}

// Composant ligne de règle
interface PricelistItemRowProps {
  item: PricelistItem;
  pricelistId: number;
  currencySymbol: string;
  getAppliedOnLabel: (appliedOn: string) => string;
  getAppliedOnIcon: (appliedOn: string) => React.ReactNode;
  getComputePriceLabel: (computePrice: string) => string;
  getComputePriceColor: (computePrice: string) => string;
  onEdit: (item: PricelistItem) => void;
  onDelete: (itemId: number) => void;
}

function PricelistItemRow({
  item,
  pricelistId,
  currencySymbol,
  getAppliedOnLabel,
  getAppliedOnIcon,
  getComputePriceLabel,
  getComputePriceColor,
  onEdit,
  onDelete,
}: PricelistItemRowProps) {
  // Formater la valeur selon le type
  const formatValue = () => {
    if (item.fixed_price !== undefined && item.fixed_price !== null) {
      return (
        <span className="font-semibold text-green-600 dark:text-green-400">
          {currencySymbol}{item.fixed_price.toFixed(2)}
        </span>
      );
    }
    if (item.percent_price !== undefined && item.percent_price !== null) {
      return (
        <span className="font-semibold text-amber-600 dark:text-amber-400">
          {item.percent_price.toFixed(0)}%
        </span>
      );
    }
    if (item.price_discount !== undefined && item.price_discount !== null) {
      return (
        <span className="font-semibold text-red-600 dark:text-red-400">
          -{item.price_discount.toFixed(0)}%
        </span>
      );
    }
    return <span className="text-gray-400 dark:text-gray-500">-</span>;
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          {getAppliedOnIcon(item.applied_on)}
          <span>{getAppliedOnLabel(item.applied_on)}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-gray-900 dark:text-white">
          {item.product_name || item.category_name || (
            <span className="text-gray-400 dark:text-gray-500 italic">Tous</span>
          )}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getComputePriceColor(item.compute_price)}`}>
          {getComputePriceLabel(item.compute_price)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {formatValue()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
        {item.min_quantity > 1 ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-xs">
            ≥ {item.min_quantity}
          </span>
        ) : (
          <span className="text-gray-400">1</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={() => onEdit(item)}
          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
          aria-label="Modifier"
        >
          <Pencil className="h-5 w-5 inline" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
          aria-label="Supprimer"
        >
          <Trash2 className="h-5 w-5 inline" />
        </button>
      </td>
    </tr>
  );
}
