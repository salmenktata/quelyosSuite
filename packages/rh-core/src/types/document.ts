import { DocumentType, DocumentVisibility } from './enums';

/**
 * Document Types
 */

/**
 * Document RH
 */
export interface Document {
  id: number;
  companyId: number;
  employeeId: number;
  type: DocumentType;
  visibility: DocumentVisibility;
  name: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  s3Bucket: string;
  uploadedById: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Métadonnées pour upload de document
 */
export interface UploadDocumentInput {
  employeeId: number;
  type: DocumentType;
  visibility: DocumentVisibility;
  name: string;
  description?: string;
}

/**
 * Document avec relations
 */
export interface DocumentWithRelations extends Document {
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeNumber: string;
  };
  uploadedBy?: {
    id: number;
    email: string;
  };
}

/**
 * URL de téléchargement signée
 */
export interface DocumentDownloadUrl {
  url: string;
  expiresAt: string;
  fileName: string;
}

/**
 * Vérifier si un utilisateur peut voir un document
 */
export function canViewDocument(
  document: Document,
  userRole: string,
  isOwner: boolean
): boolean {
  // Admin peut tout voir
  if (userRole === 'ADMIN' || userRole === 'RH_ADMIN') return true;

  switch (document.visibility) {
    case DocumentVisibility.EMPLOYEE:
      // L'employé propriétaire peut voir
      return isOwner;

    case DocumentVisibility.RH_ONLY:
      // RH_MANAGER et RH_ADMIN peuvent voir
      return ['RH_ADMIN', 'RH_MANAGER'].includes(userRole);

    case DocumentVisibility.ADMIN_ONLY:
      // Seulement les admins
      return ['ADMIN', 'RH_ADMIN'].includes(userRole);

    default:
      return false;
  }
}

/**
 * Formater la taille du fichier
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Obtenir l'icône selon le type MIME
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('word')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  return '📎';
}
