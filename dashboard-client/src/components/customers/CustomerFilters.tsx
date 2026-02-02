import { useState, useEffect } from 'react'
import { Button } from '../common'
import { Download, Search } from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'

interface CustomerFiltersProps {
  searchInput: string
  onSearchInputChange: (value: string) => void
  onSearch: (value: string) => void
  onReset: () => void
  onExportCSV: () => void
  isExporting: boolean
  totalCount?: number
  currentSearch?: string
}

export function CustomerFilters({
  searchInput,
  onSearchInputChange,
  onSearch,
  onReset,
  onExportCSV,
  isExporting,
  totalCount,
  currentSearch,
}: CustomerFiltersProps) {
  const debouncedSearch = useDebounce(searchInput, 300)
  const [hasSearched, setHasSearched] = useState(false)

  // Recherche automatique avec debounce
  useEffect(() => {
    if (hasSearched || debouncedSearch) {
      onSearch(debouncedSearch)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasSearched(true)
    }
  }, [debouncedSearch, hasSearched, onSearch])

  const handleReset = () => {
    onSearchInputChange('')
    setHasSearched(false)
    onReset()
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 relative">
          <label htmlFor="customer-search" className="sr-only">
            Rechercher un client
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="customer-search"
              type="text"
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              placeholder="Rechercher par nom, email ou téléphone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors"
              aria-describedby="search-description"
            />
          </div>
          <span id="search-description" className="sr-only">
            La recherche se lance automatiquement pendant la frappe
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {currentSearch && (
            <Button type="button" variant="secondary" onClick={handleReset} className="w-full sm:w-auto">
              Réinitialiser
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={onExportCSV}
            loading={isExporting}
            disabled={isExporting}
            icon={<Download className="h-5 w-5" />}
            className="w-full sm:w-auto"
            aria-label="Exporter les clients en CSV"
          >
            Exporter CSV
          </Button>
        </div>
      </div>

      {totalCount !== undefined && (
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          {totalCount} client{totalCount > 1 ? 's' : ''} trouvé{totalCount > 1 ? 's' : ''}
          {currentSearch && ` pour "${currentSearch}"`}
        </div>
      )}
    </div>
  )
}
