import { useState } from 'react';
import DOMPurify from 'dompurify';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, Badge, Skeleton, Button } from '@/components/common';
import { useEmailTemplates, TEMPLATE_CATEGORIES, type TemplateCategory } from '@/hooks/useEmailTemplates';
import { FileText, Eye, Search, AlertCircle, RefreshCw } from 'lucide-react';

export default function EmailTemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<number | null>(null);

  const { data: templates, isLoading, error, refetch } = useEmailTemplates();

  const filteredTemplates = (templates || []).filter((t) => {
    const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const selectedTemplateData = previewTemplate
    ? templates?.find((t) => t.id === previewTemplate)
    : null;

  if (error) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <Breadcrumbs
            items={[
              { label: 'Accueil', href: '/dashboard' },
              { label: 'Marketing', href: '/marketing' },
              { label: 'Email', href: '/marketing/email' },
              { label: 'Templates' },
            ]}
          />
          <div role="alert" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement des templates email.
              </p>
              <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => refetch()}>
                Réessayer
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/dashboard' },
            { label: 'Marketing', href: '/marketing' },
            { label: 'Email', href: '/marketing/email' },
            { label: 'Templates' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Templates Email
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {templates?.length || 0} templates disponibles
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un template..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                selectedCategory === 'all'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Tous ({templates?.length || 0})
            </button>
            {TEMPLATE_CATEGORIES.map((cat) => {
              const count = templates?.filter((t) => t.category === cat.key).length || 0;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    selectedCategory === cat.key
                      ? cat.color
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Templates list */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <Skeleton height={300} />
            ) : filteredTemplates.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Aucun template trouvé</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => {
                  const catInfo = TEMPLATE_CATEGORIES.find((c) => c.key === template.category);
                  const isSelected = previewTemplate === template.id;

                  return (
                    <div
                      key={template.id}
                      onClick={() => setPreviewTemplate(template.id)}
                      className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-4 cursor-pointer transition ${
                        isSelected
                          ? 'border-pink-500 shadow-lg'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {template.name}
                        </h3>
                        <Eye className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-pink-500' : 'text-gray-400'}`} />
                      </div>

                      {catInfo && (
                        <Badge className={catInfo.color} size="sm">
                          {catInfo.label}
                        </Badge>
                      )}

                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 line-clamp-2">
                        {template.subject}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preview panel */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 sticky top-4">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-white">Aperçu</h3>
              </div>

              {selectedTemplateData ? (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Objet
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {selectedTemplateData.subject}
                    </p>
                  </div>

                  {selectedTemplateData.preview_text && (
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Texte aperçu
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {selectedTemplateData.preview_text}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contenu
                    </label>
                    <div
                      className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedTemplateData.content) }}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Eye className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Sélectionnez un template pour voir l'aperçu
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
