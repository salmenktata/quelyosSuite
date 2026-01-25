import { z } from 'zod';
import { EmployeeStatus } from '../types/enums';

/**
 * Employee (Employé) Validation Schemas
 */

/**
 * Schéma de création d'un employé
 */
export const createEmployeeSchema = z.object({
  employeeNumber: z
    .string()
    .min(1, 'Le numéro employé est requis')
    .max(50)
    .regex(/^[A-Z0-9-]+$/, 'Format invalide (A-Z, 0-9, - uniquement)'),
  firstName: z.string().min(1, 'Le prénom est requis').max(255),
  lastName: z.string().min(1, 'Le nom est requis').max(255),
  email: z.string().email('Email invalide').optional().nullable(),
  phone: z
    .string()
    .max(50)
    .regex(/^[\d\s+()-]*$/, 'Format de téléphone invalide')
    .optional()
    .nullable(),
  storeId: z.number().int().positive().optional().nullable(),
  teamId: z.number().int().positive().optional().nullable(),
  position: z.string().max(255).optional().nullable(),
  hireDate: z.coerce.date(),
  status: z.nativeEnum(EmployeeStatus).optional(),
  leaveBalance: z.number().min(0, 'Le solde ne peut pas être négatif').optional(),
  userId: z.number().int().positive().optional().nullable(),
});

/**
 * Schéma de mise à jour d'un employé
 */
export const updateEmployeeSchema = createEmployeeSchema.partial();
