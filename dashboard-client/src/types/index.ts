/**
 * Types pour le Backoffice
 * Réexporte tous les types partagés + types spécifiques backoffice
 */

// Réexporter tous les types partagés
export * from '@quelyos/types';

// Types spécifiques au backoffice (Stock, Analytics, Invoices, etc.)
// Note: Invoice, OrderHistoryItem, PaginatedResponse sont commentés dans backoffice.ts
// car déjà exportés par @quelyos/types pour éviter les duplications
export * from './backoffice';
