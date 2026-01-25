import { ContractType } from './enums';

/**
 * Contract (Contrat) Types
 */

/**
 * Contrat de travail
 */
export interface Contract {
  id: number;
  companyId: number;
  employeeId: number;
  type: ContractType;
  startDate: Date;
  endDate?: Date; // Null pour CDI
  salary: number;
  position: string;
  documentUrl?: string; // URL S3 du contrat signé
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Données pour créer un contrat
 */
export interface CreateContractInput {
  employeeId: number;
  type: ContractType;
  startDate: Date | string;
  endDate?: Date | string;
  salary: number;
  position: string;
  documentUrl?: string;
  isActive?: boolean;
}

/**
 * Données pour mettre à jour un contrat
 */
export interface UpdateContractInput extends Partial<CreateContractInput> {}

/**
 * Contrat avec relations
 */
export interface ContractWithRelations extends Contract {
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeNumber: string;
  };
}

/**
 * Vérifier si un contrat est expiré
 */
export function isContractExpired(contract: Contract): boolean {
  if (!contract.endDate) return false; // CDI n'expire pas
  return new Date(contract.endDate) < new Date();
}

/**
 * Vérifier si un contrat arrive à expiration bientôt
 */
export function isContractExpiringSoon(contract: Contract, daysThreshold = 30): boolean {
  if (!contract.endDate) return false;
  const expiryDate = new Date(contract.endDate);
  const today = new Date();
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilExpiry > 0 && daysUntilExpiry <= daysThreshold;
}

/**
 * Durée du contrat en jours
 */
export function getContractDuration(contract: Contract): number | null {
  if (!contract.endDate) return null; // CDI = durée illimitée
  const start = new Date(contract.startDate);
  const end = new Date(contract.endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}
