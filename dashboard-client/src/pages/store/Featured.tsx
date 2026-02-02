/**
 * Page de gestion des produits mis en avant
 *
 * Fonctionnalités :
 * - Liste des produits vedettes affichés en homepage
 * - Réorganisation par drag & drop pour modifier l'ordre d'affichage
 * - Ajout/retrait de produits avec recherche
 * - Badge statut stock (en stock, faible, rupture)
 */

import { useState, useCallback, useMemo } from 'react'
import { Layout } from '../../components/Layout'
import {
  useFeaturedProducts,
  useAvailableProducts,
  useAddFeaturedProduct,
  useRemoveFeaturedProduct,
  useReorderFeaturedProducts,
} from '../../hooks/useFeatured'
import { Badge, Button, Breadcrumbs, SkeletonTable, Modal, BackendImage, PageNotice } from '../../components/common'
import { ecommerceNotices } from '@/lib/notices'
import { useToast } from '../../hooks/useToast'
import { ToastContainer } from '../../components/common/Toast'
import { logger } from '@quelyos/logger';

interface FeaturedProduct {
  id: number
  name: string
  price: number
  image: string | null
  sequence: number
  qty_available: number
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock'
  category: { id: number; name: string } | null
}

interface AvailableProduct {
  id: number
  name: string
  price: number
  image: string | null
  default_code: string
  category: { id: number; name: string } | null
}

export default function Featured() {
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [draggedId, setDraggedId] = useState<number | null>(null)

  const { data, isLoading, error } = useFeaturedProducts({ limit: 50 })
  const {
    data: availableData,
    isLoading: availableLoading,
  } = useAvailableProducts({ limit: 50, search: search || undefined })

  const addMutation = useAddFeaturedProduct()
  const removeMutation = useRemoveFeaturedProduct()
  const reorderMutation = useReorderFeaturedProducts()
  const toast = useToast()

  const featuredProducts = useMemo(() => (data?.data?.products || []) as FeaturedProduct[], [data])
  const availableProducts = (availableData?.data?.products || []) as AvailableProduct[]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  const handleAddProduct = async (productId: number) => {
    try {
      await addMutation.mutateAsync(productId)
      toast.success('Produit ajoute aux vedettes')
    } catch {
      logger.error("Erreur attrapée");
      toast.error("Erreur lors de l'ajout du produit")
    }
  }

  const handleRemoveProduct = async (productId: number) => {
    try {
      await removeMutation.mutateAsync(productId)
      toast.success('Produit retire des vedettes')
    } catch {
      logger.error("Erreur attrapée");
      toast.error('Erreur lors du retrait du produit')
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, productId: number) => {
    setDraggedId(productId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', productId.toString())
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetId: number) => {
      e.preventDefault()

      if (draggedId === null || draggedId === targetId) {
        setDraggedId(null)
        return
      }

      const currentOrder = featuredProducts.map((p) => p.id)
      const draggedIndex = currentOrder.indexOf(draggedId)
      const targetIndex = currentOrder.indexOf(targetId)

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedId(null)
        return
      }

      // Remove dragged item and insert at new position
      const newOrder = [...currentOrder]
      newOrder.splice(draggedIndex, 1)
      newOrder.splice(targetIndex, 0, draggedId)

      setDraggedId(null)

      try {
        await reorderMutation.mutateAsync(newOrder)
        toast.success('Ordre mis a jour')
      } catch {
      logger.error("Erreur attrapée");
        toast.error("Erreur lors de la mise a jour de l'ordre")
      }
    },
    [draggedId, featuredProducts, reorderMutation, toast]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
  }, [])

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

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Produits mis en avant' },
          ]}
        />

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Produits mis en avant
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gerer les produits affiches en page d'accueil ({featuredProducts.length} produit
              {featuredProducts.length > 1 ? 's' : ''})
            </p>
          </div>
          <Button variant="primary" onClick={() => setAddModalOpen(true)}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Ajouter un produit
          </Button>
        </div>

        <PageNotice config={ecommerceNotices.featured} className="mb-6" />

        {/* Info drag & drop */}
        {featuredProducts.length > 1 && (
          <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
            Glissez-deposez les produits pour modifier leur ordre d'affichage
          </div>
        )}

        {/* Liste des produits vedettes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <SkeletonTable rows={5} columns={5} />
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6" role="alert">
              <p className="text-red-800 dark:text-red-200 mb-4">
                Erreur lors du chargement des produits vedettes
              </p>
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, product.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, product.id)}
                  onDragEnd={handleDragEnd}
                  className={`p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-move ${
                    draggedId === product.id ? 'opacity-50 bg-indigo-50 dark:bg-indigo-900/20' : ''
                  }`}
                >
                  {/* Drag handle */}
                  <div className="text-gray-400 dark:text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8h16M4 16h16"
                      />
                    </svg>
                  </div>

                  {/* Sequence badge */}
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    {product.sequence}
                  </div>

                  {/* Image */}
                  <BackendImage
                    src={product.image}
                    alt={product.name}
                    className="w-16 h-16 rounded-lg object-cover"
                    fallback={
                      <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    }
                  />

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {product.category?.name || 'Sans categorie'}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatPrice(product.price)}
                  </div>

                  {/* Stock status */}
                  <div>{getStockBadge(product.stock_status, product.qty_available)}</div>

                  {/* Actions */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveProduct(product.id)}
                    disabled={removeMutation.isPending}
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Aucun produit vedette
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Ajoutez des produits pour les mettre en avant sur la page d'accueil
              </p>
              <Button variant="primary" onClick={() => setAddModalOpen(true)}>
                Ajouter un produit
              </Button>
            </div>
          )}
        </div>

        {/* Modal d'ajout */}
        <Modal
          isOpen={addModalOpen}
          onClose={() => {
            setAddModalOpen(false)
            setSearch('')
            setSearchInput('')
          }}
          title="Ajouter un produit vedette"
          hideDefaultActions={true}
        >
          <div className="min-w-[500px]">
            {/* Recherche */}
            <form onSubmit={handleSearch} className="mb-4 flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Rechercher un produit..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
              <Button type="submit" variant="primary">
                Rechercher
              </Button>
            </form>

            {/* Liste des produits disponibles */}
            <div className="max-h-[400px] overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              {availableLoading ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Chargement...
                </div>
              ) : availableProducts.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {availableProducts.map((product) => (
                    <div
                      key={product.id}
                      className="p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <BackendImage
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 rounded object-cover"
                        fallback={
                          <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {product.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {product.default_code && (
                            <span className="font-mono mr-2">{product.default_code}</span>
                          )}
                          {product.category?.name || 'Sans categorie'}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatPrice(product.price)}
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAddProduct(product.id)}
                        loading={addMutation.isPending}
                      >
                        Ajouter
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  {search
                    ? 'Aucun produit trouve pour cette recherche'
                    : 'Tous les produits sont deja en vedette'}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setAddModalOpen(false)
                  setSearch('')
                  setSearchInput('')
                }}
              >
                Fermer
              </Button>
            </div>
          </div>
        </Modal>

        {/* ToastContainer */}
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} position="top-right" />
      </div>
    </Layout>
  )
}
