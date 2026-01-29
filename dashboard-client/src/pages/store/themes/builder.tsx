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
 * 8. Sauvegarde vers Odoo (soumission draft)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, Button, PageNotice } from '@/components/common';
import { BuilderProvider, useBuilder } from '@/components/theme-builder/BuilderContext';
import { SectionsPalette } from '@/components/theme-builder/SectionsPalette';
import { CanvasArea } from '@/components/theme-builder/CanvasArea';
import { SectionConfigPanel } from '@/components/theme-builder/SectionConfigPanel';
import { storeNotices } from '@/lib/notices/store-notices';
import { toast } from 'sonner';
import { Download, Upload, Save, RotateCcw } from 'lucide-react';

/**
 * Toolbar d'actions (Export/Import/Save/Reset)
 */
function ActionsToolbar() {
  const { exportJSON, importJSON, resetBuilder } = useBuilder();
  const navigate = useNavigate();

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
    try {
      const json = exportJSON();
      const themeConfig = JSON.parse(json);

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
        toast.error(data.error?.data?.message || 'Erreur lors de la sauvegarde');
      }
    } catch (_error) {
      toast.error('Erreur lors de la sauvegarde du thème');
    }
  };

  const handleReset = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser le builder ?')) {
      resetBuilder();
    }
  };

  return (
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
        Save to Odoo
      </Button>
    </div>
  );
}

/**
 * Contenu principal du builder (avec provider)
 */
function BuilderContent() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Theme Builder
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Créez votre thème visuellement avec drag & drop
          </p>
        </div>
        <ActionsToolbar />
      </div>

      {/* Layout 3 colonnes */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar gauche : Palette */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          <SectionsPalette />
        </div>

        {/* Zone centrale : Canvas */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-800 overflow-hidden">
          <CanvasArea />
        </div>

        {/* Sidebar droite : Config */}
        <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          <SectionConfigPanel />
        </div>
      </div>
    </div>
  );
}

/**
 * Page principale avec Layout
 */
export default function ThemeBuilderPage() {
  const [showNotice, setShowNotice] = useState(true);

  return (
    <Layout>
      <div className="flex flex-col h-full">
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

        <div className="flex-1 overflow-hidden">
          <BuilderProvider>
            <BuilderContent />
          </BuilderProvider>
        </div>
      </div>
    </Layout>
  );
}
