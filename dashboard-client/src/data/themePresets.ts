import { DEFAULT_COLORS } from '../hooks/useTenants';
import type { TenantColors } from '../hooks/useTenants';

export interface ThemePreset {
  id: string;
  label: string;
  description: string;
  colors: TenantColors;
  fontFamily: 'inter' | 'roboto' | 'poppins' | 'montserrat' | 'open-sans' | 'lato';
  darkMode: {
    enabled: boolean;
    defaultDark: boolean;
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'sportif',
    label: 'Le Sportif',
    description: 'Theme actuel, vert premium et contraste doux.',
    colors: DEFAULT_COLORS,
    fontFamily: 'inter',
    darkMode: { enabled: true, defaultDark: false },
  },
  {
    id: 'ocean',
    label: 'Ocean',
    description: 'Palette bleue, propre et moderne.',
    colors: {
      primary: '#1d4ed8',
      primaryDark: '#1e40af',
      primaryLight: '#3b82f6',
      secondary: '#93c5fd',
      secondaryDark: '#60a5fa',
      secondaryLight: '#bfdbfe',
      accent: '#06b6d4',
      background: '#ffffff',
      foreground: '#0f172a',
      muted: '#f1f5f9',
      mutedForeground: '#64748b',
      border: '#e2e8f0',
      ring: '#1d4ed8',
    },
    fontFamily: 'roboto',
    darkMode: { enabled: true, defaultDark: false },
  },
  {
    id: 'sunset',
    label: 'Sunset',
    description: 'Orange chaleureux, ideal pour lifestyle.',
    colors: {
      primary: '#ea580c',
      primaryDark: '#c2410c',
      primaryLight: '#fb923c',
      secondary: '#fed7aa',
      secondaryDark: '#fdba74',
      secondaryLight: '#ffedd5',
      accent: '#ef4444',
      background: '#ffffff',
      foreground: '#111827',
      muted: '#fff7ed',
      mutedForeground: '#6b7280',
      border: '#e5e7eb',
      ring: '#ea580c',
    },
    fontFamily: 'poppins',
    darkMode: { enabled: true, defaultDark: false },
  },
  {
    id: 'forest',
    label: 'Forest',
    description: 'Vert profond et accents naturels.',
    colors: {
      primary: '#166534',
      primaryDark: '#14532d',
      primaryLight: '#22c55e',
      secondary: '#d6d3c3',
      secondaryDark: '#b6b09b',
      secondaryLight: '#eeeae0',
      accent: '#f59e0b',
      background: '#ffffff',
      foreground: '#0f172a',
      muted: '#f8fafc',
      mutedForeground: '#64748b',
      border: '#e2e8f0',
      ring: '#166534',
    },
    fontFamily: 'montserrat',
    darkMode: { enabled: true, defaultDark: false },
  },
];
