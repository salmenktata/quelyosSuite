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
      const token = localStorage.getItem('odoo_session_token')
      if (!token) return null

      // Décoder le payload JWT (simplifié)
      const payload = JSON.parse(atob(token.split('.')[1]))
      return {
        id: payload.uid || payload.sub || 1,
        name: payload.name || 'Utilisateur',
        email: payload.email || '',
        role: payload.role || 'user'
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
    localStorage.removeItem('odoo_session_token')
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
