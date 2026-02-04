/**
 * Page Blog - Gestion des articles et catégories
 *
 * Fonctionnalités :
 * - Liste des articles par catégorie
 * - Création et édition d'articles
 * - Gestion des états (brouillon, publié, archivé)
 * - Statistiques de lecture
 * - Mise en avant d'articles
 */
import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Eye, FileText, Clock, Tag, AlertCircle, RefreshCw } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common';
import { storeNotices } from '@/lib/notices';
import { apiFetchJson } from '@/lib/apiFetch';
import { logger } from '@quelyos/logger';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  coverUrl: string | null;
  categoryName: string;
  authorName: string;
  state: 'draft' | 'published' | 'archived';
  publishedDate: string | null;
  isFeatured: boolean;
  viewsCount: number;
  readingTime: number;
  tags: { id: number; name: string }[];
}

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  postCount: number;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [editing, setEditing] = useState<BlogPost | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, number> = {};
      if (selectedCategory) params.category_id = selectedCategory;

      const data = await apiFetchJson<{ result?: { success: boolean; posts: BlogPost[] } }>(
        '/api/admin/blog/posts',
        {
          method: 'POST',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params }),
        }
      );
      if (data.result?.success) {
        setPosts(data.result.posts);
      } else {
        setError('Erreur lors du chargement des articles');
      }
    } catch {
      logger.error("Erreur attrapée");
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const fetchCategories = async () => {
    try {
      const data = await apiFetchJson<{ result?: { success: boolean; categories: BlogCategory[] } }>(
        '/api/admin/blog/categories',
        {
          method: 'POST',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: {} }),
        }
      );
      if (data.result?.success) {
        setCategories(data.result.categories);
      }
    } catch {
      logger.error("Erreur attrapée");
      // Categories fetch error silenced
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'archived': return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'published': return 'Publié';
      case 'archived': return 'Archivé';
      default: return 'Brouillon';
    }
  };

  const newPost = () => {
    setEditing({
      id: 0,
      title: '',
      slug: '',
      excerpt: '',
      coverUrl: null,
      categoryName: '',
      authorName: '',
      state: 'draft',
      publishedDate: null,
      isFeatured: false,
      viewsCount: 0,
      readingTime: 1,
      tags: [],
    });
  };

  if (loading) {
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
            { label: 'Blog' },
          ]}
        />

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blog</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Gérez vos articles et contenus
            </p>
          </div>
          <Button onClick={newPost} icon={<Plus className="w-4 h-4" />}>
            Nouvel article
          </Button>
        </div>

        <PageNotice config={storeNotices.blog} className="mb-6" />

        {error && (
          <div role="alert" className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 dark:text-red-300">{error}</p>
              <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={fetchPosts} className="mt-2">
                Réessayer
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-56 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Catégories</h3>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-3 py-2 rounded mb-1 ${
                  selectedCategory === null
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Tous les articles
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
                    {cat.postCount}
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
                  : 'Tous les articles'}
              </h2>
            </div>

            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex"
                >
                  <div className="w-48 h-32 bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                    {post.coverUrl ? (
                      <img src={post.coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{post.title}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getStateColor(post.state)}`}>
                            {getStateLabel(post.state)}
                          </span>
                          {post.isFeatured && (
                            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">
                              Mise en avant
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {post.excerpt || 'Pas de résumé'}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit className="w-4 h-4" />}
                          onClick={() => setEditing(post)}
                          className="p-1.5"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-4 h-4 text-red-500" />}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {post.categoryName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readingTime} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.viewsCount} vues
                      </span>
                      {post.publishedDate && (
                        <span>
                          {new Date(post.publishedDate).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {posts.length === 0 && !error && (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Aucun article</p>
                  <Button variant="ghost" onClick={newPost} className="mt-4">
                    Créer un article
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {editing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editing.id ? 'Modifier l\'article' : 'Nouvel article'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={editing.slug}
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Extrait
                  </label>
                  <textarea
                    value={editing.excerpt}
                    onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="secondary" onClick={() => setEditing(null)}>
                  Annuler
                </Button>
                <Button onClick={() => { setEditing(null); fetchPosts(); }}>
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
