/**
 * Page liste produits - Style lesportif.com.tn
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { odooClient } from '@/lib/odoo/client';
import type { Product, ProductFilters, Category } from '@/types';
import { LoadingSpinner } from '@/components/common/Loading';

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
  });
  const [total, setTotal] = useState(0);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });

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
      if (response.success) {
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
    });
    setPriceRange({ min: 0, max: 1000 });
  };

  const currentPage = Math.floor((filters.offset || 0) / itemsPerPage) + 1;
  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-7xl py-6">
        {/* Breadcrumb */}
        <nav className="text-sm mb-6 text-gray-600">
          <Link href="/" className="hover:text-[#01613a]">Accueil</Link>
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
                    className="text-xs text-gray-500 hover:text-[#01613a] underline transition-colors"
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
                      onChange={(e) => handleFilterChange('is_featured', e.target.checked || undefined)}
                      className="w-4 h-4 text-[#01613a] border-gray-300 rounded focus:ring-[#01613a]"
                    />
                    <span className="ml-2 text-sm group-hover:text-[#01613a]">⭐ Produits vedettes</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.is_new}
                      onChange={(e) => handleFilterChange('is_new', e.target.checked || undefined)}
                      className="w-4 h-4 text-[#01613a] border-gray-300 rounded focus:ring-[#01613a]"
                    />
                    <span className="ml-2 text-sm group-hover:text-[#01613a]">🆕 Nouveautés</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.is_bestseller}
                      onChange={(e) => handleFilterChange('is_bestseller', e.target.checked || undefined)}
                      className="w-4 h-4 text-[#01613a] border-gray-300 rounded focus:ring-[#01613a]"
                    />
                    <span className="ml-2 text-sm group-hover:text-[#01613a]">🔥 Meilleures ventes</span>
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
                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#01613a]"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      value={priceRange.max || 1000}
                      onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) || 1000 })}
                      placeholder="Max"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#01613a]"
                    />
                  </div>
                  <button
                    onClick={handlePriceFilter}
                    className="w-full bg-[#01613a] text-white py-2 rounded text-sm hover:bg-[#024d2e] transition-colors"
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
                          ? 'bg-[#01613a] text-white'
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
                            ? 'bg-[#01613a] text-white'
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
              <div className="text-sm text-gray-600">
                Affichage <span className="font-semibold text-[#01613a]">{Math.min((filters.offset || 0) + 1, total)}-{Math.min((filters.offset || 0) + itemsPerPage, total)}</span> de <span className="font-semibold text-[#01613a]">{total}</span> article(s)
              </div>

              <div className="flex items-center gap-3">
                {/* Tri */}
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#01613a]"
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
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#01613a]"
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
                    className={`p-2 ${viewMode === 'grid' ? 'bg-[#01613a] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                    title="Vue grille"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-[#01613a] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                    title="Vue liste"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* GRILLE PRODUITS */}
            {isLoading && filters.offset === 0 ? (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner />
              </div>
            ) : products.length > 0 ? (
              <>
                <div className={viewMode === 'grid'
                  ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                  : 'space-y-4'
                }>
                  {products.map((product) => (
                    <ProductCardLeSportif key={product.id} product={product} viewMode={viewMode} />
                  ))}
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => handleFilterChange('offset', Math.max(0, (filters.offset || 0) - itemsPerPage))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Précédent
                    </button>

                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let page = i + 1;
                        if (totalPages > 5 && currentPage > 3) {
                          page = currentPage - 2 + i;
                          if (page > totalPages) page = totalPages - 4 + i;
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => handleFilterChange('offset', (page - 1) * itemsPerPage)}
                            className={`px-3 py-2 text-sm rounded ${
                              currentPage === page
                                ? 'bg-[#01613a] text-white'
                                : 'border border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handleFilterChange('offset', (filters.offset || 0) + itemsPerPage)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded shadow-sm p-12 text-center">
                <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-[#01613a] hover:underline"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Carte produit style Le Sportif Premium
function ProductCardLeSportif({ product, viewMode }: { product: Product; viewMode: 'grid' | 'list' }) {
  const discountPercent = product.compare_at_price
    ? Math.round((1 - product.list_price / product.compare_at_price) * 100)
    : 0;

  const inStock = product.qty_available !== undefined ? product.qty_available > 0 : true;

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4 hover:shadow-xl hover:border-[#01613a]/20 transition-all duration-300">
        <div className="w-32 h-32 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden relative">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
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
            <div className="text-xs text-[#c9c18f] font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
              </svg>
              {product.default_code}
            </div>
          )}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl font-bold text-gray-900">{product.list_price.toFixed(2)} <span className="text-sm font-normal text-gray-600">TND</span></span>
            {product.compare_at_price && (
              <span className="text-sm text-gray-400 line-through">{product.compare_at_price.toFixed(2)} TND</span>
            )}
          </div>
          {/* Stock indicator */}
          {product.qty_available !== undefined && (
            <div className="mb-3 flex items-center gap-1.5 text-xs">
              {inStock ? (
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
          )}
          <Link href={`/products/${product.slug || product.id}`}>
            <button className="bg-[#01613a] text-white px-6 py-2 rounded-lg hover:bg-[#024d2e] transition-colors text-sm font-semibold">
              Voir le produit
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-[#01613a]/20 transition-all duration-300 transform hover:-translate-y-1">
        {/* Image avec hover button */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <Link href={`/products/${product.slug || product.id}`}>
            {product.image_url ? (
              <img
                src={product.image_url}
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
              <span className="bg-[#01613a] text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-lg">
                NOUVEAU
              </span>
            )}
          </div>

          {/* Hover Button - Ajouter au panier */}
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button className="w-full bg-[#01613a] text-white py-2.5 rounded-lg font-semibold hover:bg-[#024d2e] flex items-center justify-center gap-2 shadow-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Ajouter au panier
            </button>
          </div>
        </div>

        {/* Product Info */}
        <Link href={`/products/${product.slug || product.id}`} className="block p-4">
          {product.default_code && (
            <div className="text-xs text-[#c9c18f] font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
              </svg>
              {product.default_code}
            </div>
          )}

          <h3 className="font-semibold text-sm text-gray-900 mb-3 line-clamp-2 group-hover:text-[#01613a] transition-colors min-h-10 leading-tight">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">
              {product.list_price.toFixed(2)} <span className="text-sm font-normal text-gray-600">TND</span>
            </span>
            {product.compare_at_price && (
              <span className="text-sm text-gray-400 line-through">
                {product.compare_at_price.toFixed(2)} TND
              </span>
            )}
          </div>

          {/* Stock indicator */}
          {product.qty_available !== undefined && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {inStock ? (
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
          )}
        </Link>
      </div>
    </div>
  );
}
