'use client';

/**
 * ThemeProvider - Charge et applique le thème actif du tenant
 *
 * Fonctionnalités :
 * - Charge la config du thème depuis l'API au mount
 * - Applique les CSS variables (couleurs, spacing, etc.)
 * - Charge les Google Fonts dynamiquement
 * - Gère les overrides du tenant (deep merge)
 * - Fallback sur thème par défaut si erreur
 * - Met à jour le DOM avec les styles
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { backendClient, type ThemeConfig } from '@/lib/backend/client';
import { logger } from '@/lib/logger';

interface ThemeContextValue {
  theme: ThemeConfig | null;
  loading: boolean;
  error: string | null;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: null,
  loading: true,
  error: null,
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
  tenantId?: number;
}

// Thème par défaut (fallback)
const DEFAULT_THEME: ThemeConfig = {
  id: 'default',
  name: 'Thème par défaut',
  category: 'general',
  colors: {
    primary: '#dc2626',
    secondary: '#64748b',
    accent: '#f59e0b',
    background: '#ffffff',
    text: '#1e293b',
    muted: '#94a3b8',
  },
  typography: {
    headings: 'Inter',
    body: 'Inter',
  },
  layouts: {
    homepage: {
      sections: [],
    },
    productPage: {
      layout: 'standard',
      gallery: {
        type: 'standard',
      },
      sections: [],
    },
    categoryPage: {
      layout: 'sidebar-left',
      grid: '3cols',
      filters: ['price', 'category'],
    },
  },
  components: {
    productCard: 'standard',
    header: 'standard',
    footer: 'standard',
    buttons: 'standard',
  },
  spacing: {
    sectionPadding: 'medium',
    containerWidth: '1280px',
  },
};

export function ThemeProvider({ children, tenantId = 1 }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTheme() {
      try {
        setLoading(true);
        setError(null);

        const response = await backendClient.getActiveTheme(tenantId);

        // La réponse API a la structure : { success, theme: { config: {...} } }
        if (response.success && response.theme?.config) {
          setTheme(response.theme.config);
          applyThemeStyles(response.theme.config);
        } else {
          // Fallback sur thème par défaut
          logger.warn('Impossible de charger le thème, utilisation du thème par défaut');
          setTheme(DEFAULT_THEME);
          applyThemeStyles(DEFAULT_THEME);
        }
      } catch (_err) {
        logger.error('Erreur chargement thème:', err);
        setError('Erreur de chargement du thème');
        setTheme(DEFAULT_THEME);
        applyThemeStyles(DEFAULT_THEME);
      } finally {
        setLoading(false);
      }
    }

    loadTheme();
  }, [tenantId]);

  return (
    <ThemeContext.Provider value={{ theme, loading, error }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Applique les styles du thème au DOM
 */
function applyThemeStyles(config: ThemeConfig) {
  const root = document.documentElement;

  // Appliquer les couleurs (utilise les variables CSS existantes de globals.css)
  if (config.colors) {
    root.style.setProperty('--primary', config.colors.primary);
    root.style.setProperty('--color-primary', config.colors.primary);
    root.style.setProperty('--secondary', config.colors.secondary);
    root.style.setProperty('--color-secondary', config.colors.secondary);

    if (config.colors.accent) {
      root.style.setProperty('--accent', config.colors.accent);
      root.style.setProperty('--color-accent', config.colors.accent);
    }
    if (config.colors.background) {
      root.style.setProperty('--background', config.colors.background);
      root.style.setProperty('--color-background', config.colors.background);
    }
    if (config.colors.text) {
      root.style.setProperty('--foreground', config.colors.text);
      root.style.setProperty('--color-foreground', config.colors.text);
    }
    if (config.colors.muted) {
      root.style.setProperty('--muted', config.colors.muted);
      root.style.setProperty('--color-muted', config.colors.muted);
    }
  }

  // Appliquer le spacing
  if (config.spacing) {
    if (config.spacing.containerWidth) {
      root.style.setProperty('--container-width', config.spacing.containerWidth);
    }
    if (config.spacing.gutter) {
      root.style.setProperty('--gutter', config.spacing.gutter);
    }
  }

  // Charger les polices Google Fonts
  if (config.typography) {
    const fonts = [config.typography.headings, config.typography.body, config.typography.mono].filter(Boolean) as string[];
    loadGoogleFonts(fonts);

    // Mettre à jour la police principale du body
    root.style.setProperty('--app-font-sans', `'${config.typography.body}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`);
    root.style.setProperty('--font-sans', `'${config.typography.body}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`);

    if (config.typography.mono) {
      root.style.setProperty('--font-mono', `'${config.typography.mono}', 'Menlo', 'Monaco', 'Courier New', monospace`);
    }
  }

  // Injecter le CSS custom si présent
  if (config.customCSS) {
    let styleEl = document.getElementById('theme-custom-css') as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'theme-custom-css';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = config.customCSS;
  }
}

/**
 * Charge les Google Fonts dynamiquement
 */
function loadGoogleFonts(fontFamilies: string[]) {
  const uniqueFonts = [...new Set(fontFamilies)];
  const fontsQuery = uniqueFonts
    .map(font => `family=${font.replace(/\s+/g, '+')}:wght@400;500;600;700`)
    .join('&');

  const linkId = 'google-fonts-theme';
  let linkEl = document.getElementById(linkId) as HTMLLinkElement;

  if (!linkEl) {
    linkEl = document.createElement('link');
    linkEl.id = linkId;
    linkEl.rel = 'stylesheet';
    linkEl.href = `https://fonts.googleapis.com/css2?${fontsQuery}&display=swap`;
    document.head.appendChild(linkEl);
  } else {
    linkEl.href = `https://fonts.googleapis.com/css2?${fontsQuery}&display=swap`;
  }
}
