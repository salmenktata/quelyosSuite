/**
 * @quelyos/rh-core
 * Package partagé pour le module RH de Quelyos
 *
 * Contient:
 * - Types TypeScript pour toutes les entités RH
 * - Schémas de validation Zod
 * - Fonctions utilitaires (dates, GPS, etc.)
 * - Constantes et messages
 *
 * @packageDocumentation
 */

// Types
export * from './types';

// Schemas de validation
export * from './schemas';

// Utilitaires
export * from './utils';

/**
 * Version du package
 */
export const VERSION = '1.0.0';

/**
 * Nom du package
 */
export const PACKAGE_NAME = '@quelyos/rh-core';
