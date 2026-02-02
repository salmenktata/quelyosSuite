'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { backendClient } from '@/lib/backend/client';
import { logger } from '@/lib/logger';

interface PriceRange {
  min: number;
  max: number;
  count: number;
  label: string;
}

interface AttributeValue {
  value: string;
  count: number;
}

interface Brand {
  name: string;
  count: number;
}

interface Facets {
  price_ranges: PriceRange[];
  attributes: Record<string, AttributeValue[]>;
  brands: Brand[];
  total_products: number;
}

interface AppliedFilters {
  priceRanges: string[];
  attributes: Record<string, string[]>;
  brands: string[];
}

interface ProductFiltersProps {
  categoryId?: number;
  onFiltersChange?: (filters: AppliedFilters) => void;
}

/**
 * Product Filters Component (Faceted Search)
 * Displays filter options with counts and applies filters via URL params
 * Features:
 * - Price range filters
 * - Attribute filters (Color, Size, etc.)
 * - Brand filters
 * - URL synchronization
 * - Loading states
 */
export function ProductFilters({ categoryId, onFiltersChange }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [facets, setFacets] = useState<Facets | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    price: true,
    attributes: true,
    brands: true,
  });

  // Parse current filters from URL
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({});
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  useEffect(() => {
    loadFacets();
    parseFiltersFromURL();
  }, [categoryId]);

  useEffect(() => {
    // Notify parent of filter changes
    if (onFiltersChange) {
      onFiltersChange({
        priceRanges: selectedPriceRanges,
        attributes: selectedAttributes,
        brands: selectedBrands,
      });
    }
  }, [selectedPriceRanges, selectedAttributes, selectedBrands]);

  const parseFiltersFromURL = () => {
    // Parse price ranges
    const priceParam = searchParams.get('price');
    if (priceParam) {
      setSelectedPriceRanges(priceParam.split(','));
    }

    // Parse attributes (e.g., ?color=red,blue&size=M,L)
    const attrs: Record<string, string[]> = {};
    searchParams.forEach((value, key) => {
      if (key !== 'price' && key !== 'brand' && key !== 'category' && key !== 'sort') {
        attrs[key] = value.split(',');
      }
    });
    setSelectedAttributes(attrs);

    // Parse brands
    const brandParam = searchParams.get('brand');
    if (brandParam) {
      setSelectedBrands(brandParam.split(','));
    }
  };

  const loadFacets = async () => {
    try {
      setLoading(true);

      const response = await backendClient.getProductFacets(categoryId);

      if (response.success && response.data) {
        setFacets(response.data as unknown as Facets);
      }
    } catch (error) {
      logger.error('Error loading facets:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateURL = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Apply updates
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Navigate with new params
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handlePriceRangeToggle = (range: PriceRange) => {
    const rangeKey = `${range.min}-${range.max}`;
    const newSelected = selectedPriceRanges.includes(rangeKey)
      ? selectedPriceRanges.filter((r) => r !== rangeKey)
      : [...selectedPriceRanges, rangeKey];

    setSelectedPriceRanges(newSelected);
    updateURL({ price: newSelected.length > 0 ? newSelected.join(',') : null });
  };

  const handleAttributeToggle = (attributeName: string, value: string) => {
    const attrKey = attributeName.toLowerCase();
    const currentValues = selectedAttributes[attrKey] || [];

    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    const newAttributes = { ...selectedAttributes };
    if (newValues.length > 0) {
      newAttributes[attrKey] = newValues;
    } else {
      delete newAttributes[attrKey];
    }

    setSelectedAttributes(newAttributes);
    updateURL({ [attrKey]: newValues.length > 0 ? newValues.join(',') : null });
  };

  const handleBrandToggle = (brandName: string) => {
    const newSelected = selectedBrands.includes(brandName)
      ? selectedBrands.filter((b) => b !== brandName)
      : [...selectedBrands, brandName];

    setSelectedBrands(newSelected);
    updateURL({ brand: newSelected.length > 0 ? newSelected.join(',') : null });
  };

  const clearAllFilters = () => {
    setSelectedPriceRanges([]);
    setSelectedAttributes({});
    setSelectedBrands([]);

    // Clear all filter params from URL
    const params = new URLSearchParams(searchParams.toString());
    ['price', 'brand'].forEach((key) => params.delete(key));

    // Clear attribute params
    Object.keys(selectedAttributes).forEach((key) => params.delete(key));

    router.push(`?${params.toString()}`, { scroll: false });
  };

  const hasActiveFilters =
    selectedPriceRanges.length > 0 ||
    Object.keys(selectedAttributes).length > 0 ||
    selectedBrands.length > 0;

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
            <div className="h-8 w-full animate-pulse rounded bg-gray-200"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!facets) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Filtres</h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-primary hover:underline"
          >
            Tout effacer
          </button>
        )}
      </div>

      {/* Total Products */}
      <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
        <span className="font-semibold">{facets.total_products}</span> produit
        {facets.total_products > 1 ? 's' : ''} trouvé{facets.total_products > 1 ? 's' : ''}
      </div>

      {/* Price Ranges */}
      {facets.price_ranges.length > 0 && (
        <div className="border-b pb-6">
          <button
            onClick={() => setExpanded({ ...expanded, price: !expanded.price })}
            className="mb-4 flex w-full items-center justify-between text-left font-semibold text-gray-900"
          >
            Prix
            <svg
              className={`h-5 w-5 transition-transform ${
                expanded.price ? 'rotate-180' : ''
              }`}
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
          </button>

          {expanded.price && (
            <div className="space-y-2">
              {facets.price_ranges.map((range) => {
                const rangeKey = `${range.min}-${range.max}`;
                const isSelected = selectedPriceRanges.includes(rangeKey);

                return (
                  <label
                    key={rangeKey}
                    className="flex cursor-pointer items-center gap-3 text-sm text-gray-700 hover:text-primary"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handlePriceRangeToggle(range)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="flex-1">{range.label}</span>
                    <span className="text-xs text-gray-500">({range.count})</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Attributes */}
      {Object.entries(facets.attributes).map(([attrName, values]) => {
        const attrKey = attrName.toLowerCase();
        const selectedValues = selectedAttributes[attrKey] || [];

        return (
          <div key={attrName} className="border-b pb-6">
            <button
              onClick={() =>
                setExpanded({ ...expanded, [attrName]: !expanded[attrName] })
              }
              className="mb-4 flex w-full items-center justify-between text-left font-semibold text-gray-900"
            >
              {attrName}
              <svg
                className={`h-5 w-5 transition-transform ${
                  expanded[attrName] ? 'rotate-180' : ''
                }`}
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
            </button>

            {expanded[attrName] && (
              <div className="space-y-2">
                {values.map((item) => {
                  const isSelected = selectedValues.includes(item.value);

                  return (
                    <label
                      key={item.value}
                      className="flex cursor-pointer items-center gap-3 text-sm text-gray-700 hover:text-primary"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleAttributeToggle(attrName, item.value)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="flex-1">{item.value}</span>
                      <span className="text-xs text-gray-500">({item.count})</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Brands */}
      {facets.brands.length > 0 && (
        <div className="border-b pb-6">
          <button
            onClick={() => setExpanded({ ...expanded, brands: !expanded.brands })}
            className="mb-4 flex w-full items-center justify-between text-left font-semibold text-gray-900"
          >
            Marques
            <svg
              className={`h-5 w-5 transition-transform ${
                expanded.brands ? 'rotate-180' : ''
              }`}
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
          </button>

          {expanded.brands && (
            <div className="space-y-2">
              {facets.brands.map((brand) => {
                const isSelected = selectedBrands.includes(brand.name);

                return (
                  <label
                    key={brand.name}
                    className="flex cursor-pointer items-center gap-3 text-sm text-gray-700 hover:text-primary"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleBrandToggle(brand.name)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="flex-1">{brand.name}</span>
                    <span className="text-xs text-gray-500">({brand.count})</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
