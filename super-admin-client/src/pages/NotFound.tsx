import { Link } from 'react-router'
import { Home, ArrowLeft } from 'lucide-react'

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-8xl font-bold text-gray-200 dark:text-gray-700 mb-4">404</div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Page non trouvée</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
        {`La page que vous recherchez n'existe pas ou a été déplacée.`}
      </p>
      <div className="flex items-center gap-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm"
        >
          <Home className="w-4 h-4" />
          Retour au Dashboard
        </Link>
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Page précédente
        </button>
      </div>
    </div>
  )
}
