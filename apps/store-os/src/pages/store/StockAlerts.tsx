/**
 * Page Alertes Stock - Surveillance des ruptures et stocks faibles
 *
 * Fonctionnalités :
 * - Liste des produits en rupture de stock
 * - Liste des produits avec stock faible
 * - Seuil d'alerte configurable
 * - Indicateurs visuels de niveau de stock
 */
import { useState, useEffect } from 'react';
import { AlertTriangle, Package, RefreshCw, Settings, AlertCircle } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common';
import { storeNotices } from '@/lib/notices';
import { apiFetchJson } from '@/lib/apiFetch';

interface StockAlert {
  id: number;
  name: string;
  sku: string;
  qtyAvailable: number;
  virtualAvailable: number;
}

interface OutOfStock {
  id: number;
  name: string;
  sku: string;
}

export default function StockAlerts() {
  const [lowStock, setLowStock] = useState<StockAlert[]>([]);
  const [outOfStock, setOutOfStock] = useState<OutOfStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(10);

  useEffect(() => {
    fetchAlerts();
  }, [threshold]);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetchJson<{ result?: { success: boolean; lowStock: StockAlert[]; outOfStock: OutOfStock[] } }>(
        '/api/admin/stock/alerts',
        {
          method: 'POST',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { threshold } }),
        }
      );
      if (data.result?.success) {
        setLowStock(data.result.lowStock || []);
        setOutOfStock(data.result.outOfStock || []);
      } else {
        setError('Erreur lors du chargement des alertes');
      }
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
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
            { label: 'Alertes Stock' },
          ]}
        />

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alertes Stock</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Surveillez les ruptures et stocks faibles
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={fetchAlerts}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Actualiser
          </Button>
        </div>

        <PageNotice config={storeNotices.stockAlerts} className="mb-6" />

        {error && (
          <div role="alert" className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 dark:text-red-300">{error}</p>
              <Button variant="secondary" size="sm" onClick={fetchAlerts} className="mt-2">
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {/* Threshold Setting */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Seuil d'alerte:</span>
            <select
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value={5}>5 unités</option>
              <option value={10}>10 unités</option>
              <option value={20}>20 unités</option>
              <option value={50}>50 unités</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">Ruptures de stock</p>
                <p className="text-3xl font-bold text-red-700 dark:text-red-300">{outOfStock.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Package className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Stock faible (&le; {threshold})</p>
                <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{lowStock.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Out of Stock */}
        {outOfStock.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Ruptures de stock ({outOfStock.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {outOfStock.map((product) => (
                <div key={product.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{product.sku || 'Sans référence'}</p>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-sm font-medium">
                    Rupture
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Low Stock */}
        {lowStock.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-yellow-600 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Stock faible ({lowStock.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                    <th className="p-4">Produit</th>
                    <th className="p-4">Référence</th>
                    <th className="p-4 text-right">Stock actuel</th>
                    <th className="p-4 text-right">Stock virtuel</th>
                    <th className="p-4 text-right">Niveau</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {lowStock.map((product) => (
                    <tr key={product.id} className="border-b border-gray-50 dark:border-gray-700/50">
                      <td className="p-4 font-medium text-gray-900 dark:text-white">{product.name}</td>
                      <td className="p-4 text-gray-500 dark:text-gray-400">{product.sku || '-'}</td>
                      <td className="p-4 text-right">
                        <span className={`font-medium ${product.qtyAvailable <= 5 ? 'text-red-600' : 'text-yellow-600'}`}>
                          {product.qtyAvailable}
                        </span>
                      </td>
                      <td className="p-4 text-right text-gray-600 dark:text-gray-400">
                        {product.virtualAvailable}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                product.qtyAvailable <= 5 ? 'bg-red-500' : 'bg-yellow-500'
                              }`}
                              style={{ width: `${Math.min(100, (product.qtyAvailable / threshold) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {outOfStock.length === 0 && lowStock.length === 0 && !error && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Package className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Stocks en ordre
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Aucun produit en rupture ou avec un stock faible
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
