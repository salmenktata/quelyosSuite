/**
 * Adaptateur de compatibilité @quelyos/auth
 * Simule les fonctionnalités auth pour la migration finance
 */

import { useState, useCallback } from 'react'

export interface User {
  id: number
  name: string
  email: string
  role?: string
  groups: string[] // Groupes de sécurité Odoo (ex: ['Quelyos Stock User', ...])
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

// Hook simplifié pour récupérer l'utilisateur depuis localStorage
export function useAuth(): AuthContextType {
  const [isLoading, setIsLoading] = useState(false)

  // Récupère l'utilisateur depuis le token stocké
  const getUser = useCallback((): User | null => {
    try {
      // Vérifier d'abord le user stocké par le login principal
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const user = JSON.parse(storedUser)
        return {
          id: user.id || 1,
          name: user.name || 'Utilisateur',
          email: user.email || '',
          role: user.role || 'user',
          groups: user.groups || []
        }
      }

      // Fallback: essayer le JWT token (legacy)
      const token = localStorage.getItem('backend_session_token')
      if (!token) return null

      // Décoder le payload JWT (simplifié)
      const payload = JSON.parse(atob(token.split('.')[1]))
      return {
        id: payload.uid || payload.sub || 1,
        name: payload.name || 'Utilisateur',
        email: payload.email || '',
        role: payload.role || 'user',
        groups: payload.groups || []
      }
    } catch {
      return null
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    // Implémenté dans Login.tsx existant
    setIsLoading(false)
  }

  const logout = () => {
    localStorage.removeItem('backend_session_token')
    localStorage.removeItem('session_id')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  return {
    user: getUser(),
    isLoading,
    login,
    logout
  }
}

export function useRequireAuth() {
  const { user, isLoading } = useAuth()
  return { user, isLoading, isAuthenticated: !!user }
}
