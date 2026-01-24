/**
 * FilterDrawer - Drawer de filtres mobile avec bottom sheet
 * Permet d'accéder aux filtres sur mobile (<lg screens)
 */

'use client';

import React, { useEffect, useState } from 'react';
import type { ProductFilters, Category } from '@/types';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ProductFilters;
  onFilterChange: (key: keyof ProductFilters, value: any) => void;
  categories: Category[];
  priceRange: { min: number; max: number };
  onPriceRangeChange: (range: { min: number; max: number }) => void;
  onPriceApply: () => void;
  onClearAll: () => void;
  totalResults: number;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  categories,
  priceRange,
  onPriceRangeChange,
  onPriceApply,
  onClearAll,
  totalResults,
}) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Compter les filtres actifs
  const activeFilterCount = [
    filters.is_featured,
    filters.is_new,
    filters.is_bestseller,
    filters.category_id,
    filters.price_min,
    filters.price_max,
  ].filter(Boolean).length;

  // Empêcher le scroll du body quand le drawer est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Gestion du swipe down pour fermer
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchEnd - touchStart;
    const isDownSwipe = distance > minSwipeDistance;
    if (isDownSwipe) {
      onClose();
    }
  };

  const handleApplyAndClose = () => {
    onPriceApply();
    onClose();
  };

  const handleClearAndClose = () => {
    onClearAll();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998] lg:hidden animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-[9999] bg-white
          rounded-t-3xl shadow-2xl
          max-h-[85vh] flex flex-col
          lg:hidden
          ${isOpen ? 'animate-slide-up' : ''}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-drawer-title"
      >
        {/* Handle de swipe */}
        <div
          className="pt-4 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 id="filter-drawer-title" className="font-bold text-lg text-gray-900">
              Filtres
              {activeFilterCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-primary rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Fermer les filtres"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Sélections */}
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase text-gray-700">Sélections</h3>
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.is_featured || false}
                  onChange={(e) => onFilterChange('is_featured', e.target.checked)}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-ring"
                />
                <span className="ml-3 text-base text-gray-700 group-hover:text-primary">⭐ Produits vedettes</span>
              </label>
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.is_new || false}
                  onChange={(e) => onFilterChange('is_new', e.target.checked)}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-ring"
                />
                <span className="ml-3 text-base text-gray-700 group-hover:text-primary">🆕 Nouveautés</span>
              </label>
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.is_bestseller || false}
                  onChange={(e) => onFilterChange('is_bestseller', e.target.checked)}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-ring"
                />
                <span className="ml-3 text-base text-gray-700 group-hover:text-primary">🔥 Meilleures ventes</span>
              </label>
            </div>
          </div>

          {/* Prix */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="font-semibold mb-3 text-sm uppercase text-gray-700">Prix (TND)</h3>
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <input
                  type="number"
                  value={priceRange.min || 0}
                  onChange={(e) => onPriceRangeChange({ ...priceRange, min: Number(e.target.value) || 0 })}
                  placeholder="Min"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
                />
                <span className="text-gray-400 font-semibold">-</span>
                <input
                  type="number"
                  value={priceRange.max || 1000}
                  onChange={(e) => onPriceRangeChange({ ...priceRange, max: Number(e.target.value) || 1000 })}
                  placeholder="Max"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </div>
          </div>

          {/* Catégories */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="font-semibold mb-3 text-sm uppercase text-gray-700">Catégories</h3>
            <div className="space-y-2">
              <button
                onClick={() => onFilterChange('category_id', undefined)}
                className={`w-full text-left py-3 px-4 rounded-lg text-base transition-colors ${
                  !filters.category_id
                    ? 'bg-primary text-white font-medium'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                Toutes les catégories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onFilterChange('category_id', cat.id)}
                  className={`w-full text-left py-3 px-4 rounded-lg text-base transition-colors ${
                    filters.category_id === cat.id
                      ? 'bg-primary text-white font-medium'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {cat.name}
                  {cat.product_count !== undefined && (
                    <span className="text-xs ml-2 opacity-75">({cat.product_count})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer sticky */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0 space-y-3">
          <button
            onClick={handleApplyAndClose}
            className="w-full bg-primary text-white py-4 rounded-lg text-base font-semibold hover:bg-primary-dark transition-colors active:scale-[0.98]"
          >
            Voir les résultats {totalResults > 0 && `(${totalResults})`}
          </button>
          <button
            onClick={handleClearAndClose}
            className="w-full bg-white text-gray-700 py-3 rounded-lg text-base font-medium border border-gray-300 hover:bg-gray-50 transition-colors active:scale-[0.98]"
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </>
  );
};

export default FilterDrawer;
