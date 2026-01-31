import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button } from '@/components/common'
import { apiClient } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Check, X } from 'lucide-react'

export default function BankReconciliationPage() {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.post('/finance/bank-reconciliation/suggest').then(res => {
      if (res.data.success) setSuggestions(res.data.data.suggestions)
      setLoading(false)
    })
  }, [])

  const handleValidate = async (suggestionId: number) => {
    // TODO: Appel API validation
    setSuggestions(suggestions.filter((s: any) => s.id !== suggestionId))
  }

  if (loading) return <Layout><div>Chargement...</div></Layout>

  return (
    <Layout>
      <Breadcrumbs items={[
        { label: 'Finance', path: '/finance' },
        { label: 'Rapprochement Bancaire', path: '/finance/bank-reconciliation' },
      ]} />

      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Rapprochement Bancaire AI
      </h1>

      <div className="space-y-4">
        {suggestions.map((suggestion: any) => (
          <div key={suggestion.id} className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Transaction Bancaire
                </h3>
                <p className="text-sm text-gray-900 dark:text-white">{suggestion.bankTransaction.label}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {formatDate(suggestion.bankTransaction.date)} - {formatCurrency(suggestion.bankTransaction.amount, '€')}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Écriture Comptable Suggérée
                </h3>
                <p className="text-sm text-gray-900 dark:text-white">{suggestion.accountMove.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {formatDate(suggestion.accountMove.date)} - {formatCurrency(suggestion.accountMove.amount, '€')}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded">
                  Score: {suggestion.score}%
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {suggestion.reason}
                </span>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleValidate(suggestion.id)} variant="primary" size="sm">
                  <Check className="w-4 h-4 mr-1" />
                  Valider
                </Button>
                <Button onClick={() => handleValidate(suggestion.id)} variant="outline" size="sm">
                  <X className="w-4 h-4 mr-1" />
                  Ignorer
                </Button>
              </div>
            </div>
          </div>
        ))}

        {suggestions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Aucune suggestion de rapprochement</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
