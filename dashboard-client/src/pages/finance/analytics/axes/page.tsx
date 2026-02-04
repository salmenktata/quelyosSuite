/**
 * Axes Analytiques - Gestion des dimensions d'analyse comptable
 *
 * Fonctionnalités :
 * - Création et édition d'axes analytiques (projets, départements, activités)
 * - Gestion codes et statuts actif/inactif
 * - Liste complète avec filtrage et recherche
 * - Attribution axes aux comptes et écritures comptables
 * - Support multi-dimensions pour analyse croisée
 */
import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, PageNotice, SkeletonTable } from '@/components/common'
import { apiClient } from '@/lib/api'
import { financeNotices } from '@/lib/notices/finance-notices'
import { Plus, AlertCircle, RefreshCw, Target } from 'lucide-react'
import { GlassCard, GlassBadge } from '@/components/ui/glass'

interface AnalyticAxis {
  id: number
  name: string
  code: string
  status?: 'active' | 'inactive'
}

export default function AnalyticsAxesPage() {
  const [axes, setAxes] = useState<AnalyticAxis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAxes = () => {
    setLoading(true)
    setError(null)
    apiClient.post<{
      success: boolean;
      data: {
        axes: AnalyticAxis[];
      };
      error?: string;
    }>('/finance/analytics/axes')
      .then(res => {
        if (res.data.success && res.data.data) {
          setAxes(res.data.data.axes)
        } else {
          setError(res.data.error || 'Erreur lors du chargement des axes')
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
    fetchAxes()
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="![animation:none] p-4 md:p-8 space-y-6">
          <div className="![animation:none] h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="![animation:none] h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <SkeletonTable rows={5} columns={3} />
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
          { label: 'Axes' },
        ]} />

        {error && (
          <div role="alert" className="![animation:none] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="![animation:none] flex items-center gap-3">
              <AlertCircle className="![animation:none] w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="![animation:none] flex-1 text-red-800 dark:text-red-200">{error}</p>
              <Button variant="ghost" size="sm" icon={<RefreshCw className="![animation:none] w-4 h-4" />} onClick={fetchAxes}>
                Réessayer
              </Button>
            </div>
          </div>
        )}

        <PageNotice config={financeNotices.analyticsAxes} className="![animation:none] mb-6" />

        <div className="![animation:none] flex items-center justify-between">
          <div className="![animation:none] space-y-1">
            <p className="![animation:none] text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Comptabilité Analytique</p>
            <h1 className="![animation:none] text-3xl font-semibold text-gray-900 dark:text-white">Axes Analytiques</h1>
            <p className="![animation:none] text-sm text-gray-600 dark:text-gray-400">
              Gérez vos dimensions d'analyse comptable (projets, départements, activités)
            </p>
          </div>
          <Button variant="primary" icon={<Plus className="![animation:none] w-4 h-4" />}>
            Nouvel Axe
          </Button>
        </div>

        {axes.length === 0 ? (
          <GlassCard variant="subtle" className="![animation:none] p-12 text-center">
            <Target className="![animation:none] mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="![animation:none] mb-2 text-lg font-semibold text-gray-900 dark:text-white">Aucun axe analytique</h3>
            <p className="![animation:none] mb-4 text-sm text-gray-600 dark:text-gray-400">
              Créez votre premier axe pour organiser votre analyse comptable.
            </p>
            <Button variant="primary" icon={<Plus className="![animation:none] w-4 h-4" />}>
              Créer un axe
            </Button>
          </GlassCard>
        ) : (
          <GlassCard className="![animation:none] overflow-hidden">
            <table className="![animation:none] min-w-full">
              <thead className="![animation:none] bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="![animation:none] px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="![animation:none] px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="![animation:none] px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="![animation:none] divide-y divide-gray-200 dark:divide-gray-700">
                {axes.map((axis) => (
                  <tr key={axis.id} className="![animation:none] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="![animation:none] px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {axis.name}
                    </td>
                    <td className="![animation:none] px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {axis.code}
                    </td>
                    <td className="![animation:none] px-6 py-4 text-sm">
                      <GlassBadge variant={axis.status === 'inactive' ? 'warning' : 'success'}>
                        {axis.status === 'inactive' ? 'Inactif' : 'Actif'}
                      </GlassBadge>
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
