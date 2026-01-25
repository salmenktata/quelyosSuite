/**
 * Page Pricelists - Gestion des listes de prix
 *
 * Fonctionnalités :
 * - Liste des pricelists avec filtres (actives, recherche)
 * - Tri par nom, devise, politique
 * - CRUD complet (création, modification, suppression)
 * - Navigation vers détails (règles de prix)
 * - Dark mode complet
 * - Accessibilité WCAG 2.1 AA
 * - Skeleton loading
 * - Animations modernes
 * - Raccourcis clavier (Cmd/Ctrl+F, Escape)
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePricelists, useDeletePricelist, type Pricelist } from '../hooks/usePricelists';
import { Layout } from '../components/Layout';
import { SkeletonGrid } from '../components/common/Skeleton';
import { PricelistFormModal } from '../components/pricelists/PricelistFormModal';
import {
  CurrencyDollarIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

// Options de tri
type SortOption = 'name' | 'currency' | 'policy';
type SortOrder = 'asc' | 'desc';

export default function Pricelists() {
  const navigate = useNavigate();

  // États
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Données
  const { data: pricelists, isLoading, error, refetch } = usePricelists({ active_only: activeOnly });
  const deleteMutation = useDeletePricelist();

  // Debounce recherche (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filtrage et tri
  const filteredAndSortedPricelists = useMemo(() => {
    if (!pricelists) return [];

    // Filtrage par recherche
    let filtered = pricelists.filter(
      (pricelist) =>
        pricelist.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        pricelist.currency_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'currency':
          comparison = a.currency_name.localeCompare(b.currency_name);
          break;
        case 'policy':
          comparison = a.discount_policy.localeCompare(b.discount_policy);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [pricelists, debouncedSearchQuery, sortBy, sortOrder]);

  // Statistiques
  const stats = useMemo(() => {
    if (!pricelists) return { total: 0, active: 0, currencies: 0 };
    const uniqueCurrencies = new Set(pricelists.map((p) => p.currency_name));
    return {
      total: filteredAndSortedPricelists.length,
      active: pricelists.filter((p) => p.active).length,
      currencies: uniqueCurrencies.size,
    };
  }, [pricelists, filteredAndSortedPricelists]);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+F : Focus recherche
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('pricelist-search')?.focus();
      }

      // Escape : Clear recherche
      if (e.key === 'Escape') {
        setSearchQuery('');
        setDebouncedSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6 p-4 md:p-8">
          {/* Skip link - Accessibilité */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Aller au contenu principal
          </a>

          {/* Header skeleton */}
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>

          {/* Filters skeleton */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
          </div>

          {/* Grid skeleton */}
          <SkeletonGrid count={6} columns={3} />
        </div>
      </Layout>
    );
  }

  // Error state avec retry
  if (error) {
    return (
      <Layout>
        <div className="p-4 md:p-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
            <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Erreur de chargement
            </h2>
            <p className="text-red-600 dark:text-red-300 mb-4">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div id="main-content" className="space-y-6 p-4 md:p-8">
        {/* Skip link - Accessibilité */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Aller au contenu principal
        </a>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <CurrencyDollarIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              Listes de Prix
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gérez vos listes de prix et règles tarifaires pour différents segments clients
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Bouton Nouvelle liste */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Nouvelle liste</span>
            </button>

            {/* Hint raccourcis */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-500 dark:text-gray-400">
                ⌘F
              </kbd>
              <span>Rechercher</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-500 dark:text-gray-400 ml-2">
                Esc
              </kbd>
              <span>Effacer</span>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Recherche */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="pricelist-search"
              type="text"
              placeholder="Rechercher par nom ou devise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              aria-label="Rechercher une liste de prix"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearchQuery('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Effacer la recherche"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Tri */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none pl-10 pr-8 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
              aria-label="Trier par"
            >
              <option value="name">Nom</option>
              <option value="currency">Devise</option>
              <option value="policy">Politique</option>
            </select>
            <ArrowsUpDownIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={sortOrder === 'asc' ? 'Tri descendant' : 'Tri ascendant'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* Filtre actifs */}
          <label className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
            />
            <FunnelIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Actives uniquement
            </span>
          </label>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Listes</p>
                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <TagIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>

          {/* Actives */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Actives</p>
                <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* Devises */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Devises</p>
                <p className="mt-1 text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.currencies}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <CurrencyDollarIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Grille des pricelists */}
        {filteredAndSortedPricelists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedPricelists.map((pricelist) => (
              <PricelistCard
                key={pricelist.id}
                pricelist={pricelist}
                onClick={() => navigate(`/pricelists/${pricelist.id}`)}
                onDelete={(id) => {
                  if (confirm('Confirmer la suppression de cette liste de prix ?')) {
                    deleteMutation.mutate(id);
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <CurrencyDollarIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucune liste de prix trouvée
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery
                ? 'Essayez de modifier vos critères de recherche.'
                : "Créez votre première liste de prix en cliquant sur le bouton 'Nouvelle liste'."}
            </p>
          </div>
        )}
      </div>

      {/* Modal création */}
      <PricelistFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </Layout>
  );
}

// Composant Card pour une pricelist
interface PricelistCardProps {
  pricelist: Pricelist;
  onClick: () => void;
  onDelete: (id: number) => void;
}

function PricelistCard({ pricelist, onClick, onDelete }: PricelistCardProps) {
  return (
    <div className="relative w-full text-left bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/40 transition-colors">
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {pricelist.currency_symbol}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
              {pricelist.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">ID: {pricelist.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Actions */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(pricelist.id);
            }}
            className="p-1.5 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            aria-label="Supprimer"
          >
            <TrashIcon className="h-4 w-4" />
          </button>

          {/* Badge statut */}
          {pricelist.active ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              <CheckCircleIcon className="w-3.5 h-3.5" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
              <XCircleIcon className="w-3.5 h-3.5" />
              Inactive
            </span>
          )}
        </div>
      </div>

      {/* Infos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Devise</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {pricelist.currency_symbol} {pricelist.currency_name}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Politique</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {pricelist.discount_policy === 'with_discount' ? 'Avec remises' : 'Sans remises'}
          </span>
        </div>
      </div>

      {/* Indication cliquable */}
      <button
        onClick={onClick}
        className="w-full mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-left"
      >
        <span className="text-sm text-indigo-600 dark:text-indigo-400 group-hover:underline">
          Voir les règles de prix →
        </span>
      </button>
    </div>
  );
}
