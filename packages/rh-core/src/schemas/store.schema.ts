import { z } from 'zod';

/**
 * Store (Magasin) Validation Schemas
 */

/**
 * Schéma de création d'un magasin
 */
export const createStoreSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255),
  code: z.string().min(1).max(50).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(255).optional(),
  phone: z.string().max(50).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().positive('Le rayon doit être positif').optional(),
  qrCode: z.string().optional(),
});

/**
 * Schéma de mise à jour d'un magasin
 */
export const updateStoreSchema = createStoreSchema.partial();
