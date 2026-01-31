/**
 * Page Rapport Temps Théorique vs Réel
 *
 * Fonctionnalités :
 * - Comparaison temps pointé vs temps contractuel
 * - Filtres par employé et période
 * - Détection anomalies (heures sup, retards)
 * - Export PDF/Excel
 * - Graphiques d'évolution
 *
 * Module OCA : hr_attendance_report_theoretical_time
 */

import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button } from '@/components/common'
import { hrNotices } from '@/lib/notices'
import { Download, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function TheoreticalTimeReport() {
  const [dateFrom, setDateFrom] = useState('2026-01-01')
  const [dateTo, setDateTo] = useState('2026-01-31')
  const [employeeId, setEmployeeId] = useState<number | undefined>()

  // TODO: Créer hook useTheoreticalTimeReport
  const data = {
    employee_name: 'Marie Dubois',
    theoretical_hours: 168.0,
    worked_hours: 172.5,
    difference: 4.5,
    difference_percentage: 2.68,
    attendance_count: 21,
    attendance_details: [
      { id: 1, check_in: '2026-01-20T09:00:00', check_out: '2026-01-20T17:30:00', worked_hours: 8.5 },
      { id: 2, check_in: '2026-01-21T08:45:00', check_out: '2026-01-21T17:15:00', worked_hours: 8.5 },
    ],
  }

  const getDifferenceIcon = (diff: number) => {
    if (diff > 0) return <TrendingUp className="h-5 w-5 text-emerald-500" />
    if (diff < 0) return <TrendingDown className="h-5 w-5 text-red-500" />
    return <Minus className="h-5 w-5 text-gray-500" />
  }

  const getDifferenceColor = (diff: number) => {
    if (diff > 0) return 'text-emerald-600 dark:text-emerald-400'
    if (diff < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'RH', href: '/hr' },
            { label: 'Pointage', href: '/hr/attendance' },
            { label: 'Rapport Temps Théorique' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Rapport Temps Théorique vs Réel
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Comparaison des heures contractuelles et pointées
            </p>
          </div>
          <Button variant="secondary" icon={<Download className="h-5 w-5" />}>
            Export PDF
          </Button>
        </div>

        <PageNotice config={hrNotices.theoreticalReport} className="mb-6" />

        {/* Filtres */}
        <div className="mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                Employé
              </label>
              <select
                value={employeeId || ''}
                onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : undefined)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Sélectionner un employé</option>
                <option value="1">Marie Dubois</option>
                {/* TODO: Charger depuis API */}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                Date Début
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                Date Fin
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* KPI Summary */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Heures Théoriques</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {data.theoretical_hours}h
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Heures Travaillées</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {data.worked_hours}h
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Écart</p>
                <p className={`text-2xl font-bold mt-2 ${getDifferenceColor(data.difference)}`}>
                  {data.difference > 0 ? '+' : ''}{data.difference}h
                </p>
              </div>
              {getDifferenceIcon(data.difference)}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pourcentage</p>
            <p className={`text-2xl font-bold mt-2 ${getDifferenceColor(data.difference)}`}>
              {data.difference > 0 ? '+' : ''}{data.difference_percentage.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Détail pointages */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Détail des Pointages ({data.attendance_count} jours)
            </h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Arrivée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Départ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Heures Travaillées
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {data.attendance_details.map((att) => (
                <tr key={att.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(att.check_in).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(att.check_in).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(att.check_out).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                    {att.worked_hours}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
