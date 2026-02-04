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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSuggestions()
  }, [])

  const handleValidate = async (suggestionId: number) => {
    // TODO: Appel API validation
    setSuggestions(suggestions.filter((s) => s.id !== suggestionId))
  }

  if (loading) {
    return (
      <Layout>
        <div className="![animation:none] p-4 md:p-8 space-y-6">
          <div className="![animation:none] h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="![animation:none] h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <SkeletonTable rows={5} columns={4} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="![animation:none] p-4 md:p-8 space-y-6">
        <Breadcrumbs items={[
          { label: 'Accueil', href: '/' },
          { label: 'Finance', href: '/finance' },
          { label: 'Rapprochement Bancaire' },
        ]} />

        {error && (
          <div role="alert" className="![animation:none] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="![animation:none] flex items-center gap-3">
              <AlertCircle className="![animation:none] w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="![animation:none] flex-1 text-red-800 dark:text-red-200">{error}</p>
              <Button variant="ghost" size="sm" icon={<RefreshCw className="![animation:none] w-4 h-4" />} onClick={fetchSuggestions}>
                Réessayer
              </Button>
            </div>
          </div>
        )}

        <PageNotice config={financeNotices.bankReconciliation} className="![animation:none] mb-6" />

        <div className="![animation:none] flex items-center justify-between">
          <div className="![animation:none] space-y-1">
            <p className="![animation:none] text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Réconciliation</p>
            <h1 className="![animation:none] text-3xl font-semibold text-gray-900 dark:text-white">Rapprochement Bancaire AI</h1>
            <p className="![animation:none] text-sm text-gray-600 dark:text-gray-400">
              Suggestions automatiques de rapprochement bancaire avec machine learning
            </p>
          </div>
          <Button variant="primary" icon={<Link2 className="![animation:none] w-4 h-4" />}>
            Importer relevé
          </Button>
        </div>

        {suggestions.length === 0 ? (
          <GlassCard variant="subtle" className="![animation:none] p-12 text-center">
            <Link2 className="![animation:none] mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="![animation:none] mb-2 text-lg font-semibold text-gray-900 dark:text-white">Aucune suggestion</h3>
            <p className="![animation:none] mb-4 text-sm text-gray-600 dark:text-gray-400">
              Importez un relevé bancaire pour obtenir des suggestions de rapprochement automatiques.
            </p>
            <Button variant="primary" icon={<Link2 className="![animation:none] w-4 h-4" />}>
              Importer relevé
            </Button>
          </GlassCard>
        ) : (
          <div className="![animation:none] space-y-4">
            {suggestions.map((suggestion) => (
              <GlassCard key={suggestion.id} className="![animation:none] p-6">
                <div className="![animation:none] grid grid-cols-2 gap-6 mb-4">
                  <div>
                    <h3 className="![animation:none] text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Transaction Bancaire
                    </h3>
                    <p className="![animation:none] text-sm font-medium text-gray-900 dark:text-white">
                      {suggestion.bankTransaction.label}
                    </p>
                    <p className="![animation:none] text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {formatDate(suggestion.bankTransaction.date)} · {formatCurrency(suggestion.bankTransaction.amount, '€')}
                    </p>
                  </div>

                  <div>
                    <h3 className="![animation:none] text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Écriture Comptable Suggérée
                    </h3>
                    <p className="![animation:none] text-sm font-medium text-gray-900 dark:text-white">
                      {suggestion.accountMove.name}
                    </p>
                    <p className="![animation:none] text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {formatDate(suggestion.accountMove.date)} · {formatCurrency(suggestion.accountMove.amount, '€')}
                    </p>
                  </div>
                </div>

                <div className="![animation:none] flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="![animation:none] flex items-center gap-2">
                    <GlassBadge variant="info">
                      Score: {suggestion.score}%
                    </GlassBadge>
                    <span className="![animation:none] text-xs text-gray-500 dark:text-gray-400">
                      {suggestion.reason}
                    </span>
                  </div>

                  <div className="![animation:none] flex gap-2">
                    <Button onClick={() => handleValidate(suggestion.id)} variant="primary" size="sm" icon={<Check className="![animation:none] w-4 h-4" />}>
                      Valider
                    </Button>
                    <Button onClick={() => handleValidate(suggestion.id)} variant="outline" size="sm" icon={<X className="![animation:none] w-4 h-4" />}>
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
