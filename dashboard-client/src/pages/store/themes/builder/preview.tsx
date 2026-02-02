/**
 * Page Preview Thème (chargée dans iframe isolé OU nouvelle fenêtre)
 *
 * Fonctionnalités :
 * 1. Lit la config thème depuis localStorage ('theme-builder-preview')
 * 2. Applique les couleurs globales via CSS variables
 * 3. Applique la typographie (Google Fonts)
 * 4. Rend les sections dans l'ordre du canvas
 * 5. Auto-refresh quand le thème change (storage event)
 * 6. Preview isolée (pas de header/sidebar dashboard)
 * 7. Device toggle (Desktop/Tablet/Mobile) en mode standalone
 */

import { useEffect, useState } from 'react';
import { DeviceToggle } from '@/components/theme-builder/DeviceToggle';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/common';
import type { BuilderState } from '@/components/theme-builder/BuilderContext';
import { logger } from '@quelyos/logger';

type Device = 'desktop' | 'tablet' | 'mobile';

// Composants de preview simplifiés pour chaque section
function HeroSliderPreview() {
  return (
    <div className="relative h-96 bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-headings)' }}>
          Bienvenue sur Votre Boutique
        </h1>
        <p className="text-xl opacity-80" style={{ fontFamily: 'var(--font-body)' }}>
          Découvrez nos produits exceptionnels
        </p>
        <button className="mt-6 px-6 py-3 bg-accent text-white rounded-lg font-medium">
          Découvrir
        </button>
      </div>
    </div>
  );
}

function FeaturedProductsPreview() {
  return (
    <div className="py-16 px-8">
      <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-headings)' }}>
        Produits Mis en Avant
      </h2>
      <div className="grid grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/10" />
            <div className="p-4">
              <h3 className="font-semibold mb-2" style={{ fontFamily: 'var(--font-headings)' }}>
                Produit {i}
              </h3>
              <p className="text-sm opacity-70 mb-3" style={{ fontFamily: 'var(--font-body)' }}>
                Description du produit exemple
              </p>
              <p className="text-lg font-bold" style={{ color: 'var(--color-accent)' }}>
                99,99 €
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsletterPreview() {
  return (
    <div className="py-16 px-8 bg-primary/5">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-headings)' }}>
          Restez Informé
        </h2>
        <p className="mb-6 opacity-70" style={{ fontFamily: 'var(--font-body)' }}>
          Inscrivez-vous à notre newsletter pour recevoir nos offres exclusives
        </p>
        <div className="flex gap-4 justify-center">
          <input
            type="email"
            placeholder="Votre email"
            className="px-4 py-3 border rounded-lg flex-1 max-w-md"
            style={{ fontFamily: 'var(--font-body)' }}
          />
          <button className="px-6 py-3 bg-accent text-white rounded-lg font-medium">
            S&apos;inscrire
          </button>
        </div>
      </div>
    </div>
  );
}

function TestimonialsPreview() {
  return (
    <div className="py-16 px-8">
      <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-headings)' }}>
        Témoignages Clients
      </h2>
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-6">
            <p className="mb-4 italic opacity-80" style={{ fontFamily: 'var(--font-body)' }}>
              &quot;Excellent service et produits de qualité. Je recommande vivement !&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary" />
              <div>
                <p className="font-semibold" style={{ fontFamily: 'var(--font-headings)' }}>
                  Client {i}
                </p>
                <p className="text-sm opacity-60">⭐⭐⭐⭐⭐</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GenericSectionPreview({ type }: { type: string }) {
  return (
    <div className="py-16 px-8 bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'var(--font-headings)' }}>
          Section : {type}
        </h2>
        <p className="opacity-60" style={{ fontFamily: 'var(--font-body)' }}>
          Preview pour cette section sera développée prochainement
        </p>
      </div>
    </div>
  );
}

export default function ThemeBuilderPreview() {
  const [themeState, setThemeState] = useState<BuilderState | null>(null);
  const [device, setDevice] = useState<Device>('desktop');
  const [isStandalone, setIsStandalone] = useState(false);

  // Détecter si la page est ouverte en standalone (nouvelle fenêtre) ou en iframe
  useEffect(() => {
    setIsStandalone(window.self === window.top);
  }, []);

  // Charger le thème depuis localStorage
  useEffect(() => {
    const loadTheme = () => {
      const stored = localStorage.getItem('theme-builder-preview');
      if (stored) {
        try {
          const state = JSON.parse(stored) as BuilderState;
          setThemeState(state);
        } catch (error) {
      logger.error("Erreur:", error);
          // Error parsing theme state - ignore
        }
      }
    };

    // Charger initialement
    loadTheme();

    // Écouter les changements
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme-builder-preview') {
        loadTheme();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Appliquer les couleurs et typographie via CSS variables
  useEffect(() => {
    if (!themeState) return;

    const { colors, typography } = themeState;

    // Charger les Google Fonts
    const fontFamilies = [typography.headings, typography.body].filter(Boolean);
    fontFamilies.forEach((font) => {
      const existing = document.querySelector(`link[href*="${font.replace(/ /g, '+')}"]`);
      if (!existing) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@${typography.headingsWeight};${typography.bodyWeight}&display=swap`;
        document.head.appendChild(link);
      }
    });

    // Définir CSS variables
    document.documentElement.style.setProperty('--color-primary', colors.primary);
    document.documentElement.style.setProperty('--color-secondary', colors.secondary);
    document.documentElement.style.setProperty('--color-accent', colors.accent);
    document.documentElement.style.setProperty('--color-background', colors.background);
    document.documentElement.style.setProperty('--font-headings', typography.headings);
    document.documentElement.style.setProperty('--font-body', typography.body);
  }, [themeState]);

  // Rendre une section selon son type
  const renderSection = (section: BuilderState['sections'][0]) => {
    switch (section.type) {
      case 'hero-slider':
        return <HeroSliderPreview key={section.id} />;
      case 'featured-products':
        return <FeaturedProductsPreview key={section.id} />;
      case 'newsletter':
        return <NewsletterPreview key={section.id} />;
      case 'testimonials':
        return <TestimonialsPreview key={section.id} />;
      default:
        return <GenericSectionPreview key={section.id} type={section.type} />;
    }
  };

  // Dimensions selon device
  const deviceDimensions = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  const handleRefresh = () => {
    const stored = localStorage.getItem('theme-builder-preview');
    if (stored) {
      try {
        const state = JSON.parse(stored) as BuilderState;
        setThemeState(state);
      } catch (error) {
      logger.error("Erreur:", error);
        // Error parsing theme state - ignore
      }
    }
  };

  if (!themeState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement du thème...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header avec contrôles (seulement en mode standalone) */}
      {isStandalone && (
        <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Theme Preview
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {themeState.sections.length} section{themeState.sections.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <DeviceToggle value={device} onChange={setDevice} />
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contenu preview */}
      <div className={`${isStandalone ? 'py-8' : ''} flex justify-center`}>
        <div
          className="transition-all duration-300 ease-in-out"
          style={{
            width: isStandalone ? deviceDimensions[device] : '100%',
          }}
        >
          <div
            className="min-h-screen"
            style={{ backgroundColor: themeState.colors.background }}
          >
            {themeState.sections.length === 0 ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md px-4">
                  <div className="text-6xl mb-4">🎨</div>
                  <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-headings)' }}>
                    Aucune section
                  </h2>
                  <p className="opacity-60" style={{ fontFamily: 'var(--font-body)' }}>
                    Glissez-déposez des sections depuis la palette pour voir la preview
                  </p>
                </div>
              </div>
            ) : (
              <div>{themeState.sections.map(renderSection)}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
