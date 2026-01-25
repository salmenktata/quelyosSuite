import { Link } from 'react-router-dom'
import { UserGroupIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Button } from '../common'

interface CustomerEmptyProps {
  hasSearch: boolean
  onResetSearch?: () => void
}

export function CustomerEmpty({ hasSearch, onResetSearch }: CustomerEmptyProps) {
  if (hasSearch) {
    return (
      <div className="p-8 text-center">
        <MagnifyingGlassIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Aucun client trouvé</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Essayez de modifier vos critères de recherche.
        </p>
        {onResetSearch && (
          <Button variant="secondary" onClick={onResetSearch}>
            Réinitialiser la recherche
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="p-8 md:p-12 text-center">
      <UserGroupIcon className="w-16 h-16 md:w-20 md:h-20 mx-auto text-gray-400 mb-4" aria-hidden="true" />
      <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Aucun client enregistré
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Les clients qui créent un compte sur votre boutique apparaîtront ici. En attendant, vous pouvez
        consulter les commandes existantes.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/orders">
          <Button variant="primary">Voir les commandes</Button>
        </Link>
        <Link to="/analytics">
          <Button variant="secondary">Consulter les statistiques</Button>
        </Link>
      </div>
    </div>
  )
}
