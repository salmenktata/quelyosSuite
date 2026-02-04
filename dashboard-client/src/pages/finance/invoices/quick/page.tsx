/**
 * Page Création Facture Express - Wizard 3 étapes
 *
 * Fonctionnalités:
 * - Étape 1: Sélection/Création client
 * - Étape 2: Ajout lignes facture
 * - Étape 3: Validation et options
 * - Navigation stepper avec progression
 * - Sauvegarde brouillon automatique
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, PageNotice } from '@/components/common'
import { ChevronLeft, ChevronRight, FileText, Check } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { logger } from '@quelyos/logger'
import { financeNotices } from '@/lib/notices/finance-notices'

type Customer = {
  id: number
  name: string
  email: string
  phone?: string
}

type InvoiceLine = {
  id: string
  productId?: number
  description: string
  quantity: number
  unitPrice: number
  taxIds: number[]
}

type QuickInvoiceData = {
  customerId?: number
  customerData?: {
    name: string
    email: string
    phone: string
  }
  invoiceDate: string
  dueDate: string
  reference: string
  note: string
  lines: InvoiceLine[]
  validate: boolean
}

export default function QuickInvoicePage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // État formulaire
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' })
  const [createNew, setCreateNew] = useState(false)

  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [validateNow, setValidateNow] = useState(false)

  const [lines, setLines] = useState<InvoiceLine[]>([
    {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxIds: [],
    },
  ])

  // Calcul totaux
  const calculateTotal = () => {
    return lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)
  }

  // Recherche clients
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (searchQuery.length >= 2) {
      fetchCustomers(searchQuery)
    }
  }, [searchQuery])

  const fetchCustomers = async (query: string) => {
    try {
      const response = await apiClient.get<{
        success: boolean
        data: { customers: Customer[] }
      }>('/crm/customers', {
        params: { search: query, limit: 10 },
      })

      if (response.data.success) {
        setCustomers(response.data.data.customers)
      }
    } catch (err) {
      logger.error('Erreur recherche clients:', err)
    }
  }

  // Gestion lignes
  const addLine = () => {
    setLines([
      ...lines,
      {
        id: crypto.randomUUID(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxIds: [],
      },
    ])
  }

  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter((line) => line.id !== id))
    }
  }

  const updateLine = (id: string, field: keyof InvoiceLine, value: string | number) => {
    setLines(
      lines.map((line) =>
        line.id === id
          ? { ...line, [field]: field === 'quantity' || field === 'unitPrice' ? Number(value) : value }
          : line
      )
    )
  }

  // Navigation étapes
  const canGoNext = () => {
    if (currentStep === 1) {
      return selectedCustomer || (createNew && newCustomer.name && newCustomer.email)
    }
    if (currentStep === 2) {
      return lines.every((line) => line.description && line.quantity > 0 && line.unitPrice >= 0)
    }
    return true
  }

  const nextStep = () => {
    if (canGoNext() && currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Soumission
  const handleSubmit = async () => {
    try {
      setLoading(true)

      const data: QuickInvoiceData = {
        invoiceDate,
        dueDate: dueDate || undefined,
        reference,
        note,
        lines: lines.map((line) => ({
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxIds: line.taxIds,
        })),
        validate: validateNow,
      }

      if (selectedCustomer) {
        data.customerId = selectedCustomer.id
      } else if (createNew) {
        data.customerData = newCustomer
      }

      const response = await apiClient.post<{
        success: boolean
        data: { id: number; name: string }
        message?: string
      }>('/finance/invoices/quick-create', data)

      if (response.data.success && response.data.data) {
        alert(response.data.message || 'Facture créée avec succès')
        navigate(`/finance/invoices/${response.data.data.id}`)
      } else {
        alert('Erreur lors de la création')
      }
    } catch (err) {
      logger.error('Erreur création facture:', err)
      alert('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Facturation', href: '/invoicing' },
            { label: 'Factures', href: '/invoicing/invoices' },
            { label: 'Création Express' },
          ]}
        />

        <PageNotice config={financeNotices.invoicesQuick} />

        {/* Stepper */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step === currentStep
                    ? 'bg-indigo-600 text-white'
                    : step < currentStep
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {step < currentStep ? <Check className="h-5 w-5" /> : step}
              </div>
              {step < 3 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          {/* Étape 1: Client */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Étape 1 : Sélection Client
              </h2>

              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={() => setCreateNew(false)}
                  className={`px-4 py-2 rounded-lg ${
                    !createNew
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Client Existant
                </button>
                <button
                  onClick={() => setCreateNew(true)}
                  className={`px-4 py-2 rounded-lg ${
                    createNew
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Nouveau Client
                </button>
              </div>

              {!createNew ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rechercher un client
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nom ou email..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />

                  {customers.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {customers.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => setSelectedCustomer(customer)}
                          className={`p-3 border rounded-lg cursor-pointer ${
                            selectedCustomer?.id === customer.id
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{customer.email}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Étape 2: Lignes */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Étape 2 : Lignes de Facture
                </h2>
                <Button variant="secondary" onClick={addLine}>
                  + Ajouter
                </Button>
              </div>

              <div className="space-y-3">
                {lines.map((line, index) => (
                  <div key={line.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ligne {index + 1}
                      </span>
                      {lines.length > 1 && (
                        <button
                          onClick={() => removeLine(line.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                      placeholder="Description"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Quantité</label>
                        <input
                          type="number"
                          value={line.quantity}
                          onChange={(e) => updateLine(line.id, 'quantity', e.target.value)}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Prix unitaire €</label>
                        <input
                          type="number"
                          value={line.unitPrice}
                          onChange={(e) => updateLine(line.id, 'unitPrice', e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                      Total : {(line.quantity * line.unitPrice).toFixed(2)} €
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    Total général : {calculateTotal().toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Étape 3: Validation */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Étape 3 : Validation et Options
              </h2>

              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Client :</span>{' '}
                  {selectedCustomer?.name || newCustomer.name}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Lignes :</span> {lines.length}
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  Total : {calculateTotal().toFixed(2)} €
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date facture
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date échéance
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Référence
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="REF-001"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Note
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Merci pour votre confiance..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={validateNow}
                  onChange={(e) => setValidateNow(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Valider la facture immédiatement (sinon brouillon)
                </span>
              </label>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              icon={<ChevronLeft />}
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Précédent
            </Button>

            {currentStep < 3 ? (
              <Button
                variant="primary"
                icon={<ChevronRight />}
                onClick={nextStep}
                disabled={!canGoNext()}
              >
                Suivant
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={<FileText />}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Création...' : 'Créer la facture'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
