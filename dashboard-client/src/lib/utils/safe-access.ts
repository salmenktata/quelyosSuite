/**
 * Safe Access Utilities
 *
 * Helpers pour accès sûr aux tableaux et objets avec TypeScript strict mode
 * (noUncheckedIndexedAccess: true)
 *
 * @see dashboard-client/TYPESCRIPT_INDEXED_ACCESS_REPORT.md
 */

/**
 * Accède sûrement à un élément de tableau
 *
 * @throws Error si l'élément n'existe pas
 * @example
 * const products = await api.getProducts()
 * const first = assertArrayItem(products, 0, 'Aucun produit disponible')
 * console.log(first.name) // ✅ Safe
 */
export function assertArrayItem<T>(
  array: T[],
  index: number,
  errorMsg?: string
): T {
  const item = array[index]
  if (item === undefined) {
    throw new Error(errorMsg || `No item at index ${index}`)
  }
  return item
}

/**
 * Accède à un élément de tableau avec fallback
 *
 * @example
 * const products = await api.getProducts()
 * const first = getArrayItem(products, 0, DEFAULT_PRODUCT)
 * console.log(first.name) // ✅ Safe (utilise fallback si vide)
 */
export function getArrayItem<T>(
  array: T[],
  index: number,
  fallback: T
): T {
  return array[index] ?? fallback
}

/**
 * Accède à un élément de tableau avec valeur optionnelle
 * Retourne undefined si l'index est invalide (alternative à assertion)
 *
 * @example
 * const products = await api.getProducts()
 * const first = getArrayItemOptional(products, 0)
 * if (first) {
 *   console.log(first.name)
 * }
 */
export function getArrayItemOptional<T>(
  array: T[],
  index: number
): T | undefined {
  return array[index]
}

/**
 * Accède sûrement à une propriété de Record
 *
 * @throws Error si la clé n'existe pas
 * @example
 * const config: Record<string, Config> = { ... }
 * const value = assertRecordKey(config, 'apiUrl', 'Config apiUrl manquante')
 * console.log(value.endpoint) // ✅ Safe
 */
export function assertRecordKey<T>(
  record: Record<string, T>,
  key: string,
  errorMsg?: string
): T {
  const value = record[key]
  if (value === undefined) {
    throw new Error(errorMsg || `Key '${key}' not found in record`)
  }
  return value
}

/**
 * Accède à un Record avec fallback
 *
 * @example
 * const labels: Record<string, string> = { en: 'Hello', fr: 'Bonjour' }
 * const label = getRecordValue(labels, locale, 'Hello')
 * console.log(label) // ✅ Safe (utilise fallback si locale inconnue)
 */
export function getRecordValue<T>(
  record: Record<string, T>,
  key: string,
  fallback: T
): T {
  return record[key] ?? fallback
}

/**
 * Accède à un Record avec valeur optionnelle
 * Retourne undefined si la clé n'existe pas
 *
 * @example
 * const colors: Record<string, string> = { primary: '#000' }
 * const color = getRecordValueOptional(colors, 'secondary')
 * if (color) {
 *   applyColor(color)
 * }
 */
export function getRecordValueOptional<T>(
  record: Record<string, T>,
  key: string
): T | undefined {
  return record[key]
}

/**
 * Vérifie qu'une clé existe dans un Record (type guard)
 *
 * @example
 * const config: Record<string, Config> = { ... }
 * if (hasRecordKey(config, 'apiUrl')) {
 *   const value = config['apiUrl'] // ✅ TypeScript sait que value existe
 *   console.log(value.endpoint)
 * }
 */
export function hasRecordKey<T>(
  record: Record<string, T>,
  key: string
): boolean {
  return key in record && record[key] !== undefined
}

/**
 * Récupère le premier élément d'un tableau ou lance une erreur
 *
 * @throws Error si le tableau est vide
 * @example
 * const products = await api.getProducts()
 * const first = assertFirst(products, 'Aucun produit disponible')
 * console.log(first.name) // ✅ Safe
 */
export function assertFirst<T>(
  array: T[],
  errorMsg?: string
): T {
  if (array.length === 0) {
    throw new Error(errorMsg || 'Array is empty')
  }
  return array[0]!
}

/**
 * Récupère le dernier élément d'un tableau ou lance une erreur
 *
 * @throws Error si le tableau est vide
 * @example
 * const history = await api.getOrderHistory()
 * const latest = assertLast(history, 'Aucune commande')
 * console.log(latest.date) // ✅ Safe
 */
export function assertLast<T>(
  array: T[],
  errorMsg?: string
): T {
  if (array.length === 0) {
    throw new Error(errorMsg || 'Array is empty')
  }
  return array[array.length - 1]!
}

/**
 * Récupère le premier élément d'un tableau avec fallback
 *
 * @example
 * const products = await api.getProducts()
 * const first = getFirst(products, DEFAULT_PRODUCT)
 * console.log(first.name) // ✅ Safe (utilise fallback si vide)
 */
export function getFirst<T>(
  array: T[],
  fallback: T
): T {
  return array[0] ?? fallback
}

/**
 * Récupère le dernier élément d'un tableau avec fallback
 *
 * @example
 * const history = await api.getOrderHistory()
 * const latest = getLast(history, DEFAULT_ORDER)
 * console.log(latest.date) // ✅ Safe (utilise fallback si vide)
 */
export function getLast<T>(
  array: T[],
  fallback: T
): T {
  return array[array.length - 1] ?? fallback
}

/**
 * Filtre les valeurs undefined d'un tableau (type guard)
 *
 * @example
 * const items: (string | undefined)[] = ['a', undefined, 'b']
 * const filtered: string[] = filterUndefined(items)
 * console.log(filtered) // ['a', 'b']
 */
export function filterUndefined<T>(array: (T | undefined)[]): T[] {
  return array.filter((item): item is T => item !== undefined)
}

/**
 * Convertit un Record en tableau en filtrant les valeurs undefined
 *
 * @example
 * const record: Record<string, Product | undefined> = { ... }
 * const products: Product[] = recordToArray(record)
 */
export function recordToArray<T>(record: Record<string, T | undefined>): T[] {
  return Object.values(record).filter((item): item is T => item !== undefined)
}
