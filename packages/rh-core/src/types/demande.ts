import { DemandeType, DemandeStatus } from './enums';

/**
 * Demande (Request) Types
 */

/**
 * Demande (congés, absence, avance)
 */
export interface Demande {
  id: number;
  companyId: number;
  employeeId: number;
  type: DemandeType;
  status: DemandeStatus;
  startDate: Date;
  endDate?: Date;
  amount?: number; // Pour les avances
  reason?: string;
  justificationUrl?: string; // URL S3 du justificatif
  approvedByTeamId?: number;
  approvedByTeamAt?: Date;
  approvedByRHId?: number;
  approvedByRHAt?: Date;
  rejectedById?: number;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Données pour créer une demande
 */
export interface CreateDemandeInput {
  type: DemandeType;
  startDate: Date | string;
  endDate?: Date | string;
  amount?: number;
  reason?: string;
  justificationUrl?: string;
}

/**
 * Données pour mettre à jour une demande
 */
export interface UpdateDemandeInput extends Partial<CreateDemandeInput> {
  status?: DemandeStatus;
}

/**
 * Demande avec relations
 */
export interface DemandeWithRelations extends Demande {
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    team?: {
      id: number;
      name: string;
    };
    store?: {
      id: number;
      name: string;
    };
  };
  approvedByTeamUser?: {
    id: number;
    email: string;
  };
  approvedByRHUser?: {
    id: number;
    email: string;
  };
  rejectedByUser?: {
    id: number;
    email: string;
  };
}

/**
 * Niveau d'approbation
 */
export enum ApprovalLevel {
  TEAM = 'TEAM', // Niveau équipe (manager)
  RH = 'RH', // Niveau RH (final)
}

/**
 * Action d'approbation
 */
export interface ApprovalAction {
  level: ApprovalLevel;
  userId: number;
  comment?: string;
}

/**
 * Action de rejet
 */
export interface RejectionAction {
  userId: number;
  reason: string;
}

/**
 * Statistiques de demandes
 */
export interface DemandeStats {
  total: number;
  pending: number;
  approvedTeam: number;
  approvedRH: number;
  rejected: number;
  byType: {
    conges: number;
    absences: number;
    avances: number;
  };
}

/**
 * Calcul du nombre de jours de congés
 */
export function calculateLeaveDays(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // +1 pour inclure le premier jour
}

/**
 * Vérifier si une demande peut être approuvée
 */
export function canApprove(demande: Demande, level: ApprovalLevel): boolean {
  if (level === ApprovalLevel.TEAM) {
    return demande.status === DemandeStatus.PENDING;
  } else if (level === ApprovalLevel.RH) {
    return (
      demande.status === DemandeStatus.PENDING ||
      demande.status === DemandeStatus.APPROVED_TEAM
    );
  }
  return false;
}
