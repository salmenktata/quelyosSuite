import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // TEMPORAIRE : Authentification complètement désactivée
  // TODO PRODUCTION : Implémenter JWT (voir TODO_AUTH.md)
  return <>{children}</>
}
