/**
 * Shared TypeScript types for Support module
 *
 * CRITICAL: This is the SINGLE SOURCE OF TRUTH for support types.
 * Used by:
 * - dashboard-client (ERP Complet)
 * - apps/support-os (SaaS Support)
 *
 * @package @quelyos/types
 */

// ============================================================================
// TICKET STATES & PRIORITIES
// ============================================================================

/**
 * Ticket lifecycle states
 * Version unifiée (6 états) : dashboard-client (5) + support-os 'cancelled' (1)
 */
export type TicketState =
  | 'new'           // Nouveau ticket créé
  | 'open'          // Ticket ouvert (en cours de traitement) - dashboard-client utilise 'in_progress'
  | 'pending'       // En attente (client ou interne) - support-os utilise 'waiting'
  | 'resolved'      // Résolu (en attente de fermeture)
  | 'closed'        // Fermé définitivement
  | 'cancelled'     // Annulé (nouveau de support-os)

/**
 * Ticket priority levels
 */
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

/**
 * Ticket categories
 * Ordre alphabétique pour cohérence
 */
export type TicketCategory =
  | 'account'
  | 'billing'
  | 'bug'
  | 'delivery'
  | 'feature_request'
  | 'order'
  | 'other'
  | 'payment'
  | 'product'
  | 'question'
  | 'refund'
  | 'return'
  | 'technical'

// ============================================================================
// TICKET ENTITY
// ============================================================================

/**
 * Main Ticket entity
 * Unified structure merging dashboard-client + support-os variants
 */
export interface Ticket {
  // Core fields (présents partout)
  id: number
  reference: string
  subject: string
  description: string
  state: TicketState
  priority: TicketPriority

  // Category (dual support: enum vs ID/name)
  category?: TicketCategory                  // dashboard-client utilise enum
  category_id?: number                       // support-os utilise ID backend
  category_name?: string                     // support-os nom catégorie

  // Assignment (dual support: string vs ID/name)
  assignedTo?: string | null                 // dashboard-client format simple
  assigned_id?: number                       // support-os ID utilisateur assigné
  assigned_name?: string                     // support-os nom utilisateur

  // Partner/Customer
  partner_id?: number
  partner_name?: string
  partner_email?: string

  // Team
  team_id?: number
  team_name?: string

  // SLA (dual naming: camelCase + snake_case)
  slaFirstResponseDeadline?: string | null
  slaResolutionDeadline?: string | null
  slaFirstResponseStatus?: 'ok' | 'warning' | 'breached' | 'on_track' | null
  slaResolutionStatus?: 'ok' | 'warning' | 'breached' | 'on_track' | null
  sla_deadline?: string                      // support-os generic deadline
  sla_status?: 'on_track' | 'warning' | 'breached'

  // Metrics (dual naming)
  messageCount?: number
  message_count?: number
  responseTime?: number
  resolutionTime?: number

  // Rating
  rating?: string
  rating_comment?: string

  // Tags
  tags?: { id: number; name: string }[]

  // Timestamps (dual naming: camelCase + snake_case)
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
  closed_at?: string
}

// ============================================================================
// TICKET MESSAGES
// ============================================================================

/**
 * Message/Comment on a ticket
 * Unified structure
 */
export interface TicketMessage {
  id: number
  ticket_id?: number

  // Author (dual naming)
  authorId?: number
  author_id?: number
  authorName?: string
  author_name?: string

  // Content
  content: string

  // Type
  message_type?: 'comment' | 'internal' | 'system'
  isStaff?: boolean

  // Timestamps (dual naming)
  createdAt?: string
  created_at?: string

  // Attachments
  attachments?: { id: number; name: string; url: string }[]
}

// ============================================================================
// CREATE/UPDATE PAYLOADS
// ============================================================================

/**
 * Payload for creating a new ticket
 */
export interface CreateTicketData {
  subject: string
  description: string
  priority?: TicketPriority

  // Category (dual support)
  category?: TicketCategory
  category_id?: number

  // Relations
  partner_id?: number
  orderId?: number          // dashboard-client
  productId?: number        // dashboard-client
  tags?: number[]
}

/**
 * Payload for updating a ticket
 */
export interface UpdateTicketData {
  subject?: string
  description?: string
  state?: TicketState
  priority?: TicketPriority
  category?: TicketCategory
  category_id?: number
  assigned_id?: number
  assignedTo?: string
  tags?: number[]
}

// ============================================================================
// FILTERS & QUERIES
// ============================================================================

/**
 * Filters for querying tickets
 */
export interface TicketFilters {
  state?: TicketState[]
  priority?: TicketPriority[]
  category?: TicketCategory[]
  assigned_id?: number
  partner_id?: number
  team_id?: number
  search?: string
  created_after?: string
  created_before?: string
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Ticket statistics
 */
export interface TicketStats {
  total: number
  by_state: Record<TicketState, number>
  by_priority: Record<TicketPriority, number>
  avg_response_time?: number
  avg_resolution_time?: number
  sla_compliance_rate?: number
}

// ============================================================================
// TAGS
// ============================================================================

/**
 * Ticket tag
 */
export interface TicketTag {
  id: number
  name: string
  color?: string
}

// ============================================================================
// TEAMS
// ============================================================================

/**
 * Support team
 */
export interface SupportTeam {
  id: number
  name: string
  description?: string
  member_ids?: number[]
  member_count?: number
}
