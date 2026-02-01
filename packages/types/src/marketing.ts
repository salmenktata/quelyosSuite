/**
 * Shared TypeScript types for Marketing module
 *
 * @package @quelyos/types
 */

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled'
export type CampaignChannel = 'email' | 'sms' | 'push' | 'social'

export interface CampaignStats {
  sent?: number
  delivered?: number
  opened?: number
  clicked?: number
  bounced?: number
  unsubscribed?: number
}

export interface CampaignRates {
  open_rate?: number
  click_rate?: number
  bounce_rate?: number
  unsubscribe_rate?: number
}

export interface MarketingCampaign {
  id: number
  name: string
  status: CampaignStatus
  state?: string // Alias for status (backend naming)
  channel: CampaignChannel

  // Content
  content?: string // Email HTML content
  sms_message?: string // SMS text content

  // Audience
  contact_list_name?: string
  recipient_count?: number

  // Statistics
  stats?: CampaignStats
  rates?: CampaignRates

  // Dates
  create_date?: string
  created_at?: string // Alias for create_date
  schedule_date?: string
  scheduled_date?: string // Alias for schedule_date
  sent_date?: string

  // Metadata
  subject?: string // Email subject
  sender_name?: string
  sender_email?: string
}
