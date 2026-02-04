/**
 * Catégories Clients - Gestion des segments clients
 *
 * Fonctionnalités :
 * - Création/édition/suppression de catégories
 * - Palette de 9 couleurs pour identification visuelle
 * - Compteur de clients par catégorie
 * - Recherche et filtrage par couleur
 * - Tri par nom ou nombre de clients
 * - Actions groupées sur catégories sélectionnées
 */
import { useState, useEffect, useMemo } from 'react';
import { Layout } from '../../components/Layout';
import {
  useCustomerCategories,
  useCreateCustomerCategory,
  useUpdateCustomerCategory,
  useDeleteCustomerCategory,
  type CustomerCategory,
} from '../../hooks/useCustomerCategories';
import { SkeletonTable, PageNotice, Button } from '../../components/common';
import { crmNotices } from '@/lib/notices';
import { useToast } from '../../contexts/ToastContext';
import { logger } from '@quelyos/logger';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function CustomerCategories() {
  // Toast
  const toast = useToast();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'clients'>('name');
  const [colorFilter, setColorFilter] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomerCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CustomerCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(0);

  // Queries & Mutations
  const { data: categories, isLoading, error, refetch } = useCustomerCategories();
  const createMutation = useCreateCustomerCategory();
  const updateMutation = useUpdateCustomerCategory();
  const deleteMutation = useDeleteCustomerCategory();

  // Colors palette
  const colors = [
    { value: 0, class: 'bg-gray-200 dark:bg-gray-600', darkClass: 'bg-gray-600', name: 'Gris' },
    { value: 1, class: 'bg-red-200 dark:bg-red-600', darkClass: 'bg-red-600', name: 'Rouge' },
    { value: 2, class: 'bg-orange-200 dark:bg-orange-600', darkClass: 'bg-orange-600', name: 'Orange' },
    { value: 3, class: 'bg-yellow-200 dark:bg-yellow-600', darkClass: 'bg-yellow-600', name: 'Jaune' },
    { value: 4, class: 'bg-green-200 dark:bg-green-600', darkClass: 'bg-green-600', name: 'Vert' },
    { value: 5, class: 'bg-blue-200 dark:bg-blue-600', darkClass: 'bg-blue-600', name: 'Bleu' },
    { value: 6, class: 'bg-indigo-200 dark:bg-indigo-600', darkClass: 'bg-indigo-600', name: 'Indigo' },
    { value: 7, class: 'bg-purple-200 dark:bg-purple-600', darkClass: 'bg-purple-600', name: 'Violet' },
    { value: 8, class: 'bg-pink-200 dark:bg-pink-600', darkClass: 'bg-pink-600', name: 'Rose' },
  ];

  const getColorClass = (colorValue: number) => {
    const color = colors.find((c) => c.value === colorValue);
    return color?.class || 'bg-gray-200 dark:bg-gray-600';
  };

  // Filtered & sorted categories (memoized)
  const filteredCategories = useMemo(() => {
    if (!categories) return [];

    let filtered = categories.filter((category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (colorFilter !== null) {
      filtered = filtered.filter((c) => c.color === colorFilter);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return b.partner_count - a.partner_count;
      }
    });

    return filtered;
  }, [categories, searchQuery, colorFilter, sortBy]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + N : Nouvelle catégorie
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setIsCreateModalOpen(true);
      }
      // Escape : Fermer modals
      if (e.key === 'Escape') {
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
      }
      // Cmd/Ctrl + A : Tout sélectionner
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && filteredCategories.length > 0) {
        e.preventDefault();
        if (selectedCategories.length === filteredCategories.length) {
          setSelectedCategories([]);
        } else {
          setSelectedCategories(filteredCategories.map((c) => c.id));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCategories, filteredCategories]);

  // Handlers
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      await createMutation.mutateAsync({
        name: newCategoryName,
        color: selectedColor,
      });
      toast.success(`Catégorie "${newCategoryName}" créée avec succès`);
      setNewCategoryName('');
      setSelectedColor(0);
      setIsCreateModalOpen(false);
    } catch (error) {
      logger.error('[CustomerCategories] Create error:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création');
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !newCategoryName.trim()) return;

    try {
      await updateMutation.mutateAsync({
        id: editingCategory.id,
        data: {
          name: newCategoryName,
          color: selectedColor,
        },
      });
      toast.success(`Catégorie "${newCategoryName}" modifiée avec succès`);
      setIsEditModalOpen(false);
      setEditingCategory(null);
      setNewCategoryName('');
      setSelectedColor(0);
    } catch (error) {
      logger.error('[CustomerCategories] Edit error:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la modification');
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    try {
      await deleteMutation.mutateAsync(deletingCategory.id);
      toast.success(`Catégorie "${deletingCategory.name}" supprimée`);
      setIsDeleteModalOpen(false);
      setDeletingCategory(null);
      setSelectedCategories((prev) => prev.filter((id) => id !== deletingCategory.id));
    } catch (error) {
      logger.error('[CustomerCategories] Delete error:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCategories.length === 0) return;

    try {
      await Promise.all(selectedCategories.map((id) => deleteMutation.mutateAsync(id)));
      toast.success(`${selectedCategories.length} catégorie(s) supprimée(s)`);
      setSelectedCategories([]);
    } catch (error) {
      logger.error('[CustomerCategories] Bulk delete error:', error);
      toast.error('Erreur lors de la suppression groupée');
    }
  };

  const openEditModal = (category: CustomerCategory) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setSelectedColor(category.color);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (category: CustomerCategory) => {
    setDeletingCategory(category);
    setIsDeleteModalOpen(true);
  };

  const toggleCategorySelection = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Loading state with skeleton
  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6 p-4 md:p-8">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse mb-6" />
          <SkeletonTable rows={10} columns={4} />
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="p-4 md:p-8">
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement des catégories clients.
              </p>
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => refetch()}
              >
                Réessayer
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-4 md:p-8">
        {/* Skip link pour accessibilité */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg"
        >
          Aller au contenu principal
        </a>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-gray-100">
              Catégories / Tags Clients
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Segmentez vos clients avec des catégories pour un marketing ciblé
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            aria-label="Créer une nouvelle catégorie (raccourci : Cmd+N)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle catégorie
          </button>
        </div>

        <PageNotice config={crmNotices.customerCategories} className="mb-6" />

        {/* Search & Filters */}
        <div id="main-content" className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Rechercher une catégorie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              aria-label="Rechercher une catégorie"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Effacer la recherche"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'clients')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Trier les catégories"
            >
              <option value="name">Trier par nom</option>
              <option value="clients">Trier par clients</option>
            </select>

            <select
              value={colorFilter ?? ''}
              onChange={(e) => setColorFilter(e.target.value ? Number(e.target.value) : null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Filtrer par couleur"
            >
              <option value="">Toutes les couleurs</option>
              {colors.map((color) => (
                <option key={color.value} value={color.value}>
                  {color.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Catégories</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white dark:text-gray-100">
                  {filteredCategories?.length || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Clients totaux</p>
                <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                  {categories?.reduce((sum, cat) => sum + cat.partner_count, 0) || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedCategories.length > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-gray-900 dark:bg-gray-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4 animate-slide-up">
            <span className="text-sm font-medium">
              {selectedCategories.length} catégorie(s) sélectionnée(s)
            </span>
            <button
              onClick={handleBulkDelete}
              disabled={deleteMutation.isPending}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-all"
              aria-label={`Supprimer ${selectedCategories.length} catégorie(s)`}
            >
              Supprimer
            </button>
            <button
              onClick={() => setSelectedCategories([])}
              className="px-4 py-1.5 bg-gray-700 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-500 rounded-lg text-sm font-medium transition-all"
              aria-label="Désélectionner tout"
            >
              Annuler
            </button>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories && filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <div
                key={category.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all duration-200 p-4 group ${
                  selectedCategories.includes(category.id)
                    ? 'ring-2 ring-blue-500 dark:ring-blue-400'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => toggleCategorySelection(category.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      aria-label={`Sélectionner ${category.name}`}
                    />
                    <div
                      className={`w-8 h-8 rounded-full ${getColorClass(category.color)} flex-shrink-0`}
                      aria-label={`Couleur: ${colors.find((c) => c.value === category.color)?.name}`}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white dark:text-gray-100 truncate">
                        {category.name}
                      </h3>
                      {category.parent_name && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          ↳ {category.parent_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions (visible au hover) */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => openEditModal(category)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all"
                      aria-label={`Modifier ${category.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => openDeleteModal(category)}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                      aria-label={`Supprimer ${category.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span>{category.partner_count} client(s)</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg shadow p-12">
              <div className="flex flex-col items-center text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400 dark:text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-900 dark:text-white dark:text-gray-100 mb-2">
                  Aucune catégorie trouvée
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {searchQuery || colorFilter !== null
                    ? 'Aucune catégorie ne correspond à vos critères de recherche.'
                    : 'Commencez par créer votre première catégorie pour segmenter vos clients.'}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setColorFilter(null);
                    setIsCreateModalOpen(true);
                  }}
                  className="px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 transform hover:scale-105 active:scale-95 font-medium"
                >
                  {searchQuery || colorFilter !== null ? 'Réinitialiser les filtres' : 'Créer ma première catégorie'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {isCreateModalOpen && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-modal-title"
          >
            <div className="flex items-center justify-center min-h-screen px-4">
              <div
                className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Fermer la modal"
              />
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 animate-modal-appear">
                <h2
                  id="create-modal-title"
                  className="text-xl font-bold text-gray-900 dark:text-white dark:text-gray-100 mb-4"
                >
                  Nouvelle catégorie client
                </h2>
                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div>
                    <label
                      htmlFor="category-name"
                      className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2"
                    >
                      Nom de la catégorie
                    </label>
                    <input
                      id="category-name"
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Clients VIP, Grossistes..."
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                      Couleur
                    </label>
                    <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Sélectionner une couleur">
                      {colors.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setSelectedColor(color.value)}
                          className={`w-12 h-12 rounded-lg ${color.class} transition-all duration-200 ${
                            selectedColor === color.value
                              ? 'ring-2 ring-blue-600 dark:ring-blue-400 ring-offset-2 dark:ring-offset-gray-800 scale-110'
                              : 'hover:opacity-80 hover:scale-105'
                          }`}
                          title={color.name}
                          aria-label={`Couleur ${color.name}`}
                          role="radio"
                          aria-checked={selectedColor === color.value}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {createMutation.isPending ? 'Création...' : 'Créer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && editingCategory && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-modal-title"
          >
            <div className="flex items-center justify-center min-h-screen px-4">
              <div
                className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={() => setIsEditModalOpen(false)}
                aria-label="Fermer la modal"
              />
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 animate-modal-appear">
                <h2
                  id="edit-modal-title"
                  className="text-xl font-bold text-gray-900 dark:text-white dark:text-gray-100 mb-4"
                >
                  Modifier la catégorie
                </h2>
                <form onSubmit={handleEditCategory} className="space-y-4">
                  <div>
                    <label
                      htmlFor="edit-category-name"
                      className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2"
                    >
                      Nom de la catégorie
                    </label>
                    <input
                      id="edit-category-name"
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                      Couleur
                    </label>
                    <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Sélectionner une couleur">
                      {colors.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setSelectedColor(color.value)}
                          className={`w-12 h-12 rounded-lg ${color.class} transition-all duration-200 ${
                            selectedColor === color.value
                              ? 'ring-2 ring-blue-600 dark:ring-blue-400 ring-offset-2 dark:ring-offset-gray-800 scale-110'
                              : 'hover:opacity-80 hover:scale-105'
                          }`}
                          title={color.name}
                          aria-label={`Couleur ${color.name}`}
                          role="radio"
                          aria-checked={selectedColor === color.value}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {updateMutation.isPending ? 'Modification...' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && deletingCategory && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <div className="flex items-center justify-center min-h-screen px-4">
              <div
                className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={() => setIsDeleteModalOpen(false)}
                aria-label="Fermer la modal"
              />
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 animate-modal-appear">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-600 dark:text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2
                      id="delete-modal-title"
                      className="text-lg font-semibold text-gray-900 dark:text-white dark:text-gray-100 mb-2"
                    >
                      Supprimer la catégorie ?
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Êtes-vous sûr de vouloir supprimer la catégorie{' '}
                      <span className="font-semibold">"{deletingCategory.name}"</span> ?{' '}
                      {deletingCategory.partner_count > 0 && (
                        <span className="text-red-600 dark:text-red-400">
                          {deletingCategory.partner_count} client(s) perdront cette catégorie.
                        </span>
                      )}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleDeleteCategory}
                        disabled={deleteMutation.isPending}
                        className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
