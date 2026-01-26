/**
 * Page Warehouses - Gestion des entrepôts multi-sites
 *
 * Fonctionnalités :
 * - Liste entrepôts avec filtres (actifs, recherche)
 * - Tri par nom, code, société
 * - Navigation vers détails (locations + stock)
 * - Dark mode complet
 * - Accessibilité WCAG 2.1 AA
 * - Skeleton loading
 * - Animations modernes
 * - Raccourcis clavier
 *
 * Note : CRUD intentionnellement non implémenté - les entrepôts sont gérés via Odoo natif
 * car configuration critique (locations auto, règles réappro, multi-société)
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWarehouses } from '../hooks/useWarehouses';
import { Layout } from '../components/Layout';
import { SkeletonGrid } from '../components/common/Skeleton';
import { BuildingStorefrontIcon, CheckCircleIcon, MagnifyingGlassIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { WarehouseFormModal } from '../components/stock/WarehouseFormModal';

// Tri options
type SortOption = 'name' | 'code' | 'company';

export default function Warehouses() {
  const navigate = useNavigate();

  // États
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Données
  const { data: warehouses, isLoading, error, refetch } = useWarehouses({ active_only: activeOnly });

  // Debounce recherche (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filtrage et tri
  const filteredAndSortedWarehouses = useMemo(() => {
    if (!warehouses) return [];

    // Filtrage par recherche
    let filtered = warehouses.filter(
      (warehouse) =>
        warehouse.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        warehouse.code.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        (warehouse.company_name && warehouse.company_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
    );

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'code':
          return a.code.localeCompare(b.code);
        case 'company':
          return (a.company_name || '').localeCompare(b.company_name || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [warehouses, debouncedSearchQuery, sortBy]);

  // Statistiques
  const stats = useMemo(() => {
    if (!warehouses) return { total: 0, active: 0 };
    return {
      total: filteredAndSortedWarehouses.length,
      active: warehouses.filter((w) => w.active).length,
    };
  }, [warehouses, filteredAndSortedWarehouses]);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+F : Focus recherche
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('warehouse-search')?.focus();
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
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>

          {/* Filters skeleton */}
          <div className="flex gap-4">
            <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
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
          <div
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Erreur lors du chargement des entrepôts
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error.message}</p>
                <button
                  onClick={() => refetch()}
                  className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  aria-label="Réessayer le chargement des entrepôts"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-4 md:p-8" id="main-content">
        {/* Skip link - Accessibilité */}
        <a
          href="#warehouse-list"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Aller à la liste des entrepôts
        </a>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Entrepôts</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gérez vos entrepôts et locations de stock multi-sites
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Créer Entrepôt
          </button>
        </div>

        {/* Modal Création Entrepôt */}
        <WarehouseFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={(warehouseId) => {
            setIsCreateModalOpen(false);
            refetch();
            // Rediriger vers le détail de l'entrepôt créé
            navigate(`/warehouses/${warehouseId}`);
          }}
        />

        {/* Filters & Sort */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
            </div>
            <input
              id="warehouse-search"
              type="text"
              placeholder="Rechercher par nom, code ou société... (Cmd+F)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              aria-label="Rechercher un entrepôt"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearchQuery('');
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg transition-colors duration-200"
                aria-label="Effacer la recherche"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <label htmlFor="warehouse-sort" className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Trier par :
            </label>
            <select
              id="warehouse-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              aria-label="Sélectionner l'ordre de tri"
            >
              <option value="name">Nom</option>
              <option value="code">Code</option>
              <option value="company">Société</option>
            </select>
          </div>

          {/* Active only */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
                className="w-4 h-4 text-indigo-600 dark:text-indigo-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                aria-label="Filtrer uniquement les entrepôts actifs"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">Actifs uniquement</span>
            </label>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="region" aria-label="Statistiques entrepôts">
          {/* Total */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md dark:hover:shadow-gray-900/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Entrepôts</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100" aria-live="polite">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                <BuildingStorefrontIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Active */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md dark:hover:shadow-gray-900/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Actifs</p>
                <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400" aria-live="polite">
                  {stats.active}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        {/* Warehouses Grid */}
        <div
          id="warehouse-list"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          role="region"
          aria-label="Liste des entrepôts"
        >
          {filteredAndSortedWarehouses && filteredAndSortedWarehouses.length > 0 ? (
            filteredAndSortedWarehouses.map((warehouse) => (
              <article
                key={warehouse.id}
                onClick={() => navigate(`/warehouses/${warehouse.id}`)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 hover:shadow-lg dark:hover:shadow-gray-900/40 transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 group transform hover:scale-105"
                tabIndex={0}
                role="button"
                aria-label={`Voir les détails de l'entrepôt ${warehouse.name}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/warehouses/${warehouse.id}`);
                  }
                }}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                        {warehouse.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Code : {warehouse.code}</p>
                    </div>
                    {warehouse.active ? (
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 ml-2 animate-pulse"
                        aria-label="Entrepôt actif"
                      >
                        Actif
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 ml-2"
                        aria-label="Entrepôt inactif"
                      >
                        Inactif
                      </span>
                    )}
                  </div>

                  {/* Company */}
                  {warehouse.company_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <svg
                        className="w-4 h-4 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <span className="truncate">{warehouse.company_name}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/warehouses/${warehouse.id}`);
                      }}
                      className="w-full text-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 group-hover:underline transition-all duration-200"
                      aria-label={`Voir les locations et le stock de ${warehouse.name}`}
                    >
                      Voir les locations et le stock →
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            // Empty state
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-12 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                  <BuildingStorefrontIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Aucun entrepôt trouvé</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {searchQuery
                    ? `Aucun entrepôt ne correspond à "${searchQuery}"`
                    : activeOnly
                    ? 'Aucun entrepôt actif disponible'
                    : 'Aucun entrepôt configuré'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setDebouncedSearchQuery('');
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    aria-label="Réinitialiser les filtres"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
                {!searchQuery && !activeOnly && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                    💡 Les entrepôts sont gérés via l'interface d'administration (configuration critique)
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Help text - Raccourcis */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8 space-y-1">
          <p>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 font-mono">
              Cmd+F
            </kbd>{' '}
            pour rechercher •{' '}
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 font-mono">
              Esc
            </kbd>{' '}
            pour effacer
          </p>
        </div>
      </div>
    </Layout>
  );
}
