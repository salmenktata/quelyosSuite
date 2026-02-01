/**
 * @quelyos/types - Shared TypeScript type definitions
 *
 * SINGLE SOURCE OF TRUTH for types across:
 * - dashboard-client (ERP Complet / Full Suite)
 * - 7 SaaS (finance-os, store-os, copilote-ops, sales-os, retail-os, team-os, support-os)
 *
 * @package @quelyos/types
 */

// Common types (CORE - API, User, Product, Category, Order, Cart, etc.)
export type * from './common'

// Support module (COMPLET)
export type * from './support'

// Autres modules (placeholders - à migrer progressivement)
export type * from './finance'
export type * from './marketing'
export type * from './crm'
export type * from './stock'
export type * from './hr'
export type * from './pos'
