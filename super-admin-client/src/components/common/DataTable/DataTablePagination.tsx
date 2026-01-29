import { Button } from '../Button'

interface DataTablePaginationProps {
  currentPage: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
}

export function DataTablePagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
}: DataTablePaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize)
  const startItem = currentPage * pageSize + 1
  const endItem = Math.min((currentPage + 1) * pageSize, totalItems)

  const canGoPrevious = currentPage > 0
  const canGoNext = currentPage < totalPages - 1

  return (
    <div className="bg-gray-50 dark:bg-gray-900 px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 dark:border-gray-700">
      {/* Informations */}
      <div className="text-sm text-gray-700 dark:text-gray-300">
        Affichage {startItem} à {endItem} sur {totalItems}
      </div>

      {/* Boutons navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          aria-label="Page précédente"
        >
          Précédent
        </Button>

        {/* Pages */}
        <div className="hidden md:flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum: number

            if (totalPages <= 7) {
              // Si peu de pages, afficher toutes
              pageNum = i
            } else if (currentPage < 3) {
              // Au début
              pageNum = i
            } else if (currentPage > totalPages - 4) {
              // À la fin
              pageNum = totalPages - 7 + i
            } else {
              // Au milieu
              pageNum = currentPage - 3 + i
            }

            const isCurrentPage = pageNum === currentPage

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`
                  px-3 py-1 text-sm rounded-md transition-colors
                  ${
                    isCurrentPage
                      ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                  focus:outline-none focus:ring-2 focus:ring-indigo-500
                `.trim()}
                aria-label={`Page ${pageNum + 1}`}
                aria-current={isCurrentPage ? 'page' : undefined}
              >
                {pageNum + 1}
              </button>
            )
          })}
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          aria-label="Page suivante"
        >
          Suivant
        </Button>
      </div>
    </div>
  )
}
