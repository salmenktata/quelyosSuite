import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { TenantGuard } from './components/TenantGuard'
import { useSessionManager } from './hooks/useSessionManager'
import { useBranding } from './hooks/useBranding'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import AppRoutes from './routes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

function SessionManager() {
  useSessionManager({ enableWarning: !import.meta.env.DEV })
  return null
}

export default function App() {
  useBranding()

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <ThemeProvider>
          <Toaster position="top-right" richColors expand={true} closeButton />
          <ToastProvider>
            <TenantGuard>
              <SessionManager />
              <AppRoutes />
            </TenantGuard>
          </ToastProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  )
}
