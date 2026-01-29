import { Plus } from 'lucide-react';
import { useBuilder } from './BuilderContext';

/**
 * Sections disponibles dans le catalogue
 */
const availableSections = [
  {
    type: 'hero-slider',
    name: 'Hero Slider',
    description: 'Carrousel d\'images avec CTA',
    icon: '🎬',
    defaultVariant: 'fullscreen',
  },
  {
    type: 'featured-products',
    name: 'Produits Mis en Avant',
    description: 'Grille de produits sélectionnés',
    icon: '⭐',
    defaultVariant: 'grid-4cols',
  },
  {
    type: 'newsletter',
    name: 'Newsletter',
    description: 'Formulaire d\'inscription',
    icon: '📧',
    defaultVariant: 'centered',
  },
  {
    type: 'testimonials',
    name: 'Témoignages',
    description: 'Avis clients',
    icon: '💬',
    defaultVariant: 'carousel',
  },
  {
    type: 'trust-badges',
    name: 'Trust Badges',
    description: 'Badges de confiance',
    icon: '🛡️',
    defaultVariant: 'icons',
  },
  {
    type: 'faq',
    name: 'FAQ',
    description: 'Questions fréquentes',
    icon: '❓',
    defaultVariant: 'accordion',
  },
  {
    type: 'video-hero',
    name: 'Video Hero',
    description: 'Vidéo en arrière-plan',
    icon: '🎥',
    defaultVariant: 'fullscreen',
  },
  {
    type: 'category-grid',
    name: 'Catégories',
    description: 'Grille de catégories',
    icon: '📦',
    defaultVariant: 'grid-3cols',
  },
  {
    type: 'blog-preview',
    name: 'Blog Preview',
    description: 'Derniers articles',
    icon: '📝',
    defaultVariant: 'grid',
  },
  {
    type: 'contact-form',
    name: 'Contact',
    description: 'Formulaire de contact',
    icon: '📞',
    defaultVariant: 'centered',
  },
];

/**
 * Palette de sections disponibles (sidebar gauche)
 */
export function SectionsPalette() {
  const { addSection } = useBuilder();

  const handleAddSection = (section: typeof availableSections[0]) => {
    addSection({
      type: section.type,
      variant: section.defaultVariant,
      config: {},
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Sections Disponibles
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Glissez-déposez pour ajouter au canvas
        </p>
      </div>

      <div className="p-4 space-y-2">
        {availableSections.map((section) => (
          <button
            key={section.type}
            onClick={() => handleAddSection(section)}
            className="w-full flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md transition-all text-left group"
          >
            <span className="text-2xl flex-shrink-0">{section.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                {section.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {section.description}
              </p>
            </div>
            <Plus className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
}
