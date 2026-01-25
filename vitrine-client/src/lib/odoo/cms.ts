/**
 * Service CMS pour récupérer les menus, pages et blocs depuis Odoo
 */

import axios from 'axios';
import type {
  Menu,
  CmsPage,
  CmsPageSummary,
  PageSeo,
  CmsBlock,
  GetPagesOptions,
  PagesResponse,
} from '@/types/cms';
import { logger } from '@/lib/logger';

// Use absolute URL for SSR, relative for client-side
const getApiBase = () => {
  if (typeof window === 'undefined') {
    // Server-side: use absolute URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return `${siteUrl}/api/odoo`;
  }
  // Client-side: use relative URL
  return '/api/odoo';
};

/**
 * Appel JSON-RPC vers l'API CMS
 */
async function jsonrpc<T = any>(
  endpoint: string,
  params: Record<string, any> = {},
  options: { throwOn404?: boolean } = {}
): Promise<T> {
  const apiBase = getApiBase();
  const { throwOn404 = false } = options;

  try {
    const response = await axios.post(`${apiBase}${endpoint}`, params, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error: any) {
    // Gestion gracieuse des 404 pour les endpoints CMS non implémentés
    if (error.response?.status === 404 && !throwOn404) {
      logger.warn(`Endpoint CMS non implémenté: ${endpoint}`);
      // Retourner une structure par défaut selon le type de réponse attendu
      return { success: false, error: 'Not implemented' } as T;
    }

    logger.error(`Erreur API CMS [${endpoint}]:`, error);
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Unknown error';
    throw new Error(errorMessage);
  }
}

/**
 * Service CMS
 */
export const cmsService = {
  /**
   * Récupère plusieurs menus par leurs codes
   * @param codes - Liste des codes de menus (ex: ['header', 'footer_quick'])
   * @returns Map de menus indexés par code
   */
  async getMenus(codes?: string[]): Promise<Record<string, Menu>> {
    const response = await jsonrpc<{ success: boolean; menus: Record<string, Menu>; error?: string }>(
      '/menus',
      { codes }
    );
    if (response.success) {
      return response.menus;
    }
    throw new Error(response.error || 'Failed to fetch menus');
  },

  /**
   * Récupère un menu spécifique par son code
   * @param code - Code du menu (ex: 'header')
   */
  async getMenu(code: string): Promise<Menu | null> {
    const response = await jsonrpc<{ success: boolean; menu: Menu; error?: string }>(
      `/menus/${code}`,
      {},
      { throwOn404: false }
    );
    if (response.success && response.menu) {
      return response.menu;
    }
    // Retourner null si le menu n'existe pas (permet au composant de gérer gracieusement)
    return null;
  },

  /**
   * Récupère une page CMS par son slug
   * @param slug - Slug URL de la page (ex: 'about')
   */
  async getPage(slug: string): Promise<CmsPage> {
    const response = await jsonrpc<{ success: boolean; page: CmsPage; error?: string }>(
      `/pages/${slug}`,
      {}
    );
    if (response.success) {
      return response.page;
    }
    throw new Error(response.error || `Page ${slug} not found`);
  },

  /**
   * Récupère les données SEO d'une page (pour les metadata Next.js)
   * @param slug - Slug URL de la page
   */
  async getPageSeo(slug: string): Promise<PageSeo> {
    const response = await jsonrpc<{ success: boolean; seo: PageSeo; error?: string }>(
      `/pages/${slug}/seo`,
      {}
    );
    if (response.success) {
      return response.seo;
    }
    throw new Error(response.error || `SEO for ${slug} not found`);
  },

  /**
   * Liste les pages publiées avec pagination
   */
  async getPages(options?: GetPagesOptions): Promise<PagesResponse> {
    const response = await jsonrpc<{ success: boolean; pages: CmsPageSummary[]; total: number; limit: number; offset: number; error?: string }>(
      '/pages',
      options || {}
    );
    if (response.success) {
      return {
        pages: response.pages,
        total: response.total,
        limit: response.limit,
        offset: response.offset,
      };
    }
    throw new Error(response.error || 'Failed to fetch pages');
  },

  /**
   * Récupère un bloc réutilisable par son code
   * @param code - Code technique du bloc
   */
  async getBlock(code: string): Promise<CmsBlock> {
    const response = await jsonrpc<{ success: boolean; block: CmsBlock; error?: string }>(
      `/blocks/${code}`,
      {}
    );
    if (response.success) {
      return response.block;
    }
    throw new Error(response.error || `Block ${code} not found`);
  },

  /**
   * Récupère plusieurs blocs par leurs codes
   * @param codes - Liste des codes de blocs
   */
  async getBlocks(codes: string[]): Promise<Record<string, CmsBlock>> {
    const response = await jsonrpc<{ success: boolean; blocks: Record<string, CmsBlock>; error?: string }>(
      '/blocks',
      { codes }
    );
    if (response.success) {
      return response.blocks;
    }
    throw new Error(response.error || 'Failed to fetch blocks');
  },
};

export default cmsService;
