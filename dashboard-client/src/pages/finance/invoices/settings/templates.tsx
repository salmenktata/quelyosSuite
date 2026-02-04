/**
 * Page Gestion Templates Factures
 *
 * Fonctionnalités :
 * - Liste templates système + custom tenant
 * - Filtrage par secteur et type
 * - Création template custom
 * - Modification template (custom seulement)
 * - Duplication template (système → custom)
 * - Définition template par défaut
 * - Preview PDF template
 * - Éditeur WYSIWYG couleurs/logo/header/footer
 */

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, PageNotice, Button } from '@/components/common';
import { financeNotices } from '@/lib/notices';
import {
  useInvoiceTemplates,
  useDuplicateInvoiceTemplate,
  useSetDefaultInvoiceTemplate,
  SECTOR_LABELS,
  type TemplateSector,
  type InvoiceTemplate,
} from '@/hooks/useInvoiceTemplates';
import {
  Palette,
  Copy,
  Star,
  Eye,
  Edit,
  Plus,
  Filter,
  FileText,
} from 'lucide-react';

export default function InvoiceTemplatesPage() {
  const [filterType, setFilterType] = useState<'all' | 'system' | 'custom'>('all');
  const [filterSector, setFilterSector] = useState<TemplateSector | ''>('');
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Queries & Mutations
  const { data, isLoading, error } = useInvoiceTemplates({
    template_type: filterType,
    sector: filterSector || undefined,
  });

  const duplicateMutation = useDuplicateInvoiceTemplate();
  const setDefaultMutation = useSetDefaultInvoiceTemplate();

  // Handlers
  const handleDuplicate = (template: InvoiceTemplate) => {
    if (window.confirm(`Dupliquer le template "${template.name}" ?`)) {
      duplicateMutation.mutate(template.id);
    }
  };

  const handleSetDefault = (template: InvoiceTemplate) => {
    if (window.confirm(`Définir "${template.name}" comme template par défaut ?`)) {
      setDefaultMutation.mutate(template.id);
    }
  };

  const handleEdit = (template: InvoiceTemplate) => {
    setSelectedTemplate(template);
    setShowEditor(true);
  };

  const handlePreview = (template: InvoiceTemplate) => {
    window.open(template.preview_url, '_blank');
  };

  return (
    <Layout>
      <Breadcrumbs
        items={[
          { label: 'Finance', href: '/finance' },
          { label: 'Factures', href: '/finance/invoices' },
          { label: 'Templates', href: '/finance/invoices/settings/templates' },
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Palette className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              Templates Factures
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Personnalisez l&apos;apparence de vos factures PDF avec des templates sectoriels
            </p>
          </div>

          <Button
            onClick={() => {
              setSelectedTemplate(null);
              setShowEditor(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer un template
          </Button>
        </div>

        <PageNotice notices={financeNotices} currentPage="templates" />

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400 dark:text-gray-500" />

            {/* Filtre Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'system' | 'custom')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tous les templates</option>
              <option value="system">Templates système</option>
              <option value="custom">Mes templates</option>
            </select>

            {/* Filtre Secteur */}
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value as TemplateSector | '')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Tous les secteurs</option>
              {Object.entries(SECTOR_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Chargement des templates...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <p className="text-red-800 dark:text-red-200">
              Erreur : {error.message}
            </p>
          </div>
        )}

        {/* Templates Grid */}
        {data && data.templates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.templates.map((template) => (
              <div
                key={template.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
              >
                {/* Preview Header */}
                <div
                  className="h-32 rounded-t-lg flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${template.primary_color} 0%, ${template.secondary_color} 100%)`,
                  }}
                >
                  <FileText className="w-16 h-16 text-white opacity-80" />
                </div>

                {/* Template Info */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {SECTOR_LABELS[template.sector]}
                      </p>
                    </div>
                    {template.is_default && (
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    )}
                  </div>

                  {/* Type Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        template.template_type === 'system'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}
                    >
                      {template.template_type === 'system' ? 'Système' : 'Personnalisé'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {template.usage_count} utilisations
                    </span>
                  </div>

                  {/* Colors Preview */}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: template.primary_color }}
                      title={`Primaire: ${template.primary_color}`}
                    />
                    <div
                      className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: template.secondary_color }}
                      title={`Secondaire: ${template.secondary_color}`}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handlePreview(template)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>

                    <button
                      onClick={() => handleDuplicate(template)}
                      disabled={duplicateMutation.isPending}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Copy className="w-4 h-4" />
                      Dupliquer
                    </button>

                    {template.template_type === 'custom' && (
                      <button
                        onClick={() => handleEdit(template)}
                        className="flex-1 px-3 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Éditer
                      </button>
                    )}

                    {!template.is_default && template.template_type === 'custom' && (
                      <button
                        onClick={() => handleSetDefault(template)}
                        disabled={setDefaultMutation.isPending}
                        className="px-3 py-2 text-sm font-medium text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 rounded transition-colors disabled:opacity-50"
                        title="Définir par défaut"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {data && data.templates.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <FileText className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun template trouvé
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {filterType === 'custom'
                ? 'Vous n\'avez pas encore créé de template personnalisé'
                : 'Aucun template ne correspond à vos filtres'}
            </p>
            <Button
              onClick={() => {
                setSelectedTemplate(null);
                setShowEditor(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer mon premier template
            </Button>
          </div>
        )}
      </div>

      {/* TODO: Éditeur Modal (à implémenter) */}
      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {selectedTemplate ? 'Éditer le template' : 'Créer un template'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Éditeur WYSIWYG à implémenter (couleurs, logo, header, footer, CSS)
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  onClick={() => setShowEditor(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-900"
                >
                  Annuler
                </Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
