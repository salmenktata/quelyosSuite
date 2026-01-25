/**
 * Types pour le systeme de theming
 */

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  ring: string;
}

export interface Theme {
  name: string;
  label: string;
  isDark: boolean;
  colors: ThemeColors;
}

export type ThemeName = 'default' | 'dark' | 'blue' | 'red' | string;
