import { Component, ReactNode } from 'react'
import { logger } from '@quelyos/logger';

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class FinanceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Finance module error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Module Finance indisponible
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Une erreur est survenue lors du chargement du module Finance.
              Veuillez vérifier que le backend Odoo est démarré sur le port 8069.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
