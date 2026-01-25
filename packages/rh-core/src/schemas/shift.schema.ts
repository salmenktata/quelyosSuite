import { z } from 'zod';
import { ShiftStatus } from '../types/enums';

/**
 * Shift (Planning) Validation Schemas
 */

/**
 * Regex pour format HH:MM (24h)
 */
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Schéma de création d'un shift
 */
export const createShiftSchema = z
  .object({
    employeeId: z.number().int().positive('ID employé invalide'),
    date: z.coerce.date(),
    startTime: z
      .string()
      .regex(timeRegex, 'Format invalide (HH:MM attendu)'),
    endTime: z
      .string()
      .regex(timeRegex, 'Format invalide (HH:MM attendu)'),
    storeId: z.number().int().positive().optional(),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      // Vérifier que endTime > startTime (sauf shift de nuit)
      const [startHour, startMin] = data.startTime.split(':').map(Number);
      const [endHour, endMin] = data.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      // Shift de nuit autorisé si endTime < startTime
      // Sinon, endTime doit être > startTime
      return endMinutes !== startMinutes;
    },
    {
      message: 'L\'heure de fin doit être différente de l\'heure de début',
      path: ['endTime'],
    }
  );

/**
 * Schéma de mise à jour d'un shift
 */
export const updateShiftSchema = createShiftSchema.partial().extend({
  status: z.nativeEnum(ShiftStatus).optional(),
});

/**
 * Schéma pour créer plusieurs shifts (batch)
 */
export const createBatchShiftsSchema = z.object({
  shifts: z.array(createShiftSchema).min(1, 'Au moins un shift requis'),
});

/**
 * Schéma pour demander un échange de shift
 */
export const requestShiftExchangeSchema = z.object({
  shiftId: z.number().int().positive('ID shift invalide'),
  toEmployeeId: z.number().int().positive('ID employé invalide'),
  reason: z.string().max(500).optional(),
});

/**
 * Schéma pour approuver/rejeter un échange
 */
export const processShiftExchangeSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().max(500).optional(),
});

/**
 * Schéma pour filtres de planning
 */
export const planningFiltersSchema = z.object({
  employeeId: z.number().int().positive().optional(),
  storeId: z.number().int().positive().optional(),
  teamId: z.number().int().positive().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.nativeEnum(ShiftStatus).optional(),
});

