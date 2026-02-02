'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { backendClient } from '@/lib/backend/client';
import { useSearchHistoryStore } from '@/store/searchHistoryStore';
import { logger } from '@/lib/logger';
import { sanitizeHighlight } from '@/lib/utils/sanitize';
import { VisualSearch } from '@/components/search/VisualSearch';

interface SearchProduct {
  id: number;
  name: string;
  highlight: string;
  slug: string;
  image: string;
  price: number;
  currency: string;
  category: string | null;
  sku: string | null;
}

interface SearchCategory {
  id: number;
  name: string;
  highlight: string;
  product_count: number;
  image: string | null;
  parent_name?: string | null;
}

interface PopularSearch {
  query: string;
  type: 'category' | 'keyword';
  count?: number;
}

interface SearchAutocompleteProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

// Helper to get full image URL with backend server prefix
const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) return '/placeholder-product.svg';
  // If already a full URL, return as is
  if (imagePath.startsWith('http')) return imagePath;
  // Prefix with backend URL
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8069';
  return `${backendUrl}${imagePath}`;
};

/**
 * Search autocomplete component with real-time suggestions
 * Features:
 * - Debounced search (300ms)
 * - Product and category suggestions
 * - Recent searches history (localStorage)
 * - Popular searches suggestions
 * - Keyboard navigation (Arrow up/down, Enter, Escape)
 * - Click outside to close
 * - Highlights matching text
 */
export function SearchAutocomplete({
  placeholder = 'Rechercher des produits...',
  className = '',
  onSearch,
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    products: SearchProduct[];
    categories: SearchCategory[];
  }>({ products: [], categories: [] });
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showHistory, setShowHistory] = useState(false);
  const [queryExpansion, setQueryExpansion] = useState<string[]>([]);
  const [showVisualSearch, setShowVisualSearch] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Search history store
  const { searches, addSearch, removeSearch, clearHistory, getRecentSearches } =
    useSearchHistoryStore();

  // Fetch popular searches on mount
  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const response = await backendClient.getPopularSearches(5);
        // Backend returns popular_searches in data
        const popularSearches = response.data?.popular_searches;
        if (response.success && popularSearches && Array.isArray(popularSearches)) {
          // Map backend response to frontend type
          const searches: PopularSearch[] = popularSearches.map((s: unknown) => {
            const search = s as Record<string, unknown>;
            return {
              query: String(search.query || ''),
              type: (search.type === 'category' ? 'category' : 'keyword') as 'category' | 'keyword',
              count: Number(search.count || 0),
            };
          });
          setPopularSearches(searches);
        }
      } catch (_error) {
        // Silently fail - popular searches are optional
        logger.debug('Popular searches not available');
      }
    };
    fetchPopular();
  }, []);

  // Fetch autocomplete results with semantic fallback
  const fetchResults = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults({ products: [], categories: [] });
      setQueryExpansion([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setShowHistory(false);
    setQueryExpansion([]);

    try {
      // Standard autocomplete first
      const response = await backendClient.searchAutocomplete(searchQuery, 8, true);

      if (response.success) {
        const apiProducts = response.data?.products || [];
        const apiCategories = response.data?.categories || [];

        // Map API products to SearchProduct
        const products: SearchProduct[] = apiProducts.map((p) => ({
          id: p.id,
          name: p.name,
          highlight: p.name,
          slug: p.slug,
          image: p.image_url || p.image || '',
          price: p.price || 0,
          currency: typeof p.currency === 'string' ? p.currency : 'TND',
          category: typeof p.category === 'object' && p.category ? p.category.name : null,
          sku: p.sku || p.default_code || null,
        }));

        // Map API categories to SearchCategory
        const categories: SearchCategory[] = apiCategories.map((c) => ({
          id: c.id,
          name: c.name,
          highlight: c.name,
          product_count: c.product_count || 0,
          image: (c as { image_url?: string }).image_url || null,
          parent_name: (c as { parent_name?: string }).parent_name || null,
        }));

        // If few results, try semantic search for more suggestions
        if (products.length < 3 && searchQuery.length >= 3) {
          try {
            const semanticResponse = await backendClient.searchSemantic(searchQuery, { limit: 5 });
            if (semanticResponse.success && semanticResponse.data) {
              // Add semantic results that aren't already in products
              const existingIds = new Set(products.map((p) => p.id));
              const semanticProducts = semanticResponse.data.products
                .filter((sp) => !existingIds.has(sp.id))
                .slice(0, 5 - products.length)
                .map((sp): SearchProduct => ({
                  id: sp.id,
                  name: sp.name,
                  highlight: sp.name,
                  slug: sp.slug,
                  image: sp.image_url || '',
                  price: sp.price,
                  currency: 'TND',
                  category: sp.category,
                  sku: null,
                }));

              products.push(...semanticProducts);

              // Show query expansion if synonyms were used
              if (semanticResponse.data.query_expansion.length > 0) {
                setQueryExpansion(semanticResponse.data.query_expansion.slice(0, 3));
              }
            }
          } catch {
            // Semantic search is optional, fail silently
          }
        }

        setResults({ products, categories });
        setIsOpen(true);
      }
    } catch (_error) {
      logger.error('Search autocomplete error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (value.length < 2) {
      setResults({ products: [], categories: [] });
      setShowHistory(true);
      setIsOpen(true);
      return;
    }

    // Adaptive debounce based on query length
    const debounceTime = value.length <= 2 ? 400 : value.length <= 4 ? 300 : 200;

    debounceTimer.current = setTimeout(() => {
      fetchResults(value);
    }, debounceTime);
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (query.trim()) {
      // Add to search history
      const totalResults = results.products.length + results.categories.length;
      addSearch(query, totalResults);

      // Close dropdown
      setIsOpen(false);

      // Call onSearch callback if provided
      if (onSearch) {
        onSearch(query);
      } else {
        // Default behavior: navigate to search page
        window.location.href = `/products?search=${encodeURIComponent(query)}`;
      }
    }
  };

  // Handle clicking a recent search
  const handleRecentSearchClick = (searchQuery: string) => {
    setQuery(searchQuery);
    setShowHistory(false);
    fetchResults(searchQuery);
  };

  // Handle clicking a popular search
  const handlePopularSearchClick = (search: PopularSearch) => {
    if (search.type === 'category') {
      // Navigate to category page
      window.location.href = `/products?category=${search.query}`;
    } else {
      setQuery(search.query);
      setShowHistory(false);
      fetchResults(search.query);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = results.categories.length + results.products.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && isOpen) {
          const item = getItemAtIndex(selectedIndex);
          if (item) {
            if ('slug' in item) {
              window.location.href = `/products/${item.slug}`;
            } else {
              window.location.href = `/products?category=${item.id}`;
            }
          }
        } else {
          handleSubmit(e);
        }
        break;

      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Get item at index (category or product)
  const getItemAtIndex = (index: number): SearchCategory | SearchProduct | null => {
    if (index < results.categories.length) {
      return results.categories[index];
    }
    const productIndex = index - results.categories.length;
    if (productIndex < results.products.length) {
      return results.products[productIndex];
    }
    return null;
  };

  // Handle focus - show history if query is empty
  const handleFocus = () => {
    if (query.length < 2) {
      setShowHistory(true);
      setIsOpen(true);
    } else if (query.length >= 2) {
      setIsOpen(true);
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const totalResults = results.categories.length + results.products.length;
  const recentSearches = getRecentSearches(5);
  const hasHistoryOrPopular =
    recentSearches.length > 0 || popularSearches.length > 0;

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          {/* Search Icon */}
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-5 w-5 text-gray-400"
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
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={placeholder}
            className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            autoComplete="off"
          />

          {/* Loading Spinner */}
          {isLoading && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
            </div>
          )}

          {/* Clear Button */}
          {query && !isLoading && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults({ products: [], categories: [] });
                setShowHistory(true);
                inputRef.current?.focus();
              }}
              className="absolute inset-y-0 right-8 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {/* Visual Search Button */}
          <button
            type="button"
            onClick={() => setShowVisualSearch(true)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-primary transition-colors"
            title="Recherche par image"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </form>

      {/* Visual Search Modal */}
      {showVisualSearch && (
        <VisualSearch onClose={() => setShowVisualSearch(false)} />
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-[60vh] sm:max-h-96 overflow-y-auto">
          {/* Recent Searches & Popular - when query is empty or short */}
          {showHistory && query.length < 2 && hasHistoryOrPopular && (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="border-b border-gray-100 p-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs font-semibold uppercase text-gray-500">
                      Recherches récentes
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearHistory();
                      }}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Effacer
                    </button>
                  </div>
                  {recentSearches.map((item) => (
                    <div
                      key={item.query}
                      className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-gray-50 cursor-pointer group"
                      onClick={() => handleRecentSearchClick(item.query)}
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          className="h-4 w-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-sm text-gray-700">{item.query}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSearch(item.query);
                        }}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Popular Searches */}
              {popularSearches.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1 text-xs font-semibold uppercase text-gray-500">
                    Recherches populaires
                  </div>
                  {popularSearches.map((search) => (
                    <div
                      key={search.query}
                      className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handlePopularSearchClick(search)}
                    >
                      <svg
                        className="h-4 w-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                      <span className="text-sm text-gray-700">{search.query}</span>
                      {search.count !== undefined && (
                        <span className="text-xs text-gray-400">
                          ({search.count} produits)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Skeleton Loading */}
          {isLoading && query.length >= 2 && (
            <div className="p-2 space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 animate-pulse">
                  <div className="h-10 w-10 rounded bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-gray-200" />
                    <div className="h-3 w-1/2 rounded bg-gray-200" />
                  </div>
                  <div className="h-4 w-16 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          )}

          {/* Semantic Search Expansion Info */}
          {!isLoading && queryExpansion.length > 0 && (
            <div className="border-b border-gray-100 p-2">
              <div className="flex items-center gap-2 px-2 py-1">
                <svg className="h-4 w-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-purple-600 font-medium">Recherche intelligente</span>
                <div className="flex gap-1 flex-wrap">
                  {queryExpansion.map((term, i) => (
                    <span key={i} className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {!isLoading && totalResults > 0 && (
            <div className="max-h-96 overflow-y-auto">
              {/* Categories */}
              {results.categories.length > 0 && (
                <div className="border-b border-gray-100 p-2">
                  <div className="px-2 py-1 text-xs font-semibold uppercase text-gray-500">
                    Catégories
                  </div>
                  {results.categories.map((category, index) => (
                    <Link
                      key={`cat-${category.id}`}
                      href={`/products?category=${category.id}`}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                        selectedIndex === index
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <svg
                        className="h-5 w-5 flex-shrink-0"
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
                      <div className="flex-1">
                        <div dangerouslySetInnerHTML={{ __html: sanitizeHighlight(category.highlight) }} />
                        {category.parent_name && (
                          <div className="text-xs text-gray-400">
                            dans {category.parent_name}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {category.product_count} produit
                          {category.product_count > 1 ? 's' : ''}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Products */}
              {results.products.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1 text-xs font-semibold uppercase text-gray-500">
                    Produits
                  </div>
                  {results.products.map((product, index) => {
                    const itemIndex = results.categories.length + index;
                    return (
                      <Link
                        key={`prod-${product.id}`}
                        href={`/products/${product.slug}`}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 ${
                          selectedIndex === itemIndex
                            ? 'bg-primary/10'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        {/* Product Image */}
                        <div className="relative h-12 w-12 shrink-0">
                          <Image
                            src={getImageUrl(product.image) || '/placeholder-product.svg'}
                            alt={product.name}
                            fill
                            className="rounded-md object-cover"
                            sizes="48px"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 overflow-hidden">
                          <div
                            className="truncate text-sm font-medium text-gray-900"
                            dangerouslySetInnerHTML={{ __html: sanitizeHighlight(product.highlight) }}
                          />
                          {product.sku && (
                            <div className="text-xs text-gray-500">
                              Réf: {product.sku}
                            </div>
                          )}
                          {product.category && (
                            <div className="text-xs text-gray-500">{product.category}</div>
                          )}
                        </div>

                        {/* Price */}
                        <div className="flex-shrink-0 text-sm font-semibold text-primary">
                          {product.price.toFixed(2)} €
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* View All Results */}
          {!isLoading && query.length >= 2 && totalResults > 0 && (
            <div className="border-t border-gray-100 p-2">
              <button
                type="button"
                onClick={handleSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
              >
                <span>Voir tous les résultats pour "{query}"</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* No Results */}
          {!isLoading && query.length >= 2 && totalResults === 0 && (
            <div className="p-4">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-500">
                  Aucun résultat pour "{query}"
                </p>
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-gray-400">Suggestions :</p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Vérifiez l&apos;orthographe de votre recherche</li>
                    <li>• Utilisez des termes plus généraux</li>
                    <li>• Essayez des synonymes</li>
                  </ul>
                </div>

                {/* Show recent searches as alternatives */}
                {recentSearches.length > 0 && (
                  <div className="pt-3 mt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-2">Recherches récentes :</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {recentSearches.slice(0, 3).map((s) => (
                        <button
                          key={s.query}
                          onClick={() => handleRecentSearchClick(s.query)}
                          className="text-xs px-3 py-1 bg-gray-100 rounded-full hover:bg-primary hover:text-white transition-colors"
                        >
                          {s.query}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
