import { z } from 'zod';
import { DemandeType, DemandeStatus } from '../types/enums';

/**
 * Demande (Request) Validation Schemas
 */

/**
 * Schéma de création d'une demande
 */
export const createDemandeSchema = z
  .object({
    type: z.nativeEnum(DemandeType),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    amount: z.number().positive('Le montant doit être positif').optional(),
    reason: z.string().max(500, 'Maximum 500 caractères').optional(),
    justificationUrl: z.string().url('URL invalide').optional(),
  })
  .refine(
    (data) => {
      // Si type CONGES, endDate est requis
      if (data.type === DemandeType.CONGES && !data.endDate) {
        return false;
      }
      return true;
    },
    {
      message: 'La date de fin est requise pour les congés',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      // Si type AVANCE, amount est requis
      if (data.type === DemandeType.AVANCE && !data.amount) {
        return false;
      }
      return true;
    },
    {
      message: 'Le montant est requis pour les avances',
      path: ['amount'],
    }
  )
  .refine(
    (data) => {
      // Vérifier que endDate >= startDate
      if (data.endDate && data.endDate < data.startDate) {
        return false;
      }
      return true;
    },
    {
      message: 'La date de fin doit être après la date de début',
      path: ['endDate'],
    }
  );

/**
 * Schéma de mise à jour d'une demande
 */
export const updateDemandeSchema = createDemandeSchema.partial().extend({
  status: z.nativeEnum(DemandeStatus).optional(),
});

/**
 * Schéma pour approbation
 */
export const approveDemandeSchema = z.object({
  level: z.enum(['TEAM', 'RH']),
  comment: z.string().max(500).optional(),
});

/**
 * Schéma pour rejet
 */
export const rejectDemandeSchema = z.object({
  reason: z
    .string()
    .min(1, 'La raison du rejet est requise')
    .max(500, 'Maximum 500 caractères'),
});

/**
 * Schéma pour filtres de recherche
 */
export const demandeFiltersSchema = z.object({
  type: z.nativeEnum(DemandeType).optional(),
  status: z.nativeEnum(DemandeStatus).optional(),
  employeeId: z.number().int().positive().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

