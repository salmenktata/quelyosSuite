import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const sessionId = localStorage.getItem('session_id')
  const user = localStorage.getItem('user')

  // Si pas de session ou pas d'utilisateur, rediriger vers login
  if (!sessionId || !user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
