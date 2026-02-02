import { AlertCircle } from 'lucide-react'

interface ErrorAlertProps {
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorAlert({ message, onRetry, className = '' }: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className={`rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20 ${className}`}
    >
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 dark:text-red-400" />
        <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-auto text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
          >
            Réessayer
          </button>
        )}
      </div>
    </div>
  )
}
