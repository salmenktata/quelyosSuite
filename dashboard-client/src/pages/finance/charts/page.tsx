/**
 * Page Plan Comptable
 *
 * Fonctionnalités :
 * - Visualisation hiérarchique du plan comptable
 * - Filtres par classe (1-Capitaux, 2-Immobilisations, etc.)
 * - Actions CRUD sur les comptes
 * - Codes comptables normalisés
 */

import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice } from '@/components/common'
import { Button } from '@/components/common/Button'
import { financeNotices } from '@/lib/notices'
import { Coins, Plus, Search, Filter } from 'lucide-react'
import { useState } from 'react'

const accountClasses = [
  { id: 1, name: 'Classe 1 - Capitaux', color: 'blue' },
  { id: 2, name: 'Classe 2 - Immobilisations', color: 'green' },
  { id: 3, name: 'Classe 3 - Stocks', color: 'amber' },
  { id: 4, name: 'Classe 4 - Tiers', color: 'purple' },
  { id: 5, name: 'Classe 5 - Financiers', color: 'indigo' },
  { id: 6, name: 'Classe 6 - Charges', color: 'red' },
  { id: 7, name: 'Classe 7 - Produits', color: 'emerald' },
  { id: 8, name: 'Classe 8 - Spéciaux', color: 'gray' },
]

// Exemples de comptes (à remplacer par API)
const sampleAccounts = [
  { code: '101', name: 'Capital social', class: 1, active: true },
  { code: '106', name: 'Réserves', class: 1, active: true },
  { code: '120', name: 'Résultat de l\'exercice', class: 1, active: true },
  { code: '211', name: 'Terrains', class: 2, active: true },
  { code: '215', name: 'Installations techniques', class: 2, active: true },
  { code: '218', name: 'Matériel de bureau', class: 2, active: true },
  { code: '411', name: 'Clients', class: 4, active: true },
  { code: '401', name: 'Fournisseurs', class: 4, active: true },
  { code: '512', name: 'Banques', class: 5, active: true },
  { code: '530', name: 'Caisse', class: 5, active: true },
  { code: '606', name: 'Achats de matières premières', class: 6, active: true },
  { code: '611', name: 'Sous-traitance générale', class: 6, active: true },
  { code: '625', name: 'Déplacements, missions et réceptions', class: 6, active: true },
  { code: '706', name: 'Prestations de services', class: 7, active: true },
  { code: '707', name: 'Ventes de marchandises', class: 7, active: true },
]

export default function ChartsPage() {
  const [selectedClass, setSelectedClass] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredAccounts = sampleAccounts.filter(account => {
    const matchesClass = selectedClass === null || account.class === selectedClass
    const matchesSearch = searchTerm === '' ||
      account.code.includes(searchTerm) ||
      account.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesClass && matchesSearch
  })

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Finance', href: '/finance' },
            { label: 'Plan Comptable' },
          ]}
        />

        <PageNotice config={financeNotices.charts} className="mb-6" />

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-3">
              <Coins className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Plan Comptable
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Gérez vos comptes comptables et leur hiérarchie
              </p>
            </div>
          </div>
          <Button icon={<Plus className="h-4 w-4" />} variant="default">
            Nouveau compte
          </Button>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par code ou nom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtre par classe */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <select
                value={selectedClass ?? ''}
                onChange={(e) => setSelectedClass(e.target.value ? Number(e.target.value) : null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent"
              >
                <option value="">Toutes les classes</option>
                {accountClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Classes badges */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedClass(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedClass === null
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-2 border-amber-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Toutes ({sampleAccounts.length})
          </button>
          {accountClasses.map(cls => {
            const count = sampleAccounts.filter(acc => acc.class === cls.id).length
            const isSelected = selectedClass === cls.id
            return (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isSelected
                    ? `bg-${cls.color}-100 dark:bg-${cls.color}-900/30 text-${cls.color}-700 dark:text-${cls.color}-300 border-2 border-${cls.color}-400`
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Classe {cls.id} ({count})
              </button>
            )
          })}
        </div>

        {/* Table des comptes */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Nom du compte
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Classe
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Aucun compte trouvé
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => {
                  const accountClass = accountClasses.find(c => c.id === account.class)
                  return (
                    <tr key={account.code} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-gray-900 dark:text-white">
                          {account.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {account.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${accountClass?.color}-100 dark:bg-${accountClass?.color}-900/30 text-${accountClass?.color}-800 dark:text-${accountClass?.color}-300`}>
                          Classe {account.class}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {account.active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            Inactif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 font-medium">
                          Modifier
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Stats footer */}
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredAccounts.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Comptes affichés</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{sampleAccounts.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total comptes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{accountClasses.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Classes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {sampleAccounts.filter(a => a.active).length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Comptes actifs</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
