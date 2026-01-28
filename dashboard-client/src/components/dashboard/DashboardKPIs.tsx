import { DashboardKPICard } from './DashboardKPICard'
import { Skeleton } from '../common'
import { Euro, ShoppingBag, Users, Package } from 'lucide-react'
import type { DashboardStats } from '../../hooks/useDashboard'

interface DashboardKPIsProps {
  stats: DashboardStats | undefined
  isLoading: boolean
}

/**
 * Grid de 4 KPIs principales du dashboard
 * Responsive : 1 colonne mobile, 2 tablette, 4 desktop
 */
export function DashboardKPIs({ stats, isLoading }: DashboardKPIsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Skeleton height={140} />
        <Skeleton height={140} />
        <Skeleton height={140} />
        <Skeleton height={140} />
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {/* Chiffre d'affaires */}
      <DashboardKPICard
        title="Chiffre d'affaires"
        value={stats.revenue.total}
        variation={stats.revenue.variation}
        icon={<Euro className="w-5 h-5 md:w-6 md:h-6" />}
        colorClass="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
        formatType="price"
      />

      {/* Commandes */}
      <DashboardKPICard
        title="Commandes"
        value={stats.orders.total}
        variation={stats.orders.variation}
        icon={<ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />}
        colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        formatType="number"
        subtitle={stats.orders.pending > 0 ? `${stats.orders.pending} en attente` : undefined}
      />

      {/* Clients */}
      <DashboardKPICard
        title="Clients"
        value={stats.customers.total}
        variation={stats.customers.variation}
        icon={<Users className="w-5 h-5 md:w-6 md:h-6" />}
        colorClass="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
        formatType="number"
        subtitle={
          stats.customers.new_this_month > 0 ? `${stats.customers.new_this_month} ce mois` : undefined
        }
      />

      {/* Produits */}
      <DashboardKPICard
        title="Produits"
        value={stats.products.total}
        icon={<Package className="w-5 h-5 md:w-6 md:h-6" />}
        colorClass="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
        formatType="number"
        subtitle={
          stats.products.low_stock > 0 || stats.products.out_of_stock > 0
            ? `${stats.products.low_stock + stats.products.out_of_stock} alertes`
            : undefined
        }
      />
    </div>
  )
}
