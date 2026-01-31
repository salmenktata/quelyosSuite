/**
 * Page Import/Export Produits - Gestion CSV des produits
 *
 * Fonctionnalités :
 * - Export du catalogue produits en CSV
 * - Import de produits depuis fichier CSV
 * - Aperçu des données avant import
 * - Rapport de résultat (créés, mis à jour, erreurs)
 * - Guide du format CSV attendu
 */
import { useState } from 'react';
import { Upload, Download, FileSpreadsheet, Check, AlertCircle, X } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, PageNotice, Button } from '@/components/common';
import { storeNotices } from '@/lib/notices';
import { apiFetchJson } from '@/lib/apiFetch';

interface ImportResult {
  created: number;
  updated: number;
  errors: string[];
}

export default function ProductImport() {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [csvData, setCsvData] = useState('');
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await apiFetchJson<{ result?: { success: boolean; products: Record<string, unknown>[] } }>(
        '/api/admin/products/export',
        {
          method: 'POST',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { format: 'csv' } }),
        }
      );
      if (data.result?.success) {
        const products = data.result.products;

        const headers = ['id', 'name', 'sku', 'price', 'cost', 'category', 'type', 'active', 'description'];
        const csvContent = [
          headers.join(','),
          ...products.map((p: Record<string, unknown>) =>
            headers.map(h => {
              const val = p[h] ?? '';
              return typeof val === 'string' && (val.includes(',') || val.includes('"'))
                ? `"${val.replace(/"/g, '""')}"`
                : val;
            }).join(',')
          )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Error handled silently
    } finally {
      setExporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvData(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return;

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const data = lines.slice(1, 11).map(line => {
      const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header] = (values[index] || '').replace(/^"|"$/g, '').trim();
      });
      return obj;
    });

    setPreviewData(data);
  };

  const handleImport = async () => {
    if (!csvData) return;

    setImporting(true);
    setResult(null);

    try {
      const lines = csvData.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

      const products = lines.slice(1).map(line => {
        const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        const obj: Record<string, string> = {};
        headers.forEach((header, index) => {
          obj[header] = (values[index] || '').replace(/^"|"$/g, '').trim();
        });
        return obj;
      });

      const data = await apiFetchJson<{ result?: ImportResult }>(
        '/api/admin/products/import',
        {
          method: 'POST',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { products } }),
        }
      );
      if (data.result) {
        setResult(data.result);
      }
    } catch {
      setResult({ created: 0, updated: 0, errors: ['Erreur lors de l\'import'] });
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setCsvData('');
    setPreviewData([]);
    setResult(null);
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Boutique', href: '/store' },
            { label: 'Import/Export Produits' },
          ]}
        />

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Import/Export Produits</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez vos produits en masse via fichiers CSV
          </p>
        </div>

        <PageNotice config={storeNotices.productImport} className="mb-6" />

        {/* Export Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Download className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Exporter les produits</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Téléchargez tous vos produits au format CSV pour les modifier dans Excel ou les sauvegarder.
              </p>
              <Button
                onClick={handleExport}
                disabled={exporting}
                icon={<Download className="w-4 h-4" />}
                className="bg-green-600 hover:bg-green-700"
              >
                {exporting ? 'Export en cours...' : 'Exporter CSV'}
              </Button>
            </div>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Importer des produits</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Importez des produits depuis un fichier CSV. Les colonnes attendues: name, sku, price, cost, category, type.
              </p>

              {!csvData && !result && (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <FileSpreadsheet className="w-10 h-10 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Cliquez pour sélectionner un fichier CSV</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}

              {previewData.length > 0 && !result && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Aperçu: {previewData.length} lignes (sur {csvData.split('\n').length - 1} total)
                    </p>
                    <Button variant="ghost" onClick={resetImport} className="text-red-600">
                      Annuler
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700">
                          {Object.keys(previewData[0]).slice(0, 6).map((header) => (
                            <th key={header} className="px-3 py-2 text-left text-gray-600 dark:text-gray-400">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.slice(0, 5).map((row, index) => (
                          <tr key={index} className="border-t border-gray-100 dark:border-gray-700">
                            {Object.values(row).slice(0, 6).map((value, i) => (
                              <td key={i} className="px-3 py-2 text-gray-900 dark:text-white truncate max-w-[150px]">
                                {value || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Button
                    onClick={handleImport}
                    disabled={importing}
                    icon={<Upload className="w-4 h-4" />}
                  >
                    {importing ? 'Import en cours...' : 'Lancer l\'import'}
                  </Button>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-green-600 mb-1">
                        <Check className="w-5 h-5" />
                        <span className="font-medium">Créés</span>
                      </div>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-400">{result.created}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <Check className="w-5 h-5" />
                        <span className="font-medium">Mis à jour</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{result.updated}</p>
                    </div>
                  </div>

                  {result.errors.length > 0 && (
                    <div role="alert" className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-red-600 mb-2">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">Erreurs ({result.errors.length})</span>
                      </div>
                      <ul className="text-sm text-red-700 dark:text-red-400 space-y-1 max-h-32 overflow-y-auto">
                        {result.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button variant="secondary" onClick={resetImport} icon={<X className="w-4 h-4" />}>
                    Nouvel import
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Format Guide */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Format du fichier CSV</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p><strong className="text-gray-900 dark:text-white">Colonnes requises:</strong> name (nom du produit)</p>
            <p><strong className="text-gray-900 dark:text-white">Colonnes optionnelles:</strong> id, sku, price, cost, category, type, active, description</p>
            <p><strong className="text-gray-900 dark:text-white">Note:</strong> Si un ID ou SKU existe, le produit sera mis à jour. Sinon, il sera créé.</p>
          </div>
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded font-mono text-xs text-gray-800 dark:text-gray-200 overflow-x-auto">
            name,sku,price,cost,category<br />
            "T-shirt Basic","TSH-001",29.90,12.00,"Vêtements"<br />
            "Jean Slim","JEA-002",59.90,25.00,"Vêtements"
          </div>
        </div>
      </div>
    </Layout>
  );
}
