/**
 * Tests pour les validateurs Zod
 */

import { describe, it, expect } from 'vitest'
import {
  TenantSchema,
  SubscriptionSchema,
  InvoiceSchema,
  TransactionSchema,
  ProvisioningJobSchema,
  SystemHealthSchema,
  DashboardMetricsSchema,
  MRRBreakdownSchema,
  ChurnAnalysisSchema,
  InvoicesSummarySchema,
  TenantsResponseSchema,
  validateApiResponse,
  safeValidateApiResponse,
} from './validators'

describe('TenantSchema', () => {
  it('devrait valider un tenant valide', () => {
    const validTenant = {
      id: 1,
      name: 'Test Tenant',
      domain: 'test.quelyos.com',
      subscription_id: 1,
      subscription_state: 'active',
      plan_code: 'pro',
      plan_name: 'Professional',
      users_count: 5,
      products_count: 100,
      orders_count: 50,
      max_users: 10,
      max_products: 1000,
      max_orders_per_year: 500,
      mrr: 99.99,
      features: {
        wishlist_enabled: true,
        reviews_enabled: true,
        newsletter_enabled: false,
        product_comparison_enabled: true,
        guest_checkout_enabled: false,
      },
      created_at: '2026-01-01T00:00:00Z',
    }

    const result = TenantSchema.safeParse(validTenant)
    expect(result.success).toBe(true)
  })

  it('devrait rejeter un tenant avec plan_code invalide', () => {
    const invalidTenant = {
      id: 1,
      name: 'Test',
      domain: 'test.com',
      subscription_id: 1,
      subscription_state: 'active',
      plan_code: 'invalid_plan', // ❌ Invalide
      plan_name: 'Test',
      users_count: 0,
      products_count: 0,
      orders_count: 0,
      max_users: 10,
      max_products: 100,
      max_orders_per_year: 1000,
      mrr: 0,
      features: {
        wishlist_enabled: false,
        reviews_enabled: false,
        newsletter_enabled: false,
        product_comparison_enabled: false,
        guest_checkout_enabled: false,
      },
      created_at: '2026-01-01T00:00:00Z',
    }

    const result = TenantSchema.safeParse(invalidTenant)
    expect(result.success).toBe(false)
  })

  it('devrait rejeter un MRR négatif', () => {
    const tenant = {
      id: 1,
      name: 'Test',
      domain: 'test.com',
      subscription_id: 1,
      subscription_state: 'active',
      plan_code: 'starter',
      plan_name: 'Starter',
      users_count: 0,
      products_count: 0,
      orders_count: 0,
      max_users: 10,
      max_products: 100,
      max_orders_per_year: 1000,
      mrr: -50, // ❌ Négatif
      features: {
        wishlist_enabled: false,
        reviews_enabled: false,
        newsletter_enabled: false,
        product_comparison_enabled: false,
        guest_checkout_enabled: false,
      },
      created_at: '2026-01-01T00:00:00Z',
    }

    const result = TenantSchema.safeParse(tenant)
    expect(result.success).toBe(false)
  })
})

describe('SubscriptionSchema', () => {
  it('devrait valider une subscription valide', () => {
    const validSubscription = {
      id: 1,
      tenant_id: 1,
      tenant_name: 'Test Tenant',
      tenant_domain: 'test.quelyos.com',
      plan_id: 1,
      plan_code: 'pro',
      plan_name: 'Professional',
      state: 'active',
      billing_cycle: 'monthly',
      mrr: 99.99,
      price: 99.99,
      start_date: '2026-01-01T00:00:00Z',
      users_usage: 5,
      max_users: 10,
      products_usage: 50,
      max_products: 1000,
      orders_usage: 25,
      max_orders_per_year: 500,
    }

    const result = SubscriptionSchema.safeParse(validSubscription)
    expect(result.success).toBe(true)
  })

  it('devrait rejeter un état de subscription invalide', () => {
    const invalidSubscription = {
      id: 1,
      tenant_id: 1,
      tenant_name: 'Test',
      tenant_domain: 'test.com',
      plan_id: 1,
      plan_code: 'pro',
      plan_name: 'Pro',
      state: 'invalid_state', // ❌ Invalide
      billing_cycle: 'monthly',
      mrr: 99.99,
      price: 99.99,
      start_date: '2026-01-01T00:00:00Z',
      users_usage: 0,
      max_users: 10,
      products_usage: 0,
      max_products: 100,
      orders_usage: 0,
      max_orders_per_year: 1000,
    }

    const result = SubscriptionSchema.safeParse(invalidSubscription)
    expect(result.success).toBe(false)
  })
})

describe('DashboardMetricsSchema', () => {
  it('devrait valider des métriques dashboard complètes', () => {
    const validMetrics = {
      mrr: 1000,
      arr: 12000,
      active_subscriptions: 10,
      churn_rate: 2.5,
      mrr_history: [
        { month: '2026-01', mrr: 1000 },
        { month: '2025-12', mrr: 900 },
      ],
      revenue_by_plan: [
        { plan: 'starter', revenue: 300 },
        { plan: 'pro', revenue: 500 },
        { plan: 'enterprise', revenue: 200 },
      ],
      top_customers: [],
      at_risk_customers: [],
      recent_subscriptions: [],
    }

    const result = DashboardMetricsSchema.safeParse(validMetrics)
    expect(result.success).toBe(true)
  })

  it('devrait rejeter un churn_rate > 100', () => {
    const invalidMetrics = {
      mrr: 1000,
      arr: 12000,
      active_subscriptions: 10,
      churn_rate: 150, // ❌ > 100
      mrr_history: [],
      revenue_by_plan: [],
      top_customers: [],
      at_risk_customers: [],
      recent_subscriptions: [],
    }

    const result = DashboardMetricsSchema.safeParse(invalidMetrics)
    expect(result.success).toBe(false)
  })
})

describe('validateApiResponse', () => {
  it('devrait retourner les données validées', () => {
    const schema = MRRBreakdownSchema
    const data = {
      starter: 100,
      pro: 200,
      enterprise: 300,
      total: 600,
    }

    const result = validateApiResponse(schema, data)
    expect(result).toEqual(data)
  })

  it('devrait lancer une erreur pour des données invalides', () => {
    const schema = MRRBreakdownSchema
    const invalidData = {
      starter: -100, // ❌ Négatif
      pro: 200,
      enterprise: 300,
      total: 400,
    }

    expect(() => validateApiResponse(schema, invalidData)).toThrow('Invalid API response')
  })

  it('devrait inclure les détails de validation dans l\'erreur', () => {
    const schema = MRRBreakdownSchema
    const invalidData = {
      starter: 'not_a_number', // ❌ Type invalide
      pro: 200,
      enterprise: 300,
      total: 500,
    }

    try {
      validateApiResponse(schema, invalidData)
      expect.fail('Should have thrown an error')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toContain('Invalid API response')
    }
  })
})

describe('safeValidateApiResponse', () => {
  it('devrait retourner les données si validation réussie', () => {
    const schema = MRRBreakdownSchema
    const validData = {
      starter: 100,
      pro: 200,
      enterprise: 300,
      total: 600,
    }

    const result = safeValidateApiResponse(schema, validData)
    expect(result).toEqual(validData)
  })

  it('devrait retourner null si validation échoue', () => {
    const schema = MRRBreakdownSchema
    const invalidData = {
      starter: -100, // ❌ Négatif
      pro: 200,
      enterprise: 300,
      total: 400,
    }

    const result = safeValidateApiResponse(schema, invalidData)
    expect(result).toBeNull()
  })
})

describe('SystemHealthSchema', () => {
  it('devrait valider un health check complet', () => {
    const validHealth = {
      backend_status: 'up',
      backend_response_time_ms: 50,
      postgres_status: 'up',
      postgres_connections: 10,
      redis_status: 'up',
      redis_memory_mb: 128,
      stripe_status: 'up',
      last_webhook_received: '2026-01-29T12:00:00Z',
    }

    const result = SystemHealthSchema.safeParse(validHealth)
    expect(result.success).toBe(true)
  })

  it('devrait accepter last_webhook_received null', () => {
    const healthWithNullWebhook = {
      backend_status: 'up',
      backend_response_time_ms: 50,
      postgres_status: 'up',
      postgres_connections: 10,
      redis_status: 'down',
      redis_memory_mb: 0,
      stripe_status: 'up',
      last_webhook_received: null,
    }

    const result = SystemHealthSchema.safeParse(healthWithNullWebhook)
    expect(result.success).toBe(true)
  })
})
