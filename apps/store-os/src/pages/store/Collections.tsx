/**
 * Page Collections - Gestion des collections de produits
 *
 * Fonctionnalités :
 * - Liste des collections avec aperçu visuel
 * - Création/modification de collections
 * - Gestion de la publication et mise en avant
 * - Dates de validité des collections
 * - Association de produits aux collections
 */
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Image, Package, AlertCircle, Search } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common';
import { storeNotices } from '@/lib/notices';
import { logger } from '@/lib/logger';
import { apiFetchJson } from '@/lib/apiFetch';

interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  imageUrl: string | null;
  productCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  dateStart: string | null;
  dateEnd: string | null;
}

export default function Collections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  const filteredCollections = collections.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'published' && c.isPublished) ||
      (filterStatus === 'draft' && !c.isPublished);
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setError(null);
    try {
      const data = await apiFetchJson<{ result?: { success: boolean; collections: Collection[] } }>(
        '/api/admin/collections',
        {
          method: 'POST',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: {} }),
        }
      );
      if (data.result?.success) {
        setCollections(data.result.collections || []);
      } else {
        setError('Erreur lors du chargement des collections');
      }
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const saveCollection = async () => {
    if (!editing) return;
    try {
      const data = await apiFetchJson<{ result?: { success: boolean } }>(
        '/api/admin/collections/save',
        {
          method: 'POST',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: editing }),
        }
      );
      if (data.result?.success) {
        setEditing(null);
        fetchCollections();
      }
    } catch (error) {
      logger.error('Collections fetch error:', error);
    }
  };

  const newCollection = () => {
    setEditing({
      id: 0,
      name: '',
      slug: '',
      description: '',
      shortDescription: '',
      imageUrl: null,
      productCount: 0,
      isPublished: false,
      isFeatured: false,
      dateStart: null,
      dateEnd: null,
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
            { label: 'Collections' },
          ]}
        />

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Collections</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Groupez vos produits par thème ou saison
            </p>
          </div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={newCollection}>
            Nouvelle collection
          </Button>
        </div>

        <PageNotice config={storeNotices.collections} className="mb-6" />

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'published' | 'draft')}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="published">Publiées</option>
            <option value="draft">Brouillons</option>
          </select>
        </div>

        {error && (
          <div role="alert" className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 dark:text-red-300">{error}</p>
              <Button variant="secondary" size="sm" onClick={fetchCollections} className="mt-2">
                Réessayer
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((collection) => (
            <div
              key={collection.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="h-40 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {collection.imageUrl ? (
                  <img src={collection.imageUrl} alt={collection.name} className="w-full h-full object-cover" />
                ) : (
                  <Image className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{collection.name}</h3>
                  <div className="flex gap-1">
                    {collection.isPublished ? (
                      <Eye className="w-4 h-4 text-green-500" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                  {collection.shortDescription || 'Aucune description'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Package className="w-4 h-4" />
                    {collection.productCount} produits
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit className="w-4 h-4" />}
                      onClick={() => setEditing(collection)}
                      className="p-1.5"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-4 h-4" />}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredCollections.length === 0 && !error && (
            <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              {collections.length === 0 ? (
                <>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Aucune collection</p>
                  <Button icon={<Plus className="w-4 h-4" />} onClick={newCollection}>
                    Créer votre première collection
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Aucun résultat pour cette recherche</p>
                  <Button variant="secondary" onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}>
                    Réinitialiser les filtres
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editing.id ? 'Modifier la collection' : 'Nouvelle collection'}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Slug
                    </label>
                    <input
                      type="text"
                      value={editing.slug}
                      onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Description courte
                  </label>
                  <input
                    type="text"
                    value={editing.shortDescription || ''}
                    onChange={(e) => setEditing({ ...editing, shortDescription: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Description
                  </label>
                  <textarea
                    value={editing.description || ''}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Date début
                    </label>
                    <input
                      type="date"
                      value={editing.dateStart || ''}
                      onChange={(e) => setEditing({ ...editing, dateStart: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Date fin
                    </label>
                    <input
                      type="date"
                      value={editing.dateEnd || ''}
                      onChange={(e) => setEditing({ ...editing, dateEnd: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editing.isPublished}
                      onChange={(e) => setEditing({ ...editing, isPublished: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">Publié</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editing.isFeatured}
                      onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">Mise en avant</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="secondary" onClick={() => setEditing(null)}>
                  Annuler
                </Button>
                <Button onClick={saveCollection}>
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

