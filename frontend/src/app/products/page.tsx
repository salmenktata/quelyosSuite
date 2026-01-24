/**
 * Page liste produits - Style lesportif.com.tn
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { odooClient } from '@/lib/odoo/client';
import type { Product, ProductFilters, Category } from '@/types';
import { ProductGridSkeleton } from '@/components/common/Skeleton';
import { FilterDrawer } from '@/components/product/FilterDrawer';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ActiveFilterChips } from '@/components/filters/ActiveFilterChips';
import { Pagination, PaginationInfo } from '@/components/common/Pagination';
import { useFilterSync } from '@/hooks/useFilterSync';

// Lazy load du carousel (non critique pour le premier affichage)
const RecentlyViewedCarousel = dynamic(
  () => import('@/components/product/RecentlyViewedCarousel'),
  { ssr: false }
);

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [filters, setFilters] = useState<ProductFilters>({
    limit: 12,
    offset: 0,
    sort: 'name',
    is_new: false,
    is_featured: false,
    is_bestseller: false,
  });
  const [total, setTotal] = useState(0);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Synchroniser les filtres avec l'URL pour partageabilité
  useFilterSync({
    filters,
    onFiltersChange: setFilters,
    enabled: true,
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [filters]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await odooClient.getProducts(filters);
      if (response.success) {
        setProducts(response.products);
        setTotal(response.total);
      }
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await odooClient.getCategories();
      if (response.success && response.categories) {
        setCategories(response.categories);
      }
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters({
      ...filters,
      [key]: value,
      offset: 0,
    });
  };

  const handlePriceFilter = () => {
    setFilters({
      ...filters,
      price_min: priceRange.min,
      price_max: priceRange.max,
      offset: 0,
    });
  };

  const clearFilters = () => {
    setFilters({
      limit: itemsPerPage,
      offset: 0,
      sort: 'name',
      is_new: false,
      is_featured: false,
      is_bestseller: false,
    });
    setPriceRange({ min: 0, max: 1000 });
  };

  const handleRemoveFilter = (key: keyof ProductFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters({ ...newFilters, offset: 0 });
  };

  const handlePageChange = (page: number) => {
    setFilters({
      ...filters,
      offset: (page - 1) * itemsPerPage,
    });
  };

  const currentPage = Math.floor((filters.offset || 0) / itemsPerPage) + 1;
  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-7xl py-6">
        {/* Breadcrumb */}
        <nav className="text-sm mb-6 text-gray-600">
          <Link href="/" className="hover:text-primary">Accueil</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Produits</span>
        </nav>

        <div className="flex gap-6">
          {/* SIDEBAR FILTRES */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              {/* En-tête filtres */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold text-lg text-gray-900">Filtrer</h2>
                  <button
                    onClick={clearFilters}
                    className="text-xs text-gray-500 hover:text-primary underline transition-colors"
                  >
                    Effacer tout
                  </button>
                </div>
              </div>

              {/* Promotions */}
              <div className="p-4 border-b">
                <h3 className="font-semibold mb-3 text-sm uppercase text-gray-700">Sélections</h3>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.is_featured}
                      onChange={(e) => handleFilterChange('is_featured', e.target.checked)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                    />
                    <span className="ml-2 text-sm text-gray-700 group-hover:text-primary">⭐ Produits vedettes</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.is_new}
                      onChange={(e) => handleFilterChange('is_new', e.target.checked)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                    />
                    <span className="ml-2 text-sm text-gray-700 group-hover:text-primary">🆕 Nouveautés</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.is_bestseller}
                      onChange={(e) => handleFilterChange('is_bestseller', e.target.checked)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                    />
                    <span className="ml-2 text-sm text-gray-700 group-hover:text-primary">🔥 Meilleures ventes</span>
                  </label>
                </div>
              </div>

              {/* Prix */}
              <div className="p-4 border-b">
                <h3 className="font-semibold mb-3 text-sm uppercase text-gray-700">Prix (TND)</h3>
                <div className="space-y-3">
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={priceRange.min || 0}
                      onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) || 0 })}
                      placeholder="Min"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:border-primary"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      value={priceRange.max || 1000}
                      onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) || 1000 })}
                      placeholder="Max"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <button
                    onClick={handlePriceFilter}
                    className="w-full bg-primary text-white py-2 rounded text-sm hover:bg-primary-dark transition-colors"
                  >
                    Appliquer
                  </button>
                </div>
              </div>

              {/* Catégories */}
              <div className="p-4">
                <h3 className="font-semibold mb-3 text-sm uppercase text-gray-700">Catégories</h3>
                <ul className="space-y-1.5">
                  <li>
                    <button
                      onClick={() => handleFilterChange('category_id', undefined)}
                      className={`w-full text-left py-1.5 px-3 rounded text-sm transition-colors ${
                        !filters.category_id
                          ? 'bg-primary text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      Toutes les catégories
                    </button>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <button
                        onClick={() => handleFilterChange('category_id', cat.id)}
                        className={`w-full text-left py-1.5 px-3 rounded text-sm transition-colors ${
                          filters.category_id === cat.id
                            ? 'bg-primary text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {cat.name}
                        {cat.product_count !== undefined && (
                          <span className="text-xs ml-1 opacity-75">({cat.product_count})</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* CONTENU PRINCIPAL */}
          <div className="flex-1">
            {/* TOOLBAR */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
              {/* Affichage résultats */}
              <PaginationInfo
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={total}
              />

              <div className="flex items-center gap-3">
                {/* Tri */}
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-primary"
                >
                  <option value="name">Nom (A-Z)</option>
                  <option value="newest">Nouveautés</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                  <option value="popular">Popularité</option>
                </select>

                {/* Nombre par page */}
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setItemsPerPage(val);
                    handleFilterChange('limit', val);
                  }}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-primary"
                >
                  <option value="12">12</option>
                  <option value="24">24</option>
                  <option value="36">36</option>
                  <option value="48">48</option>
                </select>

                {/* Vue grille/liste */}
                <div className="flex border border-gray-300 rounded">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                    title="Vue grille"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                    title="Vue liste"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* FILTRES ACTIFS */}
            <ActiveFilterChips
              filters={filters}
              categories={categories}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={clearFilters}
              className="mb-6"
            />

            {/* GRILLE PRODUITS */}
            {isLoading && filters.offset === 0 ? (
              <ProductGridSkeleton count={12} viewMode={viewMode} />
            ) : products.length > 0 ? (
              <>
                <ProductGrid viewMode={viewMode}>
                  {products.map((product) => (
                    <ProductCardLeSportif key={product.id} product={product} viewMode={viewMode} />
                  ))}
                </ProductGrid>

                {/* PAGINATION */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  siblingCount={1}
                  showFirstLast={true}
                  className="mt-8"
                />
              </>
            ) : (
              <div className="bg-white rounded shadow-sm p-12 text-center">
                <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-primary hover:underline"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bouton flottant filtres (mobile uniquement) */}
        <button
          onClick={() => setIsFilterDrawerOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-2xl hover:bg-primary-dark transition-all active:scale-95 z-50"
          aria-label="Ouvrir les filtres"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {/* Badge compteur filtres actifs */}
          {[filters.is_featured, filters.is_new, filters.is_bestseller, filters.category_id, filters.price_min, filters.price_max].filter(Boolean).length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {[filters.is_featured, filters.is_new, filters.is_bestseller, filters.category_id, filters.price_min, filters.price_max].filter(Boolean).length}
            </span>
          )}
        </button>

        {/* FilterDrawer mobile */}
        <FilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          filters={filters}
          onFilterChange={handleFilterChange}
          categories={categories}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          onPriceApply={handlePriceFilter}
          onClearAll={clearFilters}
          totalResults={total}
        />

        {/* Produits récemment consultés */}
        <RecentlyViewedCarousel />
      </div>
    </div>
  );
}

// Carte produit style Le Sportif Premium
function ProductCardLeSportif({ product, viewMode }: { product: Product; viewMode: 'grid' | 'list' }) {
  // State pour le variant sélectionné
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  // Get main image URL from images array
  const mainImage = product.images?.find(img => img.is_main) || product.images?.[0];
  const imageUrl = mainImage?.url || '';

  // Variant sélectionné ou produit par défaut
  const hasVariants = product.variants && product.variants.length > 0;
  const selectedVariant = hasVariants
    ? product.variants?.find(v => v.id === selectedVariantId) || product.variants?.[0]
    : null;

  const displayPrice = selectedVariant ? selectedVariant.price : product.list_price;
  const displayInStock = selectedVariant ? selectedVariant.in_stock : product.in_stock;

  const discountPercent = product.compare_at_price
    ? Math.round((1 - product.list_price / product.compare_at_price) * 100)
    : 0;

  const inStock = product.in_stock;

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4 hover:shadow-xl hover:border-primary/20 transition-all duration-300">
        <div className="w-32 h-32 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden relative">
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
              </svg>
            </div>
          )}
          {discountPercent > 0 && (
            <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-lg">
              -{discountPercent}%
            </span>
          )}
        </div>
        <div className="flex-1">
          {product.default_code && (
            <div className="text-xs text-secondary font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
              </svg>
              {product.default_code}
            </div>
          )}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>

          {/* Variants selector */}
          {hasVariants && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {product.variants?.map((variant) => (
                <button
                  key={variant.id}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedVariantId(variant.id);
                  }}
                  disabled={!variant.in_stock}
                  className={`px-2.5 py-1 text-xs border rounded transition-all ${
                    selectedVariantId === variant.id || (!selectedVariantId && variant === product.variants?.[0])
                      ? 'border-primary bg-primary text-white font-medium'
                      : variant.in_stock
                      ? 'border-gray-300 hover:border-primary'
                      : 'border-gray-200 text-gray-400 line-through cursor-not-allowed'
                  }`}
                  title={!variant.in_stock ? 'Rupture de stock' : variant.attributes.map(a => `${a.name}: ${a.value}`).join(', ')}
                >
                  {variant.attributes.map(a => a.value).join(' / ')}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl font-bold text-gray-900">{displayPrice.toFixed(2)} <span className="text-sm font-normal text-gray-600">{product.currency?.symbol || 'TND'}</span></span>
            {product.compare_at_price && (
              <span className="text-sm text-gray-400 line-through">{product.compare_at_price.toFixed(2)} {product.currency?.symbol || 'TND'}</span>
            )}
          </div>
          {/* Stock indicator */}
          <div className="mb-3 flex items-center gap-1.5 text-xs">
            {displayInStock ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-medium">En stock</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-700 font-medium">Rupture de stock</span>
              </>
            )}
          </div>
          <Link href={`/products/${product.slug || product.id}`}>
            <button className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm font-semibold">
              Voir le produit
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-primary/20 transition-all duration-300 transform hover:-translate-y-1">
        {/* Image avec hover button */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <Link href={`/products/${product.slug || product.id}`}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                </svg>
              </div>
            )}
          </Link>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {discountPercent > 0 && (
              <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-lg">
                -{discountPercent}%
              </span>
            )}
            {product.is_new && (
              <span className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-lg">
                NOUVEAU
              </span>
            )}
          </div>

          {/* Button Ajouter au panier - Toujours visible sur mobile, hover sur desktop */}
          <div className="absolute bottom-3 left-3 right-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
            <button
              className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-primary-dark flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
              disabled={!displayInStock}
              aria-label={displayInStock ? "Ajouter au panier" : "Produit en rupture de stock"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {displayInStock ? 'Ajouter au panier' : 'Rupture de stock'}
            </button>
          </div>
        </div>

        {/* Product Info */}
        <Link href={`/products/${product.slug || product.id}`} className="block p-4">
          {product.default_code && (
            <div className="text-xs text-secondary font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
              </svg>
              {product.default_code}
            </div>
          )}

          <h3 className="font-semibold text-sm text-gray-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors min-h-10 leading-tight">
            {product.name}
          </h3>

          {/* Variants selector */}
          {hasVariants && (
            <div className="mb-2 flex flex-wrap gap-1">
              {product.variants?.map((variant) => (
                <button
                  key={variant.id}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedVariantId(variant.id);
                  }}
                  disabled={!variant.in_stock}
                  className={`px-2 py-1 text-xs border rounded transition-all ${
                    selectedVariantId === variant.id || (!selectedVariantId && variant === product.variants?.[0])
                      ? 'border-primary bg-primary text-white'
                      : variant.in_stock
                      ? 'border-gray-300 text-gray-900 hover:border-primary'
                      : 'border-gray-200 text-gray-400 line-through cursor-not-allowed'
                  }`}
                  title={!variant.in_stock ? 'Rupture de stock' : variant.attributes.map(a => `${a.name}: ${a.value}`).join(', ')}
                >
                  {variant.attributes.map(a => a.value).join(' / ')}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">
              {displayPrice.toFixed(2)} <span className="text-sm font-normal text-gray-600">{product.currency?.symbol || 'TND'}</span>
            </span>
            {product.compare_at_price && (
              <span className="text-sm text-gray-400 line-through">
                {product.compare_at_price.toFixed(2)} {product.currency?.symbol || 'TND'}
              </span>
            )}
          </div>

          {/* Stock indicator */}
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {displayInStock ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-medium">En stock</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-700 font-medium">Rupture de stock</span>
              </>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}
