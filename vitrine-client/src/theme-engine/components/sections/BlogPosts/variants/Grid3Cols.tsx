'use client';

import Image from 'next/image';

import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';
import type { ThemeContextValue } from '../../../../engine/types';

interface Grid3ColsProps {
  config?: Record<string, unknown>;
  className?: string;
  theme: ThemeContextValue;
}

const MOCK_POSTS = [
  {
    id: 1,
    title: 'Les Tendances Mode 2026',
    excerpt: 'Découvrez les couleurs et styles qui marqueront cette année',
    date: '15 Jan 2026',
    image: '',
    slug: 'tendances-mode-2026',
  },
  {
    id: 2,
    title: 'Guide des Tailles',
    excerpt: 'Comment bien choisir votre taille pour un confort optimal',
    date: '10 Jan 2026',
    image: '',
    slug: 'guide-des-tailles',
  },
  {
    id: 3,
    title: 'Conseils Entretien',
    excerpt: 'Prendre soin de vos vêtements pour qu ils durent plus longtemps',
    date: '5 Jan 2026',
    image: '',
    slug: 'conseils-entretien',
  },
];

export default function Grid3Cols({ config, className = '', theme }: Grid3ColsProps) {
  const title = (config?.title as string) || 'Nos Derniers Articles';
  const posts = (config?.posts as typeof MOCK_POSTS) || MOCK_POSTS;

  return (
    <section className={`py-16 md:py-24 bg-white dark:bg-gray-900 ${className}`}>
      <div className="container mx-auto px-4" style={{ maxWidth: theme.spacing.containerWidth }}>
        <h2
          className="text-3xl md:text-5xl font-bold text-center mb-12 text-gray-900 dark:text-white"
          style={{ fontFamily: `var(--theme-font-headings)` }}
        >
          {title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-xl transition-all"
            >
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                {post.image ? (
                  <Image src={post.image} alt={post.title} width={600} height={400} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" style={{width: "auto", height: "auto"}} unoptimized />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: theme.colors.muted }}
                  >
                    <span className="text-white text-4xl font-bold opacity-20">{post.title.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <Calendar className="h-4 w-4" />
                  <span>{post.date}</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{post.excerpt}</p>
                <div className="flex items-center gap-2 font-semibold" style={{ color: theme.colors.primary }}>
                  Lire la suite
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
