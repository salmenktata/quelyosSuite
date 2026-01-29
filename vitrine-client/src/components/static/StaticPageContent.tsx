'use client';

import { useState, useEffect, ReactNode } from 'react';
import { backendClient } from '@/lib/backend/client';
import { logger } from '@/lib/logger';

interface StaticPage {
  id: number;
  title: string;
  subtitle?: string;
  content: string;
  seo_title?: string;
  seo_description?: string;
}

interface StaticPageContentProps {
  slug: string;
  fallback: ReactNode;
  title?: string;
  subtitle?: string;
}

export function StaticPageContent({ slug, fallback, title, subtitle }: StaticPageContentProps) {
  const [page, setPage] = useState<StaticPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await backendClient.getStaticPage(slug);
        if (response.success && response.page) {
          setPage(response.page);
        } else {
          setUseFallback(true);
        }
      } catch (error) {
        logger.error(`Error fetching static page ${slug}:`, error);
        setUseFallback(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="bg-primary text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="h-12 w-64 bg-white/20 rounded mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 w-96 max-w-full bg-white/10 rounded mx-auto animate-pulse"></div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded w-5/6 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (useFallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {page?.title || title}
          </h1>
          {(page?.subtitle || subtitle) && (
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              {page?.subtitle || subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div
            className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: page?.content || '' }}
          />
        </div>
      </div>
    </div>
  );
}
