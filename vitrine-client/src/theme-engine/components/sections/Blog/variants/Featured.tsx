'use client';

import Image from 'next/image';
import type { ThemeContextValue } from '../../../../engine/types';
import { Calendar, User, ArrowRight } from 'lucide-react';

interface FeaturedProps {
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
  isFeatured?: boolean;
}

export default function Featured({ config, className = '', theme }: FeaturedProps) {
  const title = (config?.title as string) || 'Derniers Articles';

  // Mock data
  const posts: BlogPost[] = [
    {
      id: 1,
      title: 'Le Guide Ultime de la Mode Durable',
      excerpt: 'Découvrez comment adopter une garde-robe éco-responsable sans compromettre votre style. Conseils pratiques et marques recommandées.',
      image: '/images/blog/featured-1.jpg',
      author: 'Sarah Martin',
      date: '15 Jan 2026',
      category: 'Mode Durable',
      slug: 'guide-mode-durable',
      isFeatured: true,
    },
    {
      id: 2,
      title: 'Tendances Printemps-Été 2026',
      excerpt: 'Les couleurs, coupes et matières qui feront sensation cette saison.',
      image: '/images/blog/post-2.jpg',
      author: 'Marie Dubois',
      date: '12 Jan 2026',
      category: 'Tendances',
      slug: 'tendances-pe-2026',
    },
    {
      id: 3,
      title: 'Comment Bien Entretenir Vos Vêtements',
      excerpt: 'Prolongez la durée de vie de vos pièces favorites avec nos astuces.',
      image: '/images/blog/post-3.jpg',
      author: 'Lucas Renard',
      date: '10 Jan 2026',
      category: 'Conseils',
      slug: 'entretien-vetements',
    },
  ];

  const featuredPost = posts.find((p) => p.isFeatured) || posts[0];
  const otherPosts = posts.filter((p) => p.id !== featuredPost.id);

  return (
    <section className={`py-16 md:py-24 bg-white dark:bg-gray-900 ${className}`}>
      <div
        className="container mx-auto px-4"
        style={{ maxWidth: theme.spacing.containerWidth }}
      >
        <h2
          className="text-3xl md:text-5xl font-bold mb-12 text-center text-gray-900 dark:text-white"
          style={{ fontFamily: `var(--theme-font-headings)` }}
        >
          {title}
        </h2>

        {/* Featured Post */}
        <article className="grid md:grid-cols-2 gap-8 mb-12 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-xl transition-shadow">
          <div className="aspect-video md:aspect-auto relative">
            <Image
              src={featuredPost.image || 'https://via.placeholder.com/800x600?text=Featured+Post'}
              alt={featuredPost.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="p-8 flex flex-col justify-center">
            <div
              className="inline-block self-start px-4 py-2 rounded-full text-sm font-semibold mb-4"
              style={{
                backgroundColor: theme.colors.primary,
                color: '#ffffff',
              }}
            >
              {featuredPost.category}
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              {featuredPost.title}
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              {featuredPost.excerpt}
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-500 mb-6">
              <span className="flex items-center gap-2">
                <User size={16} />
                {featuredPost.author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar size={16} />
                {featuredPost.date}
              </span>
            </div>
            <a
              href={`/blog/${featuredPost.slug}`}
              className="inline-flex items-center gap-2 font-semibold text-lg hover:gap-3 transition-all"
              style={{ color: theme.colors.primary }}
            >
              Lire l'article complet
              <ArrowRight size={20} />
            </a>
          </div>
        </article>

        {/* Other Posts */}
        <div className="grid md:grid-cols-2 gap-8">
          {otherPosts.map((post) => (
            <article
              key={post.id}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
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
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <User size={14} />
                    {post.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {post.date}
                  </span>
                </div>
                <a
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 font-semibold hover:gap-3 transition-all"
                  style={{ color: theme.colors.primary }}
                >
                  Lire la suite
                  <ArrowRight size={16} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
