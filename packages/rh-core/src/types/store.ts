/**
 * Store (Magasin) Types
 */

/**
 * Magasin/Site de l'entreprise
 */
export interface Store {
  id: number;
  companyId: number;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // Rayon de geofencing en mètres
  qrCode: string; // QR code statique pour pointage
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Données pour créer un magasin
 */
export interface CreateStoreInput {
  name: string;
  code?: string;
  address?: string;
  city?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  qrCode?: string;
}

/**
 * Données pour mettre à jour un magasin
 */
export interface UpdateStoreInput extends Partial<CreateStoreInput> {}

/**
 * Magasin avec relations
 */
export interface StoreWithRelations extends Store {
  teams?: Array<{
    id: number;
    name: string;
    employeeCount?: number;
  }>;
  employeeCount?: number;
  pointageCount?: number;
}
