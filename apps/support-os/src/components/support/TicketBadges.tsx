import type { TicketState, TicketPriority } from '@quelyos/types'

const statusConfig: Record<TicketState, { label: string; className: string }> = {
  new: { label: 'Nouveau', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  open: { label: 'En cours', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  pending: { label: 'En attente', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  resolved: { label: 'R\u00E9solu', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  closed: { label: 'Ferm\u00E9', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  cancelled: { label: 'Annul\u00E9', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

const priorityConfig: Record<TicketPriority, { label: string; className: string }> = {
  low: { label: 'Basse', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
  medium: { label: 'Moyenne', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  high: { label: 'Haute', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  urgent: { label: 'Urgente', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export function TicketStatusBadge({ status, state }: { status?: TicketState; state?: TicketState }) {
  const resolvedStatus = status || state || 'new'
  const config = statusConfig[resolvedStatus] || statusConfig.new
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

export function TicketPriorityBadge({ priority }: { priority: TicketPriority }) {
  const config = priorityConfig[priority] || priorityConfig.medium
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
