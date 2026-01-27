import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { LeadListItem } from '@/types'

interface LeadTableProps {
  leads: LeadListItem[]
}

type SortField = 'name' | 'partner_name' | 'stage_name' | 'expected_revenue' | 'probability' | 'create_date'
type SortOrder = 'asc' | 'desc' | null

export function LeadTable({ leads }: LeadTableProps) {
  const [sortField, setSortField] = useState<SortField>('create_date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : sortOrder === 'desc' ? null : 'asc')
      if (sortOrder === 'desc') setSortField('create_date')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedLeads = [...leads].sort((a, b) => {
    if (!sortOrder) return 0

    let aVal: any = a[sortField]
    let bVal: any = b[sortField]

    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1

    if (typeof aVal === 'string') aVal = aVal.toLowerCase()
    if (typeof bVal === 'string') bVal = bVal.toLowerCase()

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="w-4 h-4 text-gray-400" />
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Opportunité
                  <SortIcon field="name" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('partner_name')}
                  className="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Client
                  <SortIcon field="partner_name" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('stage_name')}
                  className="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Stage
                  <SortIcon field="stage_name" />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => handleSort('expected_revenue')}
                  className="flex items-center gap-1 ml-auto text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Revenu Attendu
                  <SortIcon field="expected_revenue" />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => handleSort('probability')}
                  className="flex items-center gap-1 ml-auto text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Probabilité
                  <SortIcon field="probability" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('create_date')}
                  className="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Date Création
                  <SortIcon field="create_date" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3">
                  <Link
                    to={`/crm/leads/${lead.id}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    {lead.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {lead.partner_name || '-'}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    {lead.stage_name}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">
                  {lead.expected_revenue
                    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(lead.expected_revenue)
                    : '-'}
                </td>
                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                  {lead.probability !== undefined ? `${lead.probability}%` : '-'}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {new Date(lead.create_date).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
