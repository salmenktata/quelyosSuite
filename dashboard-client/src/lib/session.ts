/**
 * Utilitaires pour gérer la session utilisateur
 */

/**
 * Récupère le session_id du localStorage en filtrant les valeurs invalides
 * @returns Le session_id valide ou null
 */
export function getValidSessionId(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  const storedSession = localStorage.getItem('session_id')

  // Filtrer les valeurs invalides : null, undefined, vides
  if (
    !storedSession ||
    storedSession === 'null' ||
    storedSession === 'undefined' ||
    storedSession.trim() === ''
  ) {
    // Nettoyer le localStorage si la valeur est invalide
    if (storedSession) {
      localStorage.removeItem('session_id')
    }
    return null
  }

  return storedSession
}

/**
 * Vérifie si l'utilisateur est authentifié
 * @returns true si un session_id valide existe
 */
export function isAuthenticated(): boolean {
  return getValidSessionId() !== null
}
