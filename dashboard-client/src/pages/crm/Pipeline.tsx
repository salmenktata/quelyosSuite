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

/**
 * Page Pipeline CRM
 * Affiche les opportunités commerciales en vue Kanban avec drag & drop
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
      console.error(error)
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

        {/* KPI Cards */}
        {!isLoading && !error && leads.length > 0 && (
          <LeadStats leads={leads} />
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mb-6">
          <Link
            to="/crm/leads"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <List className="w-5 h-5" />
            Vue Liste
          </Link>
          <Link
            to="/crm/leads/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Opportunité
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
