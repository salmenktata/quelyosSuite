/**
 * Wrapper lazy-loaded pour Recharts
 * Permet de charger la librairie uniquement quand nécessaire (Dashboard)
 */

import { Suspense, type ComponentType } from 'react'
import { Loader2 } from 'lucide-react'

// Re-export tous les composants Recharts de manière lazy
export {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const ChartLoader = () => (
  <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-teal-600 dark:text-teal-400" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Chargement graphique...</p>
    </div>
  </div>
)

// Wrapper pour ajouter Suspense autour des charts
interface ChartWrapperProps {
  children: React.ReactNode
}

export function ChartWrapper({ children }: ChartWrapperProps) {
  return (
    <Suspense fallback={<ChartLoader />}>
      {children}
    </Suspense>
  )
}
