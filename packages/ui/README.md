# @quelyos/ui v2.0

> Bibliothèque de composants UI avec système de design tokens, thèmes light/dark et support responsive

## 🎯 Nouveautés v2.0

- ✅ **Design Tokens** : Système unifié de tokens (colors, spacing, typography, etc.)
- ✅ **Thèmes** : Support light/dark avec détection système
- ✅ **Responsive** : Hooks et composants pour mobile/tablet/desktop
- ✅ **CSS Variables** : Variables CSS générées depuis les tokens
- ✅ **TypeScript** : Types complets pour tous les tokens

## 🎨 Design Tokens

Import des tokens :

```typescript
import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  breakpoints,
  animation,
  zIndex,
} from "@quelyos/ui/tokens";

// Usage
const primaryColor = colors.brand.primary; // "#2563eb"
const spacing4 = spacing[4]; // "1rem"
const fontSans = typography.fontFamily.sans; // ['Inter', 'system-ui', ...]
```

### Tokens disponibles

- **colors** : Brand, semantic (success/error/warning/info), gray scale, background, text, border
- **spacing** : 0 à 32 (0px à 128px)
- **typography** : fontFamily (sans, mono), fontSize (xs à 5xl), fontWeight, lineHeight
- **borderRadius** : none, sm, md, lg, xl, 2xl, 3xl, full
- **shadows** : sm, md, lg, xl, 2xl, inner
- **breakpoints** : sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- **animation** : duration (fast/normal/slow), easing
- **zIndex** : dropdown, sticky, fixed, modal, popover, tooltip, notification

## 🌓 Système de Thèmes

### Setup ThemeProvider

```typescript
// app/layout.tsx
import { ThemeProvider, ThemeToggle } from "@quelyos/ui/theme";

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider
          defaultTheme="system"
          enableSystem={true}
          enableDeviceDetection={true}
        >
          <header>
            <ThemeToggle />
          </header>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Hook useTheme

```typescript
import { useTheme } from "@quelyos/ui/theme";

function MyComponent() {
  const { theme, resolvedTheme, deviceType, setTheme, toggleTheme } = useTheme();

  return (
    <div>
      <p>Theme: {theme}</p> {/* "light" | "dark" | "system" */}
      <p>Resolved: {resolvedTheme}</p> {/* "light" | "dark" */}
      <p>Device: {deviceType}</p> {/* "desktop" | "mobile" */}

      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme("dark")}>Dark Mode</button>
    </div>
  );
}
```

### CSS Variables

Ajouter dans votre `globals.css` :

```css
@import "@quelyos/ui/css-variables";

/* Ou générer manuellement : */
@layer base {
  :root {
    --color-brand-primary: #2563eb;
    --color-background-primary: #ffffff;
    /* ... */
  }

  .dark {
    --color-background-primary: #111827;
    /* ... */
  }
}
```

Utilisation dans les composants :

```css
.my-component {
  background-color: var(--color-background-primary);
  color: var(--color-text-primary);
  padding: var(--spacing-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

## 📱 Système Responsive

### Hook useResponsive

```typescript
import { useResponsive } from "@quelyos/ui/responsive";

function MyComponent() {
  const { isMobile, isTablet, isDesktop, breakpoint, width } = useResponsive();

  if (isMobile) return <MobileView />;
  if (isTablet) return <TabletView />;
  return <DesktopView />;
}
```

### Composants conditionnels

```typescript
import {
  MobileOnly,
  TabletOnly,
  DesktopOnly,
  MobileAndTablet,
  TabletAndDesktop,
} from "@quelyos/ui/responsive";

function MyComponent() {
  return (
    <>
      <MobileOnly>
        <MobileMenu />
      </MobileOnly>

      <DesktopOnly>
        <DesktopSidebar />
      </DesktopOnly>

      <TabletAndDesktop>
        <ExpandedView />
      </TabletAndDesktop>
    </>
  );
}
```

## 🧩 Composants UI

### Components disponibles

- **Button** - Variants (default, destructive, outline, secondary, ghost, link)
- **Card** - Container avec Header, Title, Description, Content, Footer
- **Input** - Champ de saisie stylisé
- **Avatar** - Avatar avec image et fallback (Radix UI)
- **Tabs** - Navigation par onglets (Radix UI)
- **Dropdown Menu** - Menu déroulant (Radix UI)
- **Tooltip** - Info-bulles (Radix UI)
- **Navigation Menu** - Menu de navigation (Radix UI)

### Usage

```typescript
import { Button, Card, CardHeader, CardTitle, Input } from "@quelyos/ui";

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exemple</CardTitle>
      </CardHeader>
      <Input placeholder="Entrez du texte..." />
      <Button>Envoyer</Button>
    </Card>
  );
}
```

## 🎨 Tailwind Configuration

Ajouter dans votre `tailwind.config.js` :

```javascript
import { colors, spacing, borderRadius, shadows } from "@quelyos/ui/tokens";

module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/**/*.{ts,tsx}", // Inclure les composants du package
  ],
  theme: {
    extend: {
      colors: {
        brand: colors.brand,
        success: colors.success,
        error: colors.error,
        warning: colors.warning,
        info: colors.info,
        gray: colors.gray,
        border: colors.border,
        background: colors.background,
      },
      spacing,
      borderRadius,
      boxShadow: shadows,
    },
  },
};
```

## 📦 Dependencies

- **Radix UI** - Composants accessibles
- **class-variance-authority** - Variants typés
- **tailwind-merge** - Fusion classes Tailwind
- **lucide-react** - Icônes

## 📝 Changelog v2.0

- ✅ Ajout système de design tokens complet
- ✅ ThemeProvider avec support light/dark/system
- ✅ Hook useTheme avec détection device (mobile/desktop)
- ✅ Système responsive (useResponsive, composants conditionnels)
- ✅ CSS Variables générées depuis les tokens
- ✅ Documentation complète avec exemples
- ✅ TypeScript types pour tous les tokens
- ✅ ThemeToggle et DeviceIndicator components
- ✅ Support animations et z-index
