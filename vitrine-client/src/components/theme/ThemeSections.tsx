'use client';

/**
 * ThemeSections - Rendu dynamique des sections homepage selon le thème actif
 *
 * Utilise le ThemeContext pour récupérer la config du thème
 * et rendre les sections via le SectionRenderer
 */

import { useTheme } from '@/theme-engine/ThemeProvider';
import { SectionRenderer } from '@/theme-engine/engine/SectionRenderer';

export function ThemeSections() {
  const { theme, loading } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement du thème...</p>
        </div>
      </div>
    );
  }

  if (!theme || !theme.layouts?.homepage?.sections || theme.layouts.homepage.sections.length === 0) {
    return null; // Pas de sections définies, on laisse le contenu par défaut
  }

  return <SectionRenderer sections={theme.layouts.homepage.sections as unknown as import('@/theme-engine/engine/types').SectionConfig[]} />;
}
