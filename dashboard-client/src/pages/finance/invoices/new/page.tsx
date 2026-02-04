/**
 * Page Création Facture Client
 * 
 * Fonctionnalités:
 * - Formulaire création facture avec lignes dynamiques
 * - Sélection client (recherche)
 * - Ajout/suppression lignes de facture
 * - Calcul automatique totaux HT/TTC
 * - Sauvegarde brouillon ou validation directe
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, PageNotice } from '@/components/common'
import { Plus, Trash2, Save, Send } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { logger } from '@quelyos/logger'
import { financeNotices } from '@/lib/notices/finance-notices'

interface InvoiceLine {
  productId: number | null
  description: string
  quantity: number
  unitPrice: number
  taxIds: number[]
}

export default function NewInvoicePage() {
  const navigate = useNavigate()
  
  // Formulaire
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]!)
  const [dueDate, setDueDate] = useState('')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [lines, setLines] = useState<InvoiceLine[]>([
    { productId: null, description: '', quantity: 1, unitPrice: 0, taxIds: [] }
  ])
  
  const [loading, setLoading] = useState(false)

  const addLine = () => {
    setLines([...lines, { productId: null, description: '', quantity: 1, unitPrice: 0, taxIds: [] }])
  }

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_line, i) => i !== index))
    }
  }

  const updateLine = (index: number, field: keyof InvoiceLine, value: string | number | number[]) => {
    const newLines = [...lines]
    const currentLine = newLines[index]
    if (!currentLine) return
    newLines[index] = { ...currentLine, [field]: value }
    setLines(newLines)
  }

  const calculateTotal = () => {
    return lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0)
  }

  const handleSubmit = async (validate = false) => {
    if (!customerId) {
      alert('Veuillez sélectionner un client')
      return
    }

    if (lines.some(line => !line.description)) {
      alert('Veuillez remplir toutes les descriptions')
      return
    }

    try {
      setLoading(true)

      const payload = {
        customerId,
        invoiceDate,
        dueDate: dueDate || undefined,
        reference: reference || undefined,
        note: note || undefined,
        lines: lines.map(line => ({
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxIds: line.taxIds,
        })),
      }

      const response = await apiClient.post<{
        success: boolean;
        data: {
          id: number;
          name: string;
        };
        error?: string;
      }>('/finance/invoices/create', payload)

      if (response.data.success && response.data.data) {
        const invoiceId = response.data.data.id

        // Si validation demandée
        if (validate) {
          await apiClient.post(`/finance/invoices/${invoiceId}/validate`)
        }

        alert(`Facture ${response.data.data.name} créée avec succès`)
        navigate('/invoicing/invoices')
      } else {
        alert(`Erreur: ${response.data.error}`)
      }
    } catch (err: unknown) {
      logger.error("Erreur:", err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      alert(`Erreur: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="![animation:none] p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Facturation', href: '/invoicing' },
            { label: 'Factures', href: '/invoicing/invoices' },
            { label: 'Nouvelle' },
          ]}
        />

        <PageNotice config={financeNotices.invoicesNew} className="![animation:none]" />

        <div className="![animation:none] mb-6">
          <h1 className="![animation:none] text-2xl font-bold text-gray-900 dark:text-white">
            Nouvelle Facture Client
          </h1>
          <p className="![animation:none] mt-1 text-sm text-gray-500 dark:text-gray-400">
            Créez une nouvelle facture de vente
          </p>
        </div>

        <div className="![animation:none] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {/* En-tête facture */}
        <div className="![animation:none] grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="![animation:none] block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Client *
            </label>
            <select
              value={customerId || ''}
              onChange={(e) => setCustomerId(parseInt(e.target.value))}
              className="![animation:none] w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Sélectionner un client</option>
              {/* TODO: Charger liste clients depuis API */}
              <option value="1">Client Test 1</option>
              <option value="2">Client Test 2</option>
            </select>
          </div>

          <div>
            <label className="![animation:none] block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Référence
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex: DEVIS-2026-001"
              className="![animation:none] w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="![animation:none] block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Facture *
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="![animation:none] w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="![animation:none] block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Échéance
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="![animation:none] w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Lignes facture */}
        <div className="![animation:none] mb-6">
          <div className="![animation:none] flex items-center justify-between mb-3">
            <h3 className="![animation:none] text-lg font-medium text-gray-900 dark:text-white">
              Lignes de Facture
            </h3>
            <Button variant="secondary" size="sm" icon={<Plus />} onClick={addLine}>
              Ajouter Ligne
            </Button>
          </div>

          <div className="![animation:none] overflow-x-auto">
            <table className="![animation:none] min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="![animation:none] bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="![animation:none] px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Description *
                  </th>
                  <th className="![animation:none] px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Quantité
                  </th>
                  <th className="![animation:none] px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Prix Unitaire
                  </th>
                  <th className="![animation:none] px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Sous-total
                  </th>
                  <th className="![animation:none] px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="![animation:none] divide-y divide-gray-200 dark:divide-gray-700">
                {lines.map((line, index) => (
                  <tr key={index}>
                    <td className="![animation:none] px-3 py-2">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => updateLine(index, 'description', e.target.value)}
                        placeholder="Description du produit/service"
                        className="![animation:none] w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        required
                      />
                    </td>
                    <td className="![animation:none] px-3 py-2">
                      <input
                        type="number"
                        value={line.quantity}
                        onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="![animation:none] w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-right"
                      />
                    </td>
                    <td className="![animation:none] px-3 py-2">
                      <input
                        type="number"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="![animation:none] w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-right"
                      />
                    </td>
                    <td className="![animation:none] px-3 py-2 text-right text-sm font-medium text-gray-900 dark:text-white">
                      {(line.quantity * line.unitPrice).toFixed(2)} €
                    </td>
                    <td className="![animation:none] px-3 py-2 text-center">
                      <button
                        onClick={() => removeLine(index)}
                        disabled={lines.length === 1}
                        className="![animation:none] text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Supprimer ligne"
                      >
                        <Trash2 className="![animation:none] w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="![animation:none] bg-gray-50 dark:bg-gray-900">
                <tr>
                  <td colSpan={3} className="![animation:none] px-3 py-2 text-right font-medium text-gray-900 dark:text-white">
                    Total HT
                  </td>
                  <td className="![animation:none] px-3 py-2 text-right font-bold text-gray-900 dark:text-white">
                    {calculateTotal().toFixed(2)} €
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Note */}
        <div className="![animation:none] mb-6">
          <label className="![animation:none] block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Note / Conditions
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Merci pour votre confiance..."
            className="![animation:none] w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Actions */}
        <div className="![animation:none] flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/invoicing/invoices')}
          >
            Annuler
          </Button>
          <Button
            variant="secondary"
            icon={<Save />}
            onClick={() => handleSubmit(false)}
            disabled={loading}
          >
            Sauvegarder Brouillon
          </Button>
          <Button
            variant="primary"
            icon={<Send />}
            onClick={() => handleSubmit(true)}
            disabled={loading}
          >
            {loading ? 'Création...' : 'Créer et Valider'}
          </Button>
        </div>
      </div>
      </div>
    </Layout>
  )
}
