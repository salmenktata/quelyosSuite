'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { CmsBlock, FaqItem } from '@/types/cms';

interface BlockRendererProps {
  block: CmsBlock;
  className?: string;
}

/**
 * Rendu des blocs CMS selon leur type
 */
export const BlockRenderer: React.FC<BlockRendererProps> = ({ block, className = '' }) => {
  const style: React.CSSProperties = {
    backgroundColor: block.background_color || undefined,
    color: block.text_color || undefined,
    padding: block.padding || undefined,
    margin: block.margin || undefined,
  };

  const containerClass = `cms-block cms-block--${block.type} ${block.css_class || ''} ${className}`.trim();

  switch (block.type) {
    case 'html':
    case 'text':
      return (
        <div
          className={containerClass}
          style={style}
          dangerouslySetInnerHTML={{ __html: block.content || '' }}
        />
      );

    case 'image':
      return (
        <div className={containerClass} style={style}>
          {block.image_url && (
            <img
              src={block.image_url}
              alt={block.name || 'Image'}
              className="w-full h-auto"
            />
          )}
        </div>
      );

    case 'video':
      return (
        <div className={containerClass} style={style}>
          {block.video_url && (
            <div className="aspect-video">
              <iframe
                src={getEmbedUrl(block.video_url)}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          )}
        </div>
      );

    case 'button':
      return (
        <div className={containerClass} style={style}>
          <BlockButton
            text={block.button_text || 'En savoir plus'}
            url={block.button_url || '#'}
            buttonStyle={block.button_style || 'primary'}
          />
        </div>
      );

    case 'accordion':
      return (
        <div className={containerClass} style={style}>
          <AccordionBlock contentJson={block.content_json} />
        </div>
      );

    case 'cta':
      return (
        <div className={containerClass} style={style}>
          <CtaBlock block={block} />
        </div>
      );

    case 'hero':
      return (
        <div className={containerClass} style={style}>
          <HeroBlock block={block} />
        </div>
      );

    case 'product_carousel':
      return (
        <div className={containerClass} style={style}>
          <ProductCarouselBlock products={block.products || []} />
        </div>
      );

    case 'category_grid':
      return (
        <div className={containerClass} style={style}>
          <CategoryGridBlock categories={block.categories || []} />
        </div>
      );

    case 'newsletter':
      return (
        <div className={containerClass} style={style}>
          <NewsletterBlock block={block} />
        </div>
      );

    case 'testimonial':
      return (
        <div className={containerClass} style={style}>
          <TestimonialBlock contentJson={block.content_json} />
        </div>
      );

    case 'features':
      return (
        <div className={containerClass} style={style}>
          <FeaturesBlock contentJson={block.content_json} />
        </div>
      );

    case 'stats':
      return (
        <div className={containerClass} style={style}>
          <StatsBlock contentJson={block.content_json} />
        </div>
      );

    default:
      // Fallback pour les types inconnus : afficher le contenu HTML
      return block.content ? (
        <div
          className={containerClass}
          style={style}
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      ) : null;
  }
};

// Utilitaires
function getEmbedUrl(url: string): string {
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return url;
}

// Composants de blocs spécifiques

interface ButtonProps {
  text: string;
  url: string;
  buttonStyle: 'primary' | 'secondary' | 'outline' | 'link';
}

const BlockButton: React.FC<ButtonProps> = ({ text, url, buttonStyle }) => {
  const styles: Record<string, string> = {
    primary: 'bg-primary text-white hover:bg-primary-dark px-6 py-3 rounded-lg font-semibold',
    secondary: 'bg-secondary text-gray-900 hover:bg-secondary-dark px-6 py-3 rounded-lg font-semibold',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white px-6 py-3 rounded-lg font-semibold',
    link: 'text-primary hover:underline font-semibold',
  };

  const isInternal = url.startsWith('/') || url.startsWith('#');

  if (isInternal) {
    return (
      <Link href={url} className={`inline-block transition-colors ${styles[buttonStyle]}`}>
        {text}
      </Link>
    );
  }

  return (
    <a
      href={url}
      className={`inline-block transition-colors ${styles[buttonStyle]}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {text}
    </a>
  );
};

// Accordion / FAQ
const AccordionBlock: React.FC<{ contentJson?: string }> = ({ contentJson }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  let items: FaqItem[] = [];
  try {
    items = contentJson ? JSON.parse(contentJson) : [];
  } catch {
    return null;
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="border rounded-lg">
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50"
          >
            <span className="font-medium">{item.title}</span>
            <svg
              className={`w-5 h-5 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openIndex === index && (
            <div className="px-4 py-3 border-t bg-gray-50">
              <div dangerouslySetInnerHTML={{ __html: item.content }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// CTA Block
const CtaBlock: React.FC<{ block: CmsBlock }> = ({ block }) => {
  return (
    <div className="text-center py-12 px-6 bg-gradient-to-r from-primary to-primary-dark rounded-xl text-white">
      {block.content && (
        <div className="mb-6" dangerouslySetInnerHTML={{ __html: block.content }} />
      )}
      {block.button_text && block.button_url && (
        <BlockButton
          text={block.button_text}
          url={block.button_url}
          buttonStyle="secondary"
        />
      )}
    </div>
  );
};

// Hero Block
const HeroBlock: React.FC<{ block: CmsBlock }> = ({ block }) => {
  return (
    <div
      className="relative min-h-[400px] flex items-center justify-center text-center text-white bg-cover bg-center"
      style={{
        backgroundImage: block.image_url ? `url(${block.image_url})` : undefined,
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 max-w-3xl px-6">
        {block.content && (
          <div dangerouslySetInnerHTML={{ __html: block.content }} />
        )}
        {block.button_text && block.button_url && (
          <div className="mt-6">
            <BlockButton
              text={block.button_text}
              url={block.button_url}
              buttonStyle={block.button_style || 'primary'}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Product Carousel
interface ProductItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  image_url: string;
}

const ProductCarouselBlock: React.FC<{ products: ProductItem[] }> = ({ products }) => {
  if (!products.length) return null;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="flex-shrink-0 w-64 group"
          >
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <h3 className="font-medium text-gray-900 group-hover:text-primary truncate">
              {product.name}
            </h3>
            <p className="text-primary font-bold">{product.price.toFixed(2)} EUR</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

// Category Grid
interface CategoryItem {
  id: number;
  name: string;
  image_url?: string;
}

const CategoryGridBlock: React.FC<{ categories: CategoryItem[] }> = ({ categories }) => {
  if (!categories.length) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/products?category=${category.id}`}
          className="group text-center"
        >
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
            {category.image_url ? (
              <img
                src={category.image_url}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark">
                <span className="text-4xl text-white font-bold">
                  {category.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <h3 className="font-medium text-gray-900 group-hover:text-primary">
            {category.name}
          </h3>
        </Link>
      ))}
    </div>
  );
};

// Newsletter Block
const NewsletterBlock: React.FC<{ block: CmsBlock }> = ({ block }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    // TODO: Implémenter l'API newsletter
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 1000);
  };

  return (
    <div className="text-center py-8 px-6 bg-gray-100 rounded-xl">
      {block.content && (
        <div className="mb-4" dangerouslySetInnerHTML={{ __html: block.content }} />
      )}
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Votre email"
          required
          className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
        >
          {status === 'loading' ? '...' : 'OK'}
        </button>
      </form>
      {status === 'success' && (
        <p className="mt-2 text-green-600">Merci pour votre inscription !</p>
      )}
    </div>
  );
};

// Testimonial Block
interface Testimonial {
  content: string;
  author: string;
  role?: string;
  avatar?: string;
}

const TestimonialBlock: React.FC<{ contentJson?: string }> = ({ contentJson }) => {
  let testimonials: Testimonial[] = [];
  try {
    testimonials = contentJson ? JSON.parse(contentJson) : [];
  } catch {
    return null;
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {testimonials.map((t, i) => (
        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-gray-600 mb-4 italic">&ldquo;{t.content}&rdquo;</p>
          <div className="flex items-center gap-3">
            {t.avatar ? (
              <img src={t.avatar} alt={t.author} className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                {t.author.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{t.author}</p>
              {t.role && <p className="text-sm text-gray-500">{t.role}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Features Block
interface Feature {
  icon?: string;
  title: string;
  description: string;
}

const FeaturesBlock: React.FC<{ contentJson?: string }> = ({ contentJson }) => {
  let features: Feature[] = [];
  try {
    features = contentJson ? JSON.parse(contentJson) : [];
  } catch {
    return null;
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {features.map((f, i) => (
        <div key={i} className="text-center">
          {f.icon && (
            <div
              className="w-16 h-16 mx-auto mb-4 text-primary"
              dangerouslySetInnerHTML={{ __html: f.icon }}
            />
          )}
          <h3 className="font-bold text-lg mb-2">{f.title}</h3>
          <p className="text-gray-600">{f.description}</p>
        </div>
      ))}
    </div>
  );
};

// Stats Block
interface Stat {
  value: string;
  label: string;
}

const StatsBlock: React.FC<{ contentJson?: string }> = ({ contentJson }) => {
  let stats: Stat[] = [];
  try {
    stats = contentJson ? JSON.parse(contentJson) : [];
  } catch {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8">
      {stats.map((s, i) => (
        <div key={i} className="text-center">
          <p className="text-4xl font-bold text-primary">{s.value}</p>
          <p className="text-gray-600">{s.label}</p>
        </div>
      ))}
    </div>
  );
};

export default BlockRenderer;
