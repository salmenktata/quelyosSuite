import { Trash2, GripVertical } from 'lucide-react';
import { useBuilder } from './BuilderContext';
import { Button } from '../common';

/**
 * Zone canvas centrale où les sections sont arrangées
 */
export function CanvasArea() {
  const { state, removeSection, selectSection } = useBuilder();
  const { sections, selectedSection } = state;

  if (sections.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Commencez à créer votre thème
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Ajoutez des sections depuis la palette de gauche pour composer la
            page d&apos;accueil de votre thème.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Canvas Homepage
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {sections.length} section{sections.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="p-4 space-y-3">
        {sections.map((section) => {
          const isSelected = selectedSection?.id === section.id;

          return (
            <div
              key={section.id}
              onClick={() => selectSection(section)}
              className={`
                relative group cursor-pointer rounded-lg border-2 transition-all
                ${
                  isSelected
                    ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <div className="p-4 flex items-center gap-3">
                <button
                  className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Réorganiser"
                >
                  <GripVertical className="w-5 h-5" />
                </button>

                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {section.type}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Variant: {section.variant}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSection(section.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {isSelected && (
                <div className="absolute -right-1 -top-1 w-3 h-3 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
