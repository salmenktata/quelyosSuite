import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cmsService } from '@/lib/odoo/cms';
import { CmsPageContent } from '@/components/cms';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Génère les métadonnées SEO pour la page
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const seo = await cmsService.getPageSeo(slug);

    return {
      title: seo.meta_title,
      description: seo.meta_description,
      keywords: seo.meta_keywords,
      alternates: {
        canonical: seo.canonical_url || undefined,
      },
      robots: seo.robots || 'index, follow',
      openGraph: {
        title: seo.og_title || seo.meta_title,
        description: seo.og_description || seo.meta_description,
        images: seo.og_image ? [{ url: seo.og_image }] : [],
        type: seo.og_type as 'website' | 'article' || 'website',
      },
    };
  } catch {
    return {
      title: 'Page non trouvée',
      description: 'La page demandée n\'existe pas.',
    };
  }
}

/**
 * Page CMS dynamique
 */
export default async function CmsPage({ params }: PageProps) {
  const { slug } = await params;

  try {
    const page = await cmsService.getPage(slug);

    if (!page) {
      notFound();
    }

    return <CmsPageContent page={page} />;
  } catch (error) {
    console.error(`Error loading CMS page ${slug}:`, error);
    notFound();
  }
}

/**
 * Revalidation ISR : régénère la page toutes les 60 secondes
 */
export const revalidate = 60;
