/**
 * Détection d'environnement multi-plateforme (Next.js, Vite, Node.js)
 *
 * Gère les différences entre :
 * - Next.js : `process.env.NODE_ENV`, `process.env.NEXT_PUBLIC_*`
 * - Vite : `import.meta.env.MODE`, `import.meta.env.VITE_*`
 * - Node.js server : `process.env.NODE_ENV`
 */

/**
 * Type d'environnement d'exécution
 */
export type RuntimeEnvironment = 'development' | 'staging' | 'production' | 'test';

/**
 * Type de plateforme d'exécution
 */
export type RuntimePlatform = 'nextjs' | 'vite' | 'nodejs';

/**
 * Détecte la plateforme d'exécution actuelle
 */
export function detectPlatform(): RuntimePlatform {
  // Vite : import.meta.env existe
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return 'vite';
  }

  // Next.js : process.env.NEXT_RUNTIME existe
  if (typeof process !== 'undefined' && process.env?.NEXT_RUNTIME) {
    return 'nextjs';
  }

  // Fallback : Node.js
  return 'nodejs';
}

/**
 * Détecte l'environnement d'exécution actuel
 */
export function detectEnvironment(): RuntimeEnvironment {
  const platform = detectPlatform();

  if (platform === 'vite') {
    const mode = import.meta.env?.MODE || 'development';
    return mode as RuntimeEnvironment;
  }

  if (typeof process !== 'undefined' && process.env) {
    const nodeEnv = process.env.NODE_ENV || 'development';
    return nodeEnv as RuntimeEnvironment;
  }

  return 'development';
}

/**
 * Vérifie si on est en mode développement
 */
export function isDevelopment(): boolean {
  return detectEnvironment() === 'development';
}

/**
 * Vérifie si on est en mode staging
 */
export function isStaging(): boolean {
  return detectEnvironment() === 'staging';
}

/**
 * Vérifie si on est en mode production
 */
export function isProduction(): boolean {
  return detectEnvironment() === 'production';
}

/**
 * Vérifie si on est en mode test
 */
export function isTest(): boolean {
  return detectEnvironment() === 'test';
}

/**
 * Vérifie si le code s'exécute côté serveur
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Vérifie si le code s'exécute côté client
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Récupère une variable d'environnement de manière sécurisée
 *
 * @param key - Nom de la variable (sans préfixe NEXT_PUBLIC_ ou VITE_)
 * @param defaultValue - Valeur par défaut
 * @param publicOnly - Si true, force l'utilisation des variables publiques (client-safe)
 */
export function getEnvVar(
  key: string,
  defaultValue?: string,
  publicOnly = false
): string | undefined {
  const platform = detectPlatform();

  // Vite : VITE_*
  if (platform === 'vite') {
    const viteKey = `VITE_${key}`;
    const value = import.meta.env?.[viteKey];
    return value !== undefined ? String(value) : defaultValue;
  }

  // Next.js : NEXT_PUBLIC_* (client) ou direct (server)
  if (platform === 'nextjs') {
    if (publicOnly || isClient()) {
      const nextPublicKey = `NEXT_PUBLIC_${key}`;
      return process.env[nextPublicKey] || defaultValue;
    }
    // Server-side : peut accéder aux variables privées
    return process.env[key] || process.env[`NEXT_PUBLIC_${key}`] || defaultValue;
  }

  // Node.js : direct
  return process.env[key] || defaultValue;
}

/**
 * Récupère une variable d'environnement publique (client-safe)
 * Alias pour getEnvVar(key, defaultValue, true)
 */
export function getPublicEnvVar(key: string, defaultValue?: string): string | undefined {
  return getEnvVar(key, defaultValue, true);
}
