/**
 * Ports fixes pour tous les services Quelyos Suite
 *
 * ⚠️ RÈGLE ABSOLUE : NE JAMAIS MODIFIER CES PORTS
 * Voir CLAUDE.md section "⛔ RÈGLE PORTS - NE JAMAIS MODIFIER"
 *
 * En cas de conflit :
 * 1. ❌ NE PAS changer le port ici
 * 2. ✅ Tuer le processus qui occupe le port : lsof -ti:PORT | xargs kill -9
 * 3. ✅ Redémarrer le service sur son port ORIGINAL
 */
export const PORTS = {
  /** Site vitrine marketing (Next.js) */
  vitrine: 3000,

  /** E-commerce client (Next.js) */
  ecommerce: 3001,

  /** Dashboard ERP complet / Full Suite (React + Vite) */
  dashboard: 5175,

  /** Panel super admin SaaS (React + Vite) */
  superadmin: 9000,

  /** Backend API (Odoo 19) */
  backend: 8069,

  /** PostgreSQL Database */
  postgres: 5432,

  /** Redis Cache */
  redis: 6379,
} as const;

/**
 * Type pour les noms de services
 */
export type ServiceName = keyof typeof PORTS;

/**
 * Type pour les numéros de port
 */
export type PortNumber = typeof PORTS[ServiceName];

/**
 * Vérifie si un port est un port Quelyos connu
 */
export function isQuelyosPort(port: number): port is PortNumber {
  return Object.values(PORTS).includes(port as PortNumber);
}

/**
 * Récupère le nom du service à partir du port
 */
export function getServiceByPort(port: number): ServiceName | null {
  const entry = Object.entries(PORTS).find(([, p]) => p === port);
  return entry ? (entry[0] as ServiceName) : null;
}
