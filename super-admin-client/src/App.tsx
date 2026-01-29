import { Routes, Route, Navigate, useLocation } from 'react-router'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthenticatedApp } from './components/AuthenticatedApp'
import { Login } from './pages/Login'
import { useAuth } from './hooks/useAuth'
import { useEffect } from 'react'

function App() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Rediriger vers /login si non authentifié et pas déjà sur /login
  useEffect(() => {
    if (!isLoading && !isAuthenticated && location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }, [isLoading, isAuthenticated, location.pathname])

  // Loading state pendant vérification auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            isAuthenticated ? (
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
