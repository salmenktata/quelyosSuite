'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Theme, ThemeName, ThemeColors } from './types';
import { themes, defaultTheme } from './themes';
import { FONT_FAMILIES } from '@/types/tenant';
import type { TenantTheme, TenantColors, TenantTypography } from '@/types/tenant';

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  availableThemes: Theme[];
  setCustomColors: (colors: Partial<ThemeColors>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'quelyos-theme';
const FONT_LINK_ID = 'tenant-font-link';

const FONT_STACKS: Record<TenantTypography['fontFamily'], string> = {
  inter: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  roboto: '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  poppins: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  montserrat: '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  'open-sans': '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  lato: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

/**
 * Applique les couleurs du theme aux variables CSS du document
 */
function applyThemeToDOM(colors: ThemeColors) {
  const root = document.documentElement;

  // Mapping des proprietes vers les noms de variables CSS
  const cssVarMap: Record<keyof ThemeColors, string> = {
    primary: '--primary',
    primaryDark: '--primary-dark',
    primaryLight: '--primary-light',
    secondary: '--secondary',
    secondaryDark: '--secondary-dark',
    secondaryLight: '--secondary-light',
    accent: '--accent',
    background: '--background',
    foreground: '--foreground',
    muted: '--muted',
    mutedForeground: '--muted-foreground',
    border: '--border',
    ring: '--ring',
  };

  // Appliquer chaque couleur comme variable CSS
  Object.entries(colors).forEach(([key, value]) => {
    const cssVar = cssVarMap[key as keyof ThemeColors];
    if (cssVar) {
      root.style.setProperty(cssVar, value);
    }
  });
}

function ensureFontLoaded(fontFamily: TenantTypography['fontFamily']) {
  if (fontFamily === 'inter') {
    const existing = document.getElementById(FONT_LINK_ID);
    if (existing) existing.remove();
    return;
  }

  const fontConfig = FONT_FAMILIES[fontFamily];
  if (!fontConfig?.url) return;

  let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = FONT_LINK_ID;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  if (link.href !== fontConfig.url) {
    link.href = fontConfig.url;
  }
}

function applyTypographyToDOM(fontFamily: TenantTypography['fontFamily']) {
  const root = document.documentElement;
  const fontStack = FONT_STACKS[fontFamily] || FONT_STACKS.inter;

  root.style.setProperty('--app-font-sans', fontStack);
  ensureFontLoaded(fontFamily);
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultThemeName?: ThemeName;
  configColors?: {
    primaryColor?: string;
    secondaryColor?: string;
  };
  /** Thème du tenant (priorité maximale) */
  tenantTheme?: TenantTheme | null;
}

export function ThemeProvider({
  children,
  defaultThemeName = 'default',
  configColors,
  tenantTheme,
}: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>(defaultThemeName);
  const [customColors, setCustomColorsState] = useState<Partial<ThemeColors>>({});
  const [mounted, setMounted] = useState(false);

  // Calculer le theme effectif (theme de base + overrides)
  // Priorité: tenantTheme > configColors > theme de base
  const theme = React.useMemo(() => {
    const baseTheme = themes[themeName] || defaultTheme;
    const mergedColors = { ...baseTheme.colors };

    // 1. Si tenantTheme est fourni, l'utiliser en priorité
    if (tenantTheme?.colors) {
      const tc = tenantTheme.colors;
      mergedColors.primary = tc.primary;
      mergedColors.primaryDark = tc.primaryDark;
      mergedColors.primaryLight = tc.primaryLight;
      mergedColors.secondary = tc.secondary;
      mergedColors.secondaryDark = tc.secondaryDark;
      mergedColors.secondaryLight = tc.secondaryLight;
      mergedColors.accent = tc.accent;
      mergedColors.background = tc.background;
      mergedColors.foreground = tc.foreground;
      mergedColors.muted = tc.muted;
      mergedColors.mutedForeground = tc.mutedForeground;
      mergedColors.border = tc.border;
      mergedColors.ring = tc.ring;
    } else {
      // 2. Sinon, utiliser configColors (SiteConfig legacy)
      if (configColors?.primaryColor) {
        mergedColors.primary = configColors.primaryColor;
        mergedColors.ring = configColors.primaryColor;
      }
      if (configColors?.secondaryColor) {
        mergedColors.secondary = configColors.secondaryColor;
      }
    }

    // 3. Appliquer les overrides personnalises (setCustomColors)
    Object.assign(mergedColors, customColors);

    return { ...baseTheme, colors: mergedColors };
  }, [themeName, configColors, customColors, tenantTheme]);

  // Initialiser depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && themes[stored]) {
      setThemeName(stored);
    } else if (tenantTheme?.darkMode?.defaultDark) {
      setThemeName('dark');
    }
    setMounted(true);
  }, [tenantTheme?.darkMode?.defaultDark]);

  // Appliquer le theme au DOM quand il change
  useEffect(() => {
    if (!mounted) return;

    applyThemeToDOM(theme.colors);
    applyTypographyToDOM(tenantTheme?.typography?.fontFamily || 'inter');

    // Definir l'attribut data-theme pour les selecteurs CSS
    document.documentElement.setAttribute('data-theme', theme.name);

    // Gerer la classe dark pour les variantes Tailwind dark:
    const allowDarkMode = tenantTheme?.darkMode?.enabled ?? true;
    if (allowDarkMode && theme.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, mounted, tenantTheme]);

  // Appliquer le favicon du tenant
  useEffect(() => {
    // Note: tenantTheme n'a pas le branding, on ne peut pas accéder au favicon ici
    // Le favicon est géré dans le branding du tenant qui n'est pas passé au ThemeProvider
    // Il faudrait créer un composant séparé ou passer le branding aussi
  }, []);

  const setTheme = useCallback(
    (name: ThemeName) => {
      if (tenantTheme?.darkMode?.enabled === false && name === 'dark') {
        return;
      }
      setThemeName(name);
      localStorage.setItem(STORAGE_KEY, name);
    },
    [tenantTheme?.darkMode?.enabled]
  );

  const setCustomColors = useCallback((colors: Partial<ThemeColors>) => {
    setCustomColorsState(colors);
  }, []);

  const value: ThemeContextType = {
    theme,
    themeName,
    setTheme,
    availableThemes: Object.values(themes),
    setCustomColors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
