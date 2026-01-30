/**
 * Page FAQ - Gestion des questions fréquentes
 *
 * Fonctionnalités :
 * - Liste des FAQ par catégorie
 * - Création et édition de FAQ
 * - Gestion des catégories
 * - Accordéon pour afficher les réponses
 * - Options de publication et mise en avant
 */
import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, HelpCircle, AlertCircle } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common';
import { storeNotices } from '@/lib/notices';
import { apiFetchJson } from '@/lib/apiFetch';

interface FAQCategory {
  id: number;
  name: string;
  code: string;
  icon: string;
  faqCount: number;
}

interface FAQ {
  id: number;
  question: string;
  answer: string;
  categoryId: number;
  categoryName: string;
  isPublished: boolean;
  isFeatured: boolean;
}

export default function FAQPage() {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', code: '', icon: 'HelpCircle' });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const data = await apiFetchJson<{ result?: { success: boolean; categories: FAQCategory[] } }>(
        '/api/admin/faq/categories',
        {
          method: 'POST',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: {} }),
        }
      );
      if (data.result?.success) {
        setCategories(data.result.categories || []);
      }
    } catch {
      // Categories fetch error silenced
    }
  };

  const fetchFaqs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, number> = {};
      if (selectedCategory) params.category_id = selectedCategory;

      const data = await apiFetchJson<{ result?: { success: boolean; faqs: FAQ[] } }>(
        '/api/admin/faq',
        {
          method: 'POST',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params }),
        }
      );
      if (data.result?.success) {
        setFaqs(data.result.faqs || []);
      } else {
        setError('Erreur lors du chargement des FAQ');
      }
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const saveCategory = async () => {
    try {
      const data = await apiFetchJson<{ result?: { success: boolean } }>(
        '/api/admin/faq/categories/save',
        {
          method: 'POST',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: categoryForm }),
        }
      );
      if (data.result?.success) {
        setShowCategoryForm(false);
        setCategoryForm({ name: '', code: '', icon: 'HelpCircle' });
        fetchCategories();
      }
    } catch {
      // Save error silenced
    }
  };

  const saveFaq = async () => {
    if (!editingFaq) return;
    try {
      const data = await apiFetchJson<{ result?: { success: boolean } }>(
        '/api/admin/faq/save',
        {
          method: 'POST',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: editingFaq }),
        }
      );
      if (data.result?.success) {
        setEditingFaq(null);
        fetchFaqs();
        fetchCategories();
      }
    } catch {
      // Save error silenced
    }
  };

  const deleteFaq = async (id: number) => {
    if (!confirm('Supprimer cette FAQ ?')) return;
    try {
      const data = await apiFetchJson<{ result?: { success: boolean } }>(
        `/api/admin/faq/${id}/delete`,
        {
          method: 'POST',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: {} }),
        }
      );
      if (data.result?.success) {
        fetchFaqs();
        fetchCategories();
      }
    } catch {
      // Delete error silenced
    }
  };

  if (loading && categories.length === 0) {
    return (
      <Layout>
        <div className="p-4 md:p-8">
          <SkeletonTable rows={6} columns={4} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Boutique', href: '/store' },
            { label: 'FAQ' },
          ]}
        />

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">FAQ</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Gérez les questions fréquemment posées
            </p>
          </div>
          <Button
            onClick={() => setEditingFaq({
              id: 0,
              question: '',
              answer: '',
              categoryId: selectedCategory || (categories[0]?.id || 0),
              categoryName: '',
              isPublished: true,
              isFeatured: false,
            })}
            icon={<Plus className="w-4 h-4" />}
          >
            Nouvelle FAQ
          </Button>
        </div>

        <PageNotice config={storeNotices.faq} className="mb-6" />

        {error && (
          <div role="alert" className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 dark:text-red-300">{error}</p>
              <Button variant="secondary" size="sm" onClick={fetchFaqs} className="mt-2">
                Réessayer
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar - Catégories */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Catégories</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => setShowCategoryForm(true)}
                  className="p-1"
                />
              </div>

              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-3 py-2 rounded mb-1 ${
                  selectedCategory === null
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Toutes ({faqs.length})
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded mb-1 flex justify-between ${
                    selectedCategory === cat.id
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {cat.faqCount}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedCategory
                  ? categories.find(c => c.id === selectedCategory)?.name
                  : 'Toutes les FAQ'}
              </h2>
            </div>

            {loading ? (
              <SkeletonTable rows={4} columns={2} />
            ) : (
              <div className="space-y-2">
                {faqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div
                      className="flex justify-between items-center p-4 cursor-pointer"
                      onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    >
                      <div className="flex items-center gap-3">
                        {expandedFaq === faq.id ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">{faq.question}</span>
                        {faq.isFeatured && (
                          <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">
                            Mise en avant
                          </span>
                        )}
                        {!faq.isPublished && (
                          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded">
                            Brouillon
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit className="w-4 h-4" />}
                          onClick={() => setEditingFaq(faq)}
                          className="p-1.5"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-4 h-4 text-red-500" />}
                          onClick={() => deleteFaq(faq.id)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20"
                        />
                      </div>
                    </div>
                    {expandedFaq === faq.id && (
                      <div className="px-4 pb-4 pl-11">
                        <div
                          className="prose dark:prose-invert prose-sm max-w-none text-gray-600 dark:text-gray-300"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(faq.answer) }}
                        />
                      </div>
                    )}
                  </div>
                ))}

                {faqs.length === 0 && !error && (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <HelpCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Aucune FAQ dans cette catégorie</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Category Form Modal */}
        {showCategoryForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Nouvelle catégorie
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    value={categoryForm.code}
                    onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="secondary" onClick={() => setShowCategoryForm(false)}>
                  Annuler
                </Button>
                <Button onClick={saveCategory}>
                  Créer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Form Modal */}
        {editingFaq && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingFaq.id ? 'Modifier la FAQ' : 'Nouvelle FAQ'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={editingFaq.categoryId}
                    onChange={(e) => setEditingFaq({ ...editingFaq, categoryId: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Question
                  </label>
                  <input
                    type="text"
                    value={editingFaq.question}
                    onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Réponse
                  </label>
                  <textarea
                    value={editingFaq.answer}
                    onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingFaq.isPublished}
                      onChange={(e) => setEditingFaq({ ...editingFaq, isPublished: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-900 dark:text-white dark:text-gray-300">Publié</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingFaq.isFeatured}
                      onChange={(e) => setEditingFaq({ ...editingFaq, isFeatured: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-900 dark:text-white dark:text-gray-300">Mise en avant</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="secondary" onClick={() => setEditingFaq(null)}>
                  Annuler
                </Button>
                <Button onClick={saveFaq}>
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
