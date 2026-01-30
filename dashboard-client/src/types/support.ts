export interface Ticket {
  id: number
  reference: string
  subject: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  state: TicketState
  assignedTo: string | null
  messageCount: number
  createdAt: string
  updatedAt: string
  responseTime?: number
  resolutionTime?: number
  slaFirstResponseDeadline?: string | null
  slaResolutionDeadline?: string | null
  slaFirstResponseStatus?: 'ok' | 'warning' | 'breached' | null
  slaResolutionStatus?: 'ok' | 'warning' | 'breached' | null
}

export type TicketCategory =
  | 'order'
  | 'product'
  | 'delivery'
  | 'return'
  | 'refund'
  | 'payment'
  | 'account'
  | 'technical'
  | 'billing'
  | 'feature_request'
  | 'bug'
  | 'question'
  | 'other'

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export type TicketState = 'new' | 'open' | 'pending' | 'resolved' | 'closed'

export interface TicketMessage {
  id: number
  authorId: number
  authorName: string
  content: string
  isStaff: boolean
  createdAt: string
}

export interface CreateTicketData {
  subject: string
  description: string
  category: TicketCategory
  priority?: TicketPriority
  orderId?: number
  productId?: number
}
