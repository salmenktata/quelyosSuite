import { Routes, Route, Navigate, useLocation } from 'react-router'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthenticatedApp } from './components/AuthenticatedApp'
import { Login } from './pages/Login'
import { useAuth } from './hooks/useAuth'
import { useEffect } from 'react'

function App() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // TEMPORAIRE DEV: Désactiver redirection auto
  useEffect(() => {
    if (import.meta.env.DEV) {
      // DEV MODE - Auth checks disabled (intentionnel)
      return
    }
    if (!isLoading && !isAuthenticated && location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }, [isLoading, isAuthenticated, location.pathname])

  // Loading state pendant vérification auth
  if (isLoading && !import.meta.env.DEV) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  // DEV: Laisser passer si dev mode
  const canAccess = import.meta.env.DEV || isAuthenticated

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            canAccess ? (
              <AuthenticatedApp />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
