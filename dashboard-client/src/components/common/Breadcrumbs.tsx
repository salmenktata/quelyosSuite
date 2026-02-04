import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  path?: string // Alias for href
  label: string
  href?: string
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center text-sm mb-6">
      <ol className="flex items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && (
                <svg
                  className="w-4 h-4 text-gray-400 dark:text-gray-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}

              {isLast ? (
                <span
                  className="text-gray-900 dark:text-white font-medium"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (item.href || item.path) ? (
                <Link
                  to={item.href || item.path || ""}
                  className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
