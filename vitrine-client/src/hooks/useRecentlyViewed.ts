/**
 * useRecentlyViewed - Hook pour tracker automatiquement les produits vus
 * À utiliser dans la page détail produit
 */

import { useEffect } from 'react';
import { useRecentlyViewedStore } from '@/store/recentlyViewedStore';
import type { Product } from '@quelyos/types';

interface UseRecentlyViewedOptions {
  /** Produit à tracker */
  product: Product | null;
  /** Délai avant d'enregistrer (ms) pour éviter les vues accidentelles */
  delay?: number;
}

/**
 * Hook qui enregistre automatiquement un produit comme "récemment vu"
 * Usage: useRecentlyViewed({ product })
 */
export const useRecentlyViewed = ({
  product,
  delay = 1000,
}: UseRecentlyViewedOptions) => {
  const { addProduct, clearOld } = useRecentlyViewedStore();

  useEffect(() => {
    // Nettoyer les anciens produits au mount
    clearOld();
  }, [clearOld]);

  useEffect(() => {
    if (!product) return;

    // Attendre le délai avant d'enregistrer (évite les vues accidentelles)
    const timer = setTimeout(() => {
      const mainImage = product.images?.find(img => img.is_main) || product.images?.[0];

      addProduct({
        id: product.id,
        slug: product.slug || String(product.id),
        name: product.name,
        price: product.price ?? 0,
        image_url: mainImage?.url || '',
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [product, delay, addProduct]);
};

export default useRecentlyViewed;
