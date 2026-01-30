/**
 * Validation Zod pour les réponses API
 * Garantit la cohérence des données runtime
 */

import { z } from 'zod'

// ============================================================================
// SCHEMAS DE BASE
// ============================================================================

export const TenantSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string().optional(),
  domain: z.string(),
  status: z.enum(['provisioning', 'active', 'suspended', 'archived']).optional(),
  logo: z.string().nullable().optional(),
  slogan: z.string().nullable().optional(),
  subscription_id: z.number().nullable().optional(),
  subscription_state: z.union([
    z.enum(['trial', 'active', 'past_due', 'cancelled', 'expired']),
    z.literal(false),
    z.null(),
  ]).optional(),
  plan_code: z.enum(['starter', 'pro', 'enterprise']).nullable().optional(),
  plan_name: z.string().nullable().optional(),
  users_count: z.number().nonnegative(),
  products_count: z.number().nonnegative(),
  orders_count: z.number().nonnegative(),
  max_users: z.number().nonnegative(), // 0 = illimité
  max_products: z.number().nonnegative(), // 0 = illimité
  max_orders_per_year: z.number().nonnegative(), // 0 = illimité
  mrr: z.number().nonnegative(),
  features: z.object({
    wishlist_enabled: z.boolean(),
    reviews_enabled: z.boolean(),
    newsletter_enabled: z.boolean(),
    product_comparison_enabled: z.boolean(),
    guest_checkout_enabled: z.boolean(),
  }),
  provisioning_job_id: z.number().nullable().optional(),
  provisioning_status: z.enum(['pending', 'running', 'completed', 'failed']).nullable().optional(),
  created_at: z.string(),
})

export const SubscriptionSchema = z.object({
  id: z.number(),
  name: z.string().nullable().optional(),
  tenant_id: z.number().nullable().optional(),
  tenant_name: z.string().nullable().optional(),
  tenant_domain: z.string().nullable().optional(),
  plan_id: z.number().nullable().optional(),
  plan_code: z.string().nullable().optional(),
  plan_name: z.string().nullable().optional(),
  state: z.string(),
  billing_cycle: z.string(),
  mrr: z.number().nonnegative(),
  price: z.number().nonnegative(),
  start_date: z.string().nullable().optional(),
  trial_end_date: z.string().nullable().optional(),
  next_billing_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  stripe_subscription_id: z.union([z.string(), z.literal(false)]).nullable().optional(),
  stripe_customer_id: z.union([z.string(), z.literal(false)]).nullable().optional(),
  users_usage: z.number().nonnegative().optional(),
  max_users: z.number().nonnegative(),
  products_usage: z.number().nonnegative().optional(),
  max_products: z.number().nonnegative(),
  orders_usage: z.number().nonnegative().optional(),
  max_orders_per_year: z.number().nonnegative(),
})

export const InvoiceSchema = z.object({
  id: z.number(),
  name: z.string(),
  tenant_id: z.number(),
  tenant_name: z.string(),
  amount_untaxed: z.number().nonnegative(),
  amount_total: z.number().nonnegative(),
  state: z.enum(['draft', 'posted', 'cancel']),
  payment_state: z.enum(['not_paid', 'in_payment', 'paid', 'partial', 'reversed', 'invoicing_legacy']),
  invoice_date: z.string(),
  due_date: z.string().optional(),
})

export const TransactionSchema = z.object({
  id: z.number(),
  reference: z.string(),
  tenant_id: z.number(),
  tenant_name: z.string(),
  amount: z.number().nonnegative(),
  state: z.enum(['draft', 'pending', 'authorized', 'done', 'cancel', 'error']),
  provider: z.string(),
  date: z.string(),
  error_message: z.string().optional(),
})

export const ProvisioningJobSchema = z.object({
  id: z.number(),
  tenant_id: z.number(),
  tenant_name: z.string(),
  job_type: z.enum(['tenant_creation', 'module_activation', 'data_migration']),
  state: z.enum(['pending', 'running', 'completed', 'failed']),
  progress: z.number().min(0).max(100),
  started_at: z.string().optional(),
  completed_at: z.string().optional(),
  duration_seconds: z.number().nonnegative().optional(),
  error_message: z.string().optional(),
  steps_completed: z.array(z.string()),
})

export const SystemHealthSchema = z.object({
  success: z.boolean().optional(),
  backend_status: z.enum(['up', 'down']),
  backend_response_time_ms: z.number().nonnegative(),
  postgres_status: z.enum(['up', 'down']),
  postgres_connections: z.number().nonnegative(),
  redis_status: z.enum(['up', 'down']),
  redis_memory_mb: z.number().nonnegative(),
  stripe_status: z.enum(['up', 'down']),
  last_webhook_received: z.string().nullable(),
})

export const PlanSchema = z.object({
  id: z.number(),
  code: z.enum(['starter', 'pro', 'enterprise']),
  name: z.string(),
  description: z.string().optional(),
  price_monthly: z.number().nonnegative(),
  price_yearly: z.number().nonnegative().optional(),
  max_users: z.number().nonnegative(),
  max_products: z.number().nonnegative(),
  max_orders_per_year: z.number().nonnegative(),
  features: z.object({
    wishlist_enabled: z.boolean().optional(),
    reviews_enabled: z.boolean().optional(),
    newsletter_enabled: z.boolean().optional(),
    product_comparison_enabled: z.boolean().optional(),
    guest_checkout_enabled: z.boolean().optional(),
    api_access: z.boolean().optional(),
    priority_support: z.boolean().optional(),
    custom_domain: z.boolean().optional(),
  }).optional(),
  is_active: z.boolean().optional(),
  subscribers_count: z.number().nonnegative().optional(),
  created_at: z.string().optional(),
})

export const PlansResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(PlanSchema),
})

// ============================================================================
// SCHEMAS COMPOSÉS
// ============================================================================

// Schémas simplifiés pour le dashboard
export const TopCustomerSchema = z.object({
  id: z.number(),
  name: z.string(),
  mrr: z.number().nonnegative(),
  plan: z.enum(['starter', 'pro', 'enterprise']).nullable().optional(),
})

export const AtRiskCustomerSchema = z.object({
  id: z.number(),
  name: z.string(),
  tenant_id: z.number().nullable().optional(),
  plan: z.enum(['starter', 'pro', 'enterprise']).nullable().optional(),
  mrr: z.number().nonnegative(),
  health_score: z.number().min(0).max(100),
  health_status: z.enum(['healthy', 'at_risk', 'critical']),
  state: z.enum(['trial', 'active', 'past_due', 'cancelled', 'expired']).optional(),
  usage_score: z.number().optional(),
  payment_health: z.number().optional(),
  engagement_score: z.number().optional(),
  churn_risk: z.number().optional(),
  trial_end_date: z.string().nullable().optional(),
})

export const HealthOverviewSchema = z.object({
  success: z.boolean().optional(),
  distribution: z.object({
    healthy: z.number().nonnegative(),
    at_risk: z.number().nonnegative(),
    critical: z.number().nonnegative(),
    total: z.number().nonnegative(),
  }),
  at_risk_customers: z.array(AtRiskCustomerSchema),
  total_mrr_at_risk: z.number().nonnegative(),
})

export const RecentSubscriptionSchema = z.object({
  id: z.number(),
  name: z.string(),
  plan: z.enum(['starter', 'pro', 'enterprise']).nullable().optional(),
  state: z.enum(['trial', 'active', 'past_due', 'cancelled', 'expired']),
  mrr: z.number().nonnegative(),
  created_at: z.string().nullable().optional(),
})

// Dashboard At-Risk Customer (simplified with health_score)
export const DashboardAtRiskCustomerSchema = z.object({
  id: z.number(),
  name: z.string(),
  mrr: z.number().nonnegative(),
  plan: z.enum(['starter', 'pro', 'enterprise']).nullable().optional(),
  health_score: z.number().min(0).max(100).optional(),
  health_status: z.enum(['healthy', 'at_risk', 'critical']).optional(),
})

export const DashboardMetricsSchema = z.object({
  success: z.boolean().optional(),
  mrr: z.number().nonnegative(),
  arr: z.number().nonnegative(),
  active_subscriptions: z.number().nonnegative(),
  churn_rate: z.number().min(0).max(100),
  mrr_history: z.array(
    z.object({
      month: z.string(),
      mrr: z.number().nonnegative(),
    })
  ),
  revenue_by_plan: z.array(
    z.object({
      plan: z.string(),
      revenue: z.number().nonnegative(),
    })
  ),
  top_customers: z.array(TopCustomerSchema),
  at_risk_customers: z.array(DashboardAtRiskCustomerSchema),
  recent_subscriptions: z.array(RecentSubscriptionSchema),
})

export const MRRBreakdownSchema = z.object({
  success: z.boolean().optional(),
  starter: z.number().nonnegative(),
  pro: z.number().nonnegative(),
  enterprise: z.number().nonnegative(),
  total: z.number().nonnegative(),
})

export const ChurnAnalysisItemSchema = z.object({
  month: z.string(),
  churn_rate: z.number().min(0).max(100),
  churned_count: z.number().nonnegative(),
  active_start_count: z.number().nonnegative(),
})

export const ChurnAnalysisSchema = z.object({
  success: z.boolean().optional(),
  error: z.string().optional(),
  data: z.array(ChurnAnalysisItemSchema).optional().default([]),
})

export const InvoicesSummarySchema = z.object({
  success: z.boolean().optional(),
  total_revenue: z.number().nonnegative(),
  unpaid_invoices: z.number().nonnegative(),
  unpaid_amount: z.number().nonnegative(),
  success_rate: z.number().min(0).max(100),
  failed_transactions: z.number().nonnegative(),
})

export const TenantsResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(TenantSchema),
  total: z.number().nonnegative(),
  page: z.number().nonnegative().optional(),
  limit: z.number().nonnegative().optional(),
})

// ============================================================================
// HELPERS DE VALIDATION
// ============================================================================

/**
 * Valide une réponse API et retourne les données typées
 * Lance une erreur si la validation échoue
 */
export function validateApiResponse<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
      console.error('Validation API failed:', details, '\nData received:', JSON.stringify(data, null, 2).slice(0, 500))
      throw new Error(`Invalid API response: ${details}`)
    }
    throw error
  }
}

/**
 * Valide une réponse API de manière safe (retourne null si échec)
 */
export function safeValidateApiResponse<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data)
  if (!result.success) {
    console.error('Validation API failed (safe):', result.error.issues)
    return null
  }
  return result.data
}

// ============================================================================
// SCHEMAS BACKUPS & CORS
// ============================================================================

export const BackupSchema = z.object({
  id: z.number(),
  filename: z.string(),
  type: z.enum(['full', 'incremental', 'tenant']),
  tenant_id: z.number().nullable(),
  tenant_name: z.string().nullable(),
  size_mb: z.number().nonnegative(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  created_at: z.string(),
  completed_at: z.string().nullable(),
  download_url: z.union([z.string(), z.literal(false)]).nullable(),
  error_message: z.union([z.string(), z.literal(false)]).nullable(),
})

export const BackupScheduleSchema = z.object({
  enabled: z.boolean(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  day_of_week: z.number().min(0).max(6).optional(), // 0=dimanche, 6=samedi
  day_of_month: z.number().min(1).max(28).optional(),
  hour: z.number().min(0).max(23),
  minute: z.number().min(0).max(59),
  backup_type: z.enum(['full', 'incremental']),
  retention_count: z.number().min(1).max(365),
})

export const BackupsResponseSchema = z.object({
  success: z.boolean().optional(),
  error: z.string().optional(),
  data: z.array(BackupSchema).optional().default([]),
  total: z.number().nonnegative().optional().default(0),
  last_auto_backup: z.union([z.string(), z.literal(false)]).nullable().optional(),
  next_scheduled_backup: z.union([z.string(), z.literal(false)]).nullable().optional(),
  schedule: BackupScheduleSchema.optional(),
})

export const CorsEntrySchema = z.object({
  id: z.number(),
  domain: z.string(),
  tenant_id: z.number().nullable(),
  tenant_name: z.string().nullable(),
  created_at: z.string(),
  created_by: z.string(),
  is_active: z.boolean(),
})

export const CorsSettingsSchema = z.object({
  entries: z.array(CorsEntrySchema),
  allow_credentials: z.boolean(),
  max_age_seconds: z.number().nonnegative(),
})

// ============================================================================
// SCHEMAS DUNNING
// ============================================================================

export const DunningStepSchema = z.object({
  id: z.number(),
  subscription_id: z.number(),
  tenant_name: z.string(),
  tenant_id: z.number().nullable().optional(),
  days_overdue: z.number().nonnegative(),
  next_action: z.enum(['email_soft', 'email_urgent', 'suspend', 'cancel']),
  next_action_date: z.string().nullable().optional(),
  step_number: z.number(),
  amount_due: z.number().nonnegative(),
})

export const DunningOverviewSchema = z.object({
  success: z.boolean().optional(),
  stats: z.object({
    pending_steps: z.number().nonnegative(),
    executed_today: z.number().nonnegative(),
    total_past_due: z.number().nonnegative(),
    total_amount_due: z.number().nonnegative(),
    recovered_this_month: z.number().nonnegative(),
    recovered_count: z.number().nonnegative(),
  }),
  active_collections: z.array(DunningStepSchema),
})

// ============================================================================
// SCHEMAS RÉPONSES API (wrappers avec success et data)
// ============================================================================

export const SubscriptionsResponseSchema = z.object({
  success: z.boolean().optional(),
  error: z.string().optional(),
  data: z.array(SubscriptionSchema).optional().default([]),
  total: z.number().nonnegative().optional().default(0),
})

export const InvoicesResponseSchema = z.object({
  success: z.boolean().optional(),
  error: z.string().optional(),
  data: z.array(InvoiceSchema).optional().default([]),
})

export const TransactionsResponseSchema = z.object({
  success: z.boolean().optional(),
  error: z.string().optional(),
  data: z.array(TransactionSchema).optional().default([]),
})

export const ProvisioningJobsResponseSchema = z.object({
  success: z.boolean().optional(),
  error: z.string().optional(),
  data: z.array(ProvisioningJobSchema).optional().default([]),
})

// ============================================================================
// TYPES TYPESCRIPT INFÉRÉS
// ============================================================================

export type Tenant = z.infer<typeof TenantSchema>
export type Subscription = z.infer<typeof SubscriptionSchema>
export type Invoice = z.infer<typeof InvoiceSchema>
export type Transaction = z.infer<typeof TransactionSchema>
export type ProvisioningJob = z.infer<typeof ProvisioningJobSchema>
export type SystemHealth = z.infer<typeof SystemHealthSchema>
export type DashboardMetrics = z.infer<typeof DashboardMetricsSchema>
export type MRRBreakdown = z.infer<typeof MRRBreakdownSchema>
export type ChurnAnalysisItem = z.infer<typeof ChurnAnalysisItemSchema>
export type ChurnAnalysis = z.infer<typeof ChurnAnalysisSchema>
export type InvoicesSummary = z.infer<typeof InvoicesSummarySchema>
export type TenantsResponse = z.infer<typeof TenantsResponseSchema>
export type Backup = z.infer<typeof BackupSchema>
export type BackupSchedule = z.infer<typeof BackupScheduleSchema>
export type BackupsResponse = z.infer<typeof BackupsResponseSchema>
export type CorsEntry = z.infer<typeof CorsEntrySchema>
export type CorsSettings = z.infer<typeof CorsSettingsSchema>
export type SubscriptionsResponse = z.infer<typeof SubscriptionsResponseSchema>
export type InvoicesResponse = z.infer<typeof InvoicesResponseSchema>
export type TransactionsResponse = z.infer<typeof TransactionsResponseSchema>
export type ProvisioningJobsResponse = z.infer<typeof ProvisioningJobsResponseSchema>
export type Plan = z.infer<typeof PlanSchema>
export type PlansResponse = z.infer<typeof PlansResponseSchema>
