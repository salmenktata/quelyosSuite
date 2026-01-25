/**
 * Page de comparaison de produits
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useComparisonStore } from '@/store/comparisonStore';
import { useCartStore } from '@/store/cartStore';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { Button } from '@/components/common/Button';
import { formatPrice } from '@/lib/utils/formatting';

export default function ComparePage() {
  const router = useRouter();
  const { products, removeProduct, clearComparison } = useComparisonStore();
  const { addToCart } = useCartStore();
  const { data: siteConfig, isLoading } = useSiteConfig();

  // Rediriger si la comparaison est désactivée
  useEffect(() => {
    if (!isLoading && siteConfig && !siteConfig.compare_enabled) {
      router.push('/products');
    }
  }, [siteConfig, isLoading, router]);

  // Rediriger si aucun produit
  useEffect(() => {
    if (products.length === 0) {
      router.push('/products');
    }
  }, [products.length, router]);

  if (products.length === 0) {
    return null;
  }

  const handleAddToCart = async (productId: number) => {
    await addToCart(productId, 1);
  };

  // Extraire les attributs communs pour la comparaison
  const attributes = [
    { key: 'category', label: 'Catégorie', getValue: (p: typeof products[0]) => p.category?.name || '-' },
    { key: 'price', label: 'Prix', getValue: (p: typeof products[0]) => formatPrice(p.list_price, p.currency?.symbol || 'TND') },
    { key: 'stock', label: 'Disponibilité', getValue: (p: typeof products[0]) => p.in_stock ? 'En stock' : 'Rupture' },
    { key: 'rating', label: 'Note', getValue: (p: typeof products[0]) => p.avg_rating ? p.avg_rating.toFixed(1) + ' ⭐' : '-' },
    { key: 'reviews', label: 'Nombre d\'avis', getValue: (p: typeof products[0]) => p.review_count?.toString() || '0' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="text-sm mb-6 text-gray-600">
          <Link href="/" className="hover:text-primary">Accueil</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Comparaison de produits</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Comparaison
            <span className="ml-3 text-xl text-gray-500">({products.length} produits)</span>
          </h1>

          <div className="flex items-center gap-3">
            <button
              onClick={clearComparison}
              className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
            >
              Tout effacer
            </button>
            <Link href="/products">
              <Button variant="outline">
                ← Ajouter des produits
              </Button>
            </Link>
          </div>
        </div>

        {/* Tableau de comparaison */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="p-4 text-left font-bold text-gray-700 w-48 sticky left-0 bg-gray-50 z-10">
                    Caractéristique
                  </th>
                  {products.map((product) => (
                    <th key={product.id} className="p-4 min-w-[250px]">
                      <div className="flex flex-col items-center">
                        {/* Image */}
                        <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden mb-4">
                          {product.images && product.images[0] ? (
                            <Image
                              src={product.images[0].url}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="128px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Nom */}
                        <Link href={`/products/${product.slug}`}>
                          <h3 className="font-bold text-gray-900 text-center hover:text-primary transition-colors mb-2">
                            {product.name}
                          </h3>
                        </Link>

                        {/* Bouton retirer */}
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="text-xs text-red-600 hover:text-red-800 transition-colors"
                        >
                          Retirer
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* Lignes d'attributs */}
                {attributes.map((attr, idx) => (
                  <tr key={attr.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-4 font-semibold text-gray-700 sticky left-0 bg-inherit border-r border-gray-200 z-10">
                      {attr.label}
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center text-gray-900">
                        {attr.getValue(product)}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Description */}
                <tr className="bg-white">
                  <td className="p-4 font-semibold text-gray-700 sticky left-0 bg-white border-r border-gray-200 z-10">
                    Description
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="p-4 text-sm text-gray-600">
                      {product.description ? (
                        <p className="line-clamp-3">{product.description}</p>
                      ) : (
                        <p className="text-gray-400 italic">Aucune description</p>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Actions */}
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td className="p-4 sticky left-0 bg-gray-50 z-10"></td>
                  {products.map((product) => (
                    <td key={product.id} className="p-4">
                      <div className="flex flex-col gap-2">
                        {product.in_stock ? (
                          <Button
                            variant="primary"
                            size="md"
                            fullWidth
                            onClick={() => handleAddToCart(product.id)}
                          >
                            Ajouter au panier
                          </Button>
                        ) : (
                          <Button variant="outline" size="md" fullWidth disabled>
                            Rupture de stock
                          </Button>
                        )}

                        <Link href={`/products/${product.slug}`} className="w-full">
                          <Button variant="outline" size="sm" fullWidth>
                            Voir détails
                          </Button>
                        </Link>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Aide */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-bold text-blue-900 mb-2">Conseil</h3>
              <p className="text-sm text-blue-800">
                Vous pouvez comparer jusqu\'à 4 produits simultanément. Ajoutez des produits depuis les pages produits en cliquant sur l\'icône de comparaison.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
