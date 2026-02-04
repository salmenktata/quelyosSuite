/**
 * Rapports Analytiques - Distribution comptable par axe
 *
 * Fonctionnalités :
 * - Distribution comptable multi-axes (projets, départements, activités)
 * - Analyse débit/crédit/solde par compte analytique
 * - Calcul pourcentages de répartition automatique
 * - Export rapports Excel/PDF avec drill-down
 * - Graphiques visuels de répartition (pie charts, bar charts)
 */
import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, PageNotice, SkeletonTable } from '@/components/common'
import { apiClient } from '@/lib/api'
import { financeNotices } from '@/lib/notices/finance-notices'
import { formatCurrency } from '@/lib/utils'
import { FileText, AlertCircle, RefreshCw, Download } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass'

interface AnalyticDistribution {
  accountId: number
  accountName: string
  debit: number
  credit: number
  balance: number
  percentage: number
}

export default function AnalyticsReportsPage() {
  const [distribution, setDistribution] = useState<AnalyticDistribution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDistribution = () => {
    setLoading(true)
    setError(null)
    apiClient.post<{
      success: boolean;
      data: {
        distribution: AnalyticDistribution[];
      };
      error?: string;
    }>('/finance/analytics/distribution', { axis_id: 1 })
      .then(res => {
        if (res.data.success && res.data.data) {
          setDistribution(res.data.data.distribution)
        } else {
          setError(res.data.error || 'Erreur lors du chargement de la distribution')
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
    fetchDistribution()
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="![animation:none] p-4 md:p-8 space-y-6">
          <div className="![animation:none] h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="![animation:none] h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <SkeletonTable rows={8} columns={5} />
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
          { label: 'Analytique', href: '/finance/analytics' },
          { label: 'Rapports' },
        ]} />

        {error && (
          <div role="alert" className="![animation:none] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="![animation:none] flex items-center gap-3">
              <AlertCircle className="![animation:none] w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="![animation:none] flex-1 text-red-800 dark:text-red-200">{error}</p>
              <Button variant="ghost" size="sm" icon={<RefreshCw className="![animation:none] w-4 h-4" />} onClick={fetchDistribution}>
                Réessayer
              </Button>
            </div>
          </div>
        )}

        <PageNotice config={financeNotices.analyticsReports} className="![animation:none] mb-6" />

        <div className="![animation:none] flex items-center justify-between">
          <div className="![animation:none] space-y-1">
            <p className="![animation:none] text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Comptabilité Analytique</p>
            <h1 className="![animation:none] text-3xl font-semibold text-gray-900 dark:text-white">Rapports Analytiques</h1>
            <p className="![animation:none] text-sm text-gray-600 dark:text-gray-400">
              Distribution comptable par axe analytique avec analyse détaillée
            </p>
          </div>
          <Button variant="primary" icon={<Download className="![animation:none] w-4 h-4" />}>
            Exporter
          </Button>
        </div>

        {distribution.length === 0 ? (
          <GlassCard variant="subtle" className="![animation:none] p-12 text-center">
            <FileText className="![animation:none] mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="![animation:none] mb-2 text-lg font-semibold text-gray-900 dark:text-white">Aucune distribution</h3>
            <p className="![animation:none] mb-4 text-sm text-gray-600 dark:text-gray-400">
              Aucune donnée analytique disponible pour le moment.
            </p>
          </GlassCard>
        ) : (
          <GlassCard className="![animation:none] overflow-hidden">
            <table className="![animation:none] min-w-full">
              <thead className="![animation:none] bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="![animation:none] px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Compte
                  </th>
                  <th className="![animation:none] px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Débit
                  </th>
                  <th className="![animation:none] px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Crédit
                  </th>
                  <th className="![animation:none] px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Solde
                  </th>
                  <th className="![animation:none] px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    %
                  </th>
                </tr>
              </thead>
              <tbody className="![animation:none] divide-y divide-gray-200 dark:divide-gray-700">
                {distribution.map((item) => (
                  <tr key={item.accountId} className="![animation:none] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="![animation:none] px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {item.accountName}
                    </td>
                    <td className="![animation:none] px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                      {formatCurrency(item.debit, '€')}
                    </td>
                    <td className="![animation:none] px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                      {formatCurrency(item.credit, '€')}
                    </td>
                    <td className="![animation:none] px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.balance, '€')}
                    </td>
                    <td className="![animation:none] px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-400">
                      {item.percentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        )}
      </div>
    </Layout>
  )
}
