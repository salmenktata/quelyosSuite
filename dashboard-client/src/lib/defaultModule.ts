/**
 * Helper pour gérer le module par défaut de l'utilisateur
 */
import { MODULES, type ModuleId } from '@/config/modules';

const DEFAULT_MODULE_KEY = 'default_module';

/**
 * Récupère le chemin du module par défaut de l'utilisateur
 * @returns Le chemin du module (ex: '/dashboard', '/finance', '/store')
 */
export function getDefaultModulePath(): string {
  const storedModule = localStorage.getItem(DEFAULT_MODULE_KEY);

  if (storedModule) {
    const module = MODULES.find(m => m.id === storedModule);
    if (module) {
      return module.basePath;
    }
  }

  // Fallback: dashboard (home)
  return '/dashboard';
}

/**
 * Définit le module par défaut
 * @param moduleId - ID du module à définir par défaut
 */
export function setDefaultModule(moduleId: ModuleId): void {
  localStorage.setItem(DEFAULT_MODULE_KEY, moduleId);
}

/**
 * Récupère le module par défaut
 * @returns L'ID du module par défaut ou 'home' par défaut
 */
export function getDefaultModule(): ModuleId {
  const storedModule = localStorage.getItem(DEFAULT_MODULE_KEY);
  return (storedModule as ModuleId) || 'home';
}
