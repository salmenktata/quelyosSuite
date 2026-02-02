'use client';

import { useState, type ReactNode, Children, isValidElement } from 'react';

interface SolutionsFilterProps {
  categories: string[];
  children: ReactNode;
}

export default function SolutionsFilter({ categories, children }: SolutionsFilterProps) {
  const [active, setActive] = useState('Tous');

  const filteredChildren = Children.toArray(children).filter((child) => {
    if (active === 'Tous') return true;
    if (isValidElement<{ 'data-category'?: string }>(child)) {
      return child.props['data-category'] === active;
    }
    return true;
  });

  return (
    <>
      {/* Barre de filtres */}
      <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
              active === cat
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'border border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grille filtrée */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredChildren}
      </div>
    </>
  );
}
