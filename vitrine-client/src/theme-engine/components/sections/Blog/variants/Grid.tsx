'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ThemeContextValue } from '../../../../engine/types';
import { Calendar, User, ArrowRight } from 'lucide-react';

interface GridProps {
  config?: Record<string, unknown>;
  className?: string;
  theme: ThemeContextValue;
}

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  author: string;
  date: string;
  category: string;
  slug: string;
}

export default function Grid({ config, className = '', theme }: GridProps) {
  const title = (config?.title as string) || 'Actualités & Conseils';
  const subtitle = (config?.subtitle as string) || 'Découvrez nos derniers articles';
  const limit = (config?.limit as number) || 3;

  // Mock data (sera remplacé par données backend)
  const posts: BlogPost[] = Array.from({ length: limit }, (_, i) => ({
    id: i + 1,
    title: `10 Tendances Mode ${2026 + i}`,
    excerpt: 'Découvrez les tendances qui marqueront cette année et comment les adopter avec style.',
    image: `/images/blog/post-${(i % 3) + 1}.jpg`,
    author: 'Sarah Martin',
    date: '15 Jan 2026',
    category: 'Mode',
    slug: `tendances-mode-${2026 + i}`,
  }));

  return (
    <section className={`py-16 md:py-24 bg-gray-50 dark:bg-gray-800 ${className}`}>
      <div
        className="container mx-auto px-4"
        style={{ maxWidth: theme.spacing.containerWidth }}
      >
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white"
            style={{ fontFamily: `var(--theme-font-headings)` }}
          >
            {title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 relative">
                <Image
                  src={post.image || 'https://via.placeholder.com/600x400?text=Blog+Post'}
                  alt={post.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="p-6">
                <div
                  className="inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3"
                  style={{
                    backgroundColor: `${theme.colors.primary}20`,
                    color: theme.colors.primary,
                  }}
                >
                  {post.category}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                  {post.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <User size={16} />
                    {post.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    {post.date}
                  </span>
                </div>
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 font-semibold hover:gap-3 transition-all"
                  style={{ color: theme.colors.primary }}
                >
                  Lire la suite
                  <ArrowRight size={18} />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="/blog"
            className="inline-block px-8 py-3 rounded-lg font-semibold transition-all hover:scale-105"
            style={{
              backgroundColor: theme.colors.primary,
              color: '#ffffff',
            }}
          >
            Voir tous les articles
          </a>
        </div>
      </div>
    </section>
  );
}
