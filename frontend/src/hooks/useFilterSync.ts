/**
 * useFilterSync - Hook pour synchroniser les filtres avec l'URL
 * Permet de partager des URLs avec filtres appliqués
 */

import { useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { ProductFilters } from '@/types';

interface UseFilterSyncOptions {
  /** Filtres actuels */
  filters: ProductFilters;
  /** Callback quand les filtres changent depuis l'URL */
  onFiltersChange: (filters: ProductFilters) => void;
  /** Activer/désactiver la synchronisation */
  enabled?: boolean;
}

/**
 * Hook pour synchroniser les filtres avec l'URL
 * Lecture au mount, écriture à chaque changement
 */
export const useFilterSync = ({
  filters,
  onFiltersChange,
  enabled = true,
}: UseFilterSyncOptions) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Lecture des filtres depuis l'URL au mount
  useEffect(() => {
    if (!enabled) return;

    const urlFilters: Partial<ProductFilters> = {};

    // Lire les paramètres
    const featured = searchParams.get('featured');
    const newProduct = searchParams.get('new');
    const bestseller = searchParams.get('bestseller');
    const categoryId = searchParams.get('category');
    const minPrice = searchParams.get('price_min');
    const maxPrice = searchParams.get('price_max');
    const sort = searchParams.get('sort');
    const search = searchParams.get('search');

    if (featured === 'true') urlFilters.is_featured = true;
    if (newProduct === 'true') urlFilters.is_new = true;
    if (bestseller === 'true') urlFilters.is_bestseller = true;
    if (categoryId) urlFilters.category_id = Number(categoryId);
    if (minPrice) urlFilters.price_min = Number(minPrice);
    if (maxPrice) urlFilters.price_max = Number(maxPrice);
    if (sort) urlFilters.sort = sort as any;
    if (search) urlFilters.search = search;

    // Appliquer les filtres si différents
    if (Object.keys(urlFilters).length > 0) {
      onFiltersChange({ ...filters, ...urlFilters });
    }
  }, []); // Exécuté une seule fois au mount

  // Écriture des filtres dans l'URL à chaque changement
  useEffect(() => {
    if (!enabled) return;

    const params = new URLSearchParams();

    // Construire les paramètres d'URL
    if (filters.search) params.set('search', filters.search);
    if (filters.is_featured) params.set('featured', 'true');
    if (filters.is_new) params.set('new', 'true');
    if (filters.is_bestseller) params.set('bestseller', 'true');
    if (filters.category_id) params.set('category', String(filters.category_id));
    if (filters.price_min) params.set('price_min', String(filters.price_min));
    if (filters.price_max) params.set('price_max', String(filters.price_max));
    if (filters.sort && filters.sort !== 'name') params.set('sort', filters.sort);

    // Construire la nouvelle URL
    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

    // Mettre à jour l'URL sans reload (shallow routing)
    router.replace(newUrl, { scroll: false });
  }, [filters, pathname, router, enabled]);

  return null;
};

export default useFilterSync;
