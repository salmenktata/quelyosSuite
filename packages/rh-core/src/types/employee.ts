import { EmployeeStatus } from './enums';

/**
 * Employee (Employé) Types
 */

/**
 * Employé
 */
export interface Employee {
  id: number;
  companyId: number;
  userId?: number;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  storeId?: number;
  teamId?: number;
  position?: string;
  hireDate: Date;
  status: EmployeeStatus;
  leaveBalance: number; // Solde de congés restants (en jours)
  leaveTaken: number; // Congés pris (en jours)
  qrCode: string; // QR code unique de l'employé
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Données pour créer un employé
 */
export interface CreateEmployeeInput {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  storeId?: number;
  teamId?: number;
  position?: string;
  hireDate: Date | string;
  status?: EmployeeStatus;
  leaveBalance?: number;
  userId?: number;
}

/**
 * Données pour mettre à jour un employé
 */
export interface UpdateEmployeeInput extends Partial<CreateEmployeeInput> {}

/**
 * Employé avec relations
 */
export interface EmployeeWithRelations extends Employee {
  store?: {
    id: number;
    name: string;
  };
  team?: {
    id: number;
    name: string;
    managers?: Array<{
      id: number;
      firstName: string;
      lastName: string;
    }>;
  };
  user?: {
    id: number;
    email: string;
    role: string;
  };
  activeContract?: {
    id: number;
    type: string;
    salary: number;
    position: string;
    startDate: Date;
    endDate?: Date;
  };
}

/**
 * Profil employé pour mobile app
 */
export interface EmployeeProfile extends EmployeeWithRelations {
  stats?: {
    totalPointages: number;
    pointagesThisMonth: number;
    anomaliesCount: number;
    demandesCount: number;
    demandesPending: number;
    shiftsThisMonth: number;
  };
}

/**
 * Nom complet de l'employé
 */
export function getEmployeeFullName(employee: Pick<Employee, 'firstName' | 'lastName'>): string {
  return `${employee.firstName} ${employee.lastName}`;
}
