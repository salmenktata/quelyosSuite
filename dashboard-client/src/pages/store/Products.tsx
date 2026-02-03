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
  PageNotice,
  type SearchSuggestion,
  type Attribute,
} from '../../components/common'
import { ProductFilters, ProductBulkActions, ProductTableRow } from '@/components/store/products'
import { ecommerceNotices } from '@/lib/notices'
import { useToast } from '../../hooks/useToast'
import { ToastContainer } from '../../components/common/Toast'
import { api } from '../../lib/api'
import { logger } from '@quelyos/logger'
import type { ProductsQueryParams, Product, Category } from '@quelyos/types'

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
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const limit = 20

  const toast = useToast()
  const navigate = useNavigate()

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
    attributevalue_ids: selectedAttributeValues.length > 0 ? selectedAttributeValues : undefined,
  }

  const { data: attributesData, isLoading: attributesLoading } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => api.getAllAttributes(),
  })

  const attributes: Attribute[] = useMemo(() => {
    if (!attributesData?.data?.attributes) return []
    return attributesData.data.attributes.filter((attr: Attribute) => attr.values.length > 0)
  }, [attributesData])

  const { data: productsData, isLoading, error } = useProducts(queryParams)
  const { data: categoriesData } = useCategories()
  const deleteProductMutation = useDeleteProduct()
  const duplicateProductMutation = useDuplicateProduct()
  const exportProductsMutation = useExportProducts()
  const importProductsMutation = useImportProducts()
  const archiveProductMutation = useArchiveProduct()

  const productsResponse = productsData as unknown as { data?: { products?: Product[]; total?: number }; products?: Product[]; total?: number }
  const products = useMemo(() => (productsResponse?.data?.products || productsResponse?.products || []) as Product[], [productsResponse])
  const total = (productsResponse?.data?.total || productsResponse?.total || 0) as number
  const totalPages = Math.ceil(total / limit)

  const categoriesResponse = categoriesData as unknown as { data?: { categories?: Category[] }; categories?: Category[] }
  const categories = useMemo(() => (categoriesResponse?.data?.categories || categoriesResponse?.categories || []) as Category[], [categoriesResponse])

  const hasActiveFilters = categoryFilter || stockStatusFilter || searchQuery || priceMin || priceMax || selectedAttributeValues.length > 0

  // Suggestions autocomplétion
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
      } catch (err) {
        logger.error('Error fetching suggestions:', err)
        return []
      }
    },
    []
  )

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setSearchInput(query)
    setPage(0)
  }, [])

  const handleSelectSuggestion = useCallback(
    (item: SearchSuggestion<Product>) => {
      navigate(`/products/${item.id}/edit`)
    },
    [navigate]
  )

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
    if (sortBy !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-indigo-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-indigo-600" />
    )
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal) return
    try {
      await deleteProductMutation.mutateAsync(deleteModal.id)
      toast.success(`Le produit "${deleteModal.name}" a été supprimé avec succès`)
      setDeleteModal(null)
    } catch {
      toast.error(`Erreur lors de la suppression du produit`)
    }
  }

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

  const handleExport = async () => {
    try {
      const result = await exportProductsMutation.mutateAsync({
        category_id: categoryFilter,
        search: searchQuery || undefined,
      })
      if (!result.success || !result.data) throw new Error('Export failed')
      const { products: exportData, columns } = result.data
      const headers = columns.map((c: { label: string; key: string }) => c.label).join(';')
      const rows = exportData.map((p: Record<string, unknown>) =>
        columns.map((c: { label: string; key: string }) => {
          const value = p[c.key as keyof typeof p]
          const str = String(value ?? '')
          return str.includes(';') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
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
      toast.error(`Erreur lors de l'export des produits`)
    }
  }

  const getStockBadge = useCallback((status: string, qty: number) => {
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
  }, [])

  const resetFilters = useCallback(() => {
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
  }, [])

  // Bulk selection
  const isAllSelected = useMemo(() => {
    return products.length > 0 && products.every((p: Product) => selectedProductIds.has(p.id))
  }, [products, selectedProductIds])

  const isSomeSelected = useMemo(() => {
    return products.some((p: Product) => selectedProductIds.has(p.id))
  }, [products, selectedProductIds])

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedProductIds(new Set())
    } else {
      setSelectedProductIds(new Set(products.map((p: Product) => p.id)))
    }
  }, [isAllSelected, products])

  const toggleSelectProduct = useCallback((productId: number) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
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
      if (modifier && e.key === 'n' && !e.shiftKey) {
        e.preventDefault()
        navigate('/products/create')
      }
      if (modifier && e.shiftKey && e.key === 'r') {
        e.preventDefault()
        resetFilters()
        toast.success('Filtres réinitialisés')
      }
      if (e.key === 'Escape') {
        if (deleteModal) setDeleteModal(null)
        else if (duplicateModal) setDuplicateModal(null)
        else if (importModalOpen) setImportModalOpen(false)
        else if (selectedProductIds.size > 0) clearSelection()
      }
      if (modifier && e.key === 'a' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        if (products.length > 0) setSelectedProductIds(new Set(products.map((p: Product) => p.id)))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, deleteModal, duplicateModal, importModalOpen, selectedProductIds.size, products, clearSelection, resetFilters, toast])

  // Bulk actions
  const handleBulkArchive = async (archive: boolean) => {
    if (selectedProductIds.size === 0) return
    setBulkActionLoading(true)
    try {
      await Promise.all(Array.from(selectedProductIds).map((id) => archiveProductMutation.mutateAsync({ id, archive })))
      toast.success(archive ? `${selectedProductIds.size} produit(s) archivé(s)` : `${selectedProductIds.size} produit(s) désarchivé(s)`)
      clearSelection()
    } catch {
      toast.error(`Erreur lors de l'archivage en masse`)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedProductIds.size === 0) return
    if (!confirm(`Supprimer ${selectedProductIds.size} produit(s) ? Cette action est irréversible.`)) return
    setBulkActionLoading(true)
    try {
      await Promise.all(Array.from(selectedProductIds).map((id) => deleteProductMutation.mutateAsync(id)))
      toast.success(`${selectedProductIds.size} produit(s) supprimé(s)`)
      clearSelection()
    } catch {
      toast.error('Erreur lors de la suppression en masse')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleDuplicate = useCallback((product: Product) => {
    setDuplicateModal({ id: product.id, name: product.name, newName: `${product.name} (copie)` })
  }, [])

  const handleArchive = useCallback(async (product: Product) => {
    try {
      const isArchived = product.active === false
      await archiveProductMutation.mutateAsync({ id: product.id, archive: !isArchived })
      toast.success(isArchived ? `"${product.name}" a été désarchivé` : `"${product.name}" a été archivé`)
    } catch {
      toast.error(`Erreur lors de l'archivage du produit`)
    }
  }, [archiveProductMutation, toast])

  const handleDelete = useCallback((product: Product) => {
    setDeleteModal({ id: product.id, name: product.name })
  }, [])

  return (
    <Layout>
      <div className="p-8">
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
            <Button variant="secondary" onClick={() => setImportModalOpen(true)} icon={<Upload className="w-5 h-5" />}>
              Importer CSV
            </Button>
            <Button variant="secondary" onClick={handleExport} loading={exportProductsMutation.isPending} icon={<Download className="w-5 h-5" />}>
              Exporter CSV
            </Button>
            <Link to="/store/products/create">
              <Button variant="primary" icon={<Plus className="w-5 h-5" />}>Nouveau produit</Button>
            </Link>
          </div>
        </div>

        <PageNotice config={ecommerceNotices.products} className="mb-6" />

        {/* Filtres */}
        <ProductFilters
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          handleSearch={handleSearch}
          handleSelectSuggestion={handleSelectSuggestion}
          fetchProductSuggestions={fetchProductSuggestions}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          categories={categories}
          stockStatusFilter={stockStatusFilter}
          setStockStatusFilter={setStockStatusFilter}
          priceMin={priceMin}
          setPriceMin={setPriceMin}
          priceMax={priceMax}
          setPriceMax={setPriceMax}
          includeArchived={includeArchived}
          setIncludeArchived={setIncludeArchived}
          showAttributeFilters={showAttributeFilters}
          setShowAttributeFilters={setShowAttributeFilters}
          attributes={attributes}
          attributesLoading={attributesLoading}
          selectedAttributeValues={selectedAttributeValues}
          setSelectedAttributeValues={setSelectedAttributeValues}
          searchQuery={searchQuery}
          setPage={setPage}
          resetFilters={resetFilters}
        />

        {/* Actions en masse */}
        <ProductBulkActions
          selectedCount={selectedProductIds.size}
          bulkActionLoading={bulkActionLoading}
          onArchive={handleBulkArchive}
          onDelete={handleBulkDelete}
          onClearSelection={clearSelection}
        />

        {/* Tableau */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <SkeletonTable rows={5} columns={6} />
          ) : error ? (
            <div className="p-8 text-center" role="alert">
              <p className="text-red-600 dark:text-red-400 mb-2">Erreur lors du chargement des produits</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{error instanceof Error ? error.message : 'Erreur inconnue'}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Aucun produit</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {hasActiveFilters ? 'Aucun produit ne correspond à vos critères' : 'Commencez par créer votre premier produit'}
              </p>
              {hasActiveFilters ? (
                <Button variant="secondary" onClick={resetFilters}>Réinitialiser les filtres</Button>
              ) : (
                <Link to="/store/products/create"><Button variant="primary">Créer un produit</Button></Link>
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
                      <input
                        type="checkbox"
                        checked={selectedProductIds.has(product.id)}
                        onChange={() => toggleSelectProduct(product.id)}
                        className="w-4 h-4 mt-1 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer shrink-0"
                        aria-label={`Sélectionner ${product.name}`}
                      />
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-sm font-medium truncate ${product.active === false ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                            {product.name}
                          </h3>
                          {product.active === false && <Badge variant="neutral">Archivé</Badge>}
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
                          {product.category && <Badge variant="info">{typeof product.category === 'string' ? product.category : product.category.name}</Badge>}
                          {product.variant_count && product.variant_count > 1 && <Badge variant="neutral">{product.variant_count} variantes</Badge>}
                        </div>
                      </div>
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
                          ref={(el) => { if (el) el.indeterminate = isSomeSelected && !isAllSelected }}
                        />
                      </th>
                      {(['name', 'default_code', null, 'price', 'qty_available'] as const).map((field, i) => (
                        <th key={i} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {field ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSort(field)}
                              className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 !p-0 !text-xs uppercase"
                              aria-label={`Trier par ${field === 'name' ? 'produit' : field === 'default_code' ? 'SKU' : field === 'price' ? 'prix' : 'stock'}`}
                            >
                              {field === 'name' ? 'Produit' : field === 'default_code' ? 'SKU' : field === 'price' ? 'Prix' : 'Stock'}
                              <SortIcon field={field} />
                            </Button>
                          ) : 'Catégorie'}
                        </th>
                      ))}
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {products.map((product) => (
                      <ProductTableRow
                        key={product.id}
                        product={product}
                        isSelected={selectedProductIds.has(product.id)}
                        onToggleSelect={toggleSelectProduct}
                        onDuplicate={handleDuplicate}
                        onArchive={handleArchive}
                        onDelete={handleDelete}
                        archiveLoading={archiveProductMutation.isPending}
                        deleteLoading={deleteProductMutation.isPending}
                        getStockBadge={getStockBadge}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <>
                  <div className="block lg:hidden bg-gray-50 dark:bg-gray-900 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-700 dark:text-gray-300 text-center mb-2">
                      {page * limit + 1}-{Math.min((page + 1) * limit, total)} sur {total}
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button variant="secondary" size="sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>Précédent</Button>
                      <Button variant="secondary" size="sm" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}>Suivant</Button>
                    </div>
                  </div>
                  <div className="hidden lg:flex bg-gray-50 dark:bg-gray-900 px-6 py-4 items-center justify-between border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Affichage <span className="font-medium">{page * limit + 1}</span>-<span className="font-medium">{Math.min((page + 1) * limit, total)}</span> sur <span className="font-medium">{total}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>Précédent</Button>
                      <Button variant="secondary" size="sm" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}>Suivant</Button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Modals */}
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
              {`Une copie du produit "${duplicateModal?.name}" sera créée.`}
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

        <ImportProductsModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImport={async (data) => {
            const result = await importProductsMutation.mutateAsync(data)
            if (result.success && result.data) {
              const { summary } = result.data
              if (summary.created_count > 0 || summary.updated_count > 0) {
                toast.success(`Import terminé : ${summary.created_count} créé(s), ${summary.updated_count} mis à jour`)
              }
              return result.data
            }
            throw new Error(result.error || `Erreur lors de l'import`)
          }}
          loading={importProductsMutation.isPending}
        />

        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} position="top-right" />
      </div>
    </Layout>
  )
}
