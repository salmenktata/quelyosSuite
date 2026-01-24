import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Layout } from '../components/Layout'
import {
  useCategoriesTree,
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useMoveCategory,
} from '../hooks/useCategories'
import {
  Button,
  Input,
  Modal,
  Breadcrumbs,
  SkeletonTable,
  Badge,
  CategoryTree,
} from '../components/common'
import { useToast } from '../hooks/useToast'
import { useDebounce } from '../hooks/useDebounce'
import { ToastContainer } from '../components/common/Toast'
import { Category } from '../types'

interface CategoryFormData {
  name: string
  parent_id: string
}

export default function Categories() {
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null)

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ id: number; name: string } | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({ name: '', parent_id: '' })
  const [nameError, setNameError] = useState<string | null>(null)
  const [nameValid, setNameValid] = useState(false)
  const [expandAll, setExpandAll] = useState<boolean>(true)

  const debouncedSearch = useDebounce(searchQuery, 300)

  const toast = useToast()

  // Queries
  const {
    data: treeData,
    isLoading: isTreeLoading,
    error: treeError,
  } = useCategoriesTree()

  const {
    data: searchData,
    isLoading: isSearchLoading,
  } = useCategories({
    search: debouncedSearch || undefined,
    include_tree: false,
  })

  // Mutations
  const createCategoryMutation = useCreateCategory()
  const updateCategoryMutation = useUpdateCategory()
  const deleteCategoryMutation = useDeleteCategory()
  const moveCategoryMutation = useMoveCategory()

  // Computed
  const isLoading = isTreeLoading || isSearchLoading
  const error = treeError

  // Catégories à afficher (arbre ou résultats de recherche)
  const displayCategories = useMemo(() => {
    if (debouncedSearch) {
      return searchData?.data?.categories || []
    }
    return treeData?.data?.categories || []
  }, [debouncedSearch, searchData, treeData])

  // Liste plate pour le sélecteur de parent
  const flatCategories = useMemo(() => {
    if (!treeData?.data?.categories) return []

    const flatten = (cats: Category[], result: Category[] = []): Category[] => {
      for (const cat of cats) {
        result.push(cat)
        if (cat.children) {
          flatten(cat.children, result)
        }
      }
      return result
    }

    return flatten(treeData.data.categories)
  }, [treeData])

  // Stats
  const stats = useMemo(() => {
    const totalCategories = flatCategories.length
    const rootCategories = (treeData?.data?.categories || []).length
    const totalProducts = flatCategories.reduce((sum, cat) => sum + (cat.product_count || 0), 0)
    const emptyCategories = flatCategories.filter((cat) => !cat.product_count || cat.product_count === 0).length

    return { totalCategories, rootCategories, totalProducts, emptyCategories }
  }, [flatCategories, treeData])

  // Validation
  const validateName = (name: string) => {
    if (!name.trim()) {
      setNameError('Le nom est requis')
      setNameValid(false)
      return false
    }
    if (name.trim().length < 2) {
      setNameError('Le nom doit contenir au moins 2 caractères')
      setNameValid(false)
      return false
    }
    if (name.trim().length > 100) {
      setNameError('Le nom ne peut pas dépasser 100 caractères')
      setNameValid(false)
      return false
    }
    setNameError(null)
    setNameValid(true)
    return true
  }

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name })
    if (name.length > 0) {
      validateName(name)
    } else {
      setNameError(null)
      setNameValid(false)
    }
  }

  // Handlers
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    try {
      await createCategoryMutation.mutateAsync({
        name: formData.name,
        parent_id: formData.parent_id ? Number(formData.parent_id) : undefined,
      })
      toast.success(`La catégorie "${formData.name}" a été créée avec succès`)
      setFormData({ name: '', parent_id: '' })
      setIsCreating(false)
    } catch (error) {
      toast.error('Erreur lors de la création de la catégorie')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory || !formData.name.trim()) return

    try {
      await updateCategoryMutation.mutateAsync({
        id: editingCategory.id,
        data: {
          name: formData.name,
          parent_id: formData.parent_id ? Number(formData.parent_id) : null,
        },
      })
      toast.success(`La catégorie "${formData.name}" a été modifiée avec succès`)
      setFormData({ name: '', parent_id: '' })
      setEditingCategory(null)
    } catch (error) {
      toast.error('Erreur lors de la modification de la catégorie')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal) return

    try {
      await deleteCategoryMutation.mutateAsync(deleteModal.id)
      toast.success(`La catégorie "${deleteModal.name}" a été supprimée avec succès`)
      setDeleteModal(null)
    } catch (error) {
      toast.error('Erreur lors de la suppression de la catégorie')
    }
  }

  const handleMove = useCallback(
    async (categoryId: number, newParentId: number | null) => {
      try {
        await moveCategoryMutation.mutateAsync({ id: categoryId, newParentId })
        toast.success('Catégorie déplacée avec succès')
      } catch (error) {
        toast.error('Erreur lors du déplacement de la catégorie')
      }
    },
    [moveCategoryMutation, toast]
  )

  const startEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      parent_id: category.parent_id?.toString() || '',
    })
    setIsCreating(false)
    setNameError(null)
    setNameValid(true)
  }

  const cancelEdit = () => {
    setEditingCategory(null)
    setIsCreating(false)
    setFormData({ name: '', parent_id: '' })
    setNameError(null)
    setNameValid(false)
  }

  const openCreateModal = () => {
    setFormData({ name: '', parent_id: '' })
    setEditingCategory(null)
    setIsCreating(true)
    setNameError(null)
    setNameValid(false)
  }

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+N : Nouvelle catégorie
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !isCreating && !editingCategory) {
        e.preventDefault()
        openCreateModal()
      }
      // / ou Cmd/Ctrl+K : Focus sur recherche
      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) && !isCreating && !editingCategory) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isCreating, editingCategory])

  return (
    <Layout>
      <main role="main" className="p-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Catégories' },
          ]}
        />

        {/* En-tête */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Catégories
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Organisez vos produits en catégories hiérarchiques
            </p>
          </div>
          <Button
            variant="primary"
            onClick={openCreateModal}
            aria-label="Créer une nouvelle catégorie (Cmd+N)"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Nouvelle catégorie
          </Button>
        </div>

        {/* Statistiques */}
        <section aria-labelledby="stats-heading" className="mb-6">
          <h2 id="stats-heading" className="sr-only">
            Statistiques des catégories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLoading ? (
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ) : (
                  stats.totalCategories
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Catégories totales
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {isLoading ? (
                  <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ) : (
                  stats.rootCategories
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Catégories racines
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {isLoading ? (
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ) : (
                  stats.totalProducts
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Produits catégorisés
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {isLoading ? (
                  <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ) : (
                  stats.emptyCategories
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Catégories vides
              </div>
            </div>
          </div>
        </section>

        {/* Barre de recherche et contrôles */}
        <section aria-label="Gestion des catégories" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-gray-200 dark:border-gray-700">
            {/* Recherche */}
            <div className="relative w-full sm:w-80">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher une catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                aria-label="Rechercher une catégorie"
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Effacer la recherche"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Contrôles */}
            <div className="flex items-center gap-3">
              {/* Bouton Tout déplier/replier */}
              {displayCategories.length > 0 && !searchQuery && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setExpandAll(!expandAll)}
                  icon={
                    expandAll ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )
                  }
                  aria-label={expandAll ? 'Tout replier' : 'Tout déplier'}
                >
                  {expandAll ? 'Replier' : 'Déplier'}
                </Button>
              )}

              {searchQuery && (
                <Badge variant="info">
                  {displayCategories.length} résultat{displayCategories.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          {/* Contenu */}
          {isLoading ? (
            <SkeletonTable rows={8} columns={4} />
          ) : error ? (
            <div className="p-8 text-center text-red-600 dark:text-red-400 animate-fadeIn">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p>Erreur lors du chargement des catégories</p>
            </div>
          ) : displayCategories.length === 0 ? (
            <div className="p-12 text-center animate-fadeIn">
              <svg className="w-24 h-24 mx-auto mb-6 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'Aucun résultat trouvé' : 'Aucune catégorie'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {searchQuery
                  ? `Aucune catégorie ne correspond à "${searchQuery}". Essayez une autre recherche.`
                  : 'Créez votre première catégorie pour organiser vos produits de manière hiérarchique.'}
              </p>
              {!searchQuery && (
                <Button
                  variant="primary"
                  onClick={openCreateModal}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  }
                >
                  Créer une catégorie
                </Button>
              )}
            </div>
          ) : (
            <CategoryTree
              categories={displayCategories}
              onEdit={startEdit}
              onDelete={(cat) => setDeleteModal({ id: cat.id, name: cat.name })}
              onMove={handleMove}
              isMoving={moveCategoryMutation.isPending}
              expandAll={expandAll}
            />
          )}

          {/* Info drag & drop */}
          {displayCategories.length > 0 && !searchQuery && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 text-center">
              <svg className="w-4 h-4 inline-block mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Glissez-déposez les catégories pour réorganiser la hiérarchie
            </div>
          )}
        </section>

        {/* Modal de création/édition */}
        <Modal
          isOpen={isCreating || !!editingCategory}
          onClose={cancelEdit}
          title={editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          description={
            editingCategory
              ? 'Modifiez les informations de la catégorie'
              : 'Créez une nouvelle catégorie pour organiser vos produits'
          }
          hideDefaultActions={true}
        >
          <form onSubmit={editingCategory ? handleUpdate : handleCreate} className="space-y-4">
            <div>
              <Input
                label="Nom de la catégorie"
                id="category-name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Vêtements"
                required
                autoFocus
                className={`${
                  nameError
                    ? 'border-red-500 focus:ring-red-500'
                    : nameValid
                    ? 'border-green-500 focus:ring-green-500'
                    : ''
                }`}
              />
              {nameError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {nameError}
                </p>
              )}
              {nameValid && !nameError && (
                <p className="mt-1 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Nom valide
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="category-parent"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Catégorie parente
              </label>
              <select
                id="category-parent"
                value={formData.parent_id}
                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none"
              >
                <option value="">Aucune (catégorie racine)</option>
                {flatCategories
                  .filter((cat) => cat.id !== editingCategory?.id)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.complete_name || cat.name}
                    </option>
                  ))}
              </select>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Laissez vide pour créer une catégorie racine
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={cancelEdit}>
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              >
                {editingCategory ? 'Enregistrer' : 'Créer'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal de confirmation de suppression */}
        <Modal
          isOpen={!!deleteModal}
          onClose={() => setDeleteModal(null)}
          onConfirm={handleDeleteConfirm}
          title="Supprimer la catégorie"
          description={`Êtes-vous sûr de vouloir supprimer la catégorie "${deleteModal?.name}" ? Cette action est irréversible et les produits associés seront décatégorisés.`}
          confirmText="Supprimer"
          cancelText="Annuler"
          variant="danger"
          loading={deleteCategoryMutation.isPending}
        />

        {/* ToastContainer */}
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} position="top-right" />
      </main>
    </Layout>
  )
}
