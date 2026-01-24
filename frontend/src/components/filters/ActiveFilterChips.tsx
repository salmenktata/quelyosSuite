/**
 * ActiveFilterChips - Affiche les filtres actifs sous forme de chips
 * Permet de retirer individuellement les filtres appliqués
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chipAppear } from '@/lib/animations/variants';
import type { ProductFilters, Category } from '@/types';

interface ActiveFilterChipsProps {
  /** Filtres actifs */
  filters: ProductFilters;
  /** Catégories (pour afficher le nom au lieu de l'ID) */
  categories: Category[];
  /** Callback pour retirer un filtre */
  onRemoveFilter: (key: keyof ProductFilters) => void;
  /** Callback pour tout effacer */
  onClearAll: () => void;
  /** Classe CSS supplémentaire */
  className?: string;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  filters,
  categories,
  onRemoveFilter,
  onClearAll,
  className = '',
}) => {
  // Construire la liste des filtres actifs
  const activeFilters: Array<{
    key: keyof ProductFilters;
    label: string;
    value: any;
  }> = [];

  if (filters.is_featured) {
    activeFilters.push({
      key: 'is_featured',
      label: '⭐ Produits vedettes',
      value: true,
    });
  }

  if (filters.is_new) {
    activeFilters.push({
      key: 'is_new',
      label: '🆕 Nouveautés',
      value: true,
    });
  }

  if (filters.is_bestseller) {
    activeFilters.push({
      key: 'is_bestseller',
      label: '🔥 Meilleures ventes',
      value: true,
    });
  }

  if (filters.category_id) {
    const category = categories.find((cat) => cat.id === filters.category_id);
    if (category) {
      activeFilters.push({
        key: 'category_id',
        label: category.name,
        value: filters.category_id,
      });
    }
  }

  if (filters.search) {
    activeFilters.push({
      key: 'search',
      label: `Recherche: "${filters.search}"`,
      value: filters.search,
    });
  }

  if (filters.price_min !== undefined || filters.price_max !== undefined) {
    const min = filters.price_min || 0;
    const max = filters.price_max || '∞';
    activeFilters.push({
      key: 'price_min',
      label: `Prix: ${min} - ${max} TND`,
      value: { min: filters.price_min, max: filters.price_max },
    });
  }

  // Si aucun filtre actif, ne rien afficher
  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700">
        Filtres actifs:
      </span>

      <AnimatePresence mode="popLayout">
        {activeFilters.map((filter, index) => (
          <motion.button
            key={`${filter.key}-${filter.value}`}
            custom={index}
            variants={chipAppear}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
            onClick={() => {
              // Pour le filtre prix, retirer les deux
              if (filter.key === 'price_min') {
                onRemoveFilter('price_min');
                onRemoveFilter('price_max');
              } else {
                onRemoveFilter(filter.key);
              }
            }}
            className="
              inline-flex items-center gap-2
              px-3 py-1.5
              bg-primary text-white
              rounded-full text-sm font-medium
              hover:bg-primary-dark
              transition-colors duration-200
              active:scale-95
            "
          >
            <span>{filter.label}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Bouton "Tout effacer" si > 1 filtre */}
      {activeFilters.length > 1 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={onClearAll}
          className="
            text-sm font-medium text-gray-600
            hover:text-primary
            underline
            transition-colors
          "
        >
          Tout effacer
        </motion.button>
      )}
    </div>
  );
};

export default ActiveFilterChips;
