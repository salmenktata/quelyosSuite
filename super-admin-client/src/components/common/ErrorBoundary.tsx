import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { logger } from '@/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught error:', error, errorInfo)

    this.setState({
      error,
      errorInfo
    })

    // Envoyer à Sentry si disponible
    if (typeof window !== 'undefined' && (window as unknown as { Sentry?: { captureException: (e: Error, opts?: unknown) => void } }).Sentry) {
      (window as unknown as { Sentry: { captureException: (e: Error, opts?: unknown) => void } }).Sentry.captureException(error, {
        extra: { componentStack: errorInfo.componentStack }
      })
    }

    // Reporter au backend en production
    if (window.location.hostname !== 'localhost') {
      this.reportErrorToBackend(error, errorInfo)
    }
  }

  private reportErrorToBackend(error: Error, errorInfo: ErrorInfo) {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }

      fetch('/api/backoffice/client-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      }).catch(() => { /* Ignorer */ })
    } catch {
      // Ignorer les erreurs d'envoi
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      // Si un fallback custom est fourni, l'utiliser
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Sinon, afficher l'UI d'erreur par défaut
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Une erreur s'est produite
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {this.state.error?.message || 'Une erreur inattendue est survenue'}
            </p>

            {/* Afficher les détails techniques en dev */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-2">
                  Détails techniques
                </summary>
                <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto max-h-48 text-gray-800 dark:text-gray-300">
                  {this.state.error?.stack}
                  {'\n\n'}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </button>
            </div>

            {process.env.NODE_ENV === 'production' && (
              <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
                Si le problème persiste, veuillez contacter le support.
              </p>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
