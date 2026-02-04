/**
 * OCR Factures Fournisseurs - Extraction automatique depuis PDF/image
 *
 * Fonctionnalités:
 * - Upload fichier PDF ou image (PNG, JPG)
 * - Extraction automatique via Tesseract OCR ou Google Vision API
 * - Parsing intelligent : numéro, dates, fournisseur, montants
 * - Correction manuelle des données extraites
 * - Création facture fournisseur (in_invoice) dans Odoo
 * - Support fallback saisie manuelle si OCR échoue
 */
import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button } from '@/components/common'
import { Upload, FileText, CheckCircle, Edit, AlertCircle, Loader } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { logger } from '@quelyos/logger'
import { getBackendUrl } from '@quelyos/config'

type ExtractedData = {
  supplier: {
    name: string
    vat: string
    address: string
  }
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  totalAmount: number
  taxAmount: number
  untaxedAmount: number
  lines: Array<{
    description: string
    quantity: number
    unitPrice: number
  }>
  raw_text?: string
}

type Step = 'upload' | 'extracted' | 'created'

export default function OCRSupplierInvoicePage() {
  const [currentStep, setCurrentStep] = useState<Step>('upload')
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [extractionMethod, setExtractionMethod] = useState<string>('')
  const [confidence, setConfidence] = useState<string>('')

  // Données éditables (copie de extractedData)
  const [editableData, setEditableData] = useState<ExtractedData | null>(null)

  const [createdInvoice, setCreatedInvoice] = useState<any>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Vérifier type
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
      if (!allowedTypes.includes(file.type)) {
        alert('Type de fichier non supporté. Utilisez PDF, PNG ou JPG.')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleUploadExtract = async () => {
    if (!selectedFile) return

    try {
      setUploading(true)

      const formData = new FormData()
      formData.append('file', selectedFile)

      const token = localStorage.getItem('authToken')
      const backendUrl = getBackendUrl(import.meta.env.MODE as 'development' | 'production')
      const response = await fetch(`${backendUrl}/api/finance/invoices/ocr-extract`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        setExtractedData(result.data.extractedData)
        setEditableData(JSON.parse(JSON.stringify(result.data.extractedData))) // Deep copy
        setExtractionMethod(result.data.extractionMethod)
        setConfidence(result.data.confidence)
        setCurrentStep('extracted')
      } else {
        alert(`Erreur: ${result.error || 'Extraction échouée'}`)
      }
    } catch (err) {
      logger.error('Erreur upload OCR:', err)
      alert('Erreur lors de l\'extraction OCR')
    } finally {
      setUploading(false)
    }
  }

  const handleCreateInvoice = async () => {
    if (!editableData) return

    try {
      setCreating(true)

      const response = await apiClient.post<{
        success: boolean
        data: { invoice: any }
        message?: string
      }>('/finance/invoices/create-from-ocr', {
        supplierName: editableData.supplier.name,
        supplierVat: editableData.supplier.vat,
        invoiceNumber: editableData.invoiceNumber,
        invoiceDate: editableData.invoiceDate,
        dueDate: editableData.dueDate,
        totalAmount: editableData.totalAmount,
        taxAmount: editableData.taxAmount,
        untaxedAmount: editableData.untaxedAmount,
        lines: editableData.lines,
      })

      if (response.data.success && response.data.data) {
        setCreatedInvoice(response.data.data.invoice)
        setCurrentStep('created')
        alert(response.data.message || 'Facture fournisseur créée avec succès')
      }
    } catch (err) {
      logger.error('Erreur création facture:', err)
      alert('Erreur lors de la création de la facture')
    } finally {
      setCreating(false)
    }
  }

  const handleReset = () => {
    setCurrentStep('upload')
    setSelectedFile(null)
    setExtractedData(null)
    setEditableData(null)
    setExtractionMethod('')
    setConfidence('')
    setCreatedInvoice(null)
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Facturation', href: '/invoicing' },
            { label: 'Factures', href: '/invoicing/invoices' },
            { label: 'OCR Fournisseurs' },
          ]}
        />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            OCR Factures Fournisseurs
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Extraction automatique des données depuis PDF ou image
          </p>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${currentStep === 'upload' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'upload' ? 'bg-indigo-600 text-white' : 'bg-gray-300 dark:bg-gray-700'}`}>
              1
            </div>
            <span className="text-sm font-medium">Upload</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-300 dark:bg-gray-700" />
          <div className={`flex items-center gap-2 ${currentStep === 'extracted' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'extracted' ? 'bg-indigo-600 text-white' : 'bg-gray-300 dark:bg-gray-700'}`}>
              2
            </div>
            <span className="text-sm font-medium">Vérification</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-300 dark:bg-gray-700" />
          <div className={`flex items-center gap-2 ${currentStep === 'created' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'created' ? 'bg-indigo-600 text-white' : 'bg-gray-300 dark:bg-gray-700'}`}>
              3
            </div>
            <span className="text-sm font-medium">Créée</span>
          </div>
        </div>

        {/* Step 1: Upload */}
        {currentStep === 'upload' && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Télécharger Facture Fournisseur
              </h2>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"
                >
                  Cliquer pour sélectionner un fichier
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  PDF, PNG ou JPG (max 10 Mo)
                </p>
                {selectedFile && (
                  <p className="text-sm text-gray-900 dark:text-white mt-4 font-medium">
                    Fichier sélectionné: {selectedFile.name}
                  </p>
                )}
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                  Méthodes d&apos;extraction
                </h3>
                <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                  <li>• Tesseract OCR (local, gratuit, rapide)</li>
                  <li>• Google Vision API (cloud, très précis, nécessite config)</li>
                  <li>• Saisie manuelle (si OCR échoue ou indisponible)</li>
                </ul>
              </div>

              <Button
                variant="primary"
                icon={uploading ? <Loader className="animate-spin" /> : <Upload />}
                onClick={handleUploadExtract}
                disabled={!selectedFile || uploading}
                className="w-full"
              >
                {uploading ? 'Extraction en cours...' : 'Extraire les données'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Extracted Data Editing */}
        {currentStep === 'extracted' && editableData && (
          <div className="space-y-6">
            {/* Méthode extraction */}
            <div className={`p-4 rounded-lg border ${
              extractionMethod === 'manual'
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            }`}>
              <div className="flex items-center gap-2">
                {extractionMethod === 'manual' ? (
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                )}
                <p className={`text-sm font-medium ${
                  extractionMethod === 'manual'
                    ? 'text-yellow-900 dark:text-yellow-300'
                    : 'text-green-900 dark:text-green-300'
                }`}>
                  {extractionMethod === 'manual' && 'OCR indisponible - Saisie manuelle requise'}
                  {extractionMethod === 'tesseract' && 'Extraction Tesseract OCR réussie'}
                  {extractionMethod === 'google_vision' && 'Extraction Google Vision API réussie'}
                </p>
              </div>
            </div>

            {/* Formulaire éditable */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Edit className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Vérifier et Corriger les Données
                </h2>
              </div>

              <div className="space-y-6">
                {/* Fournisseur */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Fournisseur
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Nom *
                      </label>
                      <input
                        type="text"
                        value={editableData.supplier.name}
                        onChange={(e) => setEditableData({
                          ...editableData,
                          supplier: { ...editableData.supplier, name: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Nom du fournisseur"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        N° TVA Intra
                      </label>
                      <input
                        type="text"
                        value={editableData.supplier.vat}
                        onChange={(e) => setEditableData({
                          ...editableData,
                          supplier: { ...editableData.supplier, vat: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="FR12345678901"
                      />
                    </div>
                  </div>
                </div>

                {/* Facture */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Facture
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        N° Facture *
                      </label>
                      <input
                        type="text"
                        value={editableData.invoiceNumber}
                        onChange={(e) => setEditableData({ ...editableData, invoiceNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="FA-2024-001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Date Facture *
                      </label>
                      <input
                        type="date"
                        value={editableData.invoiceDate}
                        onChange={(e) => setEditableData({ ...editableData, invoiceDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Date Échéance
                      </label>
                      <input
                        type="date"
                        value={editableData.dueDate}
                        onChange={(e) => setEditableData({ ...editableData, dueDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Montants */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Montants
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Total HT (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editableData.untaxedAmount}
                        onChange={(e) => setEditableData({ ...editableData, untaxedAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        TVA (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editableData.taxAmount}
                        onChange={(e) => setEditableData({ ...editableData, taxAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Total TTC (€) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editableData.totalAmount}
                        onChange={(e) => setEditableData({ ...editableData, totalAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Texte brut OCR (optionnel) */}
                {editableData.raw_text && (
                  <details className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      Texte brut extrait (debug)
                    </summary>
                    <pre className="text-xs text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-wrap">
                      {editableData.raw_text}
                    </pre>
                  </details>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleReset}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                icon={creating ? <Loader className="animate-spin" /> : <CheckCircle />}
                onClick={handleCreateInvoice}
                disabled={creating || !editableData.supplier.name || !editableData.invoiceNumber || !editableData.invoiceDate}
                className="flex-1"
              >
                {creating ? 'Création en cours...' : 'Créer Facture Fournisseur'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Created */}
        {currentStep === 'created' && createdInvoice && (
          <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              <h2 className="text-lg font-semibold text-green-900 dark:text-green-300">
                Facture Fournisseur Créée avec Succès !
              </h2>
            </div>

            <div className="space-y-2 text-sm text-green-800 dark:text-green-400">
              <p><strong>Numéro:</strong> {createdInvoice.name}</p>
              <p><strong>Référence:</strong> {createdInvoice.ref}</p>
              <p><strong>Fournisseur:</strong> {createdInvoice.supplierName}</p>
              <p><strong>Montant:</strong> {createdInvoice.amountTotal.toFixed(2)} €</p>
              <p><strong>Statut:</strong> {createdInvoice.state === 'draft' ? 'Brouillon' : 'Validée'}</p>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={handleReset}
              >
                Nouvelle Extraction
              </Button>
              <Button
                variant="primary"
                onClick={() => window.location.href = `/finance/invoices/${createdInvoice.id}`}
              >
                Voir la Facture
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
