/**
 * Configuration Backend API centralisée
 * SÉCURITÉ : Fail-fast si BACKEND_URL manquant (pas de fallback localhost)
 */

const BACKEND_URL = process.env.BACKEND_URL

if (!BACKEND_URL) {
  throw new Error(
    'BACKEND_URL environment variable is required. Please set it in your .env file.'
  )
}

export { BACKEND_URL }
