import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

/**
 * Sections disponibles dans le catalogue
 */
const availableSections = [
  {
    type: 'hero-slider',
    name: 'Hero Slider',
    description: "Carrousel d'images avec CTA",
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
    description: "Formulaire d'inscription",
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
 * Item de section draggable
 */
function DraggableSection({ section }: { section: typeof availableSections[0] }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${section.type}`,
    data: {
      type: section.type,
      variant: section.defaultVariant,
      source: 'palette',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''
      }`}
    >
      <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
      <span className="text-2xl flex-shrink-0">{section.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white text-sm">
          {section.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {section.description}
        </p>
      </div>
    </div>
  );
}

/**
 * Palette de sections disponibles (sidebar gauche)
 */
export function SectionsPalette() {
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
          <DraggableSection key={section.type} section={section} />
        ))}
      </div>
    </div>
  );
}
