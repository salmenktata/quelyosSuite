export interface Tenant {
  id: number
  name: string
  domain: string
  logo?: string
  slogan?: string
  subscription_id: number
  subscription_state: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'
  plan_code: 'starter' | 'pro' | 'enterprise'
  plan_name: string
  users_count: number
  products_count: number
  orders_count: number
  max_users: number
  max_products: number
  max_orders_per_year: number
  mrr: number
  features: {
    wishlist_enabled: boolean
    reviews_enabled: boolean
    newsletter_enabled: boolean
    product_comparison_enabled: boolean
    guest_checkout_enabled: boolean
  }
  provisioning_job_id?: number
  provisioning_status?: 'pending' | 'running' | 'completed' | 'failed'
  created_at: string
}

export interface Subscription {
  id: number
  tenant_id: number
  tenant_name: string
  tenant_domain: string
  plan_id: number
  plan_code: 'starter' | 'pro' | 'enterprise'
  plan_name: string
  state: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'
  billing_cycle: 'monthly' | 'yearly'
  mrr: number
  price: number
  start_date: string
  trial_end_date?: string
  next_billing_date?: string
  end_date?: string
  stripe_subscription_id?: string
  stripe_customer_id?: string
  users_usage: number
  max_users: number
  products_usage: number
  max_products: number
  orders_usage: number
  max_orders_per_year: number
}

export interface DashboardMetrics {
  mrr: number
  arr: number
  active_subscriptions: number
  churn_rate: number
  mrr_history: { month: string; mrr: number }[]
  revenue_by_plan: { plan: string; revenue: number }[]
  top_customers: Tenant[]
  at_risk_customers: Tenant[]
  recent_subscriptions: Subscription[]
}

export interface Invoice {
  id: number
  name: string
  tenant_id: number
  tenant_name: string
  amount_untaxed: number
  amount_total: number
  state: 'draft' | 'posted' | 'cancel'
  payment_state: 'not_paid' | 'in_payment' | 'paid' | 'partial' | 'reversed' | 'invoicing_legacy'
  invoice_date: string
  due_date?: string
}

export interface Transaction {
  id: number
  reference: string
  tenant_id: number
  tenant_name: string
  amount: number
  state: 'draft' | 'pending' | 'authorized' | 'done' | 'cancel' | 'error'
  provider: string
  date: string
  error_message?: string
}

export interface ProvisioningJob {
  id: number
  tenant_id: number
  tenant_name: string
  job_type: 'tenant_creation' | 'module_activation' | 'data_migration'
  state: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  started_at?: string
  completed_at?: string
  duration_seconds?: number
  error_message?: string
  steps_completed: string[]
}

export interface SystemHealth {
  backend_status: 'up' | 'down'
  backend_response_time_ms: number
  postgres_status: 'up' | 'down'
  postgres_connections: number
  redis_status: 'up' | 'down'
  redis_memory_mb: number
  stripe_status: 'up' | 'down'
  last_webhook_received: string
}

export interface ErrorLog {
  id: number
  timestamp: string
  tenant_id?: number
  tenant_name?: string
  level: 'error' | 'warning'
  message: string
  stacktrace?: string
  context?: Record<string, unknown>
}

export interface ChurnAnalysis {
  month: string
  churn_rate: number
  churned_count: number
  active_start_count: number
}

export interface MRRBreakdown {
  starter: number
  pro: number
  enterprise: number
  total: number
}
