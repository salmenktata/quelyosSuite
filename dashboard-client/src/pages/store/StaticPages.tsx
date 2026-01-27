import { useState } from 'react'
import { Layout } from '../../components/Layout'
import { useStaticPages, useCreateStaticPage, useUpdateStaticPage, useDeleteStaticPage, StaticPage } from '../../hooks/useStaticPages'
import { Button, SkeletonTable, PageNotice, Breadcrumbs } from '../../components/common'
import { useToast } from '../../hooks/useToast'
import { marketingNotices } from '@/lib/notices'

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
      toast.error('Erreur lors de la suppression')
    }
  }

  const showForm = isCreating || editingPage

  return (
    <Layout>
      <Breadcrumbs
        items={[
          { label: 'Accueil', href: '/dashboard' },
          { label: 'Boutique', href: '/store/my-shop' },
          { label: 'Pages Statiques' },
        ]}
      />
      <div className="p-6 bg-white dark:bg-gray-800 min-h-screen">
        <PageNotice config={marketingNotices.staticPages} className="mb-6" />

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pages Statiques</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pages institutionnelles (À propos, CGV, etc.)</p>
          </div>
          {!showForm && <Button onClick={handleNew}>Nouvelle page</Button>}
        </div>

        <div className={`grid gap-6 ${showForm ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Liste */}
          <div className="overflow-hidden">
            {isLoading ? <SkeletonTable rows={5} columns={4} /> : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Slug</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actif</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {pages?.map(p => (
                    <tr
                      key={p.id}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${editingPage?.id === p.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                      onClick={() => handleEdit(p)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{p.name}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400">{p.slug}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${p.active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {p.active ? 'Oui' : 'Non'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button onClick={(e) => { e.stopPropagation(); handleDelete(p.id) }} size="sm" variant="secondary">Supprimer</Button>
                      </td>
                    </tr>
                  ))}
                  {(!pages || pages.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        Aucune page. Cliquez sur "Nouvelle page" pour en créer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Formulaire inline */}
          {showForm && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {isCreating ? 'Nouvelle Page' : 'Modifier la Page'}
                </h2>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {(['general', 'content', 'navigation'] as const).map(tab => (
                  <Button
                    key={tab}
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab(tab)}
                    className={`!rounded-none px-4 py-2 text-sm font-medium ${activeTab === tab ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                  >
                    {tab === 'general' ? 'Général' : tab === 'content' ? 'Contenu' : 'Navigation'}
                  </Button>
                ))}
              </div>

              <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                {activeTab === 'general' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => {
                          const name = e.target.value
                          setFormData({ ...formData, name, slug: isCreating ? generateSlug(name) : formData.slug })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm"
                        placeholder="À propos de nous"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug (URL) *</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={e => setFormData({ ...formData, slug: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm font-mono"
                        placeholder="about-us"
                      />
                      <p className="text-xs text-gray-500 mt-1">URL : /pages/{formData.slug}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm"
                        placeholder="Titre affiché sur la page"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Layout</label>
                      <select
                        value={formData.layout}
                        onChange={e => setFormData({ ...formData, layout: e.target.value as typeof formData.layout })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm"
                      >
                        <option value="default">Par défaut</option>
                        <option value="full_width">Pleine largeur</option>
                        <option value="centered">Centré</option>
                        <option value="with_sidebar">Avec sidebar</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="active" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                      <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">Page active</label>
                    </div>
                  </>
                )}

                {activeTab === 'content' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sous-titre</label>
                      <input
                        type="text"
                        value={formData.subtitle}
                        onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contenu (HTML)</label>
                      <textarea
                        rows={8}
                        value={formData.content}
                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm font-mono"
                        placeholder="<p>Contenu de la page...</p>"
                      />
                    </div>

                    {formData.layout === 'with_sidebar' && (
                      <>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={formData.show_sidebar} onChange={e => setFormData({ ...formData, show_sidebar: e.target.checked })} className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Afficher la sidebar</span>
                        </div>
                        {formData.show_sidebar && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contenu sidebar</label>
                            <textarea
                              rows={4}
                              value={formData.sidebar_content}
                              onChange={e => setFormData({ ...formData, sidebar_content: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {activeTab === 'navigation' && (
                  <>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={formData.show_in_footer} onChange={e => setFormData({ ...formData, show_in_footer: e.target.checked })} className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Afficher dans le footer</span>
                      </label>

                      {formData.show_in_footer && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Colonne footer</label>
                          <select
                            value={formData.footer_column}
                            onChange={e => setFormData({ ...formData, footer_column: e.target.value as typeof formData.footer_column })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm"
                          >
                            <option value="">Sélectionner...</option>
                            <option value="company">Entreprise</option>
                            <option value="help">Aide</option>
                            <option value="legal">Légal</option>
                          </select>
                        </div>
                      )}

                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={formData.show_in_menu} onChange={e => setFormData({ ...formData, show_in_menu: e.target.checked })} className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Afficher dans le menu principal</span>
                      </label>

                      {formData.show_in_menu && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position menu</label>
                          <input
                            type="number"
                            min="0"
                            value={formData.menu_position}
                            onChange={e => setFormData({ ...formData, menu_position: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                <Button onClick={handleCancel} variant="secondary">Annuler</Button>
                <Button onClick={handleSave} disabled={!formData.name || !formData.slug}>Sauvegarder</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
