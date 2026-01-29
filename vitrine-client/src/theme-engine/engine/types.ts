/**
 * Types TypeScript pour le moteur de thème Quelyos
 *
 * Définit la structure des configurations de thème JSON,
 * des sections, layouts et composants réutilisables.
 */

// ============================================================================
// COLOR & TYPOGRAPHY
// ============================================================================

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent?: string;
  background?: string;
  text?: string;
  muted?: string;
}

export interface ThemeTypography {
  headings: string;
  body: string;
  mono?: string;
}

// ============================================================================
// SECTIONS
// ============================================================================

export type SectionType =
  | 'hero-slider'
  | 'hero'
  | 'featured-products'
  | 'newsletter'
  | 'testimonials'
  | 'faq'
  | 'trust-badges'
  | 'call-to-action'
  | 'blog'
  | 'contact'
  | 'video-hero'
  | 'social-proof'
  | 'promo-banner'
  | 'features'
  | 'categories'
  | 'product-tabs'
  | 'brand-logos'
  | 'contact-form'
  | 'countdown-timer'
  | 'blog-posts';

export interface SectionConfig {
  type: SectionType;
  variant: string;
  config?: Record<string, unknown>;
  id?: string;
  className?: string;
}

// ============================================================================
// LAYOUTS
// ============================================================================

export type LayoutType = 'sidebar-left' | 'sidebar-right' | 'fullwidth' | 'centered';

export interface HomepageLayout {
  sections: SectionConfig[];
}

export interface ProductPageLayout {
  layout: LayoutType;
  gallery: {
    type: 'zoom-vertical' | 'zoom-horizontal' | 'lightbox' | 'carousel';
    thumbnailPosition?: 'left' | 'right' | 'bottom';
  };
  sections: SectionConfig[];
}

export interface CategoryPageLayout {
  layout: LayoutType;
  grid: '2cols' | '3cols' | '4cols' | '5cols';
  filters: string[];
}

export interface ThemeLayouts {
  homepage: HomepageLayout;
  productPage: ProductPageLayout;
  categoryPage: CategoryPageLayout;
}

// ============================================================================
// COMPONENTS
// ============================================================================

export type ProductCardVariant = 'style-minimal' | 'style-detailed' | 'style-overlay' | 'style-compact';
export type HeaderVariant = 'transparent-sticky' | 'solid-sticky' | 'classic';
export type FooterVariant = 'columns-3' | 'columns-4' | 'minimal';
export type ButtonVariant = 'rounded-shadow' | 'squared' | 'minimal' | 'outline';

export interface ThemeComponents {
  productCard: ProductCardVariant;
  header: HeaderVariant;
  footer: FooterVariant;
  buttons: ButtonVariant;
}

// ============================================================================
// SPACING & SIZING
// ============================================================================

export interface ThemeSpacing {
  sectionPadding: 'small' | 'medium' | 'large' | 'xlarge';
  containerWidth: string;
  gutter?: string;
}

// ============================================================================
// MAIN THEME CONFIG
// ============================================================================

export type ThemeCategory = 'fashion' | 'tech' | 'food' | 'beauty' | 'sports' | 'home' | 'general';

export interface ThemeConfig {
  id: string;
  name: string;
  category: ThemeCategory;
  description?: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  layouts: ThemeLayouts;
  components: ThemeComponents;
  spacing: ThemeSpacing;
  customCSS?: string;
  version?: string;
}

// ============================================================================
// THEME CONTEXT
// ============================================================================

export interface ThemeContextValue {
  config: ThemeConfig;
  colors: ThemeColors;
  typography: ThemeTypography;
  components: ThemeComponents;
  spacing: ThemeSpacing;
}

// ============================================================================
// SECTION COMPONENT PROPS
// ============================================================================

export interface SectionProps {
  variant?: string;
  config?: Record<string, unknown>;
  className?: string;
  theme: ThemeContextValue;
}
