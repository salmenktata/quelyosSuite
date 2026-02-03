/**
 * Import Relevés Bancaires - Import automatique transactions bancaires
 *
 * Fonctionnalités :
 * - Import multi-formats (CSV, OFX, CAMT.053, MT940)
 * - Détection automatique format et encodage
 * - Validation transactions avant import avec preview
 * - Mapping colonnes personnalisable
 * - Import incrémental avec détection doublons
 */
import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, PageNotice } from '@/components/common'
import { apiClient } from '@/lib/api'
import { financeNotices } from '@/lib/notices/finance-notices'
import { Upload, AlertCircle, FileText, CheckCircle2 } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass'

interface ImportResult {
  imported: number
  duplicates?: number
  errors?: number
}

export default function BankImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState('csv')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('format', format)

      const response = await apiClient.post<{
        success: boolean;
        data: ImportResult;
        error?: string;
      }>('/finance/bank-statements/import', formData)

      if (response.data.success && response.data.data) {
        setResult(response.data.data)
      } else {
        setError(response.data.error || 'Erreur lors de l\'import')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs items={[
          { label: 'Accueil', href: '/' },
          { label: 'Finance', href: '/finance' },
          { label: 'Import Relevés' },
        ]} />

        <PageNotice config={financeNotices.bankImport} className="mb-6" />

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Import</p>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Import Relevés Bancaires</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Importez vos relevés bancaires aux formats CSV, OFX, CAMT.053 ou MT940
            </p>
          </div>
        </div>

        {error && (
          <div role="alert" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="flex-1 text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Import réussi : {result.imported} transactions importées
                </p>
                {result.duplicates !== undefined && result.duplicates > 0 && (
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    {result.duplicates} doublon(s) ignoré(s)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <GlassCard className="p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="format" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Format du fichier
              </label>
              <select
                id="format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              >
                <option value="csv">CSV (Comma-Separated Values)</option>
                <option value="ofx">OFX (Open Financial Exchange)</option>
                <option value="camt053">CAMT.053 (ISO 20022)</option>
                <option value="mt940">MT940 (SWIFT)</option>
              </select>
            </div>

            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Sélectionner un fichier
              </label>
              <div className="relative">
                <input
                  id="file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept=".csv,.ofx,.xml,.940"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-300 file:cursor-pointer hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50"
                />
              </div>
              {file && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <FileText className="w-4 h-4" />
                  <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleImport}
              disabled={!file || importing}
              variant="primary"
              icon={<Upload className="w-4 h-4" />}
              className="w-full"
            >
              {importing ? 'Import en cours...' : 'Importer le relevé'}
            </Button>
          </div>
        </GlassCard>

        {!file && !result && (
          <GlassCard variant="subtle" className="p-8 text-center">
            <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Aucun fichier sélectionné</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sélectionnez un relevé bancaire pour commencer l'import
            </p>
          </GlassCard>
        )}
      </div>
    </Layout>
  )
}
