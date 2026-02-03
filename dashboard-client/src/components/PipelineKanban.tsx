import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { LeadListItem, Stage } from '@/types'

interface PipelineKanbanProps {
  leads: LeadListItem[]
  stages: Stage[]
  onStageChange: (leadId: number, stageId: number) => void
}

export function PipelineKanban({ leads, stages, onStageChange }: PipelineKanbanProps) {
  const [draggedLead, setDraggedLead] = useState<LeadListItem | null>(null)

  const handleDragStart = (e: React.DragEvent, lead: LeadListItem) => {
    setDraggedLead(lead)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedLead(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, stageId: number) => {
    e.preventDefault()
    if (draggedLead && draggedLead.stage_id !== stageId) {
      onStageChange(draggedLead.id, stageId)
    }
    setDraggedLead(null)
  }

  const visibleStages = stages.filter(s => !s.fold)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {visibleStages.map(stage => {
        const stageLeads = leads.filter(lead => lead.stage_id === stage.id)
        const totalRevenue = stageLeads.reduce((sum, lead) => sum + (lead.expected_revenue || 0), 0)

        return (
          <div
            key={stage.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">{stage.name}</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {stageLeads.length}
                </span>
              </div>
              {totalRevenue > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalRevenue)}
                </p>
              )}
            </div>

            <div className="p-4 space-y-3 min-h-[200px]">
              {stageLeads.map(lead => (
                <Link
                  key={lead.id}
                  to={`/crm/leads/${lead.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead)}
                  onDragEnd={handleDragEnd}
                  className={`block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all cursor-move ${
                    draggedLead?.id === lead.id ? 'opacity-50' : ''
                  }`}
                >
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                    {lead.name}
                  </h4>
                  {lead.partner_name && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {lead.partner_name}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    {lead.expected_revenue && (
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(lead.expected_revenue)}
                      </span>
                    )}
                    {lead.probability !== undefined && (
                      <span className="text-gray-500 dark:text-gray-400">
                        {lead.probability}%
                      </span>
                    )}
                  </div>
                  {lead.date_deadline && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Échéance : {new Date(lead.date_deadline).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
