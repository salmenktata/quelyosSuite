'use client';

import Image from 'next/image';

import { useState } from 'react';
import Link from 'next/link';
import type { ThemeContextValue } from '../../../../engine/types';

interface TabbedProps {
  config?: Record<string, unknown>;
  className?: string;
  theme: ThemeContextValue;
}

const MOCK_TABS = [
  { id: 'nouveautes', label: 'Nouveautés' },
  { id: 'bestsellers', label: 'Meilleures Ventes' },
  { id: 'promos', label: 'Promotions' },
];

const MOCK_PRODUCTS = [
  { id: 1, name: 'Produit 1', price: 99.99, image: '', slug: 'produit-1' },
  { id: 2, name: 'Produit 2', price: 149.99, image: '', slug: 'produit-2' },
  { id: 3, name: 'Produit 3', price: 79.99, image: '', slug: 'produit-3' },
  { id: 4, name: 'Produit 4', price: 199.99, image: '', slug: 'produit-4' },
];

export default function Tabbed({ config, className = '', theme }: TabbedProps) {
  const title = (config?.title as string) || 'Nos Produits';
  const tabs = (config?.tabs as typeof MOCK_TABS) || MOCK_TABS;
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <section className={`py-16 md:py-24 bg-white dark:bg-gray-900 ${className}`}>
      <div className="container mx-auto px-4" style={{ maxWidth: theme.spacing.containerWidth }}>
        <h2
          className="text-3xl md:text-5xl font-bold text-center mb-8 text-gray-900 dark:text-white"
          style={{ fontFamily: `var(--theme-font-headings)` }}
        >
          {title}
        </h2>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? 'text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              style={activeTab === tab.id ? { backgroundColor: theme.colors.primary } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_PRODUCTS.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-xl transition-all"
            >
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                {product.image ? (
                  <Image src={product.image} alt={product.name} width={400} height={400} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" style={{width: "auto", height: "auto"}} unoptimized />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: theme.colors.muted }}
                  >
                    <span className="text-white text-4xl font-bold opacity-20">{product.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">{product.name}</h3>
                <p className="text-xl font-bold" style={{ color: theme.colors.primary }}>
                  {product.price.toFixed(2)} TND
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
