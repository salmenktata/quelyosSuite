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
  domain: z.string(),
  logo: z.string().optional(),
  slogan: z.string().optional(),
  subscription_id: z.number(),
  subscription_state: z.enum(['trial', 'active', 'past_due', 'cancelled', 'expired']),
  plan_code: z.enum(['starter', 'pro', 'enterprise']),
  plan_name: z.string(),
  users_count: z.number().nonnegative(),
  products_count: z.number().nonnegative(),
  orders_count: z.number().nonnegative(),
  max_users: z.number().positive(),
  max_products: z.number().positive(),
  max_orders_per_year: z.number().positive(),
  mrr: z.number().nonnegative(),
  features: z.object({
    wishlist_enabled: z.boolean(),
    reviews_enabled: z.boolean(),
    newsletter_enabled: z.boolean(),
    product_comparison_enabled: z.boolean(),
    guest_checkout_enabled: z.boolean(),
  }),
  provisioning_job_id: z.number().optional(),
  provisioning_status: z.enum(['pending', 'running', 'completed', 'failed']).optional(),
  created_at: z.string(),
})

export const SubscriptionSchema = z.object({
  id: z.number(),
  tenant_id: z.number(),
  tenant_name: z.string(),
  tenant_domain: z.string(),
  plan_id: z.number(),
  plan_code: z.enum(['starter', 'pro', 'enterprise']),
  plan_name: z.string(),
  state: z.enum(['trial', 'active', 'past_due', 'cancelled', 'expired']),
  billing_cycle: z.enum(['monthly', 'yearly']),
  mrr: z.number().nonnegative(),
  price: z.number().nonnegative(),
  start_date: z.string(),
  trial_end_date: z.string().optional(),
  next_billing_date: z.string().optional(),
  end_date: z.string().optional(),
  stripe_subscription_id: z.string().optional(),
  stripe_customer_id: z.string().optional(),
  users_usage: z.number().nonnegative(),
  max_users: z.number().positive(),
  products_usage: z.number().nonnegative(),
  max_products: z.number().positive(),
  orders_usage: z.number().nonnegative(),
  max_orders_per_year: z.number().positive(),
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
  backend_status: z.enum(['up', 'down']),
  backend_response_time_ms: z.number().nonnegative(),
  postgres_status: z.enum(['up', 'down']),
  postgres_connections: z.number().nonnegative(),
  redis_status: z.enum(['up', 'down']),
  redis_memory_mb: z.number().nonnegative(),
  stripe_status: z.enum(['up', 'down']),
  last_webhook_received: z.string().nullable(),
})

// ============================================================================
// SCHEMAS COMPOSÉS
// ============================================================================

export const DashboardMetricsSchema = z.object({
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
  top_customers: z.array(TenantSchema),
  at_risk_customers: z.array(TenantSchema),
  recent_subscriptions: z.array(SubscriptionSchema),
})

export const MRRBreakdownSchema = z.object({
  starter: z.number().nonnegative(),
  pro: z.number().nonnegative(),
  enterprise: z.number().nonnegative(),
  total: z.number().nonnegative(),
})

export const ChurnAnalysisSchema = z.object({
  month: z.string(),
  churn_rate: z.number().min(0).max(100),
  churned_count: z.number().nonnegative(),
  active_start_count: z.number().nonnegative(),
})

export const InvoicesSummarySchema = z.object({
  total_revenue: z.number().nonnegative(),
  unpaid_invoices: z.number().nonnegative(),
  unpaid_amount: z.number().nonnegative(),
  success_rate: z.number().min(0).max(100),
  failed_transactions: z.number().nonnegative(),
})

export const TenantsResponseSchema = z.object({
  data: z.array(TenantSchema),
  total: z.number().nonnegative(),
  page: z.number().positive().optional(),
  limit: z.number().positive().optional(),
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
      console.error('Validation API failed:', error.errors)
      throw new Error(`Invalid API response: ${error.errors.map((e) => e.message).join(', ')}`)
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
    console.error('Validation API failed (safe):', result.error.errors)
    return null
  }
  return result.data
}

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
export type ChurnAnalysis = z.infer<typeof ChurnAnalysisSchema>
export type InvoicesSummary = z.infer<typeof InvoicesSummarySchema>
export type TenantsResponse = z.infer<typeof TenantsResponseSchema>
