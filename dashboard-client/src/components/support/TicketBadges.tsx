import { Badge } from '@/components/common'
import { AlertCircle } from 'lucide-react'
import type { TicketState, TicketPriority } from '@/types'

interface TicketStatusBadgeProps {
  state: TicketState
}

export function TicketStatusBadge({ state }: TicketStatusBadgeProps) {
  const variants: Record<TicketState, 'neutral' | 'info' | 'warning' | 'success'> = {
    new: 'info',
    open: 'warning',
    pending: 'warning',
    solved: 'success',
    closed: 'neutral',
  }

  const labels: Record<TicketState, string> = {
    new: 'Nouveau',
    open: 'En cours',
    pending: 'En attente',
    solved: 'Résolu',
    closed: 'Fermé',
  }

  return <Badge variant={variants[state]}>{labels[state]}</Badge>
}

interface TicketPriorityBadgeProps {
  priority: TicketPriority
}

export function TicketPriorityBadge({ priority }: TicketPriorityBadgeProps) {
  const colors: Record<TicketPriority, string> = {
    low: 'text-gray-600 dark:text-gray-400',
    medium: 'text-blue-600 dark:text-blue-400',
    high: 'text-orange-600 dark:text-orange-400',
    urgent: 'text-red-600 dark:text-red-400',
  }

  const labels: Record<TicketPriority, string> = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
    urgent: 'Urgente',
  }

  return (
    <span className={`inline-flex items-center gap-1 ${colors[priority]}`}>
      {priority === 'urgent' && <AlertCircle className="w-4 h-4" />}
      {labels[priority]}
    </span>
  )
}
