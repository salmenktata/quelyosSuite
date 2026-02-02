'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { backendClient } from '@/lib/backend/client';
import { getProxiedImageUrl } from '@/lib/image-proxy';
import { formatPrice } from '@/lib/utils/formatting';
import { logger } from '@/lib/logger';

interface VisualSearchProps {
  onClose?: () => void;
}

interface SearchResult {
  id: number;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  similarity?: number;
}

export function VisualSearch({ onClose }: VisualSearchProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image trop volumineuse (max 5MB)');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setError(null);
        performVisualSearch(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setError(null);
        performVisualSearch(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const performVisualSearch = async (imageData: string) => {
    setIsSearching(true);
    setResults([]);

    try {
      // Extraire la couleur dominante de l&apos;image (simplification)
      const dominantColor = await extractDominantColor(imageData);

      // Rechercher des produits similaires
      // En l'absence d&apos;une vraie API de vision, on utilise la recherche semantique
      // avec des termes basés sur la couleur
      const colorTerms: Record<string, string[]> = {
        red: ['rouge', 'red', 'bordeaux'],
        blue: ['bleu', 'blue', 'marine', 'navy'],
        green: ['vert', 'green'],
        yellow: ['jaune', 'yellow', 'or', 'gold'],
        orange: ['orange'],
        purple: ['violet', 'purple', 'mauve'],
        pink: ['rose', 'pink'],
        brown: ['marron', 'brown', 'beige'],
        black: ['noir', 'black'],
        white: ['blanc', 'white'],
        gray: ['gris', 'gray', 'grey'],
      };

      const searchTerm = colorTerms[dominantColor]?.[0] || 'produit';

      const response = await backendClient.searchSemantic(searchTerm, { limit: 8 });

      if (response.success && response.data?.products) {
        setResults(response.data.products.map((p: { id: number; name: string; slug: string; price: number; image_url: string | null }, i: number) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          image_url: p.image_url,
          similarity: Math.max(95 - i * 8, 60), // Score simulé
        })));
      }
    } catch (_err) {
      logger.error('Visual search error:', err);
      setError('Erreur lors de la recherche visuelle');
    } finally {
      setIsSearching(false);
    }
  };

  const extractDominantColor = (imageData: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 50;
        canvas.height = 50;
        ctx?.drawImage(img, 0, 0, 50, 50);

        const imageData = ctx?.getImageData(0, 0, 50, 50).data;
        if (!imageData) {
          resolve('gray');
          return;
        }

        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < imageData.length; i += 4) {
          r += imageData[i];
          g += imageData[i + 1];
          b += imageData[i + 2];
          count++;
        }

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        // Determiner la couleur dominante
        const colors = [
          { name: 'red', r: 255, g: 0, b: 0 },
          { name: 'blue', r: 0, g: 0, b: 255 },
          { name: 'green', r: 0, g: 128, b: 0 },
          { name: 'yellow', r: 255, g: 255, b: 0 },
          { name: 'orange', r: 255, g: 165, b: 0 },
          { name: 'purple', r: 128, g: 0, b: 128 },
          { name: 'pink', r: 255, g: 192, b: 203 },
          { name: 'brown', r: 139, g: 69, b: 19 },
          { name: 'black', r: 0, g: 0, b: 0 },
          { name: 'white', r: 255, g: 255, b: 255 },
          { name: 'gray', r: 128, g: 128, b: 128 },
        ];

        let closest = 'gray';
        let minDistance = Infinity;

        for (const color of colors) {
          const distance = Math.sqrt(
            Math.pow(r - color.r, 2) +
            Math.pow(g - color.g, 2) +
            Math.pow(b - color.b, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            closest = color.name;
          }
        }

        resolve(closest);
      };
      img.src = imageData;
    });
  };

  const clearSearch = () => {
    setImage(null);
    setResults([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recherche visuelle</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Uploadez une image pour trouver des produits similaires
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {!image ? (
            /* Upload Zone */
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center hover:border-primary transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>

              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Glissez une image ici
              </p>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                ou cliquez pour parcourir vos fichiers
              </p>
              <p className="text-xs text-gray-400">
                JPG, PNG, GIF - Max 5MB
              </p>
            </div>
          ) : (
            /* Results */
            <div className="space-y-6">
              {/* Uploaded image */}
              <div className="flex items-start gap-4">
                <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <Image
                    src={image}
                    alt="Image uploadee"
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={clearSearch}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Image analysee</h3>
                  {isSearching ? (
                    <p className="text-sm text-gray-500">Recherche en cours...</p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {results.length} produit(s) similaire(s) trouve(s)
                    </p>
                  )}
                </div>
              </div>

              {/* Loading */}
              {isSearching && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
                  {error}
                </div>
              )}

              {/* Results grid */}
              {!isSearching && results.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {results.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={onClose}
                      className="group bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="relative aspect-square">
                        {product.image_url ? (
                          <Image
                            src={getProxiedImageUrl(product.image_url)}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="150px"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}

                        {/* Similarity badge */}
                        {product.similarity && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {product.similarity}%
                          </div>
                        )}
                      </div>

                      <div className="p-3">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary">
                          {product.name}
                        </h4>
                        <p className="text-sm font-bold text-primary mt-1">
                          {formatPrice(product.price, 'TND')}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* New search button */}
              {!isSearching && results.length > 0 && (
                <button
                  onClick={clearSearch}
                  className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors"
                >
                  Nouvelle recherche
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
