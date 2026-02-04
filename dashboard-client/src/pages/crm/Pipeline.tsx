import { Link } from 'react-router-dom'
import { List, Plus } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, SkeletonCard, PageNotice, Button } from '@/components/common'
import { PipelineKanban } from '@/components/PipelineKanban'
import { LeadStats } from '@/components/leads/LeadStats'
import { useLeads } from '@/hooks/useLeads'
import { useStages } from '@/hooks/useStages'
import { useUpdateLeadStage } from '@/hooks/useUpdateLeadStage'
import { crmNotices } from '@/lib/notices/crm-notices'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

/**
 * Page Pipeline CRM
 *
 * Fonctionnalités :
 * - Vue Kanban drag & drop des opportunités par étape
 * - Statistiques agrégées (total opportunités, revenu attendu, probabilité moyenne)
 * - Changement de statut par glisser-déposer entre colonnes
 * - Calcul revenu total par étape avec visualisation
 * - Navigation rapide vers détail opportunité
 * - Switch instantané entre vue Pipeline et Liste
 * - Création nouvelle opportunité depuis le pipeline
 */
export default function Pipeline() {
  const { data: leadsData, isLoading: leadsLoading, error: leadsError } = useLeads()
  const { data: stages = [], isLoading: stagesLoading, error: stagesError } = useStages()
  const updateStageMutation = useUpdateLeadStage()

  const leads = leadsData?.leads || []
  const isLoading = leadsLoading || stagesLoading
  const error = leadsError || stagesError

  const handleStageChange = async (leadId: number, stageId: number) => {
    try {
      await updateStageMutation.mutateAsync({ id: leadId, stage_id: stageId })
      toast.success('Opportunité déplacée avec succès')
    } catch (error) {
      toast.error('Erreur lors du déplacement de l\'opportunité')
      logger.error('Pipeline stage change error:', error)
    }
  }

  return (
    <Layout>
      <div className="p-4 md:p-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Pipeline CRM' }]} />

        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Pipeline CRM
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gérez vos opportunités commerciales par glisser-déposer
          </p>
        </div>

        <PageNotice config={crmNotices.pipeline} className="mb-6" />

        {/* Error Message */}
        {error && (
          <div role="alert" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement du pipeline.
              </p>
              <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => refetch()}>
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        {!isLoading && !error && leads.length > 0 && (
          <LeadStats leads={leads} />
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mb-6">
          <Link to="/crm/leads">
            <Button variant="secondary" icon={<List className="w-5 h-5" />}>
              Vue Liste
            </Button>
          </Link>
          <Link to="/crm/leads/new">
            <Button variant="primary" icon={<Plus className="w-5 h-5" />}>
              Nouvelle Opportunité
            </Button>
          </Link>
        </div>

        {/* Kanban */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center" role="alert">
            <p className="text-red-600 dark:text-red-400 mb-4">
              Erreur lors du chargement du pipeline
            </p>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </div>
        ) : (
          <PipelineKanban
            leads={leads}
            stages={stages}
            onStageChange={handleStageChange}
          />
        )}
      </div>
    </Layout>
  )
}
