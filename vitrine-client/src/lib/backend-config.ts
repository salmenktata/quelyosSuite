/**
 * Configuration Backend API centralisée
 * SÉCURITÉ : Fail-fast si BACKEND_URL manquant (pas de fallback localhost)
 */

// Autoriser build Next.js sans BACKEND_URL (sera fourni au runtime)
const BACKEND_URL = process.env.BACKEND_URL || ''

// Validation au runtime (seulement si utilisé)
function getBackendUrl(): string {
  if (!BACKEND_URL) {
    throw new Error(
      'BACKEND_URL environment variable is required. Please set it in your .env file.'
    )
  }
  return BACKEND_URL
}

// Export direct pour compatibilité (validation lazy)
export { BACKEND_URL }

// Export fonction pour validation stricte
export { getBackendUrl }
