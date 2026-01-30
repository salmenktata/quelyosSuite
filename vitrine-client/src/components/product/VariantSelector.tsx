'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { VariantsResponse, ExtendedProductVariant } from '@quelyos/types';
import { ColorSwatch } from './ColorSwatch';
import { SizeButton } from './SizeButton';
import { getColorHex } from '@/lib/variants';

interface VariantSelectorProps {
  productId: number;
  variantsData: VariantsResponse;
  selectedVariant: ExtendedProductVariant | null;
  onVariantChange: (variant: ExtendedProductVariant) => void;
  onImagePreview?: (imageUrl: string) => void; // Callback pour changer l&apos;image au survol
  className?: string;
}

export function VariantSelector({
  productId,
  variantsData,
  selectedVariant,
  onVariantChange,
  onImagePreview,
  className = '',
}: VariantSelectorProps) {
  // État pour les attributs sélectionnés (ex: {couleur_id: value_id, taille_id: value_id})
  const [selectedAttributes, setSelectedAttributes] = useState<Record<number, number>>({});

  const { attributes, variants } = variantsData;

  // Initialiser la sélection avec la variante par défaut ou la première disponible
  useEffect(() => {
    if (selectedVariant && selectedVariant.attribute_values) {
      const initialSelection: Record<number, number> = {};
      selectedVariant.attribute_values.forEach((av) => {
        initialSelection[av.attribute_id] = av.value_id;
      });
      setSelectedAttributes(initialSelection);
    } else if (variants.length > 0) {
      // Sélectionner automatiquement la première variante disponible
      const firstVariant = variants.find(v => v.in_stock) || variants[0];
      if (firstVariant.attribute_values) {
        const initialSelection: Record<number, number> = {};
        firstVariant.attribute_values.forEach((av) => {
          initialSelection[av.attribute_id] = av.value_id;
        });
        setSelectedAttributes(initialSelection);
        onVariantChange(firstVariant);
      }
    }
  }, [productId, variants.length]);

  // Trouver la variante exacte correspondant à la sélection
  const matchingVariant = useMemo(() => {
    return variants.find((variant) => {
      if (!variant.attribute_values) return false;

      // Vérifier que tous les attributs sélectionnés correspondent
      return variant.attribute_values.every((av) =>
        selectedAttributes[av.attribute_id] === av.value_id
      );
    });
  }, [selectedAttributes, variants]);

  // Mettre à jour la variante sélectionnée quand la sélection change
  useEffect(() => {
    if (matchingVariant && matchingVariant !== selectedVariant) {
      onVariantChange(matchingVariant);
    }
  }, [matchingVariant]);

  // Déterminer quelles valeurs d&apos;attribut sont disponibles selon la sélection actuelle
  const getAvailableValues = (attributeId: number) => {
    if (!attributes) return new Set<number>();
    const attribute = attributes.find(a => a.attribute_id === attributeId);
    if (!attribute) return new Set<number>();

    // Si aucun attribut sélectionné, toutes les valeurs sont disponibles
    if (Object.keys(selectedAttributes).length === 0) {
      return new Set(attribute.values.map(v => v.id));
    }

    // Trouver les variantes qui correspondent aux autres attributs déjà sélectionnés
    const compatibleVariants = variants.filter((variant) => {
      if (!variant.attribute_values) return false;

      return Object.entries(selectedAttributes).every(([attrIdStr, valueId]) => {
        const attrId = parseInt(attrIdStr);
        // Ignorer l'attribut actuel qu&apos;on est en train de sélectionner
        if (attrId === attributeId) return true;

        const variantAttrValue = variant.attribute_values?.find(av => av.attribute_id === attrId);
        return variantAttrValue && variantAttrValue.value_id === valueId;
      });
    });

    // Extraire les valeurs d&apos;attribut disponibles depuis ces variantes
    const availableValueIds = new Set<number>();
    compatibleVariants.forEach((variant) => {
      const attrValue = variant.attribute_values?.find(av => av.attribute_id === attributeId);
      if (attrValue) {
        availableValueIds.add(attrValue.value_id);
      }
    });

    return availableValueIds;
  };

  // Handler pour la sélection d&apos;une valeur d&apos;attribut
  const handleAttributeSelect = (attributeId: number, valueId: number) => {
    setSelectedAttributes({
      ...selectedAttributes,
      [attributeId]: valueId,
    });
  };

  // Obtenir les détails d&apos;une variante spécifique pour une valeur d&apos;attribut
  const getVariantForAttributeValue = (attributeId: number, valueId: number): ExtendedProductVariant | undefined => {
    // Créer une sélection temporaire
    const tempSelection = {
      ...selectedAttributes,
      [attributeId]: valueId,
    };

    // Trouver une variante qui correspond
    return variants.find((variant) => {
      if (!variant.attribute_values) return false;
      return variant.attribute_values.every((av) =>
        tempSelection[av.attribute_id] === av.value_id
      );
    });
  };

  if (!attributes || !attributes.length) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {attributes.map((attributeLine) => {
        const availableValueIds = getAvailableValues(attributeLine.attribute_id);
        const isColorAttribute = attributeLine.display_type === 'color' ||
                                attributeLine.attribute_name.toLowerCase().includes('couleur') ||
                                attributeLine.attribute_name.toLowerCase().includes('color');

        return (
          <div key={attributeLine.attribute_id}>
            {/* Label de l'attribut */}
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              {attributeLine.attribute_name} :
              {selectedAttributes[attributeLine.attribute_id] && (
                <span className="ml-2 text-primary font-bold">
                  {attributeLine.values.find(v => v.id === selectedAttributes[attributeLine.attribute_id])?.name}
                </span>
              )}
            </h4>

            {/* Rendu conditionnel selon le type d&apos;attribut */}
            {isColorAttribute ? (
              // Swatches de couleur compacts style Zalando
              <div className="flex flex-wrap gap-2">
                {attributeLine.values.map((value) => {
                  const variantForValue = getVariantForAttributeValue(attributeLine.attribute_id, value.id);
                  const isAvailable = availableValueIds.has(value.id);
                  const isSelected = selectedAttributes[attributeLine.attribute_id] === value.id;
                  const inStock = variantForValue ? variantForValue.in_stock && (variantForValue.stock_quantity || 0) > 0 : false;

                  const colorHex = value.html_color || getColorHex(value.name);

                  return (
                    <ColorSwatch
                      key={value.id}
                      color={colorHex}
                      colorName={value.name}
                      selected={isSelected}
                      disabled={!isAvailable || !inStock}
                      onClick={() => handleAttributeSelect(attributeLine.attribute_id, value.id)}
                      onHover={() => {
                        // Changer l&apos;image au survol (comme Zalando)
                        const imageUrl = variantForValue?.images?.[0]?.url || variantForValue?.image_url;
                        if (imageUrl) {
                          onImagePreview?.(imageUrl);
                        }
                      }}
                      onLeave={() => {
                        // Retour à l&apos;image de la variante sélectionnée
                        onImagePreview?.('');
                      }}
                      size="md"
                    />
                  );
                })}
              </div>
            ) : (
              // Boutons de taille/attribut style Zalando
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {attributeLine.values.map((value) => {
                  const variantForValue = getVariantForAttributeValue(attributeLine.attribute_id, value.id);
                  const isAvailable = availableValueIds.has(value.id);
                  const isSelected = selectedAttributes[attributeLine.attribute_id] === value.id;
                  const inStock = variantForValue ? variantForValue.in_stock && (variantForValue.stock_quantity || 0) > 0 : false;

                  return (
                    <SizeButton
                      key={value.id}
                      label={value.name}
                      selected={isSelected}
                      disabled={!isAvailable || !inStock}
                      onClick={() => handleAttributeSelect(attributeLine.attribute_id, value.id)}
                      stockInfo={{
                        inStock: inStock,
                        qty: variantForValue?.stock_quantity,
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
