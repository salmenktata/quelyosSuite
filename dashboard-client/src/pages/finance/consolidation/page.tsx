/**
 * Consolidation Multi-Entités - Vue d'ensemble groupe
 *
 * Fonctionnalités :
 * - Agrégation automatique des données financières multi-entités
 * - Vue consolidée : trésorerie, revenus, dépenses globales
 * - Détail par entité avec drill-down pour analyse approfondie
 * - Élimination des flux inter-entités pour vision juste
 * - KPIs groupe : EBITDA, BFR, DSO consolidés
 */
import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common'
import { apiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { financeNotices } from '@/lib/notices/finance-notices'
import { AlertCircle, RefreshCw, Building2 } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass'

interface ConsolidationEntity {
  id: number
  name: string
  code: string
  consolidationPercent: number
  currency: string
}

interface ConsolidationBalanceSheet {
  assets: { total: { consolidated: number } }
  liabilities: { total: { consolidated: number } }
}

export default function ConsolidationPage() {
  const [entities, setEntities] = useState<ConsolidationEntity[]>([])
  const [balanceSheet, setBalanceSheet] = useState<ConsolidationBalanceSheet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchConsolidation = () => {
    setLoading(true)
    setError(false)
    Promise.all([
      apiClient.post<{
        success: boolean;
        data: {
          entities: ConsolidationEntity[];
        };
      }>('/finance/consolidation/entities'),
      apiClient.post<{
        success: boolean;
        data: ConsolidationBalanceSheet;
      }>('/finance/consolidation/balance-sheet'),
    ])
      .then(([entitiesRes, balanceRes]) => {
        if (entitiesRes.data.success && entitiesRes.data.data) setEntities(entitiesRes.data.data.entities)
        if (balanceRes.data.success && balanceRes.data.data) setBalanceSheet(balanceRes.data.data)
        setLoading(false)
      })
      .catch(_err => {
        setError(true)
        setLoading(false)
      })
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConsolidation()
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="![animation:none] p-4 md:p-8 space-y-6">
          <div className="![animation:none] h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="![animation:none] h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
          <SkeletonTable rows={4} columns={3} />
          <div className="![animation:none] h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="![animation:none] p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Finance', href: '/finance' },
            { label: 'Consolidation' },
          ]}
        />

        <div>
          <h1 className="![animation:none] text-2xl font-bold text-gray-900 dark:text-white">
            Consolidation Groupe
          </h1>
          <p className="![animation:none] text-gray-500 dark:text-gray-400 mt-1">
            Vue consolidée de vos entités financières
          </p>
        </div>

        <PageNotice config={financeNotices.consolidation} className="![animation:none]" />

        {error && (
          <div
            role="alert"
            className="![animation:none] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="![animation:none] flex items-center gap-3">
              <AlertCircle className="![animation:none] w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="![animation:none] flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement des données de consolidation.
              </p>
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw className="![animation:none] w-4 h-4" />}
                onClick={fetchConsolidation}
              >
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {!error && entities.length === 0 && (
          <GlassCard variant="subtle" className="![animation:none] text-center py-12">
            <Building2 className="![animation:none] w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="![animation:none] text-lg font-medium text-gray-900 dark:text-white">
              Aucune entité trouvée
            </h3>
            <p className="![animation:none] text-gray-500 dark:text-gray-400 mt-1">
              Créez des entités pour commencer la consolidation.
            </p>
          </GlassCard>
        )}

        {!error && entities.length > 0 && (
          <>
            <div className="![animation:none] grid gap-6">
              <div>
                <h2 className="![animation:none] text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Entités ({entities.length})
                </h2>
                <div className="![animation:none] grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {entities.map((entity) => (
                    <div
                      key={entity.id}
                      className="![animation:none] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="![animation:none] flex justify-between items-start">
                        <div>
                          <h3 className="![animation:none] font-semibold text-gray-900 dark:text-white">
                            {entity.name}
                          </h3>
                          <p className="![animation:none] text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {entity.code}
                          </p>
                        </div>
                        <div className="![animation:none] text-right">
                          <p className="![animation:none] text-sm font-medium text-emerald-600 dark:text-emerald-400">
                            {entity.consolidationPercent}%
                          </p>
                          <p className="![animation:none] text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {entity.currency}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {balanceSheet && (
              <GlassCard className="![animation:none] p-6">
                <h2 className="![animation:none] text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Bilan Consolidé
                </h2>
                <div className="![animation:none] grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="![animation:none] p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <h3 className="![animation:none] text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2">
                      Actif Total
                    </h3>
                    <p className="![animation:none] text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                      {formatCurrency(balanceSheet.assets.total.consolidated, '€')}
                    </p>
                  </div>
                  <div className="![animation:none] p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <h3 className="![animation:none] text-sm font-medium text-orange-700 dark:text-orange-400 mb-2">
                      Passif Total
                    </h3>
                    <p className="![animation:none] text-2xl font-bold text-orange-900 dark:text-orange-100">
                      {formatCurrency(balanceSheet.liabilities.total.consolidated, '€')}
                    </p>
                  </div>
                </div>
              </GlassCard>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
