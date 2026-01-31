/**
 * Adaptateur de compatibilité @quelyos/auth
 * Utilise tokenService pour la gestion JWT Bearer
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { tokenService } from '@quelyos/auth'
import { api } from '@/lib/api'

export interface User {
  id: number
  name: string
  email: string
  login?: string
  role?: string
  groups: string[] // Groupes de sécurité backend (ex: ['Quelyos Stock User', ...])
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  checkAuth: () => Promise<boolean>
}

/**
 * Hook d'authentification utilisant JWT Bearer via tokenService
 */
export function useAuth(): AuthContextType {
  const navigate = useNavigate()
  const initialized = useRef(false)
  const [isLoading, setIsLoading] = useState(!tokenService.isAuthenticated())
  const [user, setUser] = useState<User | null>(() => {
    const storageKey = "quelyos_copilote_user"
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return null
      }
    }
    return null
  })

  /**
   * Vérifie l'authentification via /api/auth/me
   */
  const checkAuth = useCallback(async (): Promise<boolean> => {
    if (!tokenService.isAuthenticated()) {
      setUser(null)
      setIsLoading(false)
      return false
    }

    try {
      const response = await api.getUserInfo() as { success: boolean; user?: { id: number; name: string; email: string; login?: string; groups?: string[] } }
      const userData = response.user

      if (response.success && userData) {
        setUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          login: userData.login,
          groups: userData.groups || [],
        })
        setIsLoading(false)
        return true
      }

      // Token invalide
      tokenService.clear()
      setUser(null)
      setIsLoading(false)
      return false
    } catch {
      tokenService.clear()
      setUser(null)
      setIsLoading(false)
      return false
    }
  }, [])

  /**
   * Login avec credentials
   */
  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true)

      try {
        const result = await api.login(email, password) as { success: boolean; error?: string; user?: { id: number; name: string; email: string; login?: string; groups?: string[] } }
        const userData = result.user

        if (result.success && userData) {
          const userObj = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            login: userData.login,
            groups: userData.groups || [],
          }
          setUser(userObj)

          // Stocker l'utilisateur dans localStorage pour persistance
          localStorage.setItem('quelyos_copilote_user', JSON.stringify(userObj))

          setIsLoading(false)
          return { success: true }
        }

        setIsLoading(false)
        return { success: false, error: result.error || 'Identifiants invalides' }
      } catch (error) {
        setIsLoading(false)
        return { success: false, error: error instanceof Error ? error.message : 'Erreur de connexion' }
      }
    },
    []
  )

  /**
   * Déconnexion
   */
  const logout = useCallback(async () => {
    try {
      await api.logout()
    } finally {
      setUser(null)
      navigate('/login', { replace: true })
    }
  }, [navigate])

  /**
   * Configuration initiale
   */
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Connecter la fonction de refresh au tokenService
    tokenService.setRefreshFunction(async () => {
      await api.refreshToken()
      return true
    })

    // Écouter les événements du tokenService
    const unsubscribe = tokenService.subscribe((event) => {
      if (event === 'expired') {
        setUser(null)
        navigate('/login', { replace: true })
      } else if (event === 'logout') {
        setUser(null)
      }
    })

    // Vérifier l'auth si on a un token
    if (tokenService.isAuthenticated()) {
      checkAuth()
    } else {
      setIsLoading(false)
    }

    return unsubscribe
  }, [checkAuth, navigate])

  return {
    user,
    isLoading,
    isAuthenticated: !!user, // Authentification par session (pas JWT)
    login,
    logout,
    checkAuth,
  }
}

export function useRequireAuth() {
  const navigate = useNavigate()
  const { user, isLoading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isLoading, isAuthenticated, navigate])

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return null
  }

  return { user, isLoading, isAuthenticated }
}
