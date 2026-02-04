/**
 * Page Packs & Bundles - Gestion des lots de produits
 *
 * Fonctionnalités :
 * - Liste des packs avec aperçu produits
 * - Création et édition de packs
 * - Affichage des remises et économies
 * - Gestion du statut (brouillon/publié)
 * - Statistiques de stock
 */
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, Tag, AlertCircle } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common';
import { storeNotices } from '@/lib/notices';
import { apiFetchJson } from '@/lib/apiFetch';
import { logger } from '@quelyos/logger';

interface Bundle {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  products: {
    id: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  productCount: number;
  totalPrice: number;
  bundlePrice: number;
  discountAmount: number;
  discountPercent: number;
  qtyAvailable: number;
  isPublished: boolean;
}

export default function Bundles() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Bundle | null>(null);

  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    setError(null);
    try {
      const data = await apiFetchJson<{ result?: { success: boolean; bundles: Bundle[] } }>(
        '/api/admin/bundles',
        {
          method: 'POST',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: {} }),
        }
      );
      if (data.result?.success) {
        setBundles(data.result.bundles || []);
      } else {
        setError('Erreur lors du chargement des packs');
      }
    } catch {
      logger.error("Erreur attrapée");
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const newBundle = () => {
    setEditing({
      id: 0,
      name: '',
      slug: '',
      description: '',
      imageUrl: null,
      products: [],
      productCount: 0,
      totalPrice: 0,
      bundlePrice: 0,
      discountAmount: 0,
      discountPercent: 0,
      qtyAvailable: 0,
      isPublished: false,
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
            { label: 'Packs & Bundles' },
          ]}
        />

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Packs & Bundles</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Créez des packs de produits à prix réduit
            </p>
          </div>
          <Button onClick={newBundle} icon={<Plus className="w-4 h-4" />}>
            Nouveau pack
          </Button>
        </div>

        <PageNotice config={storeNotices.bundles} className="mb-6" />

        {error && (
          <div role="alert" className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 dark:text-red-300">{error}</p>
              <Button variant="secondary" size="sm" onClick={fetchBundles} className="mt-2">
                Réessayer
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="h-40 bg-gray-100 dark:bg-gray-700 flex items-center justify-center relative">
                {bundle.imageUrl ? (
                  <img src={bundle.imageUrl} alt={bundle.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                )}
                {bundle.discountPercent > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                    -{bundle.discountPercent}%
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{bundle.name}</h3>
                  {!bundle.isPublished && (
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded">
                      Brouillon
                    </span>
                  )}
                </div>

                <div className="space-y-1 mb-3">
                  {bundle.products.slice(0, 3).map((product) => (
                    <div key={product.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 truncate">
                        {product.quantity}x {product.productName}
                      </span>
                      <span className="text-gray-500 dark:text-gray-500 ml-2">
                        {product.subtotal.toFixed(2)} TND
                      </span>
                    </div>
                  ))}
                  {bundle.products.length > 3 && (
                    <p className="text-xs text-gray-400">+{bundle.products.length - 3} autres</p>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-bold text-green-600">{bundle.bundlePrice.toFixed(2)} TND</span>
                  <span className="text-sm text-gray-400 line-through">{bundle.totalPrice.toFixed(2)} TND</span>
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <Tag className="w-3 h-3" />
                    Économie {bundle.discountAmount.toFixed(2)} TND
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Stock: {bundle.qtyAvailable}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit className="w-4 h-4" />}
                      onClick={() => setEditing(bundle)}
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
              </div>
            </div>
          ))}

          {bundles.length === 0 && !error && (
            <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Aucun pack créé</p>
              <Button variant="ghost" onClick={newBundle} className="mt-4">
                Créer votre premier pack
              </Button>
            </div>
          )}
        </div>

        {editing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editing.id ? 'Modifier le pack' : 'Nouveau pack'}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
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
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editing.description || ''}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Prix du pack (TND)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editing.bundlePrice}
                    onChange={(e) => setEditing({ ...editing, bundlePrice: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editing.isPublished}
                    onChange={(e) => setEditing({ ...editing, isPublished: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-900 dark:text-white dark:text-gray-300">Publié</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="secondary" onClick={() => setEditing(null)}>
                  Annuler
                </Button>
                <Button onClick={() => { setEditing(null); fetchBundles(); }}>
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
