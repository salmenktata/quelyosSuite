/**
 * CSS Variables generator pour les design tokens
 * À utiliser dans le fichier globals.css
 */

import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  zIndex,
} from "./tokens";

export function generateCSSVariables() {
  return `
:root {
  /* Colors - Brand */
  --color-brand-primary: ${colors.brand.primary};
  --color-brand-secondary: ${colors.brand.secondary};
  --color-brand-accent: ${colors.brand.accent};

  /* Colors - Semantic */
  --color-success: ${colors.success.DEFAULT};
  --color-success-light: ${colors.success.light};
  --color-success-dark: ${colors.success.dark};

  --color-error: ${colors.error.DEFAULT};
  --color-error-light: ${colors.error.light};
  --color-error-dark: ${colors.error.dark};

  --color-warning: ${colors.warning.DEFAULT};
  --color-warning-light: ${colors.warning.light};
  --color-warning-dark: ${colors.warning.dark};

  --color-info: ${colors.info.DEFAULT};
  --color-info-light: ${colors.info.light};
  --color-info-dark: ${colors.info.dark};

  /* Colors - Background */
  --color-background-primary: ${colors.background.primary};
  --color-background-secondary: ${colors.background.secondary};
  --color-background-tertiary: ${colors.background.tertiary};

  /* Colors - Text */
  --color-text-primary: ${colors.text.primary};
  --color-text-secondary: ${colors.text.secondary};
  --color-text-tertiary: ${colors.text.tertiary};
  --color-text-disabled: ${colors.text.disabled};
  --color-text-inverse: ${colors.text.inverse};

  /* Colors - Border */
  --color-border-light: ${colors.border.light};
  --color-border: ${colors.border.DEFAULT};
  --color-border-dark: ${colors.border.dark};
  --color-border-focus: ${colors.border.focus};

  /* Spacing */
  --spacing-1: ${spacing[1]};
  --spacing-2: ${spacing[2]};
  --spacing-3: ${spacing[3]};
  --spacing-4: ${spacing[4]};
  --spacing-5: ${spacing[5]};
  --spacing-6: ${spacing[6]};
  --spacing-8: ${spacing[8]};
  --spacing-10: ${spacing[10]};
  --spacing-12: ${spacing[12]};
  --spacing-16: ${spacing[16]};

  /* Typography */
  --font-sans: ${typography.fontFamily.sans.join(", ")};
  --font-mono: ${typography.fontFamily.mono.join(", ")};

  --font-size-xs: ${typography.fontSize.xs};
  --font-size-sm: ${typography.fontSize.sm};
  --font-size-base: ${typography.fontSize.base};
  --font-size-lg: ${typography.fontSize.lg};
  --font-size-xl: ${typography.fontSize.xl};
  --font-size-2xl: ${typography.fontSize["2xl"]};

  /* Border Radius */
  --radius-sm: ${borderRadius.sm};
  --radius: ${borderRadius.DEFAULT};
  --radius-md: ${borderRadius.md};
  --radius-lg: ${borderRadius.lg};
  --radius-xl: ${borderRadius.xl};
  --radius-full: ${borderRadius.full};

  /* Shadows */
  --shadow-sm: ${shadows.sm};
  --shadow: ${shadows.DEFAULT};
  --shadow-md: ${shadows.md};
  --shadow-lg: ${shadows.lg};
  --shadow-xl: ${shadows.xl};

  /* Z-Index */
  --z-dropdown: ${zIndex.dropdown};
  --z-sticky: ${zIndex.sticky};
  --z-fixed: ${zIndex.fixed};
  --z-modal: ${zIndex.modal};
  --z-popover: ${zIndex.popover};
  --z-tooltip: ${zIndex.tooltip};
  --z-notification: ${zIndex.notification};
}

.dark {
  /* Dark mode overrides */
  --color-background-primary: ${colors.gray[900]};
  --color-background-secondary: ${colors.gray[800]};
  --color-background-tertiary: ${colors.gray[700]};

  --color-text-primary: ${colors.gray[50]};
  --color-text-secondary: ${colors.gray[400]};
  --color-text-tertiary: ${colors.gray[500]};
  --color-text-disabled: ${colors.gray[600]};

  --color-border-light: ${colors.gray[800]};
  --color-border: ${colors.gray[700]};
  --color-border-dark: ${colors.gray[600]};
}
  `.trim();
}

// Export pour usage direct dans les apps
export const cssVariables = generateCSSVariables();
