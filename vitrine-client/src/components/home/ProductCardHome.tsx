'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@quelyos/types';
import { useToast } from '@/store/toastStore';
import { getProxiedImageUrl } from '@/lib/image-proxy';

export function ProductCardHome({ product }: { product: Product }) {
  const toast = useToast();

  // Prix du produit (API anonymisée retourne 'price')
  const listPrice = product.price ?? 0;
  const comparePrice = product.compare_at_price ?? 0;

  const discountPercent = comparePrice > 0 && listPrice > 0
    ? Math.round((1 - listPrice / comparePrice) * 100)
    : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.success(`${product.name} ajoute au panier !`);
  };

  return (
    <div className="group" data-testid="product-card">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-primary/20 transition-all duration-300 transform hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <Link href={`/products/${product.slug || product.id}`}>
            {product.image_url ? (
              <Image
                src={getProxiedImageUrl(product.image_url)}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
                unoptimized={getProxiedImageUrl(product.image_url).startsWith('/api/')}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                </svg>
              </div>
            )}
          </Link>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {discountPercent > 0 && (
              <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-lg backdrop-blur-sm">
                -{discountPercent}%
              </span>
            )}
            {product.is_new && (
              <span className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-lg backdrop-blur-sm">
                NOUVEAU
              </span>
            )}
          </div>

          {/* Bouton Ajout Panier */}
          <div className="absolute bottom-3 left-3 right-3 hidden lg:block opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handleQuickAdd}
              disabled={!product.in_stock}
              className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-primary-dark transition-colors shadow-lg flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {product.in_stock ? 'Ajouter' : 'Rupture'}
            </button>
          </div>
        </div>

        {/* Infos */}
        <Link href={`/products/${product.slug || product.id}`} className="block p-4">
          {product.sku && (
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1.5">
              {product.sku}
            </div>
          )}

          <h3 className="font-semibold text-base text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-tight">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-xl font-bold text-primary">
              {listPrice.toFixed(2)} <span className="text-sm font-normal">{product.currency?.symbol || 'TND'}</span>
            </span>
            {comparePrice > 0 && (
              <span className="text-sm text-gray-400 line-through">
                {comparePrice.toFixed(2)} {product.currency?.symbol || 'TND'}
              </span>
            )}
          </div>

          {product.stock_qty !== undefined && (
            <div className="mt-2">
              {product.stock_qty > 10 ? (
                <div className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-md">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span className="font-medium">En stock</span>
                </div>
              ) : product.stock_qty > 0 ? (
                <div className="inline-flex items-center gap-1.5 text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-md">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Plus que {product.stock_qty}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-xs bg-red-50 text-red-700 px-2 py-1 rounded-md">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  <span className="font-medium">Rupture</span>
                </div>
              )}
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}
