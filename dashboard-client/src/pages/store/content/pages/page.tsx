/**
 * Static Pages CMS Management Page
 *
 * Gestion complète des pages statiques (CGV, À propos, FAQ, etc.)
 *
 * Features principales:
 * - Liste des pages avec filtres (brouillon/publié)
 * - Éditeur WYSIWYG TipTap avec toolbar complète
 * - Preview HTML temps réel
 * - Gestion SEO (meta title, meta description)
 * - Slug automatique depuis le titre
 * - Multi-tenant isolation
 *
 * API Endpoints:
 * - GET /api/admin/static-pages (liste)
 * - POST /api/admin/static-pages/save (création/édition)
 * - GET /api/ecommerce/pages/:slug (affichage public)
 */

import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, PageNotice, Badge, Modal } from '@/components/common'
import { RichTextEditor } from '@/components/editor'
import { Plus, Edit, Eye, Save } from 'lucide-react'
import { storeNotices } from '@/lib/notices'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface StaticPage {
  id: number
  name: string
  slug: string
  content_html: string
  meta_title: string
  meta_description: string
  state: 'draft' | 'published'
  sequence: number
  active: boolean
}

interface PageFormData {
  id?: number
  name: string
  slug: string
  content_html: string
  meta_title: string
  meta_description: string
  state: 'draft' | 'published'
}

export default function StaticPagesPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<PageFormData | null>(null)
  const [filterState, setFilterState] = useState<'all' | 'draft' | 'published'>('all')

  const breadcrumbItems = [
    { label: 'Tableau de bord', path: '/dashboard' },
    { label: 'Store', path: '/store' },
    { label: 'Pages Statiques' },
  ]

  // Fetch pages
  const { data: pages = [], isLoading } = useQuery<StaticPage[]>({
    queryKey: ['static-pages'],
    queryFn: async () => {
      const response = await api.post('/api/admin/static-pages', {})
      return response.data.pages || []
    },
  })

  // Save page mutation
  const saveMutation = useMutation({
    mutationFn: async (data: PageFormData) => {
      const response = await api.post('/api/admin/static-pages/save', {
        id: data.id,
        name: data.name,
        slug: data.slug,
        content_html: data.content_html,
        meta_title: data.meta_title,
        meta_description: data.meta_description,
        state: data.state,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['static-pages'] })
      setIsModalOpen(false)
      setEditingPage(null)
    },
  })

  const handleNewPage = () => {
    setEditingPage({
      name: '',
      slug: '',
      content_html: '',
      meta_title: '',
      meta_description: '',
      state: 'draft',
    })
    setIsModalOpen(true)
  }

  const handleEdit = (page: StaticPage) => {
    setEditingPage({
      id: page.id,
      name: page.name,
      slug: page.slug,
      content_html: page.content_html,
      meta_title: page.meta_title,
      meta_description: page.meta_description,
      state: page.state,
    })
    setIsModalOpen(true)
  }

  const handleSave = () => {
    if (editingPage) {
      saveMutation.mutate(editingPage)
    }
  }

  const handleNameChange = (name: string) => {
    if (!editingPage) return
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    setEditingPage({ ...editingPage, name, slug })
  }

  const filteredPages = pages.filter((page) => {
    if (filterState === 'all') return true
    return page.state === filterState
  })

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
        <Button icon={<Plus className="h-4 w-4" />} onClick={handleNewPage}>
          Nouvelle Page
        </Button>
      </div>

      <PageNotice config={storeNotices.staticPages} className="mb-6" />

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilterState('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterState === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Toutes ({pages.length})
        </button>
        <button
          onClick={() => setFilterState('draft')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterState === 'draft'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Brouillons ({pages.filter((p) => p.state === 'draft').length})
        </button>
        <button
          onClick={() => setFilterState('published')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterState === 'published'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Publiées ({pages.filter((p) => p.state === 'published').length})
        </button>
      </div>

      {/* Pages List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Chargement des pages...
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Aucune page pour le moment. Créez votre première page !
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-gray-900 dark:text-white">
                  Titre
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900 dark:text-white">
                  Slug
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900 dark:text-white">
                  État
                </th>
                <th className="text-right p-4 text-sm font-semibold text-gray-900 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPages.map((page) => (
                <tr
                  key={page.id}
                  className="border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="p-4 text-sm text-gray-900 dark:text-white font-medium">
                    {page.name}
                  </td>
                  <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                    /{page.slug}
                  </td>
                  <td className="p-4">
                    <Badge variant={page.state === 'published' ? 'success' : 'warning'}>
                      {page.state === 'published' ? 'Publié' : 'Brouillon'}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(page)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {page.state === 'published' && (
                        <a
                          href={`/pages/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                          title="Voir sur le site"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit/Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPage?.id ? 'Modifier la page' : 'Nouvelle page'}
        size="xl"
      >
        {editingPage && (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editingPage.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="À propos de nous"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Slug URL <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">/pages/</span>
                <input
                  type="text"
                  value={editingPage.slug}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, slug: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="a-propos"
                />
              </div>
            </div>

            {/* Content Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contenu
              </label>
              <RichTextEditor
                content={editingPage.content_html}
                onChange={(html) =>
                  setEditingPage({ ...editingPage, content_html: html })
                }
                placeholder="Rédigez le contenu de votre page..."
                minHeight="400px"
              />
            </div>

            {/* SEO Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                SEO & Métadonnées
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Meta Title (60 caractères max)
                  </label>
                  <input
                    type="text"
                    value={editingPage.meta_title}
                    onChange={(e) =>
                      setEditingPage({ ...editingPage, meta_title: e.target.value })
                    }
                    maxLength={60}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Titre optimisé pour les moteurs de recherche"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {editingPage.meta_title.length}/60 caractères
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Meta Description (160 caractères max)
                  </label>
                  <textarea
                    value={editingPage.meta_description}
                    onChange={(e) =>
                      setEditingPage({
                        ...editingPage,
                        meta_description: e.target.value,
                      })
                    }
                    maxLength={160}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Description concise pour les résultats de recherche"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {editingPage.meta_description.length}/160 caractères
                  </p>
                </div>
              </div>
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                État de publication
              </label>
              <select
                value={editingPage.state}
                onChange={(e) =>
                  setEditingPage({
                    ...editingPage,
                    state: e.target.value as 'draft' | 'published',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Annuler
              </Button>
              <Button
                icon={<Save className="h-4 w-4" />}
                onClick={handleSave}
                disabled={saveMutation.isPending || !editingPage.name || !editingPage.slug}
              >
                {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  )
}
