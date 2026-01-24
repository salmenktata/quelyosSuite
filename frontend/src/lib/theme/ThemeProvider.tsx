'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Theme, ThemeName, ThemeColors } from './types';
import { themes, defaultTheme } from './themes';

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  availableThemes: Theme[];
  setCustomColors: (colors: Partial<ThemeColors>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'quelyos-theme';

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

interface ThemeProviderProps {
  children: ReactNode;
  defaultThemeName?: ThemeName;
  configColors?: {
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export function ThemeProvider({
  children,
  defaultThemeName = 'default',
  configColors,
}: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>(defaultThemeName);
  const [customColors, setCustomColorsState] = useState<Partial<ThemeColors>>({});
  const [mounted, setMounted] = useState(false);

  // Calculer le theme effectif (theme de base + overrides)
  const theme = React.useMemo(() => {
    const baseTheme = themes[themeName] || defaultTheme;

    // Fusionner avec les couleurs de config (SiteConfig)
    const mergedColors = { ...baseTheme.colors };
    if (configColors?.primaryColor) {
      mergedColors.primary = configColors.primaryColor;
      mergedColors.ring = configColors.primaryColor;
    }
    if (configColors?.secondaryColor) {
      mergedColors.secondary = configColors.secondaryColor;
    }
    // Appliquer les overrides personnalises
    Object.assign(mergedColors, customColors);

    return { ...baseTheme, colors: mergedColors };
  }, [themeName, configColors, customColors]);

  // Initialiser depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && themes[stored]) {
      setThemeName(stored);
    }
    setMounted(true);
  }, []);

  // Appliquer le theme au DOM quand il change
  useEffect(() => {
    if (!mounted) return;

    applyThemeToDOM(theme.colors);

    // Definir l'attribut data-theme pour les selecteurs CSS
    document.documentElement.setAttribute('data-theme', theme.name);

    // Gerer la classe dark pour les variantes Tailwind dark:
    if (theme.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, mounted]);

  const setTheme = useCallback((name: ThemeName) => {
    setThemeName(name);
    localStorage.setItem(STORAGE_KEY, name);
  }, []);

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
