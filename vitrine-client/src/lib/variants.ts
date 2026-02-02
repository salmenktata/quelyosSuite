/**
 * Utilitaires pour la gestion des variantes produits
 * Cache intelligent avec TTL 5 minutes
 */

import { VariantsResponse } from '@quelyos/types';
import { backendClient } from './backend/client';
import { logger } from '@/lib/logger';

// Cache globale avec TTL 5 minutes
const variantsCache = new Map<number, {
  data: VariantsResponse;
  timestamp: number;
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes en millisecondes

/**
 * Fetch lazy des variantes avec système de cache
 * Utilisé pour optimiser les performances sur la page catalogue
 */
export async function fetchVariantsLazy(productId: number): Promise<VariantsResponse | null> {
  try {
    // Vérifier le cache
    const cached = variantsCache.get(productId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    // Fetch depuis l'API
    const response = await backendClient.getProductVariants(productId);

    // Stocker en cache si succès
    if (response.success) {
      const variantsResponse = { ...response, product_id: productId };
      variantsCache.set(productId, {
        data: variantsResponse as unknown as VariantsResponse,
        timestamp: Date.now(),
      });
      return variantsResponse as unknown as VariantsResponse;
    }

    return null;
  } catch (_error) {
    logger.error(`Erreur lors de la récupération des variantes du produit ${productId}:`, error);
    return null;
  }
}

/**
 * Nettoyer le cache (utile pour tests ou après mise à jour produit)
 */
export function clearVariantsCache(productId?: number) {
  if (productId) {
    variantsCache.delete(productId);
  } else {
    variantsCache.clear();
  }
}

/**
 * Mapping des noms de couleurs vers codes hexadécimaux
 * Réutilisé de ProductCard.tsx pour cohérence
 */
export const colorToHex: Record<string, string> = {
  // Français
  'noir': '#000000',
  'blanc': '#FFFFFF',
  'rouge': '#EF4444',
  'bleu': '#3B82F6',
  'vert': '#22C55E',
  'jaune': '#EAB308',
  'orange': '#F97316',
  'rose': '#EC4899',
  'violet': '#8B5CF6',
  'gris': '#6B7280',
  'marron': '#92400E',
  'beige': '#D4B896',
  // English
  'black': '#000000',
  'white': '#FFFFFF',
  'red': '#EF4444',
  'blue': '#3B82F6',
  'green': '#22C55E',
  'yellow': '#EAB308',
  // 'orange': already defined in French section (same word)
  'pink': '#EC4899',
  'purple': '#8B5CF6',
  'gray': '#6B7280',
  'grey': '#6B7280',
  'brown': '#92400E',
};

/**
 * Déterminer si une couleur est claire (pour ajouter une bordure)
 */
export function isLightColor(hex: string): boolean {
  if (!hex || !hex.startsWith('#')) return false;

  const rgb = hexToRgb(hex);
  if (!rgb) return false;

  // Calcul de la luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.7;
}

/**
 * Convertir hex en RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

/**
 * Obtenir la couleur hex depuis un nom de couleur
 */
export function getColorHex(colorName: string): string {
  const normalized = colorName.toLowerCase().trim();
  return colorToHex[normalized] || '#9CA3AF'; // Fallback gris
}
