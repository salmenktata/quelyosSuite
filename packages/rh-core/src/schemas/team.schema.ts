import { z } from 'zod';

/**
 * Team (Équipe) Validation Schemas
 */

/**
 * Schéma de création d'une équipe
 */
export const createTeamSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255),
  description: z.string().max(500).optional(),
  storeId: z.number().int().positive().optional(),
});

/**
 * Schéma de mise à jour d'une équipe
 */
export const updateTeamSchema = createTeamSchema.partial();

/**
 * Schéma pour assigner un manager
 */
export const assignManagerSchema = z.object({
  employeeId: z.number().int().positive('ID employé invalide'),
});

