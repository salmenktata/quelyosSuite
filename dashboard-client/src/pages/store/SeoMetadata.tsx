/**
 * Page SEO Metadata - Gestion des balises meta pour le référencement
 *
 * Fonctionnalités :
 * - Liste des métadonnées SEO par page/slug
 * - Création/édition/suppression de metadata
 * - Onglets : Balises Meta / Open Graph / Avancé
 * - Score SEO et optimisation keywords
 * - Gestion noindex/nofollow/schema.org
 */

import { useState } from 'react'
import { Plus, Trash2, X, Save } from 'lucide-react'
import { Layout } from '../../components/Layout'
import { useSeoMetadataList, useCreateSeoMetadata, useUpdateSeoMetadata, useDeleteSeoMetadata, SeoMetadata } from '../../hooks/useSeoMetadata'
import { Button, SkeletonTable, PageNotice, Breadcrumbs } from '../../components/common'
import { useToast } from '../../hooks/useToast'
import { storeNotices } from '@/lib/notices'

export default function SeoMetadataPage() {
  const [editingMetadata, setEditingMetadata] = useState<SeoMetadata | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<'meta' | 'og' | 'advanced'>('meta')
  const { data: metadataList, isLoading } = useSeoMetadataList()
  const createMutation = useCreateSeoMetadata()
  const updateMutation = useUpdateSeoMetadata()
  const deleteMutation = useDeleteSeoMetadata()
  const toast = useToast()

  const defaultFormData: {
    name: string
    page_type: SeoMetadata['page_type']
    slug: string
    meta_title: string
    meta_description: string
    og_type: SeoMetadata['og_type']
    og_image_url: string
    twitter_card: SeoMetadata['twitter_card']
    schema_type: SeoMetadata['schema_type']
    focus_keyword: string
    noindex: boolean
    nofollow: boolean
    active: boolean
  } = {
    name: '',
    page_type: 'static',
    slug: '',
    meta_title: '',
    meta_description: '',
    og_type: 'website',
    og_image_url: '',
    twitter_card: 'summary_large_image',
    schema_type: 'WebPage',
    focus_keyword: '',
    noindex: false,
    nofollow: false,
    active: true,
  }

  const [formData, setFormData] = useState(defaultFormData)

  const handleNew = () => {
    setIsCreating(true)
    setEditingMetadata(null)
    setFormData(defaultFormData)
    setActiveTab('meta')
  }

  const handleEdit = (metadata: SeoMetadata) => {
    setEditingMetadata(metadata)
    setIsCreating(false)
    setFormData({
      name: metadata.name || '',
      page_type: metadata.page_type || 'static',
      slug: metadata.slug || '',
      meta_title: metadata.meta_title || '',
      meta_description: metadata.meta_description || '',
      og_type: metadata.og_type || 'website',
      og_image_url: metadata.og_image_url || '',
      twitter_card: metadata.twitter_card || 'summary_large_image',
      schema_type: metadata.schema_type || 'WebPage',
      focus_keyword: metadata.focus_keyword || '',
      noindex: metadata.noindex || false,
      nofollow: metadata.nofollow || false,
      active: metadata.active,
    })
    setActiveTab('meta')
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingMetadata(null)
    setActiveTab('meta')
  }

  const handleSave = async () => {
    try {
      if (isCreating) {
        await createMutation.mutateAsync(formData)
        toast.success('Metadata SEO créée')
      } else if (editingMetadata) {
        await updateMutation.mutateAsync({ id: editingMetadata.id, ...formData })
        toast.success('Metadata SEO mise à jour')
      }
      handleCancel()
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette metadata ?')) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Metadata supprimée')
      if (editingMetadata?.id === id) handleCancel()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400'
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const showForm = isCreating || editingMetadata

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Store', href: '/store' },
            { label: 'SEO Métadonnées' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SEO Metadata</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Balises meta pour le référencement</p>
          </div>
          {!showForm && (
            <Button onClick={handleNew} icon={<Plus className="h-4 w-4" />}>
              Nouveau
            </Button>
          )}
        </div>

        <PageNotice config={storeNotices.seoMetadata} className="mb-6" />

        <div className={`grid gap-6 ${showForm ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Liste */}
          <div className="overflow-hidden">
            {isLoading ? <SkeletonTable rows={5} columns={5} /> : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Slug</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actif</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {metadataList?.map(m => (
                    <tr
                      key={m.id}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${editingMetadata?.id === m.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                      onClick={() => handleEdit(m)}
                    >
                      <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">{m.slug}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{m.page_type}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm ${getScoreColor(m.seo_score)}`}>{m.seo_score || 0}/100</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${m.active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {m.active ? 'Oui' : 'Non'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          onClick={(e) => { e.stopPropagation(); handleDelete(m.id) }}
                          size="sm"
                          variant="danger"
                          icon={<Trash2 className="h-3.5 w-3.5" />}
                        >
                          Supprimer
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(!metadataList || metadataList.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        Aucune metadata. Cliquez sur "Nouveau" pour en créer.
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
                  {isCreating ? 'Nouvelle Metadata' : 'Modifier la Metadata'}
                </h2>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {(['meta', 'og', 'advanced'] as const).map(tab => (
                  <Button
                    key={tab}
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab(tab)}
                    className={`!rounded-none px-4 py-2 text-sm font-medium ${activeTab === tab ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                  >
                    {tab === 'meta' ? 'Balises Meta' : tab === 'og' ? 'Open Graph' : 'Avancé'}
                  </Button>
                ))}
              </div>

              <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                {activeTab === 'meta' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Nom interne</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm" placeholder="Homepage" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Type de page</label>
                        <select value={formData.page_type} onChange={e => setFormData({ ...formData, page_type: e.target.value as typeof formData.page_type })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm">
                          <option value="home">Homepage</option>
                          <option value="product">Page Produit</option>
                          <option value="category">Page Catégorie</option>
                          <option value="static">Page Statique</option>
                          <option value="collection">Collection</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Slug (URL)</label>
                      <input type="text" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm font-mono" placeholder="/about-us" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Meta Title <span className="text-xs text-gray-500">({formData.meta_title.length}/60)</span>
                      </label>
                      <input type="text" maxLength={60} value={formData.meta_title} onChange={e => setFormData({ ...formData, meta_title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Meta Description <span className="text-xs text-gray-500">({formData.meta_description.length}/160)</span>
                      </label>
                      <textarea maxLength={160} rows={3} value={formData.meta_description} onChange={e => setFormData({ ...formData, meta_description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm" />
                    </div>
                  </>
                )}

                {activeTab === 'og' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">OG Image URL</label>
                      <input type="url" value={formData.og_image_url} onChange={e => setFormData({ ...formData, og_image_url: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm" placeholder="https://..." />
                      <p className="text-xs text-gray-500 mt-1">Recommandé : 1200x630px</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">OG Type</label>
                        <select value={formData.og_type} onChange={e => setFormData({ ...formData, og_type: e.target.value as typeof formData.og_type })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm">
                          <option value="website">Website</option>
                          <option value="article">Article</option>
                          <option value="product">Product</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Twitter Card</label>
                        <select value={formData.twitter_card} onChange={e => setFormData({ ...formData, twitter_card: e.target.value as typeof formData.twitter_card })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm">
                          <option value="summary">Summary</option>
                          <option value="summary_large_image">Summary Large Image</option>
                          <option value="product">Product</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'advanced' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Schema.org Type</label>
                        <select value={formData.schema_type} onChange={e => setFormData({ ...formData, schema_type: e.target.value as typeof formData.schema_type })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm">
                          <option value="WebPage">WebPage</option>
                          <option value="Product">Product</option>
                          <option value="Article">Article</option>
                          <option value="Organization">Organization</option>
                          <option value="FAQPage">FAQPage</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Focus Keyword</label>
                        <input type="text" value={formData.focus_keyword} onChange={e => setFormData({ ...formData, focus_keyword: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm" placeholder="mot-clé principal" />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={formData.noindex} onChange={e => setFormData({ ...formData, noindex: e.target.checked })} className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                        <span className="text-sm text-gray-900 dark:text-white">NoIndex</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={formData.nofollow} onChange={e => setFormData({ ...formData, nofollow: e.target.checked })} className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                        <span className="text-sm text-gray-900 dark:text-white">NoFollow</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                        <span className="text-sm text-gray-900 dark:text-white">Actif</span>
                      </label>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                <Button onClick={handleCancel} variant="secondary" icon={<X className="h-4 w-4" />}>
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={!formData.slug} icon={<Save className="h-4 w-4" />}>
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
