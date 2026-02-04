/**
 * Schémas de validation Zod pour Quelyos Dashboard
 *
 * Validation centralisée des données avec:
 * - Schémas réutilisables
 * - Messages d'erreur en français
 * - Inférence TypeScript automatique
 */

import { z } from 'zod'

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Messages d'erreur personnalisés
 */
export const errorMessages = {
  required: 'Ce champ est requis',
  email: 'Adresse email invalide',
  url: 'URL invalide',
  phone: 'Numéro de téléphone invalide',
  min: (min: number) => `Minimum ${min} caractères`,
  max: (max: number) => `Maximum ${max} caractères`,
  minNumber: (min: number) => `La valeur doit être au moins ${min}`,
  maxNumber: (max: number) => `La valeur ne doit pas dépasser ${max}`,
  positive: 'La valeur doit être positive',
  integer: 'La valeur doit être un nombre entier',
  date: 'Date invalide',
  password:
    'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre',
}

/**
 * Regex patterns
 */
export const patterns = {
  phone: /^(\+33|0)[1-9](\d{2}){4}$/,
  siret: /^\d{14}$/,
  siren: /^\d{9}$/,
  vatNumber: /^FR\d{11}$/,
  postalCode: /^\d{5}$/,
  sku: /^[A-Z0-9-]+$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
}

// =============================================================================
// BASE SCHEMAS
// =============================================================================

export const emailSchema = z.string().email(errorMessages.email)

export const phoneSchema = z
  .string()
  .regex(patterns.phone, errorMessages.phone)
  .optional()
  .or(z.literal(''))

export const urlSchema = z.string().url(errorMessages.url).optional().or(z.literal(''))

export const passwordSchema = z
  .string()
  .min(8, errorMessages.min(8))
  .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Doit contenir au moins un chiffre')

export const postalCodeSchema = z.string().regex(patterns.postalCode, 'Code postal invalide')

export const skuSchema = z.string().regex(patterns.sku, 'Référence invalide (lettres majuscules, chiffres et tirets)')

// =============================================================================
// ADDRESS SCHEMA
// =============================================================================

export const addressSchema = z.object({
  street: z.string().min(1, errorMessages.required),
  street2: z.string().optional(),
  city: z.string().min(1, errorMessages.required),
  zip: postalCodeSchema,
  country: z.string().min(1, errorMessages.required),
  state: z.string().optional(),
})

export type Address = z.infer<typeof addressSchema>

// =============================================================================
// USER SCHEMAS
// =============================================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, errorMessages.required),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    firstName: z.string().min(2, errorMessages.min(2)),
    lastName: z.string().min(2, errorMessages.min(2)),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'Vous devez accepter les conditions générales',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export type RegisterInput = z.infer<typeof registerSchema>

export const userProfileSchema = z.object({
  firstName: z.string().min(2, errorMessages.min(2)),
  lastName: z.string().min(2, errorMessages.min(2)),
  email: emailSchema,
  phone: phoneSchema,
  avatar: urlSchema,
})

export type UserProfileInput = z.infer<typeof userProfileSchema>

// =============================================================================
// PRODUCT SCHEMAS
// =============================================================================

export const productSchema = z.object({
  name: z.string().min(1, errorMessages.required).max(255, errorMessages.max(255)),
  sku: skuSchema.optional(),
  description: z.string().optional(),
  price: z.number().min(0, errorMessages.positive),
  compareAtPrice: z.number().min(0, errorMessages.positive).optional(),
  cost: z.number().min(0, errorMessages.positive).optional(),
  categoryId: z.number().int().positive().optional(),
  weight: z.number().min(0, errorMessages.positive).optional(),
  trackInventory: z.boolean().default(true),
  stockQuantity: z.number().int(errorMessages.integer).default(0),
  lowStockThreshold: z.number().int(errorMessages.integer).min(0).default(5),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
  attributes: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
      })
    )
    .default([]),
})

export type ProductInput = z.infer<typeof productSchema>

export const productVariantSchema = z.object({
  sku: skuSchema,
  price: z.number().min(0, errorMessages.positive),
  stockQuantity: z.number().int(errorMessages.integer).default(0),
  attributes: z.record(z.string(), z.string()),
  isActive: z.boolean().default(true),
})

export type ProductVariantInput = z.infer<typeof productVariantSchema>

// =============================================================================
// CUSTOMER SCHEMAS
// =============================================================================

export const customerSchema = z.object({
  firstName: z.string().min(1, errorMessages.required),
  lastName: z.string().min(1, errorMessages.required),
  email: emailSchema,
  phone: phoneSchema,
  company: z.string().optional(),
  vatNumber: z.string().regex(patterns.vatNumber, 'Numéro TVA invalide').optional().or(z.literal('')),
  billingAddress: addressSchema.optional(),
  shippingAddress: addressSchema.optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
})

export type CustomerInput = z.infer<typeof customerSchema>

// =============================================================================
// ORDER SCHEMAS
// =============================================================================

export const orderLineSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().optional(),
  quantity: z.number().int(errorMessages.integer).min(1, 'La quantité doit être au moins 1'),
  unitPrice: z.number().min(0, errorMessages.positive),
  discount: z.number().min(0).max(100, 'La remise ne peut pas dépasser 100%').default(0),
})

export type OrderLineInput = z.infer<typeof orderLineSchema>

export const orderSchema = z.object({
  customerId: z.number().int().positive(),
  lines: z.array(orderLineSchema).min(1, 'La commande doit contenir au moins un article'),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  shippingMethodId: z.number().int().positive().optional(),
  paymentMethodId: z.number().int().positive().optional(),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
})

export type OrderInput = z.infer<typeof orderSchema>

// =============================================================================
// INVENTORY SCHEMAS
// =============================================================================

export const inventoryAdjustmentSchema = z.object({
  productId: z.number().int().positive(),
  warehouseId: z.number().int().positive(),
  quantity: z.number().int(errorMessages.integer),
  reason: z.enum(['receipt', 'shipment', 'adjustment', 'return', 'damage', 'transfer']),
  notes: z.string().optional(),
  reference: z.string().optional(),
})

export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>

export const stockTransferSchema = z.object({
  productId: z.number().int().positive(),
  sourceWarehouseId: z.number().int().positive(),
  destinationWarehouseId: z.number().int().positive(),
  quantity: z.number().int(errorMessages.integer).min(1, 'La quantité doit être au moins 1'),
  notes: z.string().optional(),
})

export type StockTransferInput = z.infer<typeof stockTransferSchema>

// =============================================================================
// FINANCE SCHEMAS
// =============================================================================

export const invoiceLineSchema = z.object({
  productId: z.number().int().positive().nullable().optional(),
  description: z.string().min(1, errorMessages.required),
  quantity: z.number().min(0.01, 'La quantité doit être supérieure à 0'),
  unitPrice: z.number().min(0, errorMessages.positive),
  taxIds: z.array(z.number().int().positive()).default([]),
  taxRate: z.number().min(0).max(100).default(20).optional(),
  discount: z.number().min(0).max(100).default(0).optional(),
})

export type InvoiceLineInput = z.infer<typeof invoiceLineSchema>

export const invoiceCreateSchema = z.object({
  customerId: z.number().int().positive('Veuillez sélectionner un client'),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, errorMessages.date),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, errorMessages.date).optional().or(z.literal('')),
  reference: z.string().max(50, errorMessages.max(50)).optional(),
  note: z.string().max(500, errorMessages.max(500)).optional(),
  lines: z.array(invoiceLineSchema).min(1, 'La facture doit contenir au moins une ligne'),
})

export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>

// Schéma pour édition (plus permissif)
export const invoiceEditSchema = invoiceCreateSchema.extend({
  id: z.number().int().positive(),
  state: z.enum(['draft', 'posted', 'cancel']).optional(),
})

export type InvoiceEditInput = z.infer<typeof invoiceEditSchema>

// Schéma legacy pour compatibilité
export const invoiceSchema = z.object({
  customerId: z.number().int().positive(),
  orderId: z.number().int().positive().optional(),
  lines: z.array(invoiceLineSchema).min(1, 'La facture doit contenir au moins une ligne'),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
})

export type InvoiceInput = z.infer<typeof invoiceSchema>

export const paymentSchema = z.object({
  invoiceId: z.number().int().positive(),
  amount: z.number().min(0.01, 'Le montant doit être supérieur à 0'),
  method: z.enum(['card', 'transfer', 'cash', 'check', 'other']),
  reference: z.string().optional(),
  date: z.string().datetime(),
  notes: z.string().optional(),
})

export type PaymentInput = z.infer<typeof paymentSchema>

// =============================================================================
// HR SCHEMAS
// =============================================================================

export const employeeSchema = z.object({
  firstName: z.string().min(1, errorMessages.required),
  lastName: z.string().min(1, errorMessages.required),
  email: emailSchema,
  phone: phoneSchema,
  jobTitle: z.string().min(1, errorMessages.required),
  departmentId: z.number().int().positive(),
  managerId: z.number().int().positive().optional(),
  hireDate: z.string().datetime(),
  address: addressSchema.optional(),
  emergencyContact: z
    .object({
      name: z.string(),
      phone: z.string(),
      relationship: z.string(),
    })
    .optional(),
})

export type EmployeeInput = z.infer<typeof employeeSchema>

export const leaveRequestSchema = z.object({
  employeeId: z.number().int().positive(),
  leaveTypeId: z.number().int().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  halfDay: z.boolean().default(false),
  reason: z.string().optional(),
})

export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>

// =============================================================================
// MARKETING SCHEMAS
// =============================================================================

export const campaignSchema = z.object({
  name: z.string().min(1, errorMessages.required),
  type: z.enum(['email', 'sms', 'push', 'social']),
  subject: z.string().min(1, errorMessages.required),
  content: z.string().min(1, errorMessages.required),
  scheduledAt: z.string().datetime().optional(),
  segmentId: z.number().int().positive().optional(),
  tags: z.array(z.string()).default([]),
})

export type CampaignInput = z.infer<typeof campaignSchema>

export const contactSegmentSchema = z.object({
  name: z.string().min(1, errorMessages.required),
  filters: z.array(
    z.object({
      field: z.string(),
      operator: z.enum(['equals', 'contains', 'greaterThan', 'lessThan', 'between', 'in']),
      value: z.unknown(),
    })
  ),
})

export type ContactSegmentInput = z.infer<typeof contactSegmentSchema>

// =============================================================================
// SETTINGS SCHEMAS
// =============================================================================

export const companySettingsSchema = z.object({
  name: z.string().min(1, errorMessages.required),
  email: emailSchema,
  phone: phoneSchema,
  website: urlSchema,
  address: addressSchema,
  vatNumber: z.string().regex(patterns.vatNumber, 'Numéro TVA invalide').optional(),
  siret: z.string().regex(patterns.siret, 'Numéro SIRET invalide').optional(),
  logo: urlSchema,
  currency: z.string().length(3, 'Le code devise doit faire 3 caractères'),
  timezone: z.string(),
  language: z.string().length(2),
})

export type CompanySettingsInput = z.infer<typeof companySettingsSchema>
