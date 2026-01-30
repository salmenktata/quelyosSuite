'use client';

import type { ProductFilters, Category } from '@quelyos/types';
import { X } from 'lucide-react';

interface ActiveFilterChipsProps {
  filters: ProductFilters;
  categories: Category[];
  onRemoveFilter: (key: keyof ProductFilters) => void;
  onClearAll: () => void;
  className?: string;
}

/**
 * Composant d&apos;affichage des filtres actifs sous forme de chips
 */
export function ActiveFilterChips({
  filters,
  categories,
  onRemoveFilter,
  onClearAll,
  className = '',
}: ActiveFilterChipsProps) {
  // Liste des filtres actifs (excluant pagination et tri)
  const activeFilters: Array<{ key: keyof ProductFilters; label: string }> = [];

  if (filters.category_id) {
    const category = categories.find(c => c.id === filters.category_id);
    activeFilters.push({
      key: 'category_id',
      label: `Catégorie: ${category?.name || filters.category_id}`,
    });
  }

  if (filters.search) {
    activeFilters.push({
      key: 'search',
      label: `Recherche: "${filters.search}"`,
    });
  }

  if (filters.min_price !== undefined) {
    activeFilters.push({
      key: 'min_price',
      label: `Prix min: ${filters.min_price}€`,
    });
  }

  if (filters.max_price !== undefined) {
    activeFilters.push({
      key: 'max_price',
      label: `Prix max: ${filters.max_price}€`,
    });
  }

  if (filters.is_new) {
    activeFilters.push({
      key: 'is_new',
      label: 'Nouveautés',
    });
  }

  if (filters.is_bestseller) {
    activeFilters.push({
      key: 'is_bestseller',
      label: 'Meilleures ventes',
    });
  }

  if (filters.in_stock) {
    activeFilters.push({
      key: 'in_stock',
      label: 'En stock',
    });
  }

  if (filters.attributes) {
    Object.entries(filters.attributes).forEach(([attr, value]) => {
      activeFilters.push({
        key: 'attributes',
        label: `${attr}: ${value}`,
      });
    });
  }

  // Ne rien afficher si aucun filtre actif
  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Filtres actifs:
      </span>

      {activeFilters.map((filter, index) => (
        <button
          key={`${filter.key}-${index}`}
          onClick={() => onRemoveFilter(filter.key)}
          className="inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          {filter.label}
          <X className="w-4 h-4" />
        </button>
      ))}

      {activeFilters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary underline transition-colors"
        >
          Tout effacer
        </button>
      )}
    </div>
  );
}
