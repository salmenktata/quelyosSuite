/**
 * Page Builder de Thèmes Visuel
 *
 * Fonctionnalités :
 * 1. Interface drag & drop pour créer des thèmes sans coder
 * 2. Éditeur de couleurs et typographie (Phase 2)
 * 3. Palette de sections réutilisables
 * 4. Canvas pour organiser les sections
 * 5. Configuration de sections avec variants
 * 6. Preview temps réel (Phase 5)
 * 7. Export/Import JSON
 * 8. Sauvegarde vers le système (soumission draft)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, Button, PageNotice } from '@/components/common';
import { BuilderProvider, useBuilder, type SectionConfig } from '@/components/theme-builder/BuilderContext';
import { SectionsPalette } from '@/components/theme-builder/SectionsPalette';
import { CanvasArea } from '@/components/theme-builder/CanvasArea';
import { ColorPicker } from '@/components/theme-builder/ColorPicker';
import { FontSelector } from '@/components/theme-builder/FontSelector';
import { storeNotices } from '@/lib/notices/store-notices';
import { getValidationErrors } from '@/lib/theme-validation';
import { toast } from 'sonner';
import { Download, Upload, Save, RotateCcw, Layers, Palette as PaletteIcon, Type, Eye } from 'lucide-react';

/**
 * Toolbar d'actions (Export/Import/Save/Reset)
 */
function ActionsToolbar() {
  const { exportJSON, importJSON, resetBuilder } = useBuilder();
  const navigate = useNavigate();
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleExport = () => {
    const json = exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theme-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Thème exporté avec succès');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        importJSON(json);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      const json = exportJSON();
      const themeConfig = JSON.parse(json);

      // Validation JSON Schema
      const validationError = getValidationErrors(themeConfig);
      if (validationError) {
        toast.error('Thème invalide', {
          description: validationError,
          duration: 5000,
        });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/themes/submissions/create`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {
              name: `Theme Builder ${new Date().toLocaleDateString()}`,
              description: 'Thème créé avec le builder visuel',
              category: 'general',
              config_json: JSON.stringify(themeConfig),
              is_premium: false,
              price: 0.0,
            },
            id: 1,
          }),
        }
      );

      const data = await response.json();

      if (data.result?.success) {
        toast.success('Thème sauvegardé comme soumission draft');
        navigate('/store/themes/my-submissions');
      } else {
        const errorMsg = data.error?.data?.message || 'Erreur lors de la sauvegarde';
        setSaveError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (_error) {
      const errorMsg = 'Erreur lors de la sauvegarde du thème';
      setSaveError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleReset = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser le builder ?')) {
      resetBuilder();
    }
  };

  return (
    <>
      {saveError && (
        <div
          role="alert"
          className="absolute top-20 right-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-md shadow-lg z-50"
        >
          <p className="text-sm text-red-900 dark:text-red-100 mb-2">{saveError}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSave}>
              Réessayer
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSaveError(null)}>
              Fermer
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4" />
          Export JSON
        </Button>
        <Button variant="outline" size="sm" onClick={handleImport}>
          <Upload className="w-4 h-4" />
          Import JSON
        </Button>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
        <Button variant="primary" size="sm" onClick={handleSave}>
          <Save className="w-4 h-4" />
          Save to Backend
        </Button>
      </div>
    </>
  );
}

/**
 * Vue Build : Palette + Canvas
 */
function BuildView() {
  return (
    <div className="flex h-full">
      {/* Palette gauche (plus large) */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto">
        <SectionsPalette />
      </div>

      {/* Canvas central (large) */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-800 overflow-hidden">
        <CanvasArea />
      </div>
    </div>
  );
}

/**
 * Vue Style : Couleurs + Typographie
 */
function StyleView() {
  const { state, updateColors, updateTypography } = useBuilder();

  return (
    <div className="flex h-full">
      {/* Couleurs gauche */}
      <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto p-8">
        <div className="max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Palette de Couleurs
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Définissez les 4 couleurs principales de votre thème
            </p>
          </div>

          <div className="space-y-6">
            <ColorPicker
              label="Couleur Principale"
              value={state.colors.primary}
              onChange={(color) => updateColors({ primary: color })}
            />
            <ColorPicker
              label="Couleur Secondaire"
              value={state.colors.secondary}
              onChange={(color) => updateColors({ secondary: color })}
            />
            <ColorPicker
              label="Couleur d'Accent"
              value={state.colors.accent}
              onChange={(color) => updateColors({ accent: color })}
            />
            <ColorPicker
              label="Couleur de Fond"
              value={state.colors.background}
              onChange={(color) => updateColors({ background: color })}
            />
          </div>
        </div>
      </div>

      {/* Typographie droite */}
      <div className="w-1/2 bg-white dark:bg-gray-900 overflow-y-auto p-8">
        <div className="max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Typographie
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choisissez les polices pour titres et corps de texte
            </p>
          </div>

          <div className="space-y-8">
            <FontSelector
              label="Police des Titres"
              value={state.typography.headings}
              weight={state.typography.headingsWeight}
              onChange={(font) => updateTypography({ headings: font })}
              onWeightChange={(weight) => updateTypography({ headingsWeight: weight })}
              preview="Titre Principal"
            />

            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
              <FontSelector
                label="Police du Corps"
                value={state.typography.body}
                weight={state.typography.bodyWeight}
                onChange={(font) => updateTypography({ body: font })}
                onWeightChange={(weight) => updateTypography({ bodyWeight: weight })}
                preview="Texte du corps de page"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Header du builder avec onglets et actions
 */
function BuilderHeader({ activeView, onViewChange }: { activeView: 'build' | 'style'; onViewChange: (view: 'build' | 'style') => void }) {
  const { state } = useBuilder();

  const handlePreview = () => {
    // Sauvegarder le state complet dans localStorage (même clé que PreviewPane)
    localStorage.setItem('theme-builder-preview', JSON.stringify(state));

    // Ouvrir la preview dans une nouvelle fenêtre
    const previewWindow = window.open(
      '/store/themes/builder/preview',
      'theme-preview',
      'width=1280,height=800,menubar=no,toolbar=no,location=no'
    );

    // Focus sur la fenêtre
    if (previewWindow) {
      previewWindow.focus();
    }
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Ligne 1 : Titre + Actions */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Theme Builder
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {state.sections.length} section{state.sections.length > 1 ? 's' : ''} · Créez votre thème visuellement
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handlePreview}>
            <Eye className="w-4 h-4" />
            Preview
          </Button>
          <ActionsToolbar />
        </div>
      </div>

      {/* Ligne 2 : Onglets */}
      <div className="flex px-6 gap-1">
        <button
          onClick={() => onViewChange('build')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
            activeView === 'build'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-b-2 border-transparent'
          }`}
        >
          <Layers className="w-5 h-5" />
          Build
        </button>
        <button
          onClick={() => onViewChange('style')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
            activeView === 'style'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-b-2 border-transparent'
          }`}
        >
          <PaletteIcon className="w-5 h-5" />
          Style
        </button>
      </div>
    </div>
  );
}

/**
 * Wrapper avec header et contenu (nécessite BuilderProvider)
 */
function BuilderWithHeader() {
  const [activeView, setActiveView] = useState<'build' | 'style'>('build');

  return (
    <div className="flex flex-col h-full">
      {/* Header avec onglets */}
      <BuilderHeader activeView={activeView} onViewChange={setActiveView} />

      {/* Contenu selon vue active */}
      <div className="flex-1 overflow-hidden border-t border-gray-200 dark:border-gray-700">
        <BuilderContent activeView={activeView} />
      </div>
    </div>
  );
}

/**
 * Contenu principal du builder (avec DnD)
 */
function BuilderContent({ activeView }: { activeView: 'build' | 'style' }) {
  const { state, addSection, reorderSections } = useBuilder();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sensors pour le drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px de mouvement requis avant activation
      },
    })
  );

  // Handler début de drag
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handler fin de drag
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Cas 1 : Drag depuis palette → canvas (nouveau)
    if (active.data.current?.source === 'palette' && over.id === 'canvas-droppable') {
      const sectionData = active.data.current;
      addSection({
        type: sectionData.type,
        variant: sectionData.variant,
        config: {},
      });
      toast.success('Section ajoutée');
      return;
    }

    // Cas 2 : Réorganisation dans canvas
    if (active.data.current?.source === 'canvas' && active.id !== over.id) {
      const oldIndex = state.sections.findIndex((s) => s.id === active.id);
      const newIndex = state.sections.findIndex((s) => s.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderSections(oldIndex, newIndex);
      }
    }
  };

  // Section en cours de drag pour DragOverlay
  const activeSection = activeId
    ? state.sections.find((s) => s.id === activeId) ||
      (activeId.startsWith('palette-')
        ? { id: activeId, type: activeId.replace('palette-', ''), variant: 'default' }
        : null)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full">
        {/* Contenu selon vue active */}
        {activeView === 'build' ? <BuildView /> : <StyleView />}
      </div>

      {/* DragOverlay pour visual feedback */}
      <DragOverlay>
        {activeSection ? (
          <div className="p-4 rounded-lg border-2 border-indigo-500 dark:border-indigo-400 bg-white dark:bg-gray-800 shadow-2xl opacity-90">
            <p className="font-medium text-gray-900 dark:text-white text-sm">
              {activeSection.type}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {activeSection.variant}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/**
 * Page principale avec Layout
 */
export default function ThemeBuilderPage() {
  const [showNotice, setShowNotice] = useState(true);

  return (
    <Layout>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Boutique', href: '/store' },
            { label: 'Thèmes', href: '/store/themes' },
            { label: 'Builder', href: '/store/themes/builder' },
          ]}
        />

        {showNotice && (
          <PageNotice
            config={storeNotices['themes.builder']}
            className="mb-6"
          />
        )}

        <BuilderProvider>
          <div className="h-[calc(100vh-280px)] border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
            <BuilderWithHeader />
          </div>
        </BuilderProvider>
      </div>
    </Layout>
  );
}
