import { PointageType, PointageStatus } from './enums';

/**
 * Pointage (Attendance) Types
 */

/**
 * Pointage (check-in/check-out)
 */
export interface Pointage {
  id: number;
  companyId: number;
  employeeId: number;
  storeId?: number;
  type: PointageType;
  status: PointageStatus;
  timestamp: Date;
  latitude?: number;
  longitude?: number;
  accuracy?: number; // Précision GPS en mètres
  qrCodeScanned?: string;
  deviceId?: string;
  deviceModel?: string;
  appVersion?: string;
  syncedAt?: Date; // Date de sync avec le serveur
  clientTimestamp?: Date; // Timestamp du device (pour offline)
  isAnomaly: boolean;
  anomalyReason?: string;
  validatedBy?: number; // UserID du manager qui a validé
  validatedAt?: Date;
  justification?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Données pour créer un pointage
 */
export interface CreatePointageInput {
  type: PointageType;
  timestamp?: Date | string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  qrCodeScanned?: string;
  deviceId?: string;
  deviceModel?: string;
  appVersion?: string;
  clientTimestamp?: Date | string;
}

/**
 * Pointage avec relations
 */
export interface PointageWithRelations extends Pointage {
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeNumber: string;
  };
  store?: {
    id: number;
    name: string;
  };
}

/**
 * Raisons d'anomalie de pointage
 */
export enum AnomalyReason {
  GPS_OUT_OF_RANGE = 'GPS_OUT_OF_RANGE', // Hors zone géographique
  DUPLICATE = 'DUPLICATE', // Pointage en double (< 5 min)
  NO_SHIFT_PLANNED = 'NO_SHIFT_PLANNED', // Pas de shift planifié
  INVALID_QR_CODE = 'INVALID_QR_CODE', // QR code invalide
  TIME_OUT_OF_RANGE = 'TIME_OUT_OF_RANGE', // Heure inhabituelle
}

/**
 * Résultat de validation d'un pointage
 */
export interface PointageValidation {
  isValid: boolean;
  anomalies: AnomalyReason[];
  warnings: string[];
  distance?: number; // Distance du magasin en mètres
}

/**
 * Statistiques de pointage
 */
export interface PointageStats {
  totalPointages: number;
  entrées: number;
  sorties: number;
  anomalies: number;
  validated: number;
  hoursWorked: number; // Heures travaillées calculées
  averageArrivalTime: string; // Format HH:MM
  averageDepartureTime: string; // Format HH:MM
}

/**
 * Pointage pour sync offline
 */
export interface OfflinePointage extends CreatePointageInput {
  localId: string; // ID local temporaire
  retryCount: number;
}

/**
 * Résultat de sync batch
 */
export interface BatchSyncResult {
  success: boolean;
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{
    success: boolean;
    pointage?: Pointage;
    error?: string;
    localId?: string;
  }>;
}
