import { TrendingUp, DollarSign, Target } from 'lucide-react'
import type { LeadListItem } from '@/types'

interface LeadStatsProps {
  leads: LeadListItem[]
}

export function LeadStats({ leads }: LeadStatsProps) {
  const totalLeads = leads.length
  const totalRevenue = leads.reduce((sum, lead) => sum + (lead.expected_revenue || 0), 0)
  const avgProbability = leads.length > 0
    ? leads.reduce((sum, lead) => sum + (lead.probability || 0), 0) / leads.length
    : 0

  const stats = [
    {
      label: 'Total Opportunités',
      value: totalLeads,
      icon: Target,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Revenu Attendu',
      value: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalRevenue),
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Probabilité Moyenne',
      value: `${Math.round(avgProbability)}%`,
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stat.value}
              </p>
            </div>
            <div className={`p-3 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
