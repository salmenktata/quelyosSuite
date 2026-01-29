'use client';

/**
 * Page Preview Thème - Pour iframe Theme Builder
 *
 * Page standalone sans header/footer pour preview des thèmes
 * dans le Theme Builder. Écoute les messages postMessage du builder
 * pour mettre à jour le thème en temps réel.
 */

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import type { ThemeConfig } from '@/lib/backend/client';

// Thème par défaut
const DEFAULT_THEME: ThemeConfig = {
  id: 'preview',
  name: 'Preview',
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
      sections: [
        {
          type: 'hero-slider',
          variant: 'fullscreen-autoplay',
          config: {},
        },
        {
          type: 'featured-products',
          variant: 'grid-4cols',
          config: { limit: 4 },
        },
        {
          type: 'newsletter',
          variant: 'centered-minimal',
          config: {},
        },
      ],
    },
    productPage: {
      layout: 'standard',
      gallery: { type: 'standard' },
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

export default function ThemePreviewPage() {
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);

  useEffect(() => {
    // Appliquer les styles du thème
    applyThemeStyles(theme);

    // Écouter les messages du Theme Builder
    function handleMessage(event: MessageEvent) {
      // Vérifier l'origine pour sécurité (en production)
      // if (event.origin !== 'http://localhost:5175') return;

      if (event.data.type === 'THEME_UPDATE') {
        const newTheme = event.data.theme as ThemeConfig;
        setTheme(newTheme);
        applyThemeStyles(newTheme);
      }
    }

    window.addEventListener('message', handleMessage);

    // Signaler au parent que la preview est prête
    window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [theme]);

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
      }}
    >
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-sm text-gray-500 mb-8">
          Preview du thème (iframe pour Theme Builder)
        </p>
      </div>
    </div>
  );
}

/**
 * Applique les styles CSS du thème
 */
function applyThemeStyles(config: ThemeConfig) {
  const root = document.documentElement;

  // Couleurs
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

  // Typographie
  if (config.typography) {
    root.style.setProperty('--app-font-sans', `'${config.typography.body}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`);
    root.style.setProperty('--font-sans', `'${config.typography.body}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`);
    root.style.setProperty('--theme-font-headings', config.typography.headings);
    root.style.setProperty('--theme-font-body', config.typography.body);

    // Charger Google Fonts
    loadGoogleFonts([config.typography.headings, config.typography.body, config.typography.mono].filter(Boolean) as string[]);
  }

  // Spacing
  if (config.spacing) {
    if (config.spacing.containerWidth) {
      root.style.setProperty('--container-width', config.spacing.containerWidth);
    }
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

  const linkId = 'google-fonts-preview';
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
