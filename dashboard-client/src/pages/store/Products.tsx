/**
 * Page Produits - Gestion du catalogue produits
 *
 * Fonctionnalités :
 * - Liste complète des produits avec pagination
 * - Recherche avancée avec autocomplétion
 * - Filtres multiples (catégorie, stock, prix, attributs)
 * - Actions en masse (archiver, désarchiver, supprimer)
 * - Import/Export CSV
 * - Duplication de produits
 * - Raccourcis clavier (Cmd+N, Cmd+Shift+R, Esc, Cmd+A)
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Upload,
  Download,
  Plus,
  Image as ImageIcon,
  Tag,
  ChevronDown,
  Archive,
  RefreshCw,
  Trash2,
  Copy,
  Package,
} from 'lucide-react'
import { Layout } from '../../components/Layout'
import {
  useProducts,
  useDeleteProduct,
  useArchiveProduct,
  useDuplicateProduct,
  useExportProducts,
  useImportProducts,
} from '../../hooks/useProducts'
import { useCategories } from '../../hooks/useCategories'
import {
  Button,
  Badge,
  Modal,
  Breadcrumbs,
  SkeletonTable,
  BackendImage,
  Input,
  ImportProductsModal,
  SearchAutocomplete,
  AttributeFilter,
  PageNotice,
  type SearchSuggestion,
  type Attribute,
} from '../../components/common'
import { ecommerceNotices } from '@/lib/notices'
import { useToast } from '../../hooks/useToast'
import { ToastContainer } from '../../components/common/Toast'
import { api } from '../../lib/api'
import { logger } from '@quelyos/logger'
import type { ProductsQueryParams, Product, Category } from '@/types'

type SortField = 'name' | 'price' | 'qty_available' | 'default_code'
type SortOrder = 'asc' | 'desc'

export default function Products() {
  const [page, setPage] = useState(0)
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>()
  const [stockStatusFilter, setStockStatusFilter] = useState<
    'in_stock' | 'low_stock' | 'out_of_stock' | undefined
  >()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sortBy, setSortBy] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [deleteModal, setDeleteModal] = useState<{ id: number; name: string } | null>(null)
  const [duplicateModal, setDuplicateModal] = useState<{
    id: number
    name: string
    newName: string
  } | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [includeArchived, setIncludeArchived] = useState(false)
  const [priceMin, setPriceMin] = useState<string>('')
  const [priceMax, setPriceMax] = useState<string>('')
  const [selectedAttributeValues, setSelectedAttributeValues] = useState<number[]>([])
  const [showAttributeFilters, setShowAttributeFilters] = useState(false)
  // Bulk selection
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const limit = 20

  const toast = useToast()

  const queryParams: ProductsQueryParams = {
    limit,
    offset: page * limit,
    category_id: categoryFilter,
    search: searchQuery || undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
    stock_status: stockStatusFilter,
    include_archived: includeArchived,
    price_min: priceMin ? Number(priceMin) : undefined,
    price_max: priceMax ? Number(priceMax) : undefined,
    attribute_value_ids: selectedAttributeValues.length > 0 ? selectedAttributeValues : undefined,
  }

  // Récupérer les attributs disponibles pour les filtres
  const { data: attributesData, isLoading: attributesLoading } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => api.getAllAttributes(),
  })

  const attributes: Attribute[] = useMemo(() => {
    if (!attributesData?.data?.attributes) return []
    // Ne garder que les attributs qui ont des valeurs
    return attributesData.data.attributes.filter((attr: any) => attr.values.length > 0)
  }, [attributesData])

  const { data: productsData, isLoading, error } = useProducts(queryParams)
  const { data: categoriesData } = useCategories()
  const deleteProductMutation = useDeleteProduct()
  const duplicateProductMutation = useDuplicateProduct()
  const exportProductsMutation = useExportProducts()
  const importProductsMutation = useImportProducts()
  const archiveProductMutation = useArchiveProduct()

  // Support des deux formats de réponse API (data.products ou products directement)
  const productsResponse = productsData as unknown as { data?: { products?: Product[]; total?: number }; products?: Product[]; total?: number }
  const products = (productsResponse?.data?.products || productsResponse?.products || []) as Product[]
  const total = (productsResponse?.data?.total || productsResponse?.total || 0) as number
  const totalPages = Math.ceil(total / limit)

  const categoriesResponse = categoriesData as unknown as { data?: { categories?: Category[] }; categories?: Category[] }
  const categories = (categoriesResponse?.data?.categories || categoriesResponse?.categories || []) as Category[]

  const navigate = useNavigate()

  // Fetch suggestions pour l'autocomplétion
  const fetchProductSuggestions = useCallback(
    async (query: string): Promise<SearchSuggestion<Product>[]> => {
      try {
        const response = await api.getProducts({ search: query, limit: 8 }) as unknown as { success: boolean; data?: { products?: Product[] }; products?: Product[] }
        const productsList = response.data?.products || response.products
        if (response.success && productsList && Array.isArray(productsList)) {
          return (productsList as Product[]).map((product) => ({
            id: product.id,
            label: product.name,
            data: product,
          }))
        }
        return []
      } catch (error) {
        logger.error('Error fetching suggestions:', error)
        return []
      }
    },
    []
  )

  // Recherche
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setSearchInput(query)
    setPage(0)
  }, [])

  // Sélection d'une suggestion (navigation vers le produit)
  const handleSelectSuggestion = useCallback(
    (item: SearchSuggestion<Product>) => {
      navigate(`/products/${item.id}/edit`)
    },
    [navigate]
  )


  // Tri
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setPage(0)
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-indigo-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-indigo-600" />
    )
  }

  // Suppression
  const handleDeleteConfirm = async () => {
    if (!deleteModal) return

    try {
      await deleteProductMutation.mutateAsync(deleteModal.id)
      toast.success(`Le produit "${deleteModal.name}" a été supprimé avec succès`)
      setDeleteModal(null)
    } catch {
      toast.error('Erreur lors de la suppression du produit')
    }
  }

  // Duplication
  const handleDuplicateConfirm = async () => {
    if (!duplicateModal) return

    try {
      const result = await duplicateProductMutation.mutateAsync({
        id: duplicateModal.id,
        name: duplicateModal.newName,
      })
      toast.success(result.data?.message || 'Produit dupliqué avec succès')
      setDuplicateModal(null)
    } catch {
      toast.error('Erreur lors de la duplication du produit')
    }
  }

  // Export CSV
  const handleExport = async () => {
    try {
      const result = await exportProductsMutation.mutateAsync({
        category_id: categoryFilter,
        search: searchQuery || undefined,
      })

      if (!result.success || !result.data) {
        throw new Error('Export failed')
      }

      const { products: exportData, columns } = result.data

      // Créer le CSV
      const headers = columns.map((c: any) => c.label).join(';')
      const rows = exportData.map((p: any) =>
        columns.map((c: any) => {
          const value = p[c.key as keyof typeof p]
          // Échapper les points-virgules et guillemets
          const str = String(value ?? '')
          return str.includes(';') || str.includes('"')
            ? `"${str.replace(/"/g, '""')}"`
            : str
        }).join(';')
      )

      const csvContent = [headers, ...rows].join('\n')
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `produits_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)

      toast.success(`${exportData.length} produits exportés avec succès`)
    } catch {
      toast.error('Erreur lors de l\'export des produits')
    }
  }

  // Badge statut stock
  const getStockBadge = (status: string, qty: number) => {
    switch (status) {
      case 'in_stock':
        return <Badge variant="success">{qty} en stock</Badge>
      case 'low_stock':
        return <Badge variant="warning">{qty} (stock faible)</Badge>
      case 'out_of_stock':
        return <Badge variant="error">Rupture</Badge>
      default:
        return <Badge variant="neutral">{qty}</Badge>
    }
  }

  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setCategoryFilter(undefined)
    setStockStatusFilter(undefined)
    setSearchInput('')
    setSearchQuery('')
    setSortBy('name')
    setSortOrder('asc')
    setPriceMin('')
    setPriceMax('')
    setSelectedAttributeValues([])
    setPage(0)
  }

  const hasActiveFilters = categoryFilter || stockStatusFilter || searchQuery || priceMin || priceMax || selectedAttributeValues.length > 0

  // Bulk actions helpers
  const isAllSelected = useMemo(() => {
    return products.length > 0 && products.every((p: any) => selectedProductIds.has(p.id))
  }, [products, selectedProductIds])

  const isSomeSelected = useMemo(() => {
    return products.some((p: any) => selectedProductIds.has(p.id))
  }, [products, selectedProductIds])

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedProductIds(new Set())
    } else {
      setSelectedProductIds(new Set(products.map((p: any) => p.id)))
    }
  }, [isAllSelected, products])

  const toggleSelectProduct = useCallback((productId: number) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedProductIds(new Set())
  }, [])

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifier = isMac ? e.metaKey : e.ctrlKey

      // Cmd/Ctrl + N : Créer nouveau produit
      if (modifier && e.key === 'n' && !e.shiftKey) {
        e.preventDefault()
        navigate('/products/create')
      }

      // Cmd/Ctrl + Shift + R : Réinitialiser les filtres
      if (modifier && e.shiftKey && e.key === 'r') {
        e.preventDefault()
        resetFilters()
        toast.success('Filtres réinitialisés')
      }

      // Escape : Fermer les modals et désélectionner
      if (e.key === 'Escape') {
        if (deleteModal) {
          setDeleteModal(null)
        } else if (duplicateModal) {
          setDuplicateModal(null)
        } else if (importModalOpen) {
          setImportModalOpen(false)
        } else if (selectedProductIds.size > 0) {
          clearSelection()
        }
      }

      // Cmd/Ctrl + A : Sélectionner tout (quand pas dans un input)
      if (modifier && e.key === 'a' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        if (products.length > 0) {
          setSelectedProductIds(new Set(products.map((p: any) => p.id)))
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, deleteModal, duplicateModal, importModalOpen, selectedProductIds.size, products, clearSelection])

  // Bulk archive
  const handleBulkArchive = async (archive: boolean) => {
    if (selectedProductIds.size === 0) return

    setBulkActionLoading(true)
    try {
      const promises = Array.from(selectedProductIds).map((id) =>
        archiveProductMutation.mutateAsync({ id, archive })
      )
      await Promise.all(promises)
      toast.success(
        archive
          ? `${selectedProductIds.size} produit(s) archivé(s)`
          : `${selectedProductIds.size} produit(s) désarchivé(s)`
      )
      clearSelection()
    } catch {
      toast.error('Erreur lors de l\'archivage en masse')
    } finally {
      setBulkActionLoading(false)
    }
  }

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedProductIds.size === 0) return
    if (!confirm(`Supprimer ${selectedProductIds.size} produit(s) ? Cette action est irréversible.`)) return

    setBulkActionLoading(true)
    try {
      const promises = Array.from(selectedProductIds).map((id) =>
        deleteProductMutation.mutateAsync(id)
      )
      await Promise.all(promises)
      toast.success(`${selectedProductIds.size} produit(s) supprimé(s)`)
      clearSelection()
    } catch {
      toast.error('Erreur lors de la suppression en masse')
    } finally {
      setBulkActionLoading(false)
    }
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Store', href: '/store' },
            { label: 'Produits' },
          ]}
        />

        {/* En-tête */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Produits</h1>
            <p className="text-gray-900 dark:text-white mt-2">
              {total} produit{total > 1 ? 's' : ''} au total
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => setImportModalOpen(true)}
              icon={<Upload className="w-5 h-5" />}
            >
              Importer CSV
            </Button>
            <Button
              variant="secondary"
              onClick={handleExport}
              loading={exportProductsMutation.isPending}
              icon={<Download className="w-5 h-5" />}
            >
              Exporter CSV
            </Button>
            <Link to="/store/products/create">
              <Button
                variant="primary"
                icon={<Plus className="w-5 h-5" />}
              >
                Nouveau produit
              </Button>
            </Link>
          </div>
        </div>

        <PageNotice config={ecommerceNotices.products} className="mb-6" />

        {/* Filtres et Recherche */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recherche avec autocomplétion */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Rechercher
              </label>
              <SearchAutocomplete<Product>
                placeholder="Nom, SKU ou description..."
                value={searchInput}
                onChange={setSearchInput}
                onSearch={handleSearch}
                onSelect={handleSelectSuggestion}
                fetchSuggestions={fetchProductSuggestions}
                renderSuggestion={(item, isHighlighted) => (
                  <div
                    className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${
                      isHighlighted
                        ? 'bg-indigo-50 dark:bg-indigo-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                      {item.data.image ? (
                        <BackendImage
                          src={item.data.image}
                          alt={item.data.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        isHighlighted ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-white'
                      }`}>
                        {item.data.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.data.default_code && <span className="mr-2">{item.data.default_code}</span>}
                        <span className="font-medium">{item.data.price?.toFixed(2)} €</span>
                      </p>
                    </div>
                  </div>
                )}
              />
            </div>

            {/* Filtre catégorie */}
            <div>
              <label
                htmlFor="category-filter"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Catégorie
              </label>
              <select
                id="category-filter"
                value={categoryFilter || ''}
                onChange={(e) => {
                  setCategoryFilter(e.target.value ? Number(e.target.value) : undefined)
                  setPage(0)
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none"
              >
                <option value="">Toutes</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre statut stock */}
            <div>
              <label
                htmlFor="stock-filter"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Statut stock
              </label>
              <select
                id="stock-filter"
                value={stockStatusFilter || ''}
                onChange={(e) => {
                  setStockStatusFilter(
                    e.target.value as 'in_stock' | 'low_stock' | 'out_of_stock' | undefined || undefined
                  )
                  setPage(0)
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none"
              >
                <option value="">Tous</option>
                <option value="in_stock">En stock</option>
                <option value="low_stock">Stock faible</option>
                <option value="out_of_stock">Rupture</option>
              </select>
            </div>
          </div>

          {/* Filtres de prix */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="price-min"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Prix minimum (€)
              </label>
              <input
                id="price-min"
                type="number"
                step="0.01"
                min="0"
                value={priceMin}
                onChange={(e) => {
                  setPriceMin(e.target.value)
                  setPage(0)
                }}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="price-max"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Prix maximum (€)
              </label>
              <input
                id="price-max"
                type="number"
                step="0.01"
                min="0"
                value={priceMax}
                onChange={(e) => {
                  setPriceMax(e.target.value)
                  setPage(0)
                }}
                placeholder="1000.00"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Options supplémentaires */}
          <div className="mt-4 flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => {
                  setIncludeArchived(e.target.checked)
                  setPage(0)
                }}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Inclure les produits archivés
              </span>
            </label>

            {/* Bouton pour afficher/masquer les filtres d'attributs */}
            {attributes.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAttributeFilters(!showAttributeFilters)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${showAttributeFilters
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }
                `}
              >
                <Tag className="w-4 h-4" />
                Filtrer par attributs
                {selectedAttributeValues.length > 0 && (
                  <span className="bg-indigo-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {selectedAttributeValues.length}
                  </span>
                )}
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${showAttributeFilters ? 'rotate-180' : ''}`}
                />
              </Button>
            )}
          </div>

          {/* Panneau des filtres d'attributs */}
          {showAttributeFilters && attributes.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Filtrer par attributs
                </h3>
                {selectedAttributeValues.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedAttributeValues([])
                      setPage(0)
                    }}
                    className="!p-0 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Effacer tout ({selectedAttributeValues.length})
                  </Button>
                )}
              </div>
              <AttributeFilter
                attributes={attributes}
                selectedValues={selectedAttributeValues}
                onChange={(values) => {
                  setSelectedAttributeValues(values)
                  setPage(0)
                }}
                loading={attributesLoading}
              />
            </div>
          )}

          {/* Filtres actifs */}
          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">Filtres actifs :</span>
              {searchQuery && (
                <Badge variant="info">Recherche: "{searchQuery}"</Badge>
              )}
              {categoryFilter && (
                <Badge variant="info">
                  Catégorie: {categories.find((c: any) => c.id === categoryFilter)?.name}
                </Badge>
              )}
              {stockStatusFilter && (
                <Badge variant="info">
                  Stock: {stockStatusFilter === 'in_stock' ? 'En stock' : stockStatusFilter === 'low_stock' ? 'Faible' : 'Rupture'}
                </Badge>
              )}
              {priceMin && (
                <Badge variant="info">Prix min: {priceMin} €</Badge>
              )}
              {priceMax && (
                <Badge variant="info">Prix max: {priceMax} €</Badge>
              )}
              {selectedAttributeValues.length > 0 && (
                <Badge variant="info">
                  {selectedAttributeValues.length} attribut{selectedAttributeValues.length > 1 ? 's' : ''}
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Réinitialiser
              </Button>
            </div>
          )}
        </div>

        {/* Barre d'actions en masse */}
        {selectedProductIds.size > 0 && (
          <div className="mb-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                {selectedProductIds.size} produit{selectedProductIds.size > 1 ? 's' : ''} sélectionné{selectedProductIds.size > 1 ? 's' : ''}
              </span>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Désélectionner
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleBulkArchive(true)}
                disabled={bulkActionLoading}
                icon={<Archive className="w-4 h-4" />}
              >
                Archiver
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleBulkArchive(false)}
                disabled={bulkActionLoading}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Désarchiver
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkActionLoading}
                loading={bulkActionLoading}
                icon={<Trash2 className="w-4 h-4" />}
              >
                Supprimer
              </Button>
            </div>
          </div>
        )}

        {/* Tableau */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <SkeletonTable rows={5} columns={6} />
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600 dark:text-red-400 mb-2">
                Erreur lors du chargement des produits
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {error instanceof Error ? error.message : 'Erreur inconnue'}
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Aucun produit
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {hasActiveFilters
                  ? 'Aucun produit ne correspond à vos critères'
                  : 'Commencez par créer votre premier produit'}
              </p>
              {hasActiveFilters ? (
                <Button variant="secondary" onClick={resetFilters}>
                  Réinitialiser les filtres
                </Button>
              ) : (
                <Link to="/store/products/create">
                  <Button variant="primary">Créer un produit</Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Vue Cards Mobile */}
              <div className="block lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      selectedProductIds.has(product.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedProductIds.has(product.id)}
                        onChange={() => toggleSelectProduct(product.id)}
                        className="w-4 h-4 mt-1 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer shrink-0"
                        aria-label={`Sélectionner ${product.name}`}
                      />
                      {/* Image */}
                      <div className="h-16 w-16 shrink-0">
                        <BackendImage
                          src={product.image || ''}
                          alt={product.name}
                          className="h-16 w-16 rounded-lg object-cover"
                          fallback={
                            <div className="h-16 w-16 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          }
                        />
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-sm font-medium truncate ${product.active === false ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                            {product.name}
                          </h3>
                          {product.active === false && (
                            <Badge variant="neutral">Archivé</Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-2">
                          <span className="font-semibold">{product.price?.toFixed(2) ?? '0.00'} €</span>
                          {product.default_code && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="font-mono text-xs">{product.default_code}</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {getStockBadge(product.stock_status ?? "out_of_stock", product.qty_available ?? 0)}
                          {product.category && (
                            <Badge variant="info">{product.category.name}</Badge>
                          )}
                          {product.variant_count && product.variant_count > 1 && (
                            <Badge variant="neutral">{product.variant_count} variantes</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Mobile */}
                    <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setDuplicateModal({
                            id: product.id,
                            name: product.name,
                            newName: `${product.name} (copie)`,
                          })
                        }
                        title="Dupliquer"
                        icon={<Copy className="w-4 h-4" />}
                      >
                        Dupliquer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            const isArchived = product.active === false
                            await archiveProductMutation.mutateAsync({
                              id: product.id,
                              archive: !isArchived,
                            })
                            toast.success(
                              isArchived
                                ? `"${product.name}" a été désarchivé`
                                : `"${product.name}" a été archivé`
                            )
                          } catch {
                            toast.error('Erreur lors de l\'archivage du produit')
                          }
                        }}
                        disabled={archiveProductMutation.isPending}
                      >
                        {product.active === false ? 'Désarchiver' : 'Archiver'}
                      </Button>
                      <Link to={`/products/${product.id}/edit`}>
                        <Button variant="primary" size="sm">
                          Modifier
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() =>
                          setDeleteModal({ id: product.id, name: product.name })
                        }
                        disabled={deleteProductMutation.isPending}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Vue Tableau Desktop */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th scope="col" className="px-4 py-3 w-12">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                          aria-label={isAllSelected ? 'Désélectionner tout' : 'Sélectionner tout'}
                          ref={(el) => {
                            if (el) el.indeterminate = isSomeSelected && !isAllSelected
                          }}
                        />
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 !p-0 !text-xs uppercase"
                          aria-label={`Trier par produit ${sortBy === 'name' ? (sortOrder === 'asc' ? 'décroissant' : 'croissant') : ''}`}
                        >
                          Produit
                          <SortIcon field="name" />
                        </Button>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('default_code')}
                          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 !p-0 !text-xs uppercase"
                          aria-label={`Trier par SKU ${sortBy === 'default_code' ? (sortOrder === 'asc' ? 'décroissant' : 'croissant') : ''}`}
                        >
                          SKU
                          <SortIcon field="default_code" />
                        </Button>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Catégorie
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('price')}
                          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 !p-0 !text-xs uppercase"
                          aria-label={`Trier par prix ${sortBy === 'price' ? (sortOrder === 'asc' ? 'décroissant' : 'croissant') : ''}`}
                        >
                          Prix
                          <SortIcon field="price" />
                        </Button>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('qty_available')}
                          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 !p-0 !text-xs uppercase"
                          aria-label={`Trier par stock ${sortBy === 'qty_available' ? (sortOrder === 'asc' ? 'décroissant' : 'croissant') : ''}`}
                        >
                          Stock
                          <SortIcon field="qty_available" />
                        </Button>
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          selectedProductIds.has(product.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                        }`}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.has(product.id)}
                            onChange={() => toggleSelectProduct(product.id)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                            aria-label={`Sélectionner ${product.name}`}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 shrink-0">
                              <BackendImage
                                src={product.image ?? null}
                                alt={product.name}
                                className="h-10 w-10 rounded object-cover"
                                fallback={
                                  <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                    <ImageIcon className="w-6 h-6 text-gray-400" />
                                  </div>
                                }
                              />
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${product.active === false ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                                  {product.name}
                                </span>
                                {product.active === false && (
                                  <Badge variant="neutral">Archivé</Badge>
                                )}
                              </div>
                              {product.variant_count && product.variant_count > 1 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {product.variant_count} variantes
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                            {product.default_code || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.category ? (
                            <Badge variant="info">{product.category.name}</Badge>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Sans catégorie
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {product.price?.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStockBadge(product.stock_status ?? "out_of_stock", product.qty_available ?? 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setDuplicateModal({
                                  id: product.id,
                                  name: product.name,
                                  newName: `${product.name} (copie)`,
                                })
                              }
                              title="Dupliquer"
                              icon={<Copy className="w-4 h-4" />}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const isArchived = product.active === false
                                  await archiveProductMutation.mutateAsync({
                                    id: product.id,
                                    archive: !isArchived,
                                  })
                                  toast.success(
                                    isArchived
                                      ? `"${product.name}" a été désarchivé`
                                      : `"${product.name}" a été archivé`
                                  )
                                } catch {
                                  toast.error('Erreur lors de l\'archivage du produit')
                                }
                              }}
                              disabled={archiveProductMutation.isPending}
                              title={product.active === false ? 'Désarchiver' : 'Archiver'}
                              icon={
                                product.active === false ? (
                                  <RefreshCw className="w-4 h-4" />
                                ) : (
                                  <Archive className="w-4 h-4" />
                                )
                              }
                            />
                            <Link to={`/products/${product.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                Modifier
                              </Button>
                            </Link>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() =>
                                setDeleteModal({ id: product.id, name: product.name })
                              }
                              disabled={deleteProductMutation.isPending}
                            >
                              Supprimer
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Mobile */}
              <div className="block lg:hidden bg-gray-50 dark:bg-gray-900 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-700 dark:text-gray-300 text-center mb-2">
                  {page * limit + 1}-{Math.min((page + 1) * limit, total)} sur {total}
                </div>
                {totalPages > 1 && (
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Suivant
                    </Button>
                  </div>
                )}
              </div>

              {/* Pagination Desktop */}
              {totalPages > 1 && (
                <div className="hidden lg:flex bg-gray-50 dark:bg-gray-900 px-6 py-4 items-center justify-between border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Affichage{' '}
                    <span className="font-medium">{page * limit + 1}</span>-
                    <span className="font-medium">
                      {Math.min((page + 1) * limit, total)}
                    </span>{' '}
                    sur <span className="font-medium">{total}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal de confirmation de suppression */}
        <Modal
          isOpen={!!deleteModal}
          onClose={() => setDeleteModal(null)}
          onConfirm={handleDeleteConfirm}
          title="Supprimer le produit"
          description={`Êtes-vous sûr de vouloir supprimer le produit "${deleteModal?.name}" ? Cette action est irréversible.`}
          confirmText="Supprimer"
          cancelText="Annuler"
          variant="danger"
          loading={deleteProductMutation.isPending}
        />

        {/* Modal de duplication */}
        <Modal
          isOpen={!!duplicateModal}
          onClose={() => setDuplicateModal(null)}
          onConfirm={handleDuplicateConfirm}
          title="Dupliquer le produit"
          confirmText="Dupliquer"
          cancelText="Annuler"
          loading={duplicateProductMutation.isPending}
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Une copie du produit "{duplicateModal?.name}" sera créée.
            </p>
            <Input
              label="Nom du nouveau produit"
              value={duplicateModal?.newName || ''}
              onChange={(e) =>
                setDuplicateModal(
                  duplicateModal ? { ...duplicateModal, newName: e.target.value } : null
                )
              }
              placeholder="Nom du produit"
            />
          </div>
        </Modal>

        {/* Modal d'import CSV */}
        <ImportProductsModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImport={async (data) => {
            const result = await importProductsMutation.mutateAsync(data)
            if (result.success && result.data) {
              const { summary } = result.data
              if (summary.created_count > 0 || summary.updated_count > 0) {
                toast.success(
                  `Import terminé : ${summary.created_count} créé(s), ${summary.updated_count} mis à jour`
                )
              }
              return result.data
            }
            throw new Error(result.error || 'Erreur lors de l\'import')
          }}
          loading={importProductsMutation.isPending}
        />

        {/* ToastContainer */}
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} position="top-right" />
      </div>
    </Layout>
  )
}
