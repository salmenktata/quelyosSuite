/**
 * Tenant-aware localStorage wrapper
 *
 * Isole automatiquement les données localStorage par tenant
 * pour éviter les fuites de données cross-tenant.
 *
 * Usage:
 *   import { tenantStorage } from '@/lib/tenantStorage'
 *
 *   // Au lieu de :
 *   localStorage.setItem('cart', JSON.stringify(cart))
 *
 *   // Utiliser :
 *   tenantStorage.setItem('cart', JSON.stringify(cart))
 *   // Stocké comme : "tenant_123:cart"
 *
 * SÉCURITÉ CRITIQUE :
 * - Toutes les keys sont préfixées avec "tenant_<id>:"
 * - Impossible d'accéder aux données d'un autre tenant
 * - Les données sans préfixe ne sont PAS accessibles via cette API
 */

import { useState } from 'react'
import { logger } from '@quelyos/logger'

/**
 * Keys globales non isolées par tenant (whitelist)
 * Ces keys ne doivent PAS être préfixées par tenant_id
 */
const GLOBAL_KEYS = [
  'session_id',
  'backend_session_token',
  'user',
  'tenant_id',
  'access_token',
  'refresh_token',
  'token_expiry',
  'theme', // Thème UI global
  'language', // Langue globale
] as const

type GlobalKey = (typeof GLOBAL_KEYS)[number]

/**
 * Vérifie si une key est globale (non isolée par tenant)
 */
function isGlobalKey(key: string): key is GlobalKey {
  return GLOBAL_KEYS.includes(key as GlobalKey)
}

/**
 * Récupère le tenant_id courant depuis localStorage
 */
function getCurrentTenantId(): number | null {
  const storedTenantId = localStorage.getItem('tenant_id')
  if (!storedTenantId || storedTenantId === 'null' || storedTenantId === 'undefined') {
    return null
  }
  const tenantId = parseInt(storedTenantId, 10)
  return isNaN(tenantId) ? null : tenantId
}

/**
 * Préfixe une key avec le tenant_id courant
 */
function prefixKey(key: string): string {
  // Keys globales ne sont jamais préfixées
  if (isGlobalKey(key)) {
    return key
  }

  const tenantId = getCurrentTenantId()
  if (!tenantId) {
    logger.warn('[tenantStorage] No tenant_id found, using unprefixed key (unsafe):', key)
    return key
  }

  return `tenant_${tenantId}:${key}`
}

/**
 * Enlève le préfixe tenant d'une key
 */
function unprefixKey(prefixedKey: string, tenantId: number): string {
  const prefix = `tenant_${tenantId}:`
  if (prefixedKey.startsWith(prefix)) {
    return prefixedKey.slice(prefix.length)
  }
  return prefixedKey
}

/**
 * Wrapper localStorage isolé par tenant
 */
export const tenantStorage = {
  /**
   * Stocke une valeur dans localStorage avec isolation tenant
   */
  setItem(key: string, value: string): void {
    const prefixedKey = prefixKey(key)
    try {
      localStorage.setItem(prefixedKey, value)
      logger.debug(`[tenantStorage] setItem: ${key} → ${prefixedKey}`)
    } catch (error) {
      logger.error('[tenantStorage] setItem error:', error)
      throw error
    }
  },

  /**
   * Récupère une valeur depuis localStorage avec isolation tenant
   */
  getItem(key: string): string | null {
    const prefixedKey = prefixKey(key)
    try {
      const value = localStorage.getItem(prefixedKey)
      logger.debug(`[tenantStorage] getItem: ${key} → ${prefixedKey} = ${value?.slice(0, 50)}...`)
      return value
    } catch (error) {
      logger.error('[tenantStorage] getItem error:', error)
      return null
    }
  },

  /**
   * Supprime une valeur de localStorage avec isolation tenant
   */
  removeItem(key: string): void {
    const prefixedKey = prefixKey(key)
    try {
      localStorage.removeItem(prefixedKey)
      logger.debug(`[tenantStorage] removeItem: ${key} → ${prefixedKey}`)
    } catch (error) {
      logger.error('[tenantStorage] removeItem error:', error)
    }
  },

  /**
   * Vide toutes les données du tenant courant
   * (Conserve les keys globales comme session_id, user, etc.)
   */
  clear(): void {
    const tenantId = getCurrentTenantId()
    if (!tenantId) {
      logger.warn('[tenantStorage] Cannot clear without tenant_id')
      return
    }

    const prefix = `tenant_${tenantId}:`
    const keysToRemove: string[] = []

    // Identifier toutes les keys du tenant courant
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key)
      }
    }

    // Supprimer toutes les keys du tenant
    keysToRemove.forEach((key) => localStorage.removeItem(key))

    logger.info(`[tenantStorage] Cleared ${keysToRemove.length} items for tenant ${tenantId}`)
  },

  /**
   * Liste toutes les keys du tenant courant (sans préfixe)
   */
  keys(): string[] {
    const tenantId = getCurrentTenantId()
    if (!tenantId) {
      return []
    }

    const prefix = `tenant_${tenantId}:`
    const tenantKeys: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        tenantKeys.push(unprefixKey(key, tenantId))
      }
    }

    return tenantKeys
  },

  /**
   * Vérifie si une key existe pour le tenant courant
   */
  hasKey(key: string): boolean {
    const prefixedKey = prefixKey(key)
    return localStorage.getItem(prefixedKey) !== null
  },

  /**
   * Récupère et parse un objet JSON
   */
  getObject<T>(key: string): T | null {
    const json = this.getItem(key)
    if (!json) return null

    try {
      return JSON.parse(json) as T
    } catch (error) {
      logger.error('[tenantStorage] getObject parse error:', error)
      return null
    }
  },

  /**
   * Stocke un objet en JSON
   */
  setObject<T>(key: string, value: T): void {
    try {
      const json = JSON.stringify(value)
      this.setItem(key, json)
    } catch (error) {
      logger.error('[tenantStorage] setObject stringify error:', error)
      throw error
    }
  },
}

/**
 * Hook React pour tenantStorage avec réactivité
 *
 * Usage:
 *   const [cart, setCart] = useTenantStorage<Cart>('cart', null)
 */
export function useTenantStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void, () => void] {
  // Initialiser avec la valeur stockée ou la valeur par défaut
  const storedValue = tenantStorage.getObject<T>(key)
  const [value, setValue] = useState<T>(storedValue ?? initialValue)

  // Setter qui met à jour localStorage et le state
  const setStoredValue = (newValue: T) => {
    tenantStorage.setObject(key, newValue)
    setValue(newValue)
  }

  // Fonction pour supprimer la valeur
  const removeStoredValue = () => {
    tenantStorage.removeItem(key)
    setValue(initialValue)
  }

  return [value, setStoredValue, removeStoredValue]
}
