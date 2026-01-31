/**
 * Page Ventes Flash - Promotions limitées dans le temps
 *
 * Fonctionnalités :
 * - Liste des ventes flash avec statut
 * - Création et édition de promotions
 * - Statistiques (CA, commandes, actives)
 * - Aperçu des produits en promotion
 * - Barre de progression des ventes
 */
import { useState, useEffect } from 'react';
import { Edit, Trash2, Zap, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common';
import { storeNotices } from '@/lib/notices';
import { apiFetchJson } from '@/lib/apiFetch';

interface FlashSale {
  id: number;
  name: string;
  description: string;
  dateStart: string;
  dateEnd: string;
  state: 'draft' | 'scheduled' | 'running' | 'ended';
  isActive: boolean;
  backgroundColor: string;
  productCount: number;
  totalSales: number;
  totalOrders: number;
  products: {
    id: number;
    productName: string;
    originalPrice: number;
    flashPrice: number;
    discountPercent: number;
    qtyAvailable: number;
    qtySold: number;
  }[];
}

export default function FlashSales() {
  const [sales, setSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<FlashSale | null>(null);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setError(null);
    try {
      const data = await apiFetchJson<{ result?: { success: boolean; flashSales: FlashSale[] } }>(
        '/api/admin/flash-sales',
        {
          method: 'POST',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: {} }),
        }
      );
      if (data.result?.success) {
        setSales(data.result.flashSales || []);
      } else {
        setError('Erreur lors du chargement des ventes flash');
      }
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const newFlashSale = () => {
    setEditing({
      id: 0,
      name: '',
      description: '',
      dateStart: '',
      dateEnd: '',
      state: 'draft',
      isActive: true,
      backgroundColor: '#ef4444',
      productCount: 0,
      totalSales: 0,
      totalOrders: 0,
      products: [],
    });
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'running': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'ended': return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'running': return 'En cours';
      case 'scheduled': return 'Programmé';
      case 'ended': return 'Terminé';
      default: return 'Brouillon';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
            { label: 'Ventes Flash' },
          ]}
        />

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ventes Flash</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Créez des promotions limitées dans le temps
            </p>
          </div>
          <Button onClick={newFlashSale} icon={<Zap className="w-4 h-4" />} className="bg-red-600 hover:bg-red-700">
            Nouvelle vente flash
          </Button>
        </div>

        <PageNotice config={storeNotices.flashSales} className="mb-6" />

        {error && (
          <div role="alert" className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 dark:text-red-300">{error}</p>
              <Button variant="secondary" size="sm" onClick={fetchSales} className="mt-2">
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Ventes actives</p>
            <p className="text-2xl font-bold text-green-600">
              {sales.filter(s => s.state === 'running').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">CA Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {sales.reduce((sum, s) => sum + s.totalSales, 0).toFixed(2)} TND
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Commandes</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {sales.reduce((sum, s) => sum + s.totalOrders, 0)}
            </p>
          </div>
        </div>

        {/* Sales List */}
        <div className="space-y-4">
          {sales.map((sale) => (
            <div
              key={sale.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div
                className="h-2"
                style={{ backgroundColor: sale.backgroundColor }}
              />
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{sale.name}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStateColor(sale.state)}`}>
                        {getStateLabel(sale.state)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{sale.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit className="w-4 h-4" />}
                      onClick={() => setEditing(sale)}
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

                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm">
                  <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    {formatDate(sale.dateStart)} - {formatDate(sale.dateEnd)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {sale.productCount} produits
                  </span>
                  <span className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    {sale.totalSales.toFixed(2)} TND
                  </span>
                </div>

                {sale.products.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {sale.products.slice(0, 4).map((product) => (
                      <div
                        key={product.id}
                        className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-xs"
                      >
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {product.productName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-red-600 font-bold">{product.flashPrice} TND</span>
                          <span className="text-gray-400 line-through">{product.originalPrice}</span>
                          <span className="text-green-600">-{product.discountPercent}%</span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                          <div
                            className="bg-red-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min((product.qtySold / product.qtyAvailable) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {sales.length === 0 && !error && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Zap className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Aucune vente flash</p>
              <Button variant="ghost" onClick={newFlashSale} className="mt-4">
                Créer votre première vente flash
              </Button>
            </div>
          )}
        </div>

        {editing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editing.id ? 'Modifier la vente flash' : 'Nouvelle vente flash'}
              </h3>
              <div className="space-y-4">
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
                    Description
                  </label>
                  <textarea
                    value={editing.description}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                      Début
                    </label>
                    <input
                      type="datetime-local"
                      value={editing.dateStart?.slice(0, 16) || ''}
                      onChange={(e) => setEditing({ ...editing, dateStart: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                      Fin
                    </label>
                    <input
                      type="datetime-local"
                      value={editing.dateEnd?.slice(0, 16) || ''}
                      onChange={(e) => setEditing({ ...editing, dateEnd: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Couleur
                  </label>
                  <input
                    type="color"
                    value={editing.backgroundColor}
                    onChange={(e) => setEditing({ ...editing, backgroundColor: e.target.value })}
                    className="w-20 h-10 rounded cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="secondary" onClick={() => setEditing(null)}>
                  Annuler
                </Button>
                <Button onClick={() => { setEditing(null); fetchSales(); }} className="bg-red-600 hover:bg-red-700">
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
