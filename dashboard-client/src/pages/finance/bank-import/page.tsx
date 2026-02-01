import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button } from '@/components/common'
import { apiClient } from '@/lib/api'
import { Upload } from 'lucide-react'

interface ImportResult {
  imported: number
}

export default function BankImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState('csv')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('format', format)
    const response = await apiClient.post('/finance/bank-statements/import', formData)
    if (response.data.success) setResult(response.data.data)
    setImporting(false)
  }

  return (
    <Layout>
      <Breadcrumbs items={[
        { label: 'Finance', path: '/finance' },
        { label: 'Import Relevés', path: '/finance/bank-import' },
      ]} />

      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Import Relevés Bancaires</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="csv">CSV</option>
            <option value="ofx">OFX</option>
            <option value="camt053">CAMT.053</option>
            <option value="mt940">MT940</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Fichier</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            accept=".csv,.ofx,.xml,.940"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <Button onClick={handleImport} disabled={!file || importing} variant="primary" className="w-full">
          <Upload className="w-4 h-4 mr-2" />
          {importing ? 'Import...' : 'Importer'}
        </Button>

        {result && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-900 dark:text-green-100">
              {result.imported} transactions importées
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
