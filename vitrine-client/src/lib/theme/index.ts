/**
 * Systeme de theming Quelyos
 *
 * Usage:
 * ```tsx
 * import { ThemeProvider, useTheme } from '@/lib/theme';
 *
 * // Dans layout.tsx
 * <ThemeProvider>
 *   {children}
 * </ThemeProvider>
 *
 * // Dans un composant
 * const { theme, setTheme, availableThemes } = useTheme();
 * setTheme('dark');
 * ```
 */

export { ThemeProvider, useTheme } from './ThemeProvider';
export { themes, defaultTheme } from './themes';
export type { Theme, ThemeColors, ThemeName } from './types';
