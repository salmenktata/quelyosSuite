'use client';

import { type ReactNode, useMemo } from 'react';
import { ThemeProvider } from './ThemeContext';
import type { ThemeConfig } from './types';

interface ThemeRendererProps {
  config: ThemeConfig;
  children: ReactNode;
}

export function ThemeRenderer({ config, children }: ThemeRendererProps) {
  // Générer les variables CSS depuis la config
  const cssVariables = useMemo(() => {
    return {
      '--theme-primary': config.colors.primary,
      '--theme-secondary': config.colors.secondary,
      '--theme-accent': config.colors.accent || config.colors.primary,
      '--theme-background': config.colors.background || '#ffffff',
      '--theme-text': config.colors.text || '#000000',
      '--theme-muted': config.colors.muted || '#6b7280',
      '--theme-font-headings': config.typography.headings,
      '--theme-font-body': config.typography.body,
      '--theme-container-width': config.spacing.containerWidth,
      '--theme-section-padding':
        config.spacing.sectionPadding === 'small'
          ? '2rem'
          : config.spacing.sectionPadding === 'medium'
            ? '4rem'
            : config.spacing.sectionPadding === 'large'
              ? '6rem'
              : '8rem',
      '--theme-gutter': config.spacing.gutter || '1rem',
    } as React.CSSProperties;
  }, [config]);

  return (
    <ThemeProvider config={config}>
      <div className="theme-root" style={cssVariables}>
        {config.customCSS && (
          // SÉCURITÉ : customCSS provient d'admin de confiance uniquement
          // TODO : Ajouter sanitizeCss() si thèmes peuvent être créés par utilisateurs
          <style dangerouslySetInnerHTML={{ __html: config.customCSS }} />
        )}
        {children}
      </div>
    </ThemeProvider>
  );
}
