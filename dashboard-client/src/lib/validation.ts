import { z } from 'zod'

/**
 * Schémas de validation pour la configuration du site
 */

export const contactSchema = z.object({
  whatsapp_number: z.string()
    .regex(/^\+\d{8,15}$/, 'Format invalide (ex: +21600000000)')
    .min(9, 'Numéro trop court'),
  contact_email: z.string()
    .email('Email invalide'),
  contact_phone: z.string()
    .regex(/^\+\d{8,15}$/, 'Format invalide (ex: +21600000000)')
    .min(9, 'Numéro trop court'),
})

export const shippingSchema = z.object({
  shipping_standard_days: z.string()
    .regex(/^\d+-\d+$/, 'Format invalide (ex: 2-5)'),
  shipping_express_days: z.string()
    .regex(/^\d+-\d+$/, 'Format invalide (ex: 1-2)'),
  free_shipping_threshold: z.number()
    .min(0, 'Le montant doit être positif')
    .max(10000, 'Montant trop élevé'),
})

export const returnsSchema = z.object({
  return_delay_days: z.number()
    .int('Doit être un nombre entier')
    .min(1, 'Au minimum 1 jour')
    .max(365, 'Maximum 365 jours'),
  refund_delay_days: z.string()
    .regex(/^\d+-\d+$/, 'Format invalide (ex: 7-10)'),
})

export const warrantySchema = z.object({
  warranty_years: z.number()
    .int('Doit être un nombre entier')
    .min(0, 'Minimum 0 an')
    .max(10, 'Maximum 10 ans'),
})

export const paymentMethodsSchema = z.array(z.string())
  .min(1, 'Sélectionnez au moins un mode de paiement')

/**
 * Schéma complet pour la configuration du site
 */
export const siteConfigSchema = z.object({
  // Contact
  whatsapp_number: contactSchema.shape.whatsapp_number.optional(),
  contact_email: contactSchema.shape.contact_email.optional(),
  contact_phone: contactSchema.shape.contact_phone.optional(),
  // Livraison
  shipping_standard_days: shippingSchema.shape.shipping_standard_days.optional(),
  shipping_express_days: shippingSchema.shape.shipping_express_days.optional(),
  free_shipping_threshold: shippingSchema.shape.free_shipping_threshold.optional(),
  // Retours
  return_delay_days: returnsSchema.shape.return_delay_days.optional(),
  refund_delay_days: returnsSchema.shape.refund_delay_days.optional(),
  // Garantie
  warranty_years: warrantySchema.shape.warranty_years.optional(),
  // Paiement
  payment_methods: paymentMethodsSchema.optional(),
})

export type ContactConfig = z.infer<typeof contactSchema>
export type ShippingConfig = z.infer<typeof shippingSchema>
export type ReturnsConfig = z.infer<typeof returnsSchema>
export type WarrantyConfig = z.infer<typeof warrantySchema>
