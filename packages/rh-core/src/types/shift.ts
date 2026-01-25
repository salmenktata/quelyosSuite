import { ShiftStatus } from './enums';

/**
 * Shift (Planning) Types
 */

/**
 * Shift (horaire de travail planifié)
 */
export interface Shift {
  id: number;
  companyId: number;
  employeeId: number;
  date: Date;
  startTime: string; // Format HH:MM
  endTime: string; // Format HH:MM
  storeId?: number;
  status: ShiftStatus;
  notes?: string;
  createdById?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Données pour créer un shift
 */
export interface CreateShiftInput {
  employeeId: number;
  date: Date | string;
  startTime: string;
  endTime: string;
  storeId?: number;
  notes?: string;
}

/**
 * Données pour mettre à jour un shift
 */
export interface UpdateShiftInput extends Partial<CreateShiftInput> {
  status?: ShiftStatus;
}

/**
 * Shift avec relations
 */
export interface ShiftWithRelations extends Shift {
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
  createdBy?: {
    id: number;
    email: string;
  };
}

/**
 * Échange de shift
 */
export interface ShiftExchange {
  id: number;
  companyId: number;
  shiftId: number;
  fromEmployeeId: number;
  toEmployeeId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string;
  approvedById?: number;
  approvedAt?: Date;
  rejectedById?: number;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Planning hebdomadaire
 */
export interface WeeklySchedule {
  weekStart: Date;
  weekEnd: Date;
  shifts: ShiftWithRelations[];
  totalHours: number;
}

/**
 * Conflit de planning
 */
export interface ShiftConflict {
  type: 'OVERLAP' | 'TOO_MANY_HOURS' | 'NO_REST_PERIOD';
  message: string;
  conflictingShifts: number[]; // IDs des shifts en conflit
}

/**
 * Calcul de la durée d'un shift en heures
 */
export function calculateShiftDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;

  // Si endTime < startTime, c'est un shift de nuit
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60; // Ajouter 24h
  }

  return (endMinutes - startMinutes) / 60;
}

/**
 * Vérifier si deux shifts se chevauchent
 */
export function shiftsOverlap(shift1: Shift, shift2: Shift): boolean {
  // Même employé et même date
  if (shift1.employeeId !== shift2.employeeId) return false;
  if (shift1.date.toDateString() !== shift2.date.toDateString()) return false;

  const [s1StartHour, s1StartMin] = shift1.startTime.split(':').map(Number);
  const [s1EndHour, s1EndMin] = shift1.endTime.split(':').map(Number);
  const [s2StartHour, s2StartMin] = shift2.startTime.split(':').map(Number);
  const [s2EndHour, s2EndMin] = shift2.endTime.split(':').map(Number);

  const s1Start = s1StartHour * 60 + s1StartMin;
  const s1End = s1EndHour * 60 + s1EndMin;
  const s2Start = s2StartHour * 60 + s2StartMin;
  const s2End = s2EndHour * 60 + s2EndMin;

  return s1Start < s2End && s2Start < s1End;
}

/**
 * Formater un shift pour affichage
 */
export function formatShift(shift: Shift): string {
  const date = new Date(shift.date).toLocaleDateString('fr-FR');
  return `${date} ${shift.startTime} - ${shift.endTime}`;
}
