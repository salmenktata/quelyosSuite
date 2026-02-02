'use client'

import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useStaticPage } from '@/hooks/useStaticPage'
import Header from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { sanitizeHtml } from '@/lib/utils/sanitize'

export default function StaticPageView() {
  const params = useParams()
  const slug = params.slug as string
  const { page, loading, error } = useStaticPage(slug)

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-16">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-8"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (error || !page) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-16">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Page non trouvée
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {error || 'La page que vous recherchez n\'existe pas.'}
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const layoutClass = {
    default: 'max-w-4xl mx-auto',
    full_width: 'max-w-full',
    narrow: 'max-w-2xl mx-auto',
    with_sidebar: 'max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8',
  }[page.layout] || 'max-w-4xl mx-auto'

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16">
        {page.show_header_image && page.header_image_url && (
          <div className="relative w-full h-64 mb-8 overflow-hidden">
            <Image
              src={page.header_image_url}
              alt={page.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </div>
        )}

        <div className="container mx-auto px-4">
          <div className={layoutClass}>
            {page.layout === 'with_sidebar' ? (
              <>
                <div className="lg:col-span-2">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    {page.title}
                  </h1>
                  {page.subtitle && (
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                      {page.subtitle}
                    </p>
                  )}
                  <div
                    className="prose prose-lg dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
                  />
                </div>

                {page.show_sidebar && page.sidebar_content && (
                  <aside className="lg:col-span-1">
                    <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                      <div
                        className="prose prose-sm dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.sidebar_content) }}
                      />
                    </div>
                  </aside>
                )}
              </>
            ) : (
              <>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  {page.title}
                </h1>
                {page.subtitle && (
                  <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                    {page.subtitle}
                  </p>
                )}
                <div
                  className="prose prose-lg dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
                />
              </>
            )}

            {page.updated_date && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
                Dernière mise à jour : {new Date(page.updated_date).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
