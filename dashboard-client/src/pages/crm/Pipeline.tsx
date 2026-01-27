import { Link } from 'react-router-dom'
import { List, Plus } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { PipelineKanban } from '@/components/PipelineKanban'
import { useLeads } from '@/hooks/useLeads'
import { useStages } from '@/hooks/useStages'
import { useUpdateLeadStage } from '@/hooks/useUpdateLeadStage'
import { toast } from 'sonner'

export default function Pipeline() {
  const { data: leadsData, isLoading: leadsLoading } = useLeads()
  const { data: stages = [], isLoading: stagesLoading } = useStages()
  const updateStageMutation = useUpdateLeadStage()

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
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Link to="/" className="hover:text-gray-900 dark:hover:text-white">
            Accueil
          </Link>
          <span>/</span>
          <Link to="/crm" className="hover:text-gray-900 dark:hover:text-white">
            CRM
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Pipeline</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Pipeline CRM
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gérez vos opportunités commerciales par glisser-déposer
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/crm/leads"
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <List className="w-5 h-5" />
              Vue Liste
            </Link>
            <Link
              to="/crm/leads/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nouvelle Opportunité
            </Link>
          </div>
        </div>

        {/* Kanban */}
        {leadsLoading || stagesLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <PipelineKanban
            leads={leadsData?.leads || []}
            stages={stages}
            onStageChange={handleStageChange}
          />
        )}
      </div>
    </Layout>
  )
}
