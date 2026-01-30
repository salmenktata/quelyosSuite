/**
 * Page détail article blog - SSR
 */

import { notFound } from 'next/navigation';
import { backendClient, BlogPost } from '@/lib/backend/client';
import Link from 'next/link';
import Image from 'next/image';
import { getProxiedImageUrl } from '@/lib/image-proxy';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import type { Metadata } from 'next';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const response = await backendClient.getBlogPost(slug);

  if (!response.success || !response.post) {
    return { title: 'Article non trouvé' };
  }

  return {
    title: response.post.title,
    description: response.post.excerpt || `Lisez "${response.post.title}" sur notre blog`,
    openGraph: {
      title: response.post.title,
      description: response.post.excerpt || '',
      images: response.post.coverUrl ? [getProxiedImageUrl(response.post.coverUrl)] : [],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const response = await backendClient.getBlogPost(slug);

  if (!response.success || !response.post) {
    notFound();
  }

  const post = response.post;
  const relatedPosts = response.relatedPosts || [];

  const formattedDate = post.publishedDate
    ? new Date(post.publishedDate).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header avec image */}
      {post.coverUrl ? (
        <div className="relative h-[40vh] min-h-[300px] bg-gray-900">
          <Image
            src={getProxiedImageUrl(post.coverUrl)}
            alt={post.title}
            fill
            sizes="100vw"
            className="object-cover opacity-60"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-8">
            <Link
              href={`/blog?category=${post.categoryName}`}
              className="inline-block text-primary-light text-sm font-medium mb-3 hover:underline"
            >
              {post.categoryName}
            </Link>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white max-w-4xl">
              {post.title}
            </h1>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white py-16">
          <div className="container mx-auto px-4">
            <Link
              href={`/blog?category=${post.categoryName}`}
              className="inline-block text-white/80 text-sm font-medium mb-3 hover:underline"
            >
              {post.categoryName}
            </Link>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold max-w-4xl">
              {post.title}
            </h1>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Contenu principal */}
          <article className="flex-1 max-w-3xl">
            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
              <span className="font-medium text-gray-900 dark:text-white">{post.authorName}</span>
              {formattedDate && (
                <>
                  <span className="w-1 h-1 bg-gray-400 rounded-full" />
                  <time>{formattedDate}</time>
                </>
              )}
              <span className="w-1 h-1 bg-gray-400 rounded-full" />
              <span>{post.readingTime} min de lecture</span>
              <span className="w-1 h-1 bg-gray-400 rounded-full" />
              <span>{post.viewsCount} vues</span>
            </div>

            {/* Contenu HTML */}
            <div
              className="prose prose-lg dark:prose-invert max-w-none
                prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
                prose-a:text-primary hover:prose-a:underline
                prose-img:rounded-lg prose-img:shadow-md"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-12">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour au blog
              </Link>
            </div>
          </article>

          {/* Sidebar - Articles liés */}
          {relatedPosts.length > 0 && (
            <aside className="lg:w-80 flex-shrink-0">
              <div className="sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Articles similaires
                </h2>
                <div className="space-y-4">
                  {relatedPosts.map((related) => (
                    <RelatedPostCard key={related.id} post={related} />
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

function RelatedPostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition group"
    >
      <div className="aspect-video relative bg-gray-100 dark:bg-gray-700">
        {post.coverUrl ? (
          <Image
            src={getProxiedImageUrl(post.coverUrl)}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary transition">
          {post.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {post.readingTime} min de lecture
        </p>
      </div>
    </Link>
  );
}
