import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Image, Package } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Breadcrumbs } from '@/components/common';

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
  const [editing, setEditing] = useState<Collection | null>(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const res = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: {} }),
      });
      const data = await res.json();
      if (data.result?.success) {
        setCollections(data.result.collections);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCollection = async () => {
    if (!editing) return;
    try {
      const res = await fetch('/api/admin/collections/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: editing }),
      });
      const data = await res.json();
      if (data.result?.success) {
        setEditing(null);
        fetchCollections();
      }
    } catch (error) {
      console.error('Error:', error);
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
        <div className="flex items-center justify-center h-64">Chargement...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Breadcrumbs
        items={[
          { label: 'Boutique', href: '/store' },
          { label: 'Collections' },
        ]}
      />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Collections</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Groupez vos produits par thème ou saison
            </p>
          </div>
          <button
            onClick={newCollection}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nouvelle collection
          </button>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
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
                  <button
                    onClick={() => setEditing(collection)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {collections.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">Aucune collection</p>
            <button
              onClick={newCollection}
              className="mt-4 text-blue-600 hover:underline"
            >
              Créer votre première collection
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editing.id ? 'Modifier la collection' : 'Nouvelle collection'}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  <span className="text-sm text-gray-700 dark:text-gray-300">Publié</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editing.isFeatured}
                    onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Mise en avant</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Annuler
              </button>
              <button
                onClick={saveCollection}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
}
