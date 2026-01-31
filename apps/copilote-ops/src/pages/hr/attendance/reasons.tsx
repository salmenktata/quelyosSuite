/**
 * Page Raisons d'Absence/Retard - Gestion des justificatifs
 *
 * Fonctionnalités :
 * - Liste des raisons prédéfinies
 * - Création de nouvelles raisons
 * - Association raisons aux pointages
 * - Statistiques d'utilisation
 *
 * Module OCA : hr_attendance_reason
 */

import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button } from '@/components/common'
import { hrNotices } from '@/lib/notices'
import { Plus, Clock, AlertCircle } from 'lucide-react'

export default function AttendanceReasons() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // TODO: Créer hook useAttendanceReasons
  const isLoading = false
  const reasons = [
    { id: 1, name: 'Maladie', code: 'SICK', usage_count: 45 },
    { id: 2, name: 'Rendez-vous médical', code: 'MEDICAL', usage_count: 12 },
    { id: 3, name: 'Retard transport', code: 'TRANSPORT', usage_count: 8 },
    { id: 4, name: 'Urgence familiale', code: 'FAMILY', usage_count: 3 },
  ]

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'RH', href: '/hr' },
            { label: 'Pointage', href: '/hr/attendance' },
            { label: 'Raisons' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Raisons d&apos;Absence/Retard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gestion des justificatifs de pointage
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="h-5 w-5" />}
            onClick={() => setIsModalOpen(true)}
          >
            Nouvelle Raison
          </Button>
        </div>

        <PageNotice config={hrNotices.attendanceReasons} className="mb-6" />

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Raisons Configurées</p>
                <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mt-2">
                  {reasons.length}
                </p>
              </div>
              <Clock className="h-12 w-12 text-cyan-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Utilisations (30j)</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                  {reasons.reduce((sum, r) => sum + r.usage_count, 0)}
                </p>
              </div>
              <AlertCircle className="h-12 w-12 text-orange-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Raison la Plus Utilisée</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-2">
                  {reasons.sort((a, b) => b.usage_count - a.usage_count)[0]?.name || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des raisons */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Utilisations (30j)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {reasons.map((reason) => (
                <tr key={reason.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {reason.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 rounded">
                      {reason.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                    {reason.usage_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <Button variant="ghost" size="sm">
                      Modifier
                    </Button>
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
