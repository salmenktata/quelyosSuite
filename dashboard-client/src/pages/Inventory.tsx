import { useState } from 'react'
import { Layout } from '../components/Layout'
import { usePrepareInventory, useValidateInventory } from '../hooks/useStock'
import { Badge, Button, Breadcrumbs, Input } from '../components/common'
import { useToast } from '../contexts/ToastContext'
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'

type Step = 1 | 2 | 3 | 4

interface InventoryLine {
  product_id: number
  product_name: string
  sku: string
  image_url: string
  category: string
  theoretical_qty: number
  counted_qty: number | null
}

export default function Inventory() {
  const [step, setStep] = useState<Step>(1)
  const [categoryId, setCategoryId] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [inventoryLines, setInventoryLines] = useState<InventoryLine[]>([])
  const [adjustments, setAdjustments] = useState<Array<{ product_id: number; new_qty: number }>>([])
  const [validationResult, setValidationResult] = useState<any>(null)

  const toast = useToast()
  const prepareInventoryMutation = usePrepareInventory()
  const validateInventoryMutation = useValidateInventory()

  // Étape 1 : Sélection du périmètre
  const handlePrepareInventory = async () => {
    try {
      const params: any = {}
      if (categoryId) params.category_id = parseInt(categoryId)
      if (search) params.search = search

      const result = await prepareInventoryMutation.mutateAsync(params)

      if (result.success && result.data) {
        setInventoryLines(result.data.inventory_lines)
        setStep(2)
        toast.success(`${result.data.total_products} produit(s) sélectionné(s) pour l'inventaire`)
      } else {
        toast.error(result.error || 'Erreur lors de la préparation de l\'inventaire')
      }
    } catch (error) {
      toast.error('Erreur lors de la préparation de l\'inventaire')
    }
  }

  // Étape 2 : Saisie des quantités comptées
  const handleCountedQtyChange = (productId: number, value: string) => {
    setInventoryLines(prev =>
      prev.map(line =>
        line.product_id === productId
          ? { ...line, counted_qty: value === '' ? null : parseFloat(value) }
          : line
      )
    )
  }

  const handleNextToReview = () => {
    // Calculer les écarts
    const adjustmentsList = inventoryLines
      .filter(line => line.counted_qty !== null && line.counted_qty !== line.theoretical_qty)
      .map(line => ({
        product_id: line.product_id,
        new_qty: line.counted_qty as number,
      }))

    if (adjustmentsList.length === 0) {
      toast.warning('Aucun écart détecté. Pas d\'ajustement nécessaire.')
      return
    }

    setAdjustments(adjustmentsList)
    setStep(3)
  }

  // Étape 3 : Revue des écarts
  const handleValidateInventory = async () => {
    try {
      const result = await validateInventoryMutation.mutateAsync(adjustments)

      if (result.success && result.data) {
        setValidationResult(result.data)
        setStep(4)
        toast.success(`${result.data.total_adjusted} ajustement(s) appliqué(s) avec succès`)
      } else {
        toast.error(result.error || 'Erreur lors de la validation de l\'inventaire')
      }
    } catch (error) {
      toast.error('Erreur lors de la validation de l\'inventaire')
    }
  }

  // Reset
  const handleRestart = () => {
    setStep(1)
    setCategoryId('')
    setSearch('')
    setInventoryLines([])
    setAdjustments([])
    setValidationResult(null)
  }

  // Render steps indicator
  const renderStepsIndicator = () => {
    const steps = [
      { number: 1, label: 'Sélection' },
      { number: 2, label: 'Comptage' },
      { number: 3, label: 'Écarts' },
      { number: 4, label: 'Validation' },
    ]

    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, index) => (
          <div key={s.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  ${
                    step === s.number
                      ? 'bg-indigo-600 text-white'
                      : step > s.number
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }
                `}
              >
                {step > s.number ? (
                  <CheckCircleIcon className="h-6 w-6" />
                ) : (
                  s.number
                )}
              </div>
              <span
                className={`
                  mt-2 text-xs font-medium
                  ${step === s.number ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}
                `}
              >
                {s.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`
                  flex-1 h-1 mx-4
                  ${step > s.number ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}
                `}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <Layout>
      <div className="p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Stock', href: '/stock' },
            { label: 'Inventaire physique' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Inventaire Physique
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Comptage et ajustement des quantités en stock
          </p>
        </div>

        {renderStepsIndicator()}

        {/* Étape 1 : Sélection */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <ClipboardDocumentListIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Sélection du périmètre
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choisissez les produits à inventorier
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recherche par nom ou SKU (optionnel)
                </label>
                <Input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Catégorie (optionnel)
                </label>
                <Input
                  type="number"
                  placeholder="ID de catégorie"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Laissez vide pour inventorier tous les produits
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handlePrepareInventory}
                  disabled={prepareInventoryMutation.isPending}
                  loading={prepareInventoryMutation.isPending}
                >
                  <ArrowRightIcon className="h-5 w-5 mr-2" />
                  Préparer l'inventaire
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Étape 2 : Comptage */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <ClipboardDocumentListIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Comptage des quantités
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Saisissez les quantités comptées physiquement ({inventoryLines.length} produits)
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Catégorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Stock théorique
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Quantité comptée
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {inventoryLines.map((line) => (
                    <tr key={line.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {line.product_name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                          {line.sku || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {line.category || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="info">{line.theoretical_qty} unités</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="Quantité comptée"
                          value={line.counted_qty === null ? '' : line.counted_qty}
                          onChange={(e) => handleCountedQtyChange(line.product_id, e.target.value)}
                          className="w-32"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <Button variant="secondary" onClick={() => setStep(1)}>
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Retour
              </Button>
              <Button onClick={handleNextToReview}>
                Revue des écarts
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Étape 3 : Écarts */}
        {step === 3 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <ClipboardDocumentListIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Revue des écarts
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Vérifiez les écarts avant validation ({adjustments.length} ajustements)
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Stock théorique
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Stock compté
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Écart
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {adjustments.map((adj) => {
                    const line = inventoryLines.find(l => l.product_id === adj.product_id)
                    if (!line) return null
                    const diff = adj.new_qty - line.theoretical_qty
                    return (
                      <tr key={adj.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {line.product_name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {line.theoretical_qty} unités
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900 dark:text-white font-medium">
                            {adj.new_qty} unités
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={diff > 0 ? 'success' : 'error'}>
                            {diff > 0 ? '+' : ''}{diff} unités
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <Button variant="secondary" onClick={() => setStep(2)}>
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Retour
              </Button>
              <Button
                onClick={handleValidateInventory}
                disabled={validateInventoryMutation.isPending}
                loading={validateInventoryMutation.isPending}
              >
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Valider l'inventaire
              </Button>
            </div>
          </div>
        )}

        {/* Étape 4 : Confirmation */}
        {step === 4 && validationResult && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircleIcon className="h-12 w-12 text-green-600" />
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Inventaire validé !
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Les ajustements ont été appliqués avec succès
                </p>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-green-800 dark:text-green-200">Produits ajustés</div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {validationResult.total_adjusted}
                  </div>
                </div>
                {validationResult.error_count > 0 && (
                  <div>
                    <div className="text-sm text-red-800 dark:text-red-200">Erreurs</div>
                    <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                      {validationResult.error_count}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {validationResult.error_count > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
                  Erreurs détectées :
                </h3>
                <ul className="list-disc list-inside text-sm text-red-800 dark:text-red-200 space-y-1">
                  {validationResult.errors.map((error: any, idx: number) => (
                    <li key={idx}>
                      Produit #{error.product_id || '?'} : {error.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => window.location.href = '/stock'}>
                Retour au stock
              </Button>
              <Button onClick={handleRestart}>
                <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                Nouvel inventaire
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
