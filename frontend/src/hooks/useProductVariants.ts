/**
 * Hook custom pour gérer la logique des variantes de produits
 * Centralise le fetch, la sélection et la synchronisation des données (prix, stock, images)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Product, VariantsResponse, ExtendedProductVariant, ProductImage } from '@quelyos/types';
import { logger } from '@/lib/logger';

interface UseProductVariantsReturn {
  // État
  variantsData: VariantsResponse | null;
  selectedVariant: ExtendedProductVariant | null;
  selectedVariantId: number | null;
  isLoadingVariants: boolean;

  // Données calculées (synchronisées avec la variante sélectionnée)
  displayPrice: number;
  displayStock: boolean;
  displayStockQty: number;
  displayImages: ProductImage[];

  // Actions
  handleVariantChange: (variant: ExtendedProductVariant) => void;
}

export function useProductVariants(product: Product | null): UseProductVariantsReturn {
  const [variantsData, setVariantsData] = useState<VariantsResponse | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);

  // Fetch des variantes enrichies si le produit a des variantes
  useEffect(() => {
    if (!product) return;

    if (product.variant_count && product.variant_count > 1) {
      fetchVariants(product.id);
    } else if (product.variants && product.variants.length > 0) {
      // Produit sans variantes multiples : sélectionner le premier variant
      setSelectedVariantId(product.variants[0].id);
    }
  }, [product?.id]);

  const fetchVariants = async (productId: number) => {
    setIsLoadingVariants(true);
    try {
      // Appel direct à l'API via proxy Next.js
      const apiBase = typeof window !== 'undefined' ? '/api/odoo' : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8069';
      const url = `${apiBase}/products/${productId}/variants`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      // Si 404, l'endpoint n'existe pas (produit sans variantes) - pas d'erreur
      if (res.status === 404) {
        logger.debug(`Endpoint variantes non trouvé pour produit ${productId} (probablement sans variantes)`);
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const response: VariantsResponse = await res.json();

      if (response.success) {
        setVariantsData(response);

        // Sélectionner automatiquement la première variante en stock
        const firstInStockVariant = response.data.variants.find(
          (v: ExtendedProductVariant) => v.in_stock && (v.qty_available || 0) > 0
        );
        const defaultVariant = firstInStockVariant || response.data.variants[0];

        if (defaultVariant) {
          setSelectedVariantId(defaultVariant.id);
        }
      }
    } catch (error) {
      logger.error('Erreur chargement variantes:', error);
    } finally {
      setIsLoadingVariants(false);
    }
  };

  // Trouver la variante sélectionnée dans les données enrichies
  const selectedVariant = useMemo(() => {
    if (!selectedVariantId) return null;

    // Chercher d'abord dans variantsData (données enrichies)
    if (variantsData?.data.variants) {
      const variant = variantsData.data.variants.find(v => v.id === selectedVariantId);
      if (variant) return variant;
    }

    // Fallback: chercher dans product.variants (données de base)
    if (product?.variants) {
      const variant = product.variants.find(v => v.id === selectedVariantId);
      if (variant) return variant as ExtendedProductVariant;
    }

    return null;
  }, [selectedVariantId, variantsData, product]);

  // Calculer le prix affiché (variante sélectionnée > produit)
  const displayPrice = useMemo(() => {
    if (selectedVariant) {
      return selectedVariant.list_price ?? selectedVariant.price ?? 0;
    }
    return product?.list_price ?? product?.price ?? 0;
  }, [selectedVariant, product]);

  // Calculer le stock affiché
  const displayStock = useMemo(() => {
    if (selectedVariant) {
      return selectedVariant.in_stock && (selectedVariant.qty_available || 0) > 0;
    }
    return product?.in_stock ?? false;
  }, [selectedVariant, product]);

  const displayStockQty = useMemo(() => {
    if (selectedVariant) {
      return selectedVariant.qty_available ?? 0;
    }
    return product?.stock_qty ?? 0;
  }, [selectedVariant, product]);

  // Calculer les images affichées (variante > produit)
  const displayImages = useMemo<ProductImage[]>(() => {
    // Priorité 1: Images de la variante sélectionnée
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
      return selectedVariant.images;
    }

    // Priorité 2: Image URL de la variante (si disponible)
    if (selectedVariant?.image_url) {
      return [{
        id: selectedVariant.id,
        url: selectedVariant.image_url,
        alt: selectedVariant.name || 'Variante produit',
        is_main: true,
        sequence: 0,
      }];
    }

    // Priorité 3: Images du produit
    if (product?.images && product.images.length > 0) {
      return product.images;
    }

    // Fallback: placeholder
    return [{
      id: 0,
      url: '/placeholder-product.svg',
      alt: 'Image produit',
      is_main: true,
      sequence: 0,
    }];
  }, [selectedVariant, product]);

  // Handler pour changement de variante
  const handleVariantChange = useCallback((variant: ExtendedProductVariant) => {
    setSelectedVariantId(variant.id);
  }, []);

  return {
    variantsData,
    selectedVariant,
    selectedVariantId,
    isLoadingVariants,
    displayPrice,
    displayStock,
    displayStockQty,
    displayImages,
    handleVariantChange,
  };
}
