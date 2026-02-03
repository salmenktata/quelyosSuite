/**
 * Validation Zod des variables d'environnement pour Next.js et Vite
 *
 * Fournit des schémas Zod réutilisables pour valider les configurations
 */

import { z } from 'zod';

/**
 * Schéma de validation pour les URLs
 */
export const urlSchema = z.string().url('URL invalide');

/**
 * Schéma de validation pour les URLs HTTP/HTTPS
 */
export const httpUrlSchema = z
  .string()
  .url('URL invalide')
  .refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
    message: 'L\'URL doit commencer par http:// ou https://',
  });

/**
 * Schéma de validation pour les ports
 */
export const portSchema = z
  .number()
  .int('Le port doit être un entier')
  .min(1, 'Le port doit être >= 1')
  .max(65535, 'Le port doit être <= 65535');

/**
 * Schéma de validation pour NODE_ENV
 */
export const nodeEnvSchema = z.enum(['development', 'staging', 'production', 'test']);

/**
 * Schéma de validation pour configuration Backend API (Vite)
 */
export const viteBackendConfigSchema = z.object({
  VITE_BACKEND_URL: httpUrlSchema,
  VITE_ENABLE_MOCK: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

/**
 * Type TypeScript pour config Backend Vite
 */
export type ViteBackendConfig = z.infer<typeof viteBackendConfigSchema>;

/**
 * Schéma de validation pour configuration Backend API (Next.js)
 */
export const nextBackendConfigSchema = z.object({
  NEXT_PUBLIC_BACKEND_URL: httpUrlSchema,
  BACKEND_URL: httpUrlSchema.optional(),
  NEXT_PUBLIC_ENABLE_MOCK: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

/**
 * Type TypeScript pour config Backend Next.js
 */
export type NextBackendConfig = z.infer<typeof nextBackendConfigSchema>;

/**
 * Schéma de validation pour configuration Stripe
 */
export const stripeConfigSchema = z.object({
  STRIPE_PUBLIC_KEY: z.string().startsWith('pk_', 'Clé publique Stripe invalide'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'Clé secrète Stripe invalide').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_', 'Secret webhook Stripe invalide').optional(),
});

/**
 * Type TypeScript pour config Stripe
 */
export type StripeConfig = z.infer<typeof stripeConfigSchema>;

/**
 * Schéma de validation pour configuration Google
 */
export const googleConfigSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID requis'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google Client Secret requis').optional(),
  GOOGLE_MAPS_API_KEY: z.string().min(1, 'Google Maps API Key requis').optional(),
});

/**
 * Type TypeScript pour config Google
 */
export type GoogleConfig = z.infer<typeof googleConfigSchema>;

/**
 * Valide les variables d'environnement Vite
 *
 * @param env - Variables d'environnement (import.meta.env)
 * @param schema - Schéma Zod personnalisé (optionnel)
 * @returns Variables validées
 * @throws ZodError si validation échoue
 */
export function validateViteEnv<T extends z.ZodTypeAny>(
  env: Record<string, any>,
  schema?: T
): z.infer<T> {
  const defaultSchema = viteBackendConfigSchema as z.ZodTypeAny;
  const finalSchema = schema || defaultSchema;

  return finalSchema.parse(env);
}

/**
 * Valide les variables d'environnement Next.js
 *
 * @param env - Variables d'environnement (process.env)
 * @param schema - Schéma Zod personnalisé (optionnel)
 * @returns Variables validées
 * @throws ZodError si validation échoue
 */
export function validateNextEnv<T extends z.ZodTypeAny>(
  env: Record<string, any>,
  schema?: T
): z.infer<T> {
  const defaultSchema = nextBackendConfigSchema as z.ZodTypeAny;
  const finalSchema = schema || defaultSchema;

  return finalSchema.parse(env);
}

/**
 * Valide les variables d'environnement de manière sécurisée
 *
 * Retourne un objet avec { success, data, error } au lieu de throw
 *
 * @param env - Variables d'environnement
 * @param schema - Schéma Zod
 * @returns Résultat de validation
 */
export function safeValidateEnv<T extends z.ZodTypeAny>(
  env: Record<string, any>,
  schema: T
): { success: boolean; data?: z.infer<T>; error?: z.ZodError } {
  const result = schema.safeParse(env);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, error: result.error };
}

/**
 * Formatte les erreurs Zod de manière lisible
 *
 * @param error - Erreur Zod
 * @returns Message d'erreur formaté
 */
export function formatZodError(error: z.ZodError): string {
  return error.errors
    .map((err) => {
      const path = err.path.join('.');
      return `${path}: ${err.message}`;
    })
    .join('\n');
}
