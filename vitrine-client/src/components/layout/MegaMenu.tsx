'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { backendClient } from '@/lib/backend/client';
import { logger } from '@/lib/logger';

interface Subcategory {
  id: number;
  name: string;
  product_count: number;
}

interface FeaturedProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
}

interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  parent_name: string | null;
  child_count: number;
  product_count: number;
  image_url: string | null;
  subcategories: Subcategory[];
  featured_products: FeaturedProduct[];
}

/**
 * Mega Menu Component
 * Displays a rich navigation menu with categories, subcategories, and featured products
 * Shows on hover with visual submenu
 */
export function MegaMenu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        setActiveCategory(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);

      const response = await backendClient.getCategories({
        include_featured_products: true,
        featured_limit: 4,
      });

      if (response.success) {
        const categoriesList = response.categories || response.data?.categories || [];
        // Filter to get only top-level categories (no parent)
        const topLevelCategories = categoriesList.filter(
          (cat: Category) => !cat.parent_id
        );
        setCategories(topLevelCategories);
      }
    } catch (error) {
      logger.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryHover = (categoryId: number) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Set active category with slight delay
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveCategory(categoryId);
      setShowMenu(true);
    }, 150);
  };

  const handleMouseLeave = () => {
    // Clear timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Close menu with delay
    hoverTimeoutRef.current = setTimeout(() => {
      setShowMenu(false);
      setActiveCategory(null);
    }, 300);
  };

  const handleMouseEnter = () => {
    // Cancel close timeout when re-entering menu
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const activeData = categories.find((cat) => cat.id === activeCategory);

  if (loading) {
    return (
      <div className="flex gap-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
        ))}
      </div>
    );
  }

  return (
    <div ref={menuRef} className="relative" onMouseLeave={handleMouseLeave}>
      {/* Top-level Categories */}
      <nav className="flex items-center gap-6">
        {categories.slice(0, 8).map((category) => (
          <div
            key={category.id}
            className="relative"
            onMouseEnter={() => {
              handleMouseEnter();
              handleCategoryHover(category.id);
            }}
          >
            <Link
              href={`/products?category=${category.id}`}
              className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                activeCategory === category.id
                  ? 'text-primary'
                  : 'text-gray-700 hover:text-primary'
              }`}
            >
              {category.name}
              {category.subcategories.length > 0 && (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </Link>
          </div>
        ))}

        {categories.length > 8 && (
          <Link
            href="/products"
            className="text-sm font-medium text-gray-700 hover:text-primary"
          >
            Plus...
          </Link>
        )}
      </nav>

      {/* Mega Menu Dropdown */}
      {showMenu && activeData && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-2 rounded-lg border border-gray-200 bg-white shadow-2xl"
          onMouseEnter={handleMouseEnter}
        >
          <div className="container mx-auto px-6 py-8">
            <div className="grid gap-8 lg:grid-cols-4">
              {/* Subcategories */}
              {activeData.subcategories.length > 0 && (
                <div className="lg:col-span-1">
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-900">
                    Catégories
                  </h3>
                  <ul className="space-y-3">
                    {/* "All" link */}
                    <li>
                      <Link
                        href={`/products?category=${activeData.id}`}
                        className="flex items-center justify-between text-sm text-gray-700 transition-colors hover:text-primary"
                      >
                        <span className="font-semibold">Tout voir</span>
                        <span className="text-xs text-gray-500">
                          {activeData.product_count}
                        </span>
                      </Link>
                    </li>

                    {/* Subcategories */}
                    {activeData.subcategories.map((subcat) => (
                      <li key={subcat.id}>
                        <Link
                          href={`/products?category=${subcat.id}`}
                          className="flex items-center justify-between text-sm text-gray-700 transition-colors hover:text-primary"
                        >
                          <span>{subcat.name}</span>
                          <span className="text-xs text-gray-500">
                            {subcat.product_count}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Featured Products */}
              {activeData.featured_products.length > 0 && (
                <div
                  className={
                    activeData.subcategories.length > 0
                      ? 'lg:col-span-2'
                      : 'lg:col-span-3'
                  }
                >
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-900">
                    Produits Populaires
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {activeData.featured_products.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        className="group flex gap-3 rounded-lg border border-transparent p-2 transition-all hover:border-gray-200 hover:bg-gray-50"
                      >
                        {/* Product Image */}
                        <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <svg
                              className="h-8 w-8 text-gray-400"
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
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex flex-1 flex-col justify-center">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-primary">
                            {product.name}
                          </p>
                          <p className="mt-1 text-sm font-bold text-primary">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Promotion Banner */}
              <div className="rounded-lg bg-gradient-to-br from-primary to-purple-600 p-6 text-white lg:col-span-1">
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <h3 className="mb-2 text-lg font-bold">
                      Offres Spéciales
                    </h3>
                    <p className="mb-4 text-sm opacity-90">
                      Découvrez nos meilleures promotions dans {activeData.name}
                    </p>
                  </div>

                  <Link
                    href={`/products?category=${activeData.id}&sort=discount`}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary transition-transform hover:scale-105"
                  >
                    Voir les offres
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
