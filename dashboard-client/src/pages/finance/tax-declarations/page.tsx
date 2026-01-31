import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button } from '@/components/common'
import { FileDown, Plus, Send, CheckCircle, Clock } from 'lucide-react'
import { useTaxReports } from '@/hooks/useTaxReports'
import { formatCurrency } from '@/lib/utils'

export default function TaxDeclarationsPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [country, setCountry] = useState('FR')
  
  const { reports, loading, generate, exportEdiTva, submit } = useTaxReports({ year, country })

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  return (
    <Layout>
      <Breadcrumbs
        items={[
          { label: 'Finance', path: '/finance' },
          { label: 'Déclarations TVA', path: '/finance/tax-declarations' },
        ]}
      />

      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Déclarations TVA
      </h1>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Année</label>
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Pays</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="FR">France (CA3 / EDI-TVA)</option>
              <option value="BE">Belgique (INTERVAT)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grille mensuelle */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {months.map((month, index) => {
          const monthNum = index + 1
          const report = reports.find((r: any) => r.month === monthNum)

          return (
            <div key={monthNum} className="bg-white dark:bg-gray-800 rounded-lg border p-4">
              <div className="flex justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{month}</h3>
                {report?.state === 'submitted' ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />Soumise
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    <Clock className="w-3 h-3 mr-1" />Brouillon
                  </span>
                )}
              </div>

              {report ? (
                <>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">TVA collectée</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(report.vatCollected, '€')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">TVA déductible</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(report.vatDeductible, '€')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="font-medium text-gray-700 dark:text-gray-300">TVA nette</span>
                      <span className="font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(report.vatNet, '€')}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" icon={FileDown} 
                      onClick={() => exportEdiTva(report.id)} fullWidth>Export</Button>
                    {report.state !== 'submitted' && (
                      <Button variant="primary" size="sm" icon={Send} 
                        onClick={() => submit(report.id)} fullWidth>Soumettre</Button>
                    )}
                  </div>
                </>
              ) : (
                <Button variant="outline" size="sm" icon={Plus} 
                  onClick={() => generate(year, monthNum, country)} fullWidth>Générer</Button>
              )}
            </div>
          )
        })}
      </div>
    </Layout>
  )
}
