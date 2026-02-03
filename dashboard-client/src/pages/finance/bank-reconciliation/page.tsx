/**
 * Rapprochement Bancaire - Réconciliation automatique transactions
 *
 * Fonctionnalités :
 * - Suggestions automatiques de rapprochement avec score de confiance
 * - Matching intelligent transactions bancaires ↔ écritures comptables
 * - Validation/rejet rapide des suggestions
 * - Historique rapprochements avec audit trail
 * - Règles personnalisées de matching (montant, date, libellé)
 */
import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, PageNotice, SkeletonTable } from '@/components/common'
import { apiClient } from '@/lib/api'
import { financeNotices } from '@/lib/notices/finance-notices'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Check, X, AlertCircle, RefreshCw, Link2 } from 'lucide-react'
import { GlassCard, GlassBadge } from '@/components/ui/glass'

interface BankTransaction {
  label: string
  date: string
  amount: number
}

interface AccountMove {
  name: string
  date: string
  amount: number
}

interface ReconciliationSuggestion {
  id: number
  bankTransaction: BankTransaction
  accountMove: AccountMove
  confidence?: number
  score: number
  reason: string
}

export default function BankReconciliationPage() {
  const [suggestions, setSuggestions] = useState<ReconciliationSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSuggestions = () => {
    setLoading(true)
    setError(null)
    apiClient.post<{
      success: boolean;
      data: {
        suggestions: ReconciliationSuggestion[];
      };
      error?: string;
    }>('/finance/bank-reconciliation/suggest')
      .then(res => {
        if (res.data.success && res.data.data) {
          setSuggestions(res.data.data.suggestions)
        } else {
          setError(res.data.error || 'Erreur lors du chargement des suggestions')
        }
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Erreur de connexion')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const handleValidate = async (suggestionId: number) => {
    // TODO: Appel API validation
    setSuggestions(suggestions.filter((s) => s.id !== suggestionId))
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <SkeletonTable rows={5} columns={4} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs items={[
          { label: 'Accueil', href: '/' },
          { label: 'Finance', href: '/finance' },
          { label: 'Rapprochement Bancaire' },
        ]} />

        {error && (
          <div role="alert" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="flex-1 text-red-800 dark:text-red-200">{error}</p>
              <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={fetchSuggestions}>
                Réessayer
              </Button>
            </div>
          </div>
        )}

        <PageNotice config={financeNotices.bankReconciliation} className="mb-6" />

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Réconciliation</p>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Rapprochement Bancaire AI</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Suggestions automatiques de rapprochement bancaire avec machine learning
            </p>
          </div>
          <Button variant="primary" icon={<Link2 className="w-4 h-4" />}>
            Importer relevé
          </Button>
        </div>

        {suggestions.length === 0 ? (
          <GlassCard variant="subtle" className="p-12 text-center">
            <Link2 className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Aucune suggestion</h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Importez un relevé bancaire pour obtenir des suggestions de rapprochement automatiques.
            </p>
            <Button variant="primary" icon={<Link2 className="w-4 h-4" />}>
              Importer relevé
            </Button>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <GlassCard key={suggestion.id} className="p-6">
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Transaction Bancaire
                    </h3>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {suggestion.bankTransaction.label}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {formatDate(suggestion.bankTransaction.date)} · {formatCurrency(suggestion.bankTransaction.amount, '€')}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Écriture Comptable Suggérée
                    </h3>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {suggestion.accountMove.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {formatDate(suggestion.accountMove.date)} · {formatCurrency(suggestion.accountMove.amount, '€')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <GlassBadge variant="info">
                      Score: {suggestion.score}%
                    </GlassBadge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {suggestion.reason}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => handleValidate(suggestion.id)} variant="primary" size="sm" icon={<Check className="w-4 h-4" />}>
                      Valider
                    </Button>
                    <Button onClick={() => handleValidate(suggestion.id)} variant="outline" size="sm" icon={<X className="w-4 h-4" />}>
                      Ignorer
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
