import { TrendingUp, TrendingDown, DollarSign, Users, Package, Activity } from 'lucide-react'
import { branding } from '../config/branding'

interface KpiCardProps {
  label: string
  value: string
  change: string
  positive: boolean
  icon: React.ReactNode
}

function KpiCard({ label, value, change, positive, icon }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center text-white"
          style={{ backgroundColor: branding.color }}
        >
          {icon}
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <div className="mt-2 flex items-center gap-1 text-sm">
        {positive ? (
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        )}
        <span className={positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
          {change}
        </span>
        <span className="text-gray-500 dark:text-gray-400">vs mois dernier</span>
      </div>
    </div>
  )
}

const placeholderKpis: KpiCardProps[] = [
  { label: 'Chiffre d\'affaires', value: '0 \u20AC', change: '+0%', positive: true, icon: <DollarSign className="h-5 w-5" /> },
  { label: 'Utilisateurs actifs', value: '0', change: '+0%', positive: true, icon: <Users className="h-5 w-5" /> },
  { label: 'Commandes', value: '0', change: '+0%', positive: true, icon: <Package className="h-5 w-5" /> },
  { label: 'Taux de conversion', value: '0%', change: '+0%', positive: true, icon: <Activity className="h-5 w-5" /> },
]

export function Dashboard() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {branding.name}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {branding.description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {placeholderKpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Placeholder sections */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {`Activit\u00E9 r\u00E9cente`}
          </h2>
          <div className="mt-4 flex items-center justify-center h-48 text-gray-400 dark:text-gray-500">
            <p className="text-sm">{`Aucune donn\u00E9e disponible`}</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {`Statistiques`}
          </h2>
          <div className="mt-4 flex items-center justify-center h-48 text-gray-400 dark:text-gray-500">
            <p className="text-sm">{`Aucune donn\u00E9e disponible`}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
