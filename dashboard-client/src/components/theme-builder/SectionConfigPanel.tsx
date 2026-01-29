import { useBuilder } from './BuilderContext';

/**
 * Variants disponibles par type de section
 */
const variantsByType: Record<string, Array<{ value: string; label: string }>> = {
  'hero-slider': [
    { value: 'fullscreen', label: 'Plein écran' },
    { value: 'split-screen', label: 'Split screen' },
    { value: 'minimal', label: 'Minimal' },
  ],
  'featured-products': [
    { value: 'grid-4cols', label: 'Grille 4 colonnes' },
    { value: 'grid-3cols', label: 'Grille 3 colonnes' },
    { value: 'carousel', label: 'Carrousel' },
    { value: 'masonry', label: 'Masonry' },
  ],
  newsletter: [
    { value: 'centered', label: 'Centré' },
    { value: 'sidebar', label: 'Sidebar' },
    { value: 'popup', label: 'Popup' },
  ],
  testimonials: [
    { value: 'carousel', label: 'Carrousel' },
    { value: 'grid', label: 'Grille' },
    { value: 'masonry', label: 'Masonry' },
  ],
  'trust-badges': [
    { value: 'icons', label: 'Icônes' },
    { value: 'logos', label: 'Logos' },
    { value: 'stats', label: 'Statistiques' },
  ],
  faq: [
    { value: 'accordion', label: 'Accordéon' },
    { value: 'tabs', label: 'Onglets' },
    { value: 'list', label: 'Liste simple' },
  ],
  'video-hero': [
    { value: 'fullscreen', label: 'Plein écran' },
    { value: 'split', label: 'Split' },
    { value: 'overlay', label: 'Overlay' },
  ],
  'category-grid': [
    { value: 'grid-3cols', label: 'Grille 3 colonnes' },
    { value: 'grid-4cols', label: 'Grille 4 colonnes' },
    { value: 'carousel', label: 'Carrousel' },
  ],
  'blog-preview': [
    { value: 'grid', label: 'Grille' },
    { value: 'list', label: 'Liste' },
    { value: 'featured', label: 'Mis en avant' },
  ],
  'contact-form': [
    { value: 'centered', label: 'Centré' },
    { value: 'split', label: 'Split avec map' },
    { value: 'minimal', label: 'Minimal' },
  ],
};

/**
 * Panel de configuration de section (sidebar droite)
 */
export function SectionConfigPanel() {
  const { state, updateSection } = useBuilder();
  const { selectedSection } = state;

  if (!selectedSection) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-5xl mb-3">⚙️</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sélectionnez une section dans le canvas pour la configurer
          </p>
        </div>
      </div>
    );
  }

  const variants = variantsByType[selectedSection.type] || [];

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Configuration
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {selectedSection.type}
        </p>
      </div>

      <div className="p-4 space-y-6">
        {/* Sélecteur de variant */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Variant
          </label>
          <div className="space-y-2">
            {variants.map((variant) => (
              <label
                key={variant.value}
                className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <input
                  type="radio"
                  name="variant"
                  value={variant.value}
                  checked={selectedSection.variant === variant.value}
                  onChange={(e) =>
                    updateSection(selectedSection.id, { variant: e.target.value })
                  }
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-900 dark:text-white">
                  {variant.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Configuration avancée (à implémenter selon le type de section) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Configuration avancée
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            La configuration spécifique pour ce type de section sera ajoutée
            dans les prochaines phases.
          </p>
        </div>
      </div>
    </div>
  );
}
