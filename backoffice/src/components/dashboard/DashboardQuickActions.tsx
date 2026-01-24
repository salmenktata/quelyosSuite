import { Link } from 'react-router-dom'
import {
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ChartBarIcon,
  TicketIcon,
  CubeIcon,
} from '@heroicons/react/24/outline'

interface QuickAction {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  colorClass: string
}

const quickActions: QuickAction[] = [
  {
    title: 'Produits',
    description: 'Gérer le catalogue de produits, catégories et stocks',
    href: '/products',
    icon: <ShoppingBagIcon className="w-5 h-5 md:w-6 md:h-6" />,
    colorClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  },
  {
    title: 'Commandes',
    description: 'Suivre et gérer les commandes clients',
    href: '/orders',
    icon: <ClipboardDocumentListIcon className="w-5 h-5 md:w-6 md:h-6" />,
    colorClass: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  },
  {
    title: 'Clients',
    description: 'Gérer les comptes clients et leur historique',
    href: '/customers',
    icon: <UserGroupIcon className="w-5 h-5 md:w-6 md:h-6" />,
    colorClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  },
  {
    title: 'Analytics',
    description: 'Analyser les ventes et performances',
    href: '/analytics',
    icon: <ChartBarIcon className="w-5 h-5 md:w-6 md:h-6" />,
    colorClass: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  },
  {
    title: 'Coupons',
    description: 'Gérer les codes promo et réductions',
    href: '/coupons',
    icon: <TicketIcon className="w-5 h-5 md:w-6 md:h-6" />,
    colorClass: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  },
  {
    title: 'Stock',
    description: 'Suivre les niveaux de stock et inventaire',
    href: '/stock',
    icon: <CubeIcon className="w-5 h-5 md:w-6 md:h-6" />,
    colorClass: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  },
]

/**
 * Grid de quick actions du dashboard
 * Liens rapides vers les principales sections de l'app
 */
export function DashboardQuickActions() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6">
      <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">Accès rapides</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            to={action.href}
            className="group p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 active:scale-100 border border-gray-200 dark:border-gray-700"
          >
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mb-3 ${action.colorClass}`}>
              {action.icon}
            </div>
            <h4 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white mb-1">
              {action.title}
            </h4>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {action.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
