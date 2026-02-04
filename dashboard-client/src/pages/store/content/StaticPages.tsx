/**
 * Page Pages Statiques - Gestion des pages institutionnelles
 *
 * Fonctionnalités :
 * - Liste des pages statiques (À propos, CGV, CGU, etc.)
 * - Création/édition/suppression de pages
 * - Configuration complète (contenu, layout, sidebar, navigation)
 * - Organisation par onglets (général, contenu, navigation)
 * - Génération automatique du slug à partir du nom
 * - Affichage conditionnel dans le footer et le menu
 */

import { useState } from 'react'
import { Plus, Trash2, X, Save } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { useStaticPages, useCreateStaticPage, useUpdateStaticPage, useDeleteStaticPage, StaticPage } from '@/hooks/useStaticPages'
import { Button, SkeletonTable, PageNotice, Breadcrumbs } from '@/components/common'
import { useToast } from '@/hooks/useToast'
import { storeNotices } from '@/lib/notices'
import { logger } from '@quelyos/logger';

export default function StaticPagesPage() {
  const [editingPage, setEditingPage] = useState<StaticPage | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'content' | 'navigation'>('general')
  const { data: pages, isLoading } = useStaticPages()
  const createMutation = useCreateStaticPage()
  const updateMutation = useUpdateStaticPage()
  const deleteMutation = useDeleteStaticPage()
  const toast = useToast()

  const defaultFormData: {
    name: string
    slug: string
    title: string
    subtitle: string
    content: string
    layout: StaticPage['layout']
    show_sidebar: boolean
    sidebar_content: string
    show_header_image: boolean
    show_in_footer: boolean
    footer_column: StaticPage['footer_column'] | ''
    show_in_menu: boolean
    menu_position: number
    active: boolean
  } = {
    name: '',
    slug: '',
    title: '',
    subtitle: '',
    content: '',
    layout: 'default',
    show_sidebar: false,
    sidebar_content: '',
    show_header_image: false,
    show_in_footer: false,
    footer_column: '',
    show_in_menu: false,
    menu_position: 100,
    active: true,
  }

  const [formData, setFormData] = useState(defaultFormData)

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  const handleNew = () => {
    setIsCreating(true)
    setEditingPage(null)
    setFormData(defaultFormData)
    setActiveTab('general')
  }

  const handleEdit = (page: StaticPage) => {
    setEditingPage(page)
    setIsCreating(false)
    setFormData({
      name: page.name || '',
      slug: page.slug || '',
      title: page.title || '',
      subtitle: page.subtitle || '',
      content: page.content || '',
      layout: page.layout || 'default',
      show_sidebar: page.show_sidebar || false,
      sidebar_content: page.sidebar_content || '',
      show_header_image: page.show_header_image || false,
      show_in_footer: page.show_in_footer || false,
      footer_column: page.footer_column || '',
      show_in_menu: page.show_in_menu || false,
      menu_position: page.menu_position || 100,
      active: page.active,
    })
    setActiveTab('general')
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingPage(null)
    setActiveTab('general')
  }

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        footer_column: formData.footer_column || undefined,
      }
      if (isCreating) {
        await createMutation.mutateAsync(payload)
        toast.success('Page créée')
      } else if (editingPage) {
        await updateMutation.mutateAsync({ id: editingPage.id, ...payload })
        toast.success('Page mise à jour')
      }
      handleCancel()
    } catch {
      logger.error("Erreur attrapée");
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette page ?')) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Page supprimée')
      if (editingPage?.id === id) handleCancel()
    } catch {
      logger.error("Erreur attrapée");
      toast.error('Erreur lors de la suppression')
    }
  }

  const showForm = isCreating || editingPage

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Store', href: '/store' },
            { label: 'Pages Statiques' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pages Statiques</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Pages institutionnelles (À propos, CGV, Mentions légales, etc.)
            </p>
          </div>
          {!showForm && (
            <Button onClick={handleNew} icon={<Plus className="h-4 w-4" />}>
              Nouvelle page
            </Button>
          )}
        </div>

        <PageNotice config={storeNotices.staticPages} className="mb-6" />

        <div className={`grid gap-6 ${showForm ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Liste */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
            {isLoading ? (
              <div className="p-6">
                <SkeletonTable rows={5} columns={4} />
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Slug</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actif</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {pages?.map(p => (
                    <tr
                      key={p.id}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${editingPage?.id === p.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                      onClick={() => handleEdit(p)}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{p.name}</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-500 dark:text-gray-400">{p.slug}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${p.active ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {p.active ? 'Oui' : 'Non'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          onClick={(e) => { e.stopPropagation(); handleDelete(p.id) }}
                          size="sm"
                          variant="danger"
                          icon={<Trash2 className="h-3.5 w-3.5" />}
                        >
                          Supprimer
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(!pages || pages.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        Aucune page. Cliquez sur "Nouvelle page" pour en créer une.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Formulaire avec onglets */}
          {showForm && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {isCreating ? 'Nouvelle Page' : 'Modifier la Page'}
              </h2>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                    activeTab === 'general'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white dark:hover:text-gray-300'
                  }`}
                >
                  Général
                </button>
                <button
                  onClick={() => setActiveTab('content')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                    activeTab === 'content'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white dark:hover:text-gray-300'
                  }`}
                >
                  Contenu
                </button>
                <button
                  onClick={() => setActiveTab('navigation')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                    activeTab === 'navigation'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white dark:hover:text-gray-300'
                  }`}
                >
                  Navigation
                </button>
              </div>

              {/* Tab Content */}
              <div className="space-y-4">
                {activeTab === 'general' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Nom *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => {
                          const name = e.target.value
                          setFormData({ ...formData, name, slug: generateSlug(name) })
                        }}
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        placeholder="À propos"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Slug</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={e => setFormData({ ...formData, slug: e.target.value })}
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white font-mono text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        placeholder="a-propos"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Layout</label>
                      <select
                        value={formData.layout}
                        onChange={e => setFormData({ ...formData, layout: e.target.value as StaticPage['layout'] })}
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      >
                        <option value="default" className="bg-white dark:bg-gray-900">Par défaut</option>
                        <option value="full_width" className="bg-white dark:bg-gray-900">Pleine largeur</option>
                        <option value="narrow" className="bg-white dark:bg-gray-900">Étroit</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="active"
                        checked={formData.active}
                        onChange={e => setFormData({ ...formData, active: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
                      />
                      <label htmlFor="active" className="text-sm font-medium text-gray-900 dark:text-white">
                        Page active
                      </label>
                    </div>
                  </>
                )}

                {activeTab === 'content' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Titre</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        placeholder="Titre de la page"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Sous-titre</label>
                      <input
                        type="text"
                        value={formData.subtitle}
                        onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        placeholder="Sous-titre"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Contenu</label>
                      <textarea
                        value={formData.content}
                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                        rows={10}
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        placeholder="Contenu HTML de la page"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="show_header_image"
                        checked={formData.show_header_image}
                        onChange={e => setFormData({ ...formData, show_header_image: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
                      />
                      <label htmlFor="show_header_image" className="text-sm font-medium text-gray-900 dark:text-white">
                        Afficher image d'en-tête
                      </label>
                    </div>
                  </>
                )}

                {activeTab === 'navigation' && (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="show_in_footer"
                        checked={formData.show_in_footer}
                        onChange={e => setFormData({ ...formData, show_in_footer: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
                      />
                      <label htmlFor="show_in_footer" className="text-sm font-medium text-gray-900 dark:text-white">
                        Afficher dans le footer
                      </label>
                    </div>

                    {formData.show_in_footer && (
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Colonne footer</label>
                        <select
                          value={formData.footer_column}
                          onChange={e => setFormData({ ...formData, footer_column: e.target.value as StaticPage['footer_column'] | '' })}
                          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        >
                          <option value="" className="bg-white dark:bg-gray-900">-- Choisir --</option>
                          <option value="col1" className="bg-white dark:bg-gray-900">Colonne 1</option>
                          <option value="col2" className="bg-white dark:bg-gray-900">Colonne 2</option>
                          <option value="col3" className="bg-white dark:bg-gray-900">Colonne 3</option>
                        </select>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="show_in_menu"
                        checked={formData.show_in_menu}
                        onChange={e => setFormData({ ...formData, show_in_menu: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
                      />
                      <label htmlFor="show_in_menu" className="text-sm font-medium text-gray-900 dark:text-white">
                        Afficher dans le menu
                      </label>
                    </div>

                    {formData.show_in_menu && (
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Position menu</label>
                        <input
                          type="number"
                          value={formData.menu_position}
                          onChange={e => setFormData({ ...formData, menu_position: Number(e.target.value) })}
                          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button onClick={handleCancel} variant="secondary" icon={<X className="h-4 w-4" />}>
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={!formData.name} icon={<Save className="h-4 w-4" />}>
                  Sauvegarder
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
