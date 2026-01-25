/**
 * RH Module Enums
 * Définitions des types énumérés utilisés dans le module RH
 */

/**
 * Statut d'un employé
 */
export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
}

/**
 * Type de contrat de travail
 */
export enum ContractType {
  CDI = 'CDI', // Contrat à durée indéterminée
  CDD = 'CDD', // Contrat à durée déterminée
  STAGE = 'STAGE', // Stage
  INTERIM = 'INTERIM', // Intérim
}

/**
 * Type de demande RH
 */
export enum DemandeType {
  CONGES = 'CONGES', // Demande de congés
  ABSENCE = 'ABSENCE', // Justification d'absence
  AVANCE = 'AVANCE', // Avance sur salaire
}

/**
 * Statut d'une demande
 */
export enum DemandeStatus {
  PENDING = 'PENDING', // En attente
  APPROVED_TEAM = 'APPROVED_TEAM', // Approuvée par le manager
  APPROVED_RH = 'APPROVED_RH', // Approuvée par RH (finale)
  REJECTED = 'REJECTED', // Rejetée
  PAID = 'PAID', // Payée (pour les avances)
}

/**
 * Type de pointage
 */
export enum PointageType {
  ENTREE = 'ENTREE', // Check-in
  SORTIE = 'SORTIE', // Check-out
}

/**
 * Statut d'un pointage
 */
export enum PointageStatus {
  VALID = 'VALID', // Pointage valide
  ANOMALY = 'ANOMALY', // Anomalie détectée
  VALIDATED = 'VALIDATED', // Validé manuellement par un manager
}

/**
 * Statut d'un shift
 */
export enum ShiftStatus {
  SCHEDULED = 'SCHEDULED', // Planifié
  CONFIRMED = 'CONFIRMED', // Confirmé par l'employé
  COMPLETED = 'COMPLETED', // Terminé
  CANCELLED = 'CANCELLED', // Annulé
  EXCHANGE_REQUESTED = 'EXCHANGE_REQUESTED', // Demande d'échange
}

/**
 * Type de document RH
 */
export enum DocumentType {
  CONTRACT = 'CONTRACT', // Contrat de travail
  PAYSTUB = 'PAYSTUB', // Fiche de paie
  JUSTIFICATION = 'JUSTIFICATION', // Justificatif (médical, etc.)
  ID_CARD = 'ID_CARD', // Pièce d'identité
  OTHER = 'OTHER', // Autre
}

/**
 * Niveau de visibilité d'un document
 */
export enum DocumentVisibility {
  EMPLOYEE = 'EMPLOYEE', // Visible par l'employé
  RH_ONLY = 'RH_ONLY', // Visible uniquement par RH
  ADMIN_ONLY = 'ADMIN_ONLY', // Visible uniquement par les admins
}

/**
 * Rôles RH dans le système
 */
export enum RHRole {
  RH_ADMIN = 'RH_ADMIN', // Responsable RH
  RH_MANAGER = 'RH_MANAGER', // Responsable d'équipe
  RH_AGENT = 'RH_AGENT', // Employé
}
