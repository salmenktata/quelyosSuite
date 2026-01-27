import { Target, Plus } from 'lucide-react'

interface LeadEmptyProps {
  onCreateClick?: () => void
}

export function LeadEmpty({ onCreateClick }: LeadEmptyProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Aucune opportunité
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          Commencez à suivre vos opportunités commerciales et gérez votre pipeline de vente efficacement.
        </p>
        {onCreateClick && (
          <button
            onClick={onCreateClick}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Créer une opportunité
          </button>
        )}
      </div>
    </div>
  )
}
