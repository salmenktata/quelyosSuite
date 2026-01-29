import { useState, useEffect } from 'react'

/**
 * Hook personnalisé pour débouncer une valeur
 *
 * Retarde la mise à jour d'une valeur jusqu'à ce qu'un délai se soit écoulé
 * sans changement. Utile pour optimiser les recherches en temps réel.
 *
 * @template T - Type de la valeur à débouncer
 * @param {T} value - La valeur à débouncer
 * @param {number} delay - Délai en millisecondes avant mise à jour (ex: 300)
 * @returns {T} La valeur débouncée, mise à jour après le délai
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState('')
 * const debouncedSearch = useDebounce(search, 300)
 * // debouncedSearch se met à jour 300ms après le dernier changement de search
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
