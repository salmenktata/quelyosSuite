import { z } from 'zod';
import { DocumentType, DocumentVisibility } from '../types/enums';

/**
 * Document Validation Schemas
 */

/**
 * Taille maximale de fichier (10 MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Types MIME autorisés
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

/**
 * Schéma pour métadonnées d'upload
 */
export const uploadDocumentMetadataSchema = z.object({
  employeeId: z.number().int().positive('ID employé invalide'),
  type: z.nativeEnum(DocumentType),
  visibility: z.nativeEnum(DocumentVisibility),
  name: z.string().min(1, 'Le nom est requis').max(255),
  description: z.string().max(500).optional(),
});

/**
 * Schéma pour filtres de documents
 */
export const documentFiltersSchema = z.object({
  employeeId: z.number().int().positive().optional(),
  type: z.nativeEnum(DocumentType).optional(),
  visibility: z.nativeEnum(DocumentVisibility).optional(),
  search: z.string().max(255).optional(),
});

/**
 * Validation de fichier
 */
export const fileValidationSchema = z.object({
  fileName: z.string().min(1, 'Nom de fichier requis'),
  fileSize: z
    .number()
    .positive('Taille de fichier invalide')
    .max(MAX_FILE_SIZE, `Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024} MB)`),
  mimeType: z.string().refine(
    (val) => isAllowedMimeType(val),
    'Type de fichier non supporté'
  ),
});

/**
 * Vérifier si un type MIME est autorisé
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

/**
 * Obtenir l'extension depuis le type MIME
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  };
  return map[mimeType] || 'bin';
}
