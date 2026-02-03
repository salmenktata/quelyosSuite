/**
 * Definitions des themes disponibles
 */

import { Theme } from './types';

export const themes: Record<string, Theme> = {
  default: {
    name: 'default',
    label: 'Vert Émeraude (Défaut)',
    isDark: false,
    colors: {
      primary: '#10b981',
      primaryDark: '#059669',
      primaryLight: '#34d399',
      secondary: '#6ee7b7',
      secondaryDark: '#4ade80',
      secondaryLight: '#a7f3d0',
      accent: '#34d399',
      background: '#ffffff',
      foreground: '#171717',
      muted: '#f5f5f5',
      mutedForeground: '#737373',
      border: '#e5e5e5',
      ring: '#10b981',
    },
  },

  dark: {
    name: 'dark',
    label: 'Mode Sombre',
    isDark: true,
    colors: {
      primary: '#34d399',
      primaryDark: '#10b981',
      primaryLight: '#6ee7b7',
      secondary: '#4ade80',
      secondaryDark: '#22c55e',
      secondaryLight: '#86efac',
      accent: '#34d399',
      background: '#0a0a0a',
      foreground: '#ededed',
      muted: '#262626',
      mutedForeground: '#a3a3a3',
      border: '#404040',
      ring: '#34d399',
    },
  },

  blue: {
    name: 'blue',
    label: 'Ocean Bleu',
    isDark: false,
    colors: {
      primary: '#2563eb',
      primaryDark: '#1d4ed8',
      primaryLight: '#3b82f6',
      secondary: '#93c5fd',
      secondaryDark: '#60a5fa',
      secondaryLight: '#bfdbfe',
      accent: '#f59e0b',
      background: '#ffffff',
      foreground: '#171717',
      muted: '#f0f9ff',
      mutedForeground: '#64748b',
      border: '#e2e8f0',
      ring: '#2563eb',
    },
  },

  red: {
    name: 'red',
    label: 'Rouge Passion',
    isDark: false,
    colors: {
      primary: '#dc2626',
      primaryDark: '#b91c1c',
      primaryLight: '#ef4444',
      secondary: '#fecaca',
      secondaryDark: '#fca5a5',
      secondaryLight: '#fee2e2',
      accent: '#f59e0b',
      background: '#ffffff',
      foreground: '#171717',
      muted: '#fef2f2',
      mutedForeground: '#6b7280',
      border: '#e5e7eb',
      ring: '#dc2626',
    },
  },
};

export const defaultTheme = themes.default;
