/**
 * Constantes du module RH
 */

/**
 * Limites et seuils
 */
export const LIMITS = {
  // Pointage
  MAX_POINTAGE_DUPLICATE_MINUTES: 5, // Temps minimum entre 2 pointages (détection duplicates)
  POINTAGE_HISTORY_DEFAULT_DAYS: 30, // Nombre de jours par défaut pour l'historique
  GEOFENCING_DEFAULT_RADIUS_METERS: 100, // Rayon de geofencing par défaut

  // Congés
  DEFAULT_ANNUAL_LEAVE_DAYS: 30, // Congés annuels par défaut (Tunisie)
  MAX_CONSECUTIVE_LEAVE_DAYS: 30, // Maximum de jours consécutifs

  // Avances
  MAX_SALARY_ADVANCE_PERCENTAGE: 50, // Maximum 50% du salaire
  MAX_PENDING_ADVANCES: 3, // Maximum d'avances en attente

  // Documents
  MAX_DOCUMENT_SIZE_MB: 10, // Taille maximale d'un document
  SIGNED_URL_EXPIRY_HOURS: 1, // Durée de validité des URLs signées

  // Planning
  MAX_SHIFT_HOURS_PER_DAY: 12, // Maximum d'heures par jour
  MAX_SHIFT_HOURS_PER_WEEK: 48, // Maximum d'heures par semaine (Tunisie)
  MIN_REST_HOURS_BETWEEN_SHIFTS: 11, // Repos minimum entre deux shifts
} as const;

/**
 * Messages d'erreur standards
 */
export const ERROR_MESSAGES = {
  // Authentification
  UNAUTHORIZED: 'Authentification requise',
  FORBIDDEN: 'Permissions insuffisantes',

  // Employé
  EMPLOYEE_NOT_FOUND: 'Employé introuvable',
  EMPLOYEE_NUMBER_EXISTS: 'Ce numéro employé existe déjà',
  EMPLOYEE_INACTIVE: 'Employé inactif',

  // Magasin
  STORE_NOT_FOUND: 'Magasin introuvable',
  STORE_HAS_EMPLOYEES: 'Impossible de supprimer un magasin avec des employés',

  // Équipe
  TEAM_NOT_FOUND: 'Équipe introuvable',
  TEAM_HAS_EMPLOYEES: 'Impossible de supprimer une équipe avec des employés',

  // Pointage
  POINTAGE_DUPLICATE: 'Pointage en double détecté',
  POINTAGE_GPS_OUT_OF_RANGE: 'Position GPS hors zone autorisée',
  POINTAGE_INVALID_QR: 'QR code invalide',
  POINTAGE_NO_SHIFT: 'Aucun shift planifié pour cette période',

  // Demande
  DEMANDE_NOT_FOUND: 'Demande introuvable',
  DEMANDE_INSUFFICIENT_BALANCE: 'Solde de congés insuffisant',
  DEMANDE_ALREADY_PROCESSED: 'Demande déjà traitée',
  DEMANDE_DATE_CONFLICT: 'Conflit avec une autre demande',

  // Shift
  SHIFT_NOT_FOUND: 'Shift introuvable',
  SHIFT_OVERLAP: 'Chevauchement avec un autre shift',
  SHIFT_TOO_MANY_HOURS: 'Dépassement du nombre d\'heures autorisées',

  // Contrat
  CONTRACT_NOT_FOUND: 'Contrat introuvable',
  CONTRACT_EXPIRED: 'Contrat expiré',

  // Document
  DOCUMENT_NOT_FOUND: 'Document introuvable',
  DOCUMENT_TOO_LARGE: 'Fichier trop volumineux',
  DOCUMENT_INVALID_TYPE: 'Type de fichier non supporté',
  DOCUMENT_VIRUS_DETECTED: 'Virus détecté dans le fichier',

  // Général
  VALIDATION_ERROR: 'Erreur de validation',
  SERVER_ERROR: 'Erreur serveur',
  NOT_FOUND: 'Ressource introuvable',
} as const;

/**
 * Messages de succès
 */
export const SUCCESS_MESSAGES = {
  CREATED: 'Créé avec succès',
  UPDATED: 'Mis à jour avec succès',
  DELETED: 'Supprimé avec succès',
  APPROVED: 'Approuvé avec succès',
  REJECTED: 'Rejeté avec succès',
  UPLOADED: 'Téléchargé avec succès',
} as const;

/**
 * Codes de statut HTTP
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Jours fériés Tunisie 2026 (à mettre à jour annuellement)
 */
export const TUNISIAN_HOLIDAYS_2026 = [
  new Date('2026-01-01'), // Nouvel an
  new Date('2026-01-14'), // Révolution
  new Date('2026-03-20'), // Indépendance
  new Date('2026-04-09'), // Journée des Martyrs
  new Date('2026-05-01'), // Fête du Travail
  new Date('2026-07-25'), // République
  new Date('2026-08-13'), // Journée de la Femme
  // Ajouter les dates du Ramadan et Aid selon calendrier lunaire
] as const;

/**
 * Configuration de pagination par défaut
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
