import { z } from 'zod';
import { PointageType } from '../types/enums';

/**
 * Pointage (Attendance) Validation Schemas
 */

/**
 * Schéma de création d'un pointage
 */
export const createPointageSchema = z.object({
  type: z.nativeEnum(PointageType),
  timestamp: z.coerce.date().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accuracy: z.number().positive().optional(),
  qrCodeScanned: z.string().optional(),
  deviceId: z.string().max(255).optional(),
  deviceModel: z.string().max(255).optional(),
  appVersion: z.string().max(50).optional(),
  clientTimestamp: z.coerce.date().optional(),
});

/**
 * Schéma pour sync batch (offline)
 */
export const batchSyncSchema = z.object({
  pointages: z.array(createPointageSchema).min(1, 'Au moins un pointage requis'),
});

/**
 * Schéma pour validation manuelle
 */
export const validatePointageSchema = z.object({
  status: z.enum(['VALID', 'ANOMALY', 'VALIDATED']),
  justification: z.string().max(500).optional(),
});

/**
 * Schéma pour filtres de recherche
 */
export const pointageFiltersSchema = z.object({
  employeeId: z.number().int().positive().optional(),
  storeId: z.number().int().positive().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(['VALID', 'ANOMALY', 'VALIDATED']).optional(),
  isAnomaly: z.boolean().optional(),
  limit: z.number().int().positive().max(200).default(50),
});

