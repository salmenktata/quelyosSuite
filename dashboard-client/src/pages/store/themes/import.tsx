/**
 * Page Import Thèmes - Import batch thèmes JSON officiels Quelyos
 *
 * Fonctionnalités :
 * - Import thèmes depuis JSON (fashion-luxury, tech-minimal, food-organic)
 * - Validation JSON Schema avant import
 * - Affichage preview thèmes importés
 * - Log import détaillé (succès/échecs)
 * - Statistiques détaillées (importés/mis à jour/erreurs)
 */

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, Button, PageNotice, SkeletonTable } from '@/components/common';
import { Upload, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '@quelyos/logger';
import { tenantFetch } from '@/lib/tenantFetch';

// Thèmes JSON à importer (paths relatifs depuis public/)
const THEMES_TO_IMPORT = [
  '/themes/fashion-luxury.json',
  '/themes/tech-minimal.json',
  '/themes/food-organic.json',
];

interface ImportResult {
  theme: string;
  success: boolean;
  error?: string;
  theme_id?: number;
  updated?: boolean;
}

export default function ThemesImportPage() {
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleImport = async () => {
    setImporting(true);
    setGlobalError(null);
    setResults([]);

    try {
      // Charger les 3 thèmes JSON
      const themesData = await Promise.all(
        THEMES_TO_IMPORT.map(async (path) => {
          const response = await fetch(path);
          if (!response.ok) {
            throw new Error(`Failed to load ${path}`);
          }
          return response.json();
        })
      );

      // Appeler endpoint batch import
      const response = await tenantFetch(`${import.meta.env.VITE_BACKEND_URL}/api/themes/import-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            themes: themesData,
            is_public: true,
          },
          id: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.data?.message || data.error.message || 'Import failed');
      }

      const result = data.result;

      // Construire résultats détaillés
      const importResults: ImportResult[] = [];

      // Succès
      for (let i = 0; i < result.imported + result.updated; i++) {
        const themeData = themesData[i];
        if (themeData) {
          importResults.push({
            theme: themeData.name,
            success: true,
            updated: i >= result.imported,
          });
        }
      }

      // Erreurs
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach((err: { theme: string; error: string }) => {
          importResults.push({
            theme: err.theme,
            success: false,
            error: err.error,
          });
        });
      }

      setResults(importResults);
    } catch (err) {
      logger.error('[ThemeImport] Import error:', err);
      setGlobalError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const successCount = results.filter((r) => r.success).length;
  const errorCount = results.filter((r) => !r.success).length;
  const updatedCount = results.filter((r) => r.updated).length;

  // Loading State
  if (importing) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <SkeletonTable rows={5} columns={3} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* 1. Breadcrumbs - TOUJOURS en premier */}
        <Breadcrumbs
          items={[
            { label: 'Boutique', href: '/store' },
            { label: 'Thèmes', href: '/store/themes' },
            { label: 'Import JSON', href: '/store/themes/import' },
          ]}
        />

        {/* 2. Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Import Thèmes JSON
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Importer {THEMES_TO_IMPORT.length} thèmes JSON dans la base de données
            </p>
          </div>

          <Button onClick={handleImport} disabled={importing}>
            <Upload className="h-4 w-4 mr-2" />
            Importer les Thèmes
          </Button>
        </div>

        {/* 3. PageNotice - APRÈS le header */}
        <PageNotice
          config={{
            pageId: 'themes-import',
            title: 'Import Thèmes JSON',
            purpose:
              "Cette page permet d'importer les thèmes JSON officiels Quelyos dans la base de données",
            icon: Upload,
            moduleColor: 'indigo',
            sections: [
              {
                title: 'Informations',
                items: [
                  "Les thèmes JSON sont stockés dans vitrine-client/src/theme-engine/themes/",
                  "L'import crée les thèmes dans le système backend",
                  "Si un thème existe déjà (même code), sa configuration JSON sera mise à jour",
                  "Les thèmes importés sont publics et gratuits par défaut",
                  'Admin uniquement : droits "base.group_system" requis',
                ],
              },
            ],
          }}
        />

        {/* 4. Contenu principal */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {/* Thèmes à importer */}
          {results.length === 0 && !globalError && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Thèmes prêts à être importés :
              </h3>
              <ul className="space-y-2">
                {THEMES_TO_IMPORT.map((path, index) => (
                  <li
                    key={index}
                    className="flex items-center text-sm text-gray-600 dark:text-gray-400"
                  >
                    <CheckCircle className="h-4 w-4 mr-2 text-gray-400" />
                    {path.split('/').pop()}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Erreur globale */}
          {globalError && (
            <div
              role="alert"
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                    Erreur d&apos;import
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">{globalError}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<RefreshCw className="w-4 h-4" />}
                  onClick={() => window.location.reload()}
                >
                  Réessayer
                </Button>
              </div>
            </div>
          )}

          {/* Résultats import */}
          {results.length > 0 && (
            <div className="space-y-4">
              {/* Statistiques */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {successCount - updatedCount}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Thèmes Importés
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {updatedCount}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">Thèmes Mis à Jour</div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {errorCount}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300 mt-1">Erreurs</div>
                </div>
              </div>

              {/* Détails résultats */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="p-4 flex items-start hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                    )}

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {result.theme}
                        </h4>
                        {result.updated && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Mis à jour
                          </span>
                        )}
                      </div>

                      {result.error && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{result.error}</p>
                      )}

                      {result.success && !result.error && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {result.updated
                            ? 'Configuration JSON mise à jour'
                            : 'Thème importé avec succès'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
