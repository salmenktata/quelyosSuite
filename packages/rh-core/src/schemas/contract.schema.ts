import { z } from 'zod';
import { ContractType } from '../types/enums';

/**
 * Contract (Contrat) Validation Schemas
 */

/**
 * Schéma de création d'un contrat
 */
export const createContractSchema = z
  .object({
    employeeId: z.number().int().positive('ID employé invalide'),
    type: z.nativeEnum(ContractType),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional().nullable(),
    salary: z
      .number()
      .positive('Le salaire doit être positif')
      .min(0.01, 'Le salaire doit être supérieur à 0'),
    position: z.string().min(1, 'Le poste est requis').max(255),
    documentUrl: z.string().url('URL invalide').optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // CDI ne devrait pas avoir de endDate
      if (data.type === ContractType.CDI && data.endDate) {
        return false;
      }
      return true;
    },
    {
      message: 'Un CDI ne peut pas avoir de date de fin',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      // CDD, STAGE, INTERIM doivent avoir une endDate
      if (
        [ContractType.CDD, ContractType.STAGE, ContractType.INTERIM].includes(data.type) &&
        !data.endDate
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Ce type de contrat requiert une date de fin',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      // Vérifier que endDate > startDate
      if (data.endDate && data.endDate <= data.startDate) {
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
 * Schéma de mise à jour d'un contrat
 */
export const updateContractSchema = createContractSchema.partial();
