/**
 * Centres de Coûts - Gestion budgétaire par centre analytique
 *
 * Fonctionnalités :
 * - Création et édition centres de coûts (départements, projets, activités)
 * - Suivi budget vs réalisé avec calcul écarts automatique
 * - Affectation dépenses par centre pour traçabilité complète
 * - Analyse variances (écart absolu et pourcentage)
 * - Reporting consolidé avec drill-down par centre
 */
import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, PageNotice, SkeletonTable } from '@/components/common'
import { apiClient } from '@/lib/api'
import { financeNotices } from '@/lib/notices/finance-notices'
import { formatCurrency } from '@/lib/utils'
import { Plus, AlertCircle, RefreshCw, Target } from 'lucide-react'
import { GlassCard, GlassBadge } from '@/components/ui/glass'

interface CostCenter {
  id: number
  name: string
  budget: number
  actual: number
  variance: number
  variancePercent: number
}

export default function CostCentersPage() {
  const [centers, setCenters] = useState<CostCenter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCenters = () => {
    setLoading(true)
    setError(null)
    apiClient.post<{
      success: boolean;
      data: {
        costCenters: CostCenter[];
      };
      error?: string;
    }>('/finance/cost-centers')
      .then(res => {
        if (res.data.success && res.data.data) {
          setCenters(res.data.data.costCenters)
        } else {
          setError(res.data.error || 'Erreur lors du chargement des centres')
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
    fetchCenters()
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <SkeletonTable rows={6} columns={5} />
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
          { label: 'Centres de Coûts' },
        ]} />

        {error && (
          <div role="alert" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="flex-1 text-red-800 dark:text-red-200">{error}</p>
              <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={fetchCenters}>
                Réessayer
              </Button>
            </div>
          </div>
        )}

        <PageNotice config={financeNotices.costCenters} className="mb-6" />

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Gestion Budgétaire</p>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Centres de Coûts</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Suivez vos budgets et réalisés par département ou projet
            </p>
          </div>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
            Nouveau Centre
          </Button>
        </div>

        {centers.length === 0 ? (
          <GlassCard variant="subtle" className="p-12 text-center">
            <Target className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Aucun centre de coûts</h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Créez votre premier centre pour organiser vos budgets par département ou projet.
            </p>
            <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
              Créer un centre
            </Button>
          </GlassCard>
        ) : (
          <GlassCard className="overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Réalisé
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Écart
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {centers.map((center) => {
                  const isOverBudget = center.variancePercent > 100
                  return (
                    <tr key={center.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {center.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                        {formatCurrency(center.budget, '€')}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                        {formatCurrency(center.actual, '€')}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <span className={isOverBudget ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-900 dark:text-white'}>
                          {formatCurrency(center.variance, '€')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <GlassBadge variant={isOverBudget ? 'danger' : center.variancePercent > 80 ? 'warning' : 'success'}>
                          {center.variancePercent.toFixed(1)}%
                        </GlassBadge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </GlassCard>
        )}
      </div>
    </Layout>
  )
}
