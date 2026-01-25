/**
 * Page détail produit - Design style lesportif.com.tn
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { odooClient } from '@/lib/odoo/client';
import type { Product } from '@quelyos/types';
import { formatPrice } from '@/lib/utils/formatting';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/store/toastStore';
import { Button } from '@/components/common/Button';
import { ProductDetailSkeleton } from '@/components/common/Skeleton';
import { ProductImageGallery } from '@/components/product/ProductImageGallery';
import { ProductGrid } from '@/components/product/ProductGrid';
import ProductCard from '@/components/product/ProductCard';
import { generateProductSchema, generateBreadcrumbSchema } from '@/lib/utils/seo';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useProductVariants } from '@/hooks/useProductVariants';
import { VariantSelector } from '@/components/product/VariantSelector';
import { ViewersCount } from '@/components/product/ViewersCount';
import { CountdownTimer } from '@/components/product/CountdownTimer';
import { BundleSuggestions } from '@/components/product/BundleSuggestions';
import { logger } from '@/lib/logger';
import { sanitizeHtml } from '@/lib/utils/sanitize';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'shipping'>('description');
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [hoveredImageUrl, setHoveredImageUrl] = useState<string>(''); // Image au survol des couleurs

  const { addToCart, isLoading: isAddingToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const toast = useToast();

  // Hook custom pour gérer les variantes (fetch, sélection, synchronisation)
  const {
    variantsData,
    selectedVariant,
    selectedVariantId,
    isLoadingVariants,
    displayPrice,
    displayStock,
    displayStockQty,
    displayImages,
    handleVariantChange,
  } = useProductVariants(product);

  // Track recently viewed products
  useRecentlyViewed({ product });

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    setIsLoading(true);
    try {
      const response = await odooClient.getProductBySlug(slug);
      if (response.success && response.product) {
        setProduct(response.product);

        // Charger les produits similaires
        fetchRelatedProducts(response.product.id);
      } else {
        router.push('/products');
      }
    } catch (error) {
      logger.error('Erreur chargement produit:', error);
      router.push('/products');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRelatedProducts = async (productId: number) => {
    try {
      const response = await odooClient.getUpsellProducts(productId);
      if (response.success && response.products) {
        setRelatedProducts(response.products);
      }
    } catch (error: any) {
      // Ignorer silencieusement si endpoint pas encore implémenté (404)
      if (error?.response?.status !== 404) {
        logger.error('Erreur chargement produits similaires:', error);
      }
    }
  };

  const handleAddToCart = useCallback(async () => {
    if (!product) return;

    const productId = selectedVariantId || product.id;
    const success = await addToCart(productId, quantity);

    if (success) {
      toast.success('Produit ajouté au panier !');
    }
  }, [product, selectedVariantId, quantity, addToCart, toast]);

  // Early returns (garder les mêmes hooks conditionnels que l'original)
  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return null;
  }

  // Calculs après validation product (comme dans l'original)
  // Image affichée : priorité au survol > variante sélectionnée > produit
  const baseImage = displayImages?.find(img => img.is_main)?.url || displayImages?.[0]?.url || '/placeholder-product.svg';
  const mainImage = hoveredImageUrl || baseImage;

  // Les miniatures ne changent pas au survol, seule l'image principale change
  const galleryImages = displayImages || [];

  const hasDiscount = product.is_featured;
  const discountPercent = hasDiscount ? 20 : 0;
  const originalPrice = hasDiscount ? displayPrice * 1.25 : displayPrice;

  // Structured data
  const productSchema = generateProductSchema({
    name: product.name,
    description: product.description || '',
    image: mainImage,
    price: displayPrice,
    currency: product.currency?.name ?? 'TND',
    availability: displayStock ? 'InStock' : 'OutOfStock',
    sku: product.id.toString(),
    url: `/products/${product.slug}`,
  });

  const breadcrumbItems = [
    { name: 'Accueil', url: '/' },
    { name: 'Produits', url: '/products' },
  ];
  if (product.category) {
    breadcrumbItems.push({ name: product.category.name, url: `/products?category_id=${product.category.id}` });
  }
  breadcrumbItems.push({ name: product.name, url: `/products/${product.slug}` });
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 max-w-7xl py-8">
        {/* Breadcrumb */}
        <nav className="text-sm mb-6">
          <Link href="/" className="text-gray-600 hover:text-primary transition-colors">
            Accueil
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href="/products" className="text-gray-600 hover:text-primary transition-colors">
            Produits
          </Link>
          {product.category && (
            <>
              <span className="mx-2 text-gray-400">/</span>
              <Link
                href={`/products?category_id=${product.category.id}`}
                className="text-gray-600 hover:text-primary transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Images produit - Galerie avancée avec swipe et zoom */}
          <div className="relative">
            {/* Badges sur l'image */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-20 pointer-events-none">
              {hasDiscount && (
                <div className="bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-md shadow-lg">
                  -{discountPercent}%
                </div>
              )}
              {/* Badge/Ruban du produit (géré depuis le backoffice) */}
              {product.ribbon && (
                <div
                  className="text-sm font-bold px-3 py-1.5 rounded-md shadow-lg"
                  style={{
                    backgroundColor: product.ribbon.bg_color,
                    color: product.ribbon.text_color,
                  }}
                >
                  {product.ribbon.name}
                </div>
              )}
              {/* Fallback sur is_new si pas de ribbon */}
              {!product.ribbon && product.is_new && (
                <div className="bg-primary text-white text-sm font-bold px-3 py-1.5 rounded-md shadow-lg">
                  NOUVEAU
                </div>
              )}
            </div>
            <ProductImageGallery
              images={galleryImages}
              productName={product.name}
              previewImageUrl={hoveredImageUrl}
            />
          </div>

          {/* Informations produit */}
          <div>
            {/* Badges - Utilise le ribbon du backoffice si disponible */}
            <div className="flex gap-2 mb-4">
              {/* Badge/Ruban principal (géré depuis le backoffice) */}
              {product.ribbon && (
                <span
                  className="text-xs font-bold px-4 py-1.5 rounded-full shadow-md"
                  style={{
                    backgroundColor: product.ribbon.bg_color,
                    color: product.ribbon.text_color,
                  }}
                >
                  {product.ribbon.name}
                </span>
              )}
              {/* Fallback sur les champs booléens si pas de ribbon */}
              {!product.ribbon && product.is_new && (
                <span className="bg-gradient-to-r from-primary to-primary-light text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                  NOUVEAU
                </span>
              )}
              {!product.ribbon && product.is_bestseller && (
                <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                  TOP VENTE
                </span>
              )}
              {!product.ribbon && product.is_featured && (
                <span className="bg-gradient-to-r from-red-500 to-red-700 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                  PROMO
                </span>
              )}
            </div>

            {/* Catégorie */}
            {product.category && (
              <p className="text-sm text-secondary font-bold uppercase tracking-wide mb-2">
                {product.category.name}
              </p>
            )}

            {/* Titre */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">{product.name}</h1>

            {/* Viewers Count - Preuve sociale */}
            <ViewersCount productId={product.id} className="mb-4" />

            {/* SKU */}
            {product.default_code && (
              <div className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                </svg>
                Référence: {product.default_code}
              </div>
            )}

            {/* Prix */}
            <div className="flex flex-wrap items-baseline gap-3 mb-3 bg-gray-50 rounded-xl p-4">
              {hasDiscount && (
                <span className="text-xl text-gray-400 line-through">
                  {formatPrice(originalPrice, product.currency?.symbol ?? 'TND')}
                </span>
              )}
              <span className="text-4xl md:text-5xl font-bold text-primary transition-all duration-300">
                {formatPrice(displayPrice, product.currency?.symbol ?? 'TND')}
              </span>
              {hasDiscount && (
                <span className="bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-md">
                  -{discountPercent}%
                </span>
              )}
            </div>

            {/* Points de fidélité */}
            <div className="mb-6 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
              <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <div>
                <p className="text-sm font-bold text-gray-900">Gagnez {Math.floor(displayPrice)} points de fidélité</p>
                <p className="text-xs text-gray-600">À utiliser sur votre prochaine commande</p>
              </div>
            </div>

            {/* Countdown Timer - Offre limitée */}
            {product.offer_end_date && (
              <CountdownTimer
                endDate={product.offer_end_date}
                variant="full"
                className="mb-6"
              />
            )}

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Stock */}
            <div className="mb-6 bg-gray-50 rounded-xl p-4">
              {displayStock ? (
                <div className="flex items-center text-green-700">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-3"></div>
                  <span className="font-semibold text-lg">
                    En stock
                  </span>
                  <span className="ml-2 text-sm text-gray-600">
                    ({Math.floor(displayStockQty ?? 0)} disponibles)
                  </span>
                </div>
              ) : (
                <div className="flex items-center text-red-700">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <span className="font-semibold text-lg">Rupture de stock</span>
                </div>
              )}
            </div>

            {/* Sélecteur de variantes intelligent */}
            {variantsData?.variants && variantsData.variants.length > 1 && (
              <div className="mb-6">
                <VariantSelector
                  productId={product.id}
                  variantsData={variantsData}
                  selectedVariant={selectedVariant}
                  onVariantChange={handleVariantChange}
                  onImagePreview={(url) => setHoveredImageUrl(url)}
                />
              </div>
            )}

            {/* Quantité */}
            <div className="mb-6">
              <label className="block font-bold text-lg mb-3 text-gray-900">Quantité:</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-12 h-12 border-2 border-gray-300 rounded-xl text-gray-700 hover:border-primary hover:bg-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg transition-all duration-300"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 text-center border-2 border-gray-300 rounded-xl py-3 font-bold text-lg text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
                  min="1"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={!displayStock || quantity >= (displayStockQty ?? 0)}
                  className="w-12 h-12 border-2 border-gray-300 rounded-xl text-gray-700 hover:border-primary hover:bg-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg transition-all duration-300"
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mb-4">
              <button
                onClick={handleAddToCart}
                disabled={!displayStock || isAddingToCart}
                className="flex-1 bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                {isAddingToCart ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Ajout en cours...
                  </>
                ) : !displayStock ? (
                  'Rupture de stock'
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Ajouter au panier
                  </>
                )}
              </button>

              {isAuthenticated && (
                <button className="w-14 h-14 border-2 border-primary text-primary rounded-xl hover:bg-primary hover:text-white transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Contact WhatsApp */}
            <a
              href={`https://wa.me/21600000000?text=Bonjour, je suis intéressé par ${encodeURIComponent(product.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] text-white py-3 rounded-xl font-semibold text-base hover:bg-[#20BA5A] transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl mb-8"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Contacter sur WhatsApp
            </a>

            {/* Trust indicators + Payment methods */}
            <div className="mb-8 bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">Plus de 600 avis clients</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-2 font-semibold">Modes de paiement acceptés:</p>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700">💳 Carte bancaire</div>
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700">💵 Espèces</div>
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700">🏦 Virement</div>
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700">📱 Mobile money</div>
                </div>
              </div>
            </div>

            {/* Avantages / Garanties */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Garantie</p>
                    <p className="text-sm font-bold text-gray-900">2 ans</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Paiement</p>
                    <p className="text-sm font-bold text-gray-900">Sécurisé</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Livraison</p>
                    <p className="text-sm font-bold text-gray-900">2-5 jours</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Retour</p>
                    <p className="text-sm font-bold text-gray-900">14 jours</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistiques */}
            <div className="flex items-center gap-6 text-sm text-gray-500 border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <span className="font-medium">{product.view_count} vues</span>
              </div>
              {(product.wishlist_count ?? 0) > 0 && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{product.wishlist_count ?? 0} favoris</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs: Description, Specs, Shipping */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('description')}
              className={`flex-1 px-6 py-4 font-bold text-sm sm:text-base transition-all duration-300 ${
                activeTab === 'description'
                  ? 'bg-primary text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              📝 Description
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`flex-1 px-6 py-4 font-bold text-sm sm:text-base transition-all duration-300 border-l border-gray-200 ${
                activeTab === 'specs'
                  ? 'bg-primary text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              📋 Spécifications
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`flex-1 px-6 py-4 font-bold text-sm sm:text-base transition-all duration-300 border-l border-gray-200 ${
                activeTab === 'shipping'
                  ? 'bg-primary text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              🚚 Livraison & Retours
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'description' && (
              <div className="animate-fadeIn">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Description du produit
                </h3>
                {product.description ? (
                  <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                    <p>{product.description}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Aucune description disponible.</p>
                )}
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="animate-fadeIn">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Spécifications techniques
                </h3>
                {product.technical_description ? (
                  <div
                    className="prose prose-lg max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.technical_description) }}
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <span className="text-gray-600 font-medium">Référence:</span>
                      <span className="text-gray-900 font-bold">{product.default_code || product.id}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <span className="text-gray-600 font-medium">Catégorie:</span>
                      <span className="text-gray-900 font-bold">{product.category?.name || 'Non spécifié'}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <span className="text-gray-600 font-medium">Disponibilité:</span>
                      <span className={`font-bold ${displayStock ? 'text-green-600' : 'text-red-600'}`}>
                        {displayStock ? 'En stock' : 'Rupture de stock'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-gray-600 font-medium">Stock:</span>
                      <span className="text-gray-900 font-bold">{Math.floor(displayStockQty ?? 0)} unités</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="animate-fadeIn">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Livraison et Retours
                </h3>
                <div className="space-y-6">
                  {/* Livraison */}
                  <div className="bg-gradient-to-r from-primary/5 to-primary-light/5 rounded-xl p-5 border border-primary/20">
                    <h4 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                      </svg>
                      Livraison
                    </h4>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Livraison standard: <strong>2-5 jours ouvrables</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Livraison express: <strong>1-2 jours ouvrables</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Frais de port: <strong>Gratuit dès 150 DT d'achat</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Suivi de commande disponible</span>
                      </li>
                    </ul>
                  </div>

                  {/* Retours */}
                  <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200">
                    <h4 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Retours & Échanges
                    </h4>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>Retours acceptés sous <strong>30 jours</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>Produit dans son emballage d'origine</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>Remboursement sous <strong>7-10 jours</strong> après réception</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>Échange gratuit en cas de défaut</span>
                      </li>
                    </ul>
                  </div>

                  {/* Contact */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h4 className="font-bold text-lg text-gray-900 mb-3">Besoin d'aide?</h4>
                    <p className="text-gray-700 mb-3">
                      Notre service client est à votre disposition du lundi au vendredi de 9h à 18h.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a href="tel:+21600000000" className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-semibold text-center hover:bg-primary-dark transition-colors">
                        📞 Appelez-nous
                      </a>
                      <a href="mailto:contact@quelyos.com" className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded-lg font-semibold text-center hover:bg-gray-300 transition-colors">
                        ✉️ Email
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bundle Suggestions - Achetés ensemble */}
        <BundleSuggestions currentProduct={product} className="mt-12" />

        {/* Produits similaires */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Produits similaires</h2>
            <ProductGrid>
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </ProductGrid>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
