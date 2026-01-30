import { useState, useRef, useCallback } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'
import { Badge } from './Badge'

interface ImportRow {
  name: string
  price?: number
  standard_price?: number
  description?: string
  default_code?: string
  barcode?: string
  weight?: number
  category?: string
}

interface ImportProductsModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (data: { products: ImportRow[]; update_existing: boolean }) => Promise<{
    created: Array<{ id: number; name: string; row: number }>
    updated: Array<{ id: number; name: string; row: number }>
    errors: Array<{ row: number; error: string }>
    summary: {
      total_rows: number
      created_count: number
      updated_count: number
      error_count: number
    }
  }>
  loading?: boolean
}

export function ImportProductsModal({
  isOpen,
  onClose,
  onImport,
  loading = false,
}: ImportProductsModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const [parsedData, setParsedData] = useState<ImportRow[]>([])
  const [updateExisting, setUpdateExisting] = useState(false)
  const [importResult, setImportResult] = useState<{
    created: Array<{ id: number; name: string; row: number }>
    updated: Array<{ id: number; name: string; row: number }>
    errors: Array<{ row: number; error: string }>
    summary: {
      total_rows: number
      created_count: number
      updated_count: number
      error_count: number
    }
  } | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [previewPage, setPreviewPage] = useState(0)
  const previewPageSize = 20
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetModal = useCallback(() => {
    setStep('upload')
    setParsedData([])
    setUpdateExisting(false)
    setImportResult(null)
    setParseError(null)
    setIsImporting(false)
    setPreviewPage(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleClose = () => {
    resetModal()
    onClose()
  }

  const parseCSV = (content: string): ImportRow[] => {
    const lines = content.split(/\r?\n/).filter((line) => line.trim())
    if (lines.length < 2) {
      throw new Error('Le fichier CSV doit contenir au moins une ligne d\'en-tête et une ligne de données')
    }

    // Détecter le séparateur (virgule ou point-virgule)
    const firstLine = lines[0]
    const separator = firstLine.includes(';') ? ';' : ','

    const headers = firstLine.split(separator).map((h) => h.trim().toLowerCase().replace(/"/g, ''))

    // Mapping des colonnes possibles
    const columnMap: Record<string, keyof ImportRow> = {
      nom: 'name',
      name: 'name',
      produit: 'name',
      prix: 'price',
      price: 'price',
      'prix de vente': 'price',
      'prix vente': 'price',
      'prix achat': 'standard_price',
      'prix d\'achat': 'standard_price',
      standard_price: 'standard_price',
      cost: 'standard_price',
      description: 'description',
      sku: 'default_code',
      référence: 'default_code',
      reference: 'default_code',
      'référence (sku)': 'default_code',
      default_code: 'default_code',
      'code-barres': 'barcode',
      barcode: 'barcode',
      ean: 'barcode',
      ean13: 'barcode',
      poids: 'weight',
      weight: 'weight',
      'poids (kg)': 'weight',
      catégorie: 'category',
      categorie: 'category',
      category: 'category',
    }

    // Trouver les indices des colonnes
    const columnIndices: Partial<Record<keyof ImportRow, number>> = {}
    headers.forEach((header, index) => {
      const mapped = columnMap[header]
      if (mapped) {
        columnIndices[mapped] = index
      }
    })

    if (columnIndices.name === undefined) {
      throw new Error(
        'Colonne "nom" ou "name" non trouvée. Colonnes disponibles: ' + headers.join(', ')
      )
    }

    // Parser les lignes de données
    const rows: ImportRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(separator).map((v) => v.trim().replace(/^"|"$/g, ''))

      const row: ImportRow = {
        name: values[columnIndices.name!] || '',
      }

      if (columnIndices.price !== undefined && values[columnIndices.price]) {
        row.price = parseFloat(values[columnIndices.price].replace(',', '.')) || 0
      }
      if (columnIndices.standard_price !== undefined && values[columnIndices.standard_price]) {
        row.standard_price = parseFloat(values[columnIndices.standard_price].replace(',', '.')) || 0
      }
      if (columnIndices.description !== undefined) {
        row.description = values[columnIndices.description] || ''
      }
      if (columnIndices.default_code !== undefined) {
        row.default_code = values[columnIndices.default_code] || ''
      }
      if (columnIndices.barcode !== undefined) {
        row.barcode = values[columnIndices.barcode] || ''
      }
      if (columnIndices.weight !== undefined && values[columnIndices.weight]) {
        row.weight = parseFloat(values[columnIndices.weight].replace(',', '.')) || 0
      }
      if (columnIndices.category !== undefined) {
        row.category = values[columnIndices.category] || ''
      }

      if (row.name) {
        rows.push(row)
      }
    }

    return rows
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setParseError(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const data = parseCSV(content)
        if (data.length === 0) {
          throw new Error('Aucune ligne de données valide trouvée')
        }
        setParsedData(data)
        setStep('preview')
      } catch (err) {
        setParseError(err instanceof Error ? err.message : 'Erreur lors du parsing du fichier')
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  const handleImport = async () => {
    setIsImporting(true)
    try {
      const result = await onImport({
        products: parsedData,
        update_existing: updateExisting,
      })
      setImportResult(result)
      setStep('result')
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Erreur lors de l\'import')
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    const template = `Nom;Prix;Prix achat;Description;SKU;Code-barres;Poids (kg);Catégorie
T-shirt Nike;49.99;25.00;T-shirt en coton bio;TSHIRT-001;3760012345678;0.2;Vêtements
Pantalon Jean;89.99;45.00;Jean slim fit;JEAN-001;3760012345679;0.5;Vêtements
Casquette;29.99;12.00;Casquette ajustable;CAP-001;3760012345680;0.1;Accessoires`

    const blob = new Blob(['\ufeff' + template], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'template_import_produits.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importer des produits" hideDefaultActions={true}>
      <div className="min-w-[500px]">
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="text-gray-600 dark:text-gray-400">
              <p className="mb-4">
                Importez un fichier CSV pour créer ou mettre à jour des produits en masse.
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Colonnes acceptées
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <Badge variant="info">Nom</Badge> (obligatoire)
                  </div>
                  <div>
                    <Badge variant="neutral">Prix</Badge>
                  </div>
                  <div>
                    <Badge variant="neutral">Prix achat</Badge>
                  </div>
                  <div>
                    <Badge variant="neutral">Description</Badge>
                  </div>
                  <div>
                    <Badge variant="neutral">SKU</Badge>
                  </div>
                  <div>
                    <Badge variant="neutral">Code-barres</Badge>
                  </div>
                  <div>
                    <Badge variant="neutral">Poids (kg)</Badge>
                  </div>
                  <div>
                    <Badge variant="neutral">Catégorie</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button variant="secondary" onClick={downloadTemplate}>
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Télécharger le modèle CSV
              </Button>
            </div>

            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg
                className="w-12 h-12 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Cliquez ou glissez-déposez votre fichier CSV
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Formats acceptés : .csv (UTF-8)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {parseError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
                {parseError}
              </div>
            )}
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-900 dark:text-white dark:text-gray-300">
                {parsedData.length} produit{parsedData.length > 1 ? 's' : ''} détecté
                {parsedData.length > 1 ? 's' : ''}
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-900 dark:text-white dark:text-gray-300">
                  Mettre à jour les produits existants (par SKU/code-barres)
                </span>
              </label>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                        #
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                        Nom
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                        Prix
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                        SKU
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                        Catégorie
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {parsedData
                      .slice(previewPage * previewPageSize, (previewPage + 1) * previewPageSize)
                      .map((row, idx) => {
                        const globalIdx = previewPage * previewPageSize + idx
                        return (
                          <tr key={globalIdx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{globalIdx + 1}</td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white">{row.name}</td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white dark:text-gray-300">
                              {row.price ? `${row.price.toFixed(2)} €` : '—'}
                            </td>
                            <td className="px-3 py-2 font-mono text-gray-900 dark:text-white dark:text-gray-300">
                              {row.default_code || '—'}
                            </td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white dark:text-gray-300">
                              {row.category || '—'}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>

              {/* Pagination de la preview */}
              {parsedData.length > previewPageSize && (
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-sm text-gray-900 dark:text-white dark:text-gray-300">
                    {previewPage * previewPageSize + 1}-{Math.min((previewPage + 1) * previewPageSize, parsedData.length)} sur {parsedData.length}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewPage(Math.max(0, previewPage - 1))}
                      disabled={previewPage === 0}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewPage(Math.min(Math.ceil(parsedData.length / previewPageSize) - 1, previewPage + 1))}
                      disabled={previewPage >= Math.ceil(parsedData.length / previewPageSize) - 1}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="secondary" onClick={() => setStep('upload')}>
                Retour
              </Button>
              <Button variant="primary" onClick={handleImport} loading={isImporting || loading}>
                Importer {parsedData.length} produit{parsedData.length > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}

        {step === 'result' && importResult && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {importResult.summary.created_count}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">Créés</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {importResult.summary.updated_count}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">Mis à jour</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {importResult.summary.error_count}
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">Erreurs</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                  Erreurs ({importResult.errors.length})
                </h4>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 max-h-32 overflow-auto">
                  {importResult.errors.map((err, idx) => (
                    <li key={idx}>
                      Ligne {err.row}: {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="primary" onClick={handleClose}>
                Terminer
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
