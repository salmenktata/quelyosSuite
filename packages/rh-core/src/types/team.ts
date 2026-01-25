/**
 * Team (Équipe) Types
 */

/**
 * Équipe au sein d'un magasin
 */
export interface Team {
  id: number;
  companyId: number;
  name: string;
  description?: string;
  storeId?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Données pour créer une équipe
 */
export interface CreateTeamInput {
  name: string;
  description?: string;
  storeId?: number;
}

/**
 * Données pour mettre à jour une équipe
 */
export interface UpdateTeamInput extends Partial<CreateTeamInput> {}

/**
 * Équipe avec relations
 */
export interface TeamWithRelations extends Team {
  store?: {
    id: number;
    name: string;
  };
  managers?: Array<{
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
  }>;
  employeeCount?: number;
}
