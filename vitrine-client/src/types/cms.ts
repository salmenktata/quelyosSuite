// Types pour le CMS (menus, pages, blocs)

/**
 * Item de menu avec support hiérarchique
 */
export interface MenuItem {
  id: number;
  name?: string;
  label?: string;
  url: string;
  link_type?: 'url' | 'internal' | 'page' | 'category' | 'product';
  icon?: string | boolean;
  css_class?: string | boolean;
  open_in_new_tab?: boolean;
  open_new_tab?: boolean;
  description?: string | boolean;
  highlight?: boolean;
  visibility?: 'all' | 'authenticated' | 'guest';
  children: MenuItem[];
}

/**
 * Menu complet avec ses items
 */
export interface Menu {
  id: number;
  name: string;
  code: string;
  items: MenuItem[];
}

/**
 * Données SEO d'une page
 */
export interface PageSeo {
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  canonical_url: string;
  robots: string;
  og_title: string;
  og_description: string;
  og_image?: string;
  og_type: string;
}

/**
 * Bloc de contenu
 */
export interface CmsBlock {
  id: number;
  name?: string;
  code?: string;
  type: string;
  content?: string;
  content_json?: string;
  image_url?: string;
  video_url?: string;
  css_class?: string;
  background_color?: string;
  text_color?: string;
  padding?: string;
  margin?: string;
  // Pour les blocs bouton/CTA
  button_text?: string;
  button_url?: string;
  button_style?: 'primary' | 'secondary' | 'outline' | 'link';
  // Pour les blocs produits
  products?: {
    id: number;
    name: string;
    slug: string;
    price: number;
    image_url: string;
  }[];
  categories?: {
    id: number;
    name: string;
    image_url?: string;
  }[];
}

/**
 * Blocs organisés par zone
 */
export interface PageBlocks {
  content?: CmsBlock[];
  sidebar?: CmsBlock[];
  header?: CmsBlock[];
  footer?: CmsBlock[];
  before_content?: CmsBlock[];
  after_content?: CmsBlock[];
}

/**
 * Fil d'Ariane
 */
export interface Breadcrumb {
  name: string;
  url: string;
}

/**
 * Page parente/enfant simplifiée
 */
export interface PageLink {
  id: number;
  name: string;
  slug: string;
}

/**
 * Page CMS complète
 */
export interface CmsPage {
  id: number;
  name: string;
  slug: string;
  content: string;
  excerpt?: string;
  template:
    | 'standard'
    | 'landing'
    | 'contact'
    | 'faq'
    | 'sidebar_left'
    | 'sidebar_right'
    | 'full_width'
    | 'about' | 'a-propos' | 'qui-sommes-nous'
    | 'shipping' | 'livraison' | 'delivery'
    | 'returns' | 'retours' | 'remboursement'
    | 'legal' | 'cgv' | 'cgu' | 'privacy' | 'confidentialite' | 'mentions-legales' | 'terms';
  show_title: boolean;
  show_breadcrumb: boolean;
  header_image_url?: string;
  seo: PageSeo;
  blocks: PageBlocks;
  breadcrumbs: Breadcrumb[];
  parent?: PageLink;
  children?: PageLink[];
}

/**
 * Résumé de page (pour les listes)
 */
export interface CmsPageSummary {
  id: number;
  name: string;
  slug: string;
  excerpt?: string;
  template: string;
  publish_date?: string;
}

/**
 * Réponse API liste de pages
 */
export interface PagesResponse {
  pages: CmsPageSummary[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Options pour récupérer les pages
 */
export interface GetPagesOptions {
  limit?: number;
  offset?: number;
  parent_id?: number;
  template?: string;
}

/**
 * Item de FAQ pour le template accordion
 */
export interface FaqItem {
  title: string;
  content: string;
}
