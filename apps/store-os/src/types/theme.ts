/**
 * Types pour le système de thèmes e-commerce
 */

export type ThemeCategory = 'fashion' | 'tech' | 'food' | 'beauty' | 'sports' | 'home' | 'general';

export interface Theme {
  id: string;
  name: string;
  description: string;
  category: ThemeCategory;
  is_premium: boolean;
  price: number;
  rating: number;
  review_count: number;
  downloads: number;
  thumbnail: string | null;
  preview_url: string | false;
}

export interface ThemeConfig {
  id: string;
  name: string;
  category: ThemeCategory;
  description?: string;
  version?: string;
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
    background?: string;
    text?: string;
    muted?: string;
  };
  typography: {
    headings: string;
    body: string;
    mono?: string;
  };
  layouts: {
    homepage: {
      sections: SectionConfig[];
    };
    productPage: {
      layout: string;
      gallery: {
        type: string;
        thumbnailPosition?: string;
      };
      sections: SectionConfig[];
    };
    categoryPage: {
      layout: string;
      grid: string;
      filters: string[];
    };
  };
  components: {
    productCard: string;
    header: string;
    footer: string;
    buttons: string;
  };
  spacing: {
    sectionPadding: string;
    containerWidth: string;
    gutter?: string;
  };
  customCSS?: string;
}

export interface SectionConfig {
  type: string;
  variant: string;
  config?: Record<string, unknown>;
  id?: string;
  className?: string;
}
