'use client';

import { lazy, Suspense } from 'react';
import type { SectionConfig } from './types';
import { useTheme } from './ThemeContext';

// Lazy load des sections (optimisation performance)
const HeroSlider = lazy(() => import('../components/sections/HeroSlider'));
const Hero = lazy(() => import('../components/sections/Hero'));
const FeaturedProducts = lazy(() => import('../components/sections/FeaturedProducts'));
const Newsletter = lazy(() => import('../components/sections/Newsletter'));
const Testimonials = lazy(() => import('../components/sections/Testimonials'));
const FAQ = lazy(() => import('../components/sections/FAQ'));
const TrustBadges = lazy(() => import('../components/sections/TrustBadges'));
const CallToAction = lazy(() => import('../components/sections/CallToAction'));
const Blog = lazy(() => import('../components/sections/Blog'));
const Contact = lazy(() => import('../components/sections/Contact'));

// Nouvelles sections (Janvier 2026)
const VideoHero = lazy(() => import('../components/sections/VideoHero'));
const SocialProof = lazy(() => import('../components/sections/SocialProof'));
const PromoBanner = lazy(() => import('../components/sections/PromoBanner'));
const Features = lazy(() => import('../components/sections/Features'));
const Categories = lazy(() => import('../components/sections/Categories'));
const ProductTabs = lazy(() => import('../components/sections/ProductTabs'));
const BrandLogos = lazy(() => import('../components/sections/BrandLogos'));
const ContactForm = lazy(() => import('../components/sections/ContactForm'));
const CountdownTimer = lazy(() => import('../components/sections/CountdownTimer'));
const BlogPosts = lazy(() => import('../components/sections/BlogPosts'));

interface SectionRendererProps {
  sections: SectionConfig[];
}

function SectionFallback() {
  return (
    <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
  );
}

export function SectionRenderer({ sections }: SectionRendererProps) {
  const theme = useTheme();

  return (
    <>
      {sections.map((section, index) => {
        const key = section.id || `${section.type}-${index}`;

        let SectionComponent;
        switch (section.type) {
          case 'hero-slider':
            SectionComponent = HeroSlider;
            break;
          case 'hero':
            SectionComponent = Hero;
            break;
          case 'featured-products':
            SectionComponent = FeaturedProducts;
            break;
          case 'newsletter':
            SectionComponent = Newsletter;
            break;
          case 'testimonials':
            SectionComponent = Testimonials;
            break;
          case 'faq':
            SectionComponent = FAQ;
            break;
          case 'trust-badges':
            SectionComponent = TrustBadges;
            break;
          case 'call-to-action':
            SectionComponent = CallToAction;
            break;
          case 'blog':
            SectionComponent = Blog;
            break;
          case 'contact':
            SectionComponent = Contact;
            break;
          case 'video-hero':
            SectionComponent = VideoHero;
            break;
          case 'social-proof':
            SectionComponent = SocialProof;
            break;
          case 'promo-banner':
            SectionComponent = PromoBanner;
            break;
          case 'features':
            SectionComponent = Features;
            break;
          case 'categories':
            SectionComponent = Categories;
            break;
          case 'product-tabs':
            SectionComponent = ProductTabs;
            break;
          case 'brand-logos':
            SectionComponent = BrandLogos;
            break;
          case 'contact-form':
            SectionComponent = ContactForm;
            break;
          case 'countdown-timer':
            SectionComponent = CountdownTimer;
            break;
          case 'blog-posts':
            SectionComponent = BlogPosts;
            break;
          default:
            console.warn(`Section type "${section.type}" not found`);
            return null;
        }

        return (
          <Suspense key={key} fallback={<SectionFallback />}>
            <SectionComponent
              variant={section.variant}
              config={section.config}
              className={section.className}
              theme={theme}
            />
          </Suspense>
        );
      })}
    </>
  );
}
