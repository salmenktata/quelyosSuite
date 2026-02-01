import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs } from '@/components/common'
import { apiClient } from '@/lib/api'

interface FiscalYear {
  id: number
  name: string
  dateFrom: string
  dateTo: string
}

export default function FiscalYearsPage() {
  const [years, setYears] = useState<FiscalYear[]>([])

  useEffect(() => {
    apiClient.post<{
      success: boolean;
      data: {
        fiscalYears: FiscalYear[];
      };
    }>('/finance/fiscal-years').then(res => {
      if (res.data.success && res.data.data) setYears(res.data.data.fiscalYears)
    })
  }, [])

  return (
    <Layout>
      <Breadcrumbs items={[{ label: 'Finance', path: '/finance' }, { label: 'Exercices Fiscaux', path: '/finance/fiscal-years' }]} />
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Exercices Fiscaux</h1>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
        {years.map((y) => (
          <div key={y.id} className="border-b border-gray-200 dark:border-gray-700 py-2 text-gray-900 dark:text-white">
            {y.name} : {y.dateFrom} → {y.dateTo}
          </div>
        ))}
      </div>
    </Layout>
  )
}
