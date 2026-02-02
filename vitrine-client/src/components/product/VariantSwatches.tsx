'use client';

import React, { useState, useEffect } from 'react';
import { Motion } from '@/components/common/Motion';
import { fetchVariantsLazy, getColorHex, isLightColor } from '@/lib/variants';
import { AttributeLine, ExtendedProductVariant } from '@quelyos/types';
import { logger } from '@/lib/logger';

// SVG CheckIcon inline
const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

interface VariantSwatchesProps {
  productId: number;
  onVariantSelect?: (variantId: number) => void;
  onImagePreview?: (imageUrl: string) => void;
  maxVisible?: number;
  maxAttributes?: number; // Nombre max d&apos;attributs à afficher
  size?: 'sm' | 'md';
  className?: string;
}

export function VariantSwatches({
  productId,
  onVariantSelect,
  onImagePreview,
  maxVisible = 5,
  maxAttributes = 2, // Par défaut : 2 attributs max sur page catalogue
  size = 'sm',
  className = '',
}: VariantSwatchesProps) {
  const [attributeLines, setAttributeLines] = useState<AttributeLine[]>([]);
  const [variants, setVariants] = useState<ExtendedProductVariant[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Tailles selon props
  const swatchSize = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';

  useEffect(() => {
    async function loadVariants() {
      setIsLoading(true);
      try {
        const response = await fetchVariantsLazy(productId);

        if (response && response.success) {
          setAttributeLines(response.attributes || []);
          setVariants(response.variants);
        }
      } catch (error) {
        logger.error('Error loading variants:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadVariants();
  }, [productId]);

  // Sélectionner les attributs à afficher avec ordre de priorité
  const displayedAttributes = React.useMemo(() => {
    if (!attributeLines?.length) return [];

    const ATTRIBUTE_PRIORITY = [
      { keywords: ['color', 'couleur'], weight: 1 },
      { keywords: ['size', 'taille'], weight: 2 },
      { keywords: ['shoes size', 'pointure', 'shoe size'], weight: 3 },
      { keywords: ['material', 'matériau', 'matiere', 'matière'], weight: 4 },
      { keywords: ['finish', 'finition', 'aspect'], weight: 5 },
      { keywords: ['style'], weight: 6 },
      { keywords: ['pattern', 'motif'], weight: 7 },
    ];

    const getAttributePriority = (attr: AttributeLine): number => {
      const attrNameLower = attr.attribute_name.toLowerCase();
      if (attr.display_type === 'color') return 1;
      for (const priority of ATTRIBUTE_PRIORITY) {
        if (priority.keywords.some(keyword => attrNameLower.includes(keyword))) {
          return priority.weight;
        }
      }
      return 999;
    };

    const sortedAttributes = [...attributeLines].sort((a, b) => {
      return getAttributePriority(a) - getAttributePriority(b);
    });

    return sortedAttributes.slice(0, maxAttributes);
  }, [attributeLines, maxAttributes]);

  // Fonction générique pour extraire valeurs uniques d&apos;un attribut
  const getAttributeValues = (attribute: AttributeLine) => {
    const valueMap = new Map<number, {
      valueId: number;
      name: string;
      hex?: string; // Seulement pour couleurs
      variant?: ExtendedProductVariant; // Première variante avec cette valeur
      inStock: boolean;
      count: number;
    }>();

    // 1. Initialiser avec TOUTES les valeurs depuis attributes
    //    (pour afficher même les attributs non-variant comme "Shoes size")
    attribute.values.forEach((value) => {
      let hexColor: string | undefined;
      if (attribute.display_type === 'color') {
        hexColor = value.html_color || getColorHex(value.name);
      }

      valueMap.set(value.id, {
        valueId: value.id,
        name: value.name,
        hex: hexColor,
        variant: undefined,
        inStock: false, // Par défaut pas en stock, sera mis à jour ci-dessous
        count: 0,
      });
    });

    // 2. Mettre à jour avec les infos des variantes (stock, première variante)
    variants.forEach((variant) => {
      const attrValue = variant.attribute_values?.find(
        (av) => av.attribute_id === attribute.attribute_id
      );

      if (attrValue) {
        const existing = valueMap.get(attrValue.value_id);

        if (existing) {
          // Mettre à jour stock et compteur
          valueMap.set(attrValue.value_id, {
            ...existing,
            count: existing.count + 1,
            inStock: existing.inStock || (variant.in_stock && (variant.stock_quantity || 0) > 0),
            variant: existing.variant || variant, // Garder première variante pour preview
          });
        }
      }
    });

    // 3. Pour les attributs qui ne sont pas dans les variantes (attributs non-variant),
    //    considérer comme "disponibles" s&apos;il y a au moins une variante en stock
    const hasStockVariant = variants.some(v => v.in_stock && (v.stock_quantity || 0) > 0);
    if (hasStockVariant) {
      valueMap.forEach((value, id) => {
        if (value.count === 0) {
          // Cet attribut n&apos;est pas présent dans les variantes
          // On le marque comme disponible avec la première variante en stock
          const firstStockVariant = variants.find(v => v.in_stock && (v.stock_quantity || 0) > 0);
          valueMap.set(id, {
            ...value,
            inStock: true,
            variant: firstStockVariant,
          });
        }
      });
    }

    // Trier les valeurs
    return Array.from(valueMap.values()).sort((a, b) => {
      // Tri numérique si possible (pour pointures)
      const aNum = parseFloat(a.name);
      const bNum = parseFloat(b.name);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      // Sinon tri alphabétique
      return a.name.localeCompare(b.name);
    });
  };

  const handleValueClick = (value: ReturnType<typeof getAttributeValues>[0]) => {
    if (value.variant) {
      setSelectedId(value.variant.id);
      onVariantSelect?.(value.variant.id);
    }
  };

  const handleValueHover = (value: ReturnType<typeof getAttributeValues>[0]) => {
    if (value.variant) {
      setHoveredId(value.variant.id);

      // Précharger l&apos;image
      if (typeof window !== 'undefined' && value.variant.image_url) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = value.variant.image_url;
        document.head.appendChild(link);
      }

      // Notifier le parent pour changer l&apos;image
      if (value.variant.image_url) {
        onImagePreview?.(value.variant.image_url);
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredId(null);
    onImagePreview?.(''); // Reset image preview
  };

  // Skeleton loading
  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-1.5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`${swatchSize} rounded-full bg-gray-200 animate-pulse`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Ne rien afficher si pas de variantes à montrer
  if (!displayedAttributes.length) {
    return null;
  }

  return (
    <Motion.div
      className={`space-y-2 ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onMouseLeave={handleMouseLeave}
    >
      {displayedAttributes.map((attribute) => {
        const values = getAttributeValues(attribute);
        const visibleValues = values.slice(0, maxVisible);
        const remainingCount = Math.max(0, values.length - maxVisible);
        const isColorAttribute = attribute.display_type === 'color';

        return (
          <div key={attribute.id} className="flex items-center gap-1.5">
            {/* Affichage type Swatches (couleurs) */}
            {isColorAttribute ? (
              <>
                <div
                  role="radiogroup"
                  aria-label={`Sélecteur ${attribute.attribute_name.toLowerCase()}`}
                  className="flex items-center gap-1.5"
                >
                  {visibleValues.map((value, index) => (
                    <Motion.button
                      key={value.valueId}
                      type="button"
                      role="radio"
                      aria-checked={selectedId === value.variant?.id}
                      aria-label={`${value.name}${value.inStock ? ', disponible' : ', épuisé'}`}
                      disabled={!value.inStock}
                      onClick={() => handleValueClick(value)}
                      onMouseEnter={() => handleValueHover(value)}
                      onFocus={() => handleValueHover(value)}
                      tabIndex={selectedId === value.variant?.id ? 0 : -1}
                      className={`
                        relative ${swatchSize} rounded-full transition-all duration-300
                        ${value.inStock ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                      `}
                      whileHover={value.inStock ? { scale: 1.15 } : {}}
                      whileTap={value.inStock ? { scale: 0.95 } : {}}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {/* Couleur du swatch */}
                      <div
                        className={`
                          w-full h-full rounded-full transition-all duration-300
                          ${value.hex && isLightColor(value.hex) ? 'border-2 border-gray-300' : 'border-2 border-transparent'}
                          ${hoveredId === value.variant?.id || selectedId === value.variant?.id
                            ? 'ring-2 ring-primary ring-offset-1'
                            : ''
                          }
                        `}
                        style={{ backgroundColor: value.hex || '#9CA3AF' }}
                      />

                      {/* Checkmark si sélectionné */}
                      {selectedId === value.variant?.id && (
                        <Motion.div
                          className="absolute inset-0 flex items-center justify-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        >
                          <CheckIcon className="w-3 h-3 text-white drop-shadow-lg" />
                        </Motion.div>
                      )}

                      {/* Tooltip au hover (desktop uniquement) */}
                      {hoveredId === value.variant?.id && (
                        <Motion.div
                          className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          {value.name}
                          {/* Petite flèche */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                        </Motion.div>
                      )}
                    </Motion.button>
                  ))}
                </div>

                {/* Compteur */}
                {remainingCount > 0 && (
                  <span className="text-xs text-gray-500">
                    +{remainingCount}
                  </span>
                )}
              </>
            ) : (
              /* Affichage type Pills (tailles, matériaux, etc.) */
              <>
                <div className="flex items-center gap-1 flex-wrap">
                  {visibleValues.map((value, index) => (
                    <Motion.span
                      key={value.valueId}
                      className={`
                        px-2 py-0.5 text-xs rounded-md border transition-colors
                        ${value.inStock
                          ? 'border-gray-300 text-gray-700 bg-white'
                          : 'border-gray-200 text-gray-400 bg-gray-50 line-through'
                        }
                      `}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      title={value.inStock ? `${value.name} disponible` : `${value.name} épuisé`}
                    >
                      {value.name}
                    </Motion.span>
                  ))}

                  {/* Compteur */}
                  {remainingCount > 0 && (
                    <span className="text-xs text-gray-500">
                      +{remainingCount}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </Motion.div>
  );
}
