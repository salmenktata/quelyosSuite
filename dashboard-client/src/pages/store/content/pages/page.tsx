import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, PageNotice } from '@/components/common'
import { Plus } from 'lucide-react'
import { storeNotices } from '@/lib/notices'

export default function StaticPagesPage() {
  const breadcrumbItems = [
    { label: 'Tableau de bord', path: '/dashboard' },
    { label: 'Store', path: '/store' },
    { label: 'Pages Statiques' },
  ]

  return (
    <Layout>
      <Breadcrumbs items={breadcrumbItems} />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pages Statiques
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Créez et gérez vos pages CGV, À propos, FAQ avec éditeur WYSIWYG
          </p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />}>
          Nouvelle Page
        </Button>
      </div>

      <PageNotice config={storeNotices.staticPages} className="mb-6" />

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Feature en cours de développement - TipTap éditeur installé ✅
        </p>
      </div>
    </Layout>
  )
}
