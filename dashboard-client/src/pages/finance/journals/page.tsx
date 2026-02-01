import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs } from '@/components/common'
import { apiClient } from '@/lib/api'

export default function JournalsPage() {
  const [journals, setJournals] = useState<any[]>([])

  useEffect(() => {
    apiClient.post<{
      success: boolean;
      data: {
        journals: any[];
      };
      error?: string;
    }>('/finance/journals').then(res => {
      if (res.data.success && res.data.data) setJournals(res.data.data.journals as any[])
    })
  }, [])

  return (
    <Layout>
      <Breadcrumbs items={[{ label: 'Finance', path: '/finance' }, { label: 'Journaux', path: '/finance/journals' }]} />
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Journaux Comptables</h1>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
        {journals.map((j: any) => (
          <div key={j.id} className="border-b border-gray-200 dark:border-gray-700 py-2 text-gray-900 dark:text-white">
            [{j.code}] {j.name} - {j.type}
          </div>
        ))}
      </div>
    </Layout>
  )
}
