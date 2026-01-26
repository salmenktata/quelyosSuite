import { useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { useProduct } from '../../hooks/useProducts'
import { useProductImages } from '../../hooks/useProductImages'
import { Button, Breadcrumbs, Skeleton, Badge } from '../../components/common'
import type { ProductImage } from '@/types'
import {
  PencilIcon,
  TagIcon,
  CubeIcon,
  ScaleIcon,
  ChartBarIcon,
  ArrowTopRightOnSquareIcon,
  ArchiveBoxIcon,
  DocumentDuplicateIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline'

export default function ProductDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const productId = Number(id)

  const { data: productData, isLoading } = useProduct(productId)
  const { data: imagesData } = useProductImages(productId)

  const product = productData?.data?.product
  const images = imagesData || []

  const handleEdit = () => {
    navigate(`/products/${id}/edit`)
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-96" />
              <Skeleton className="h-64" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!product) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center py-12">
            <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              Produit non trouvé
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Le produit avec l'ID {id} n'existe pas.
            </p>
            <div className="mt-6">
              <Button onClick={() => navigate('/products')}>
                Retour aux produits
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const stockStatusColors = {
    in_stock: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    low_stock: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    out_of_stock: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  }

  const stockStatusLabels = {
    in_stock: 'En stock',
    low_stock: 'Stock faible',
    out_of_stock: 'Rupture',
  }

  const productTypeLabels = {
    consu: 'Consommable',
    service: 'Service',
    product: 'Stockable',
  }

  return (
    <Layout>
      <div className="p-6">
        {/* En-tête */}
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: 'Produits', href: '/products' },
              { label: product.name, href: `/products/${id}` },
            ]}
          />
          <div className="mt-4 flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {product.name}
                </h1>
                {product.ribbon && (
                  <span
                    className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full"
                    style={{
                      backgroundColor: product.ribbon.bg_color,
                      color: product.ribbon.text_color,
                    }}
                  >
                    {product.ribbon.name}
                  </span>
                )}
                {!product.active && (
                  <Badge variant="neutral">Archivé</Badge>
                )}
              </div>
              {product.default_code && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Référence : {product.default_code}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => window.open(`/products/${product.slug}`, '_blank')}
                icon={<ArrowTopRightOnSquareIcon className="h-4 w-4" />}
              >
                Voir sur le site
              </Button>
              <Button
                onClick={handleEdit}
                icon={<PencilIcon className="h-4 w-4" />}
              >
                Éditer
              </Button>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <PhotoIcon className="h-5 w-5" />
                  Images
                </h2>
                {images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image: ProductImage) => (
                      <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <img
                          src={image.url}
                          alt={image.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : product.image ? (
                  <div className="relative aspect-square max-w-md rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <PhotoIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Informations générales */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <TagIcon className="h-5 w-5" />
                  Informations générales
                </h2>
                <dl className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Prix de vente</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {(product.price ?? 0).toFixed(2)} €
                      </dd>
                    </div>
                    {product.standard_price !== undefined && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Coût</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {product.standard_price.toFixed(2)} €
                        </dd>
                      </div>
                    )}
                  </div>

                  {product.category && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Catégorie</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {product.category.name}
                      </dd>
                    </div>
                  )}

                  {product.barcode && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Code-barres</dt>
                      <dd className="mt-1 text-sm font-mono text-gray-900 dark:text-gray-100">
                        {product.barcode}
                      </dd>
                    </div>
                  )}

                  {product.detailed_type && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Type de produit</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {productTypeLabels[product.detailed_type] || product.detailed_type}
                      </dd>
                    </div>
                  )}

                  {product.uom_name && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Unité de mesure</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {product.uom_name}
                      </dd>
                    </div>
                  )}

                  {product.description && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                        {product.description}
                      </dd>
                    </div>
                  )}

                  {product.description_purchase && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description d'achat</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                        {product.description_purchase}
                      </dd>
                    </div>
                  )}

                  {product.product_tag_ids && product.product_tag_ids.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Tags</dt>
                      <dd className="flex flex-wrap gap-2">
                        {product.product_tag_ids.map((tag) => (
                          <Badge key={tag.id} variant="neutral">
                            {tag.name}
                          </Badge>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Dimensions et poids */}
            {(product.weight || product.volume || product.product_length || product.product_width || product.product_height) && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <ScaleIcon className="h-5 w-5" />
                    Dimensions et poids
                  </h2>
                  <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {product.weight && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Poids</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {product.weight} kg
                        </dd>
                      </div>
                    )}
                    {product.volume && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Volume</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {product.volume} m³
                        </dd>
                      </div>
                    )}
                    {product.product_length && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Longueur</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {product.product_length} m
                        </dd>
                      </div>
                    )}
                    {product.product_width && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Largeur</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {product.product_width} m
                        </dd>
                      </div>
                    )}
                    {product.product_height && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Hauteur</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {product.product_height} m
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Stock */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <CubeIcon className="h-5 w-5" />
                  Stock
                </h2>
                <div className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Quantité disponible</dt>
                    <dd className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {product.qty_available}
                    </dd>
                  </div>
                  {product.virtual_available !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Stock prévisionnel</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {product.virtual_available}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Statut</dt>
                    <dd>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${product.stock_status ? stockStatusColors[product.stock_status] : ''}`}
                      >
                        {product.stock_status ? stockStatusLabels[product.stock_status] : 'N/A'}
                      </span>
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Variantes */}
            {product.variant_count !== undefined && product.variant_count > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <ChartBarIcon className="h-5 w-5" />
                    Variantes
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ce produit possède {product.variant_count} variante{product.variant_count > 1 ? 's' : ''}.
                  </p>
                  <div className="mt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleEdit}
                      className="w-full"
                    >
                      Voir les variantes
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Taxes */}
            {product.taxes && product.taxes.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Taxes
                  </h2>
                  <ul className="space-y-2">
                    {product.taxes.map((tax: any) => (
                      <li key={tax.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-900 dark:text-gray-100">{tax.name}</span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {tax.amount_type === 'percent' ? `${tax.amount}%` : `${tax.amount} €`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Actions rapides */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Actions rapides
                </h2>
                <div className="space-y-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-start"
                    icon={<DocumentDuplicateIcon className="h-4 w-4" />}
                    onClick={() => {
                      // TODO: Implémenter la duplication
                      alert('Fonctionnalité à venir')
                    }}
                  >
                    Dupliquer le produit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-start"
                    icon={<ArchiveBoxIcon className="h-4 w-4" />}
                    onClick={() => {
                      // TODO: Implémenter l'archivage
                      alert('Fonctionnalité à venir')
                    }}
                  >
                    {product.active ? 'Archiver' : 'Désarchiver'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Métadonnées */}
            {product.create_date && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Métadonnées
                  </h2>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Créé le</dt>
                      <dd className="text-gray-900 dark:text-gray-100">
                        {new Date(product.create_date).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">ID Système</dt>
                      <dd className="text-gray-900 dark:text-gray-100 font-mono">
                        #{product.id}
                      </dd>
                    </div>
                    {product.slug && (
                      <div>
                        <dt className="text-gray-500 dark:text-gray-400">Slug</dt>
                        <dd className="text-gray-900 dark:text-gray-100 font-mono text-xs break-all">
                          {product.slug}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
