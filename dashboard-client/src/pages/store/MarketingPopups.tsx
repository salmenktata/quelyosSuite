/**
 * Page de gestion des popups marketing
 *
 * Fonctionnalités :
 * - CRUD complet des popups promotionnelles
 * - Configuration déclencheurs (délai, scroll, exit intent)
 * - Ciblage pages (toutes, homepage, produits, panier)
 * - Personnalisation design (position, couleurs, dimensions)
 * - Tracking vues et conversions
 */

import { useState } from 'react'
import { Layout } from '../../components/Layout'
import { useMarketingPopups, useCreateMarketingPopup, useUpdateMarketingPopup, useDeleteMarketingPopup, MarketingPopup } from '../../hooks/useMarketingPopups'
import { Button, SkeletonTable, PageNotice, Breadcrumbs } from '../../components/common'
import { useToast } from '../../hooks/useToast'
import { marketingNotices } from '@/lib/notices'

export default function MarketingPopupsPage() {
  const [editingPopup, setEditingPopup] = useState<MarketingPopup | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'trigger' | 'design'>('general')
  const { data: popups, isLoading, error, refetch } = useMarketingPopups()
  const createMutation = useCreateMarketingPopup()
  const updateMutation = useUpdateMarketingPopup()
  const deleteMutation = useDeleteMarketingPopup()
  const toast = useToast()

  const defaultFormData: {
    name: string
    popup_type: MarketingPopup['popup_type']
    title: string
    subtitle: string
    content: string
    cta_text: string
    cta_link: string
    cta_color: string
    show_close_button: boolean
    close_text: string
    trigger_type: MarketingPopup['trigger_type']
    trigger_delay: number
    trigger_scroll_percent: number
    target_pages: MarketingPopup['target_pages']
    custom_pages: string
    show_once_per_session: boolean
    show_once_per_user: boolean
    cookie_duration_days: number
    position: MarketingPopup['position']
    overlay_opacity: number
    max_width: number
    background_color: string
    text_color: string
    sequence: number
    active: boolean
  } = {
    name: '',
    popup_type: 'promotion',
    title: '',
    subtitle: '',
    content: '',
    cta_text: 'En savoir plus',
    cta_link: '/products',
    cta_color: '#01613a',
    show_close_button: true,
    close_text: 'Non merci',
    trigger_type: 'delay',
    trigger_delay: 3,
    trigger_scroll_percent: 50,
    target_pages: 'all',
    custom_pages: '',
    show_once_per_session: true,
    show_once_per_user: false,
    cookie_duration_days: 30,
    position: 'center',
    overlay_opacity: 0.5,
    max_width: 500,
    background_color: '#ffffff',
    text_color: '#000000',
    sequence: 10,
    active: true,
  }

  const [formData, setFormData] = useState(defaultFormData)

  const handleNew = () => {
    setIsCreating(true)
    setEditingPopup(null)
    setFormData(defaultFormData)
    setActiveTab('general')
  }

  const handleEdit = (popup: MarketingPopup) => {
    setEditingPopup(popup)
    setIsCreating(false)
    setFormData({
      name: popup.name || '',
      popup_type: popup.popup_type || 'promotion',
      title: popup.title || '',
      subtitle: popup.subtitle || '',
      content: popup.content || '',
      cta_text: popup.cta_text || 'En savoir plus',
      cta_link: popup.cta_link || '/products',
      cta_color: popup.cta_color || '#01613a',
      show_close_button: popup.show_close_button ?? true,
      close_text: popup.close_text || 'Non merci',
      trigger_type: popup.trigger_type || 'delay',
      trigger_delay: popup.trigger_delay || 3,
      trigger_scroll_percent: popup.trigger_scroll_percent || 50,
      target_pages: popup.target_pages || 'all',
      custom_pages: popup.custom_pages || '',
      show_once_per_session: popup.show_once_per_session ?? true,
      show_once_per_user: popup.show_once_per_user ?? false,
      cookie_duration_days: popup.cookie_duration_days || 30,
      position: popup.position || 'center',
      overlay_opacity: popup.overlay_opacity || 0.5,
      max_width: popup.max_width || 500,
      background_color: popup.background_color || '#ffffff',
      text_color: popup.text_color || '#000000',
      sequence: popup.sequence || 10,
      active: popup.active,
    })
    setActiveTab('general')
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingPopup(null)
    setActiveTab('general')
  }

  const handleSave = async () => {
    try {
      if (isCreating) {
        await createMutation.mutateAsync(formData)
        toast.success('Popup créée')
      } else if (editingPopup) {
        await updateMutation.mutateAsync({ id: editingPopup.id, ...formData })
        toast.success('Popup mise à jour')
      }
      handleCancel()
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette popup ?')) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Popup supprimée')
      if (editingPopup?.id === id) handleCancel()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const showForm = isCreating || editingPopup

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Store', href: '/store' },
            { label: 'Popups Marketing' },
          ]}
        />

        <PageNotice config={marketingNotices.popups} className="mb-6" />

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Popups Marketing</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Popups promotionnelles et d'engagement</p>
          </div>
          {!showForm && <Button onClick={handleNew}>Nouveau</Button>}
        </div>

        <div className={`grid gap-6 ${showForm ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Liste */}
          <div className="overflow-hidden">
            {isLoading ? (
              <SkeletonTable rows={5} columns={5} />
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6" role="alert">
                <p className="text-red-800 dark:text-red-200 mb-4">
                  Erreur lors du chargement des popups marketing
                </p>
                <Button variant="secondary" onClick={() => refetch && refetch()}>
                  Réessayer
                </Button>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Vues</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actif</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {popups?.map(p => (
                    <tr
                      key={p.id}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${editingPopup?.id === p.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                      onClick={() => handleEdit(p)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{p.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{p.popup_type}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{p.views_count || 0}</td>
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
                  {(!popups || popups.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        Aucune popup. Cliquez sur "Nouveau" pour en créer.
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
                  {isCreating ? 'Nouvelle Popup' : 'Modifier la Popup'}
                </h2>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {(['general', 'trigger', 'design'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium ${activeTab === tab ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                  >
                    {tab === 'general' ? 'Général' : tab === 'trigger' ? 'Déclencheur' : 'Design'}
                  </button>
                ))}
              </div>

              <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                {activeTab === 'general' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                        <select value={formData.popup_type} onChange={e => setFormData({ ...formData, popup_type: e.target.value as typeof formData.popup_type })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm">
                          <option value="newsletter">Newsletter</option>
                          <option value="promotion">Promotion</option>
                          <option value="announcement">Annonce</option>
                          <option value="exit_intent">Exit Intent</option>
                          <option value="welcome">Bienvenue</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre</label>
                      <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sous-titre</label>
                      <input type="text" value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contenu HTML</label>
                      <textarea rows={3} value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Texte CTA</label>
                        <input type="text" value={formData.cta_text} onChange={e => setFormData({ ...formData, cta_text: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lien CTA</label>
                        <input type="text" value={formData.cta_link} onChange={e => setFormData({ ...formData, cta_link: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="active" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                      <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">Actif</label>
                    </div>
                  </>
                )}

                {activeTab === 'trigger' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Déclencheur</label>
                      <select value={formData.trigger_type} onChange={e => setFormData({ ...formData, trigger_type: e.target.value as typeof formData.trigger_type })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm">
                        <option value="immediate">Immédiat</option>
                        <option value="delay">Après délai</option>
                        <option value="scroll">Après scroll</option>
                        <option value="exit_intent">Exit Intent</option>
                      </select>
                    </div>

                    {formData.trigger_type === 'delay' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Délai (sec)</label>
                        <input type="number" min="0" value={formData.trigger_delay} onChange={e => setFormData({ ...formData, trigger_delay: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm" />
                      </div>
                    )}

                    {formData.trigger_type === 'scroll' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scroll %</label>
                        <input type="number" min="0" max="100" value={formData.trigger_scroll_percent} onChange={e => setFormData({ ...formData, trigger_scroll_percent: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm" />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pages ciblées</label>
                      <select value={formData.target_pages} onChange={e => setFormData({ ...formData, target_pages: e.target.value as typeof formData.target_pages })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm">
                        <option value="all">Toutes</option>
                        <option value="home">Homepage</option>
                        <option value="products">Produits</option>
                        <option value="cart">Panier</option>
                        <option value="custom">Spécifiques</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={formData.show_once_per_session} onChange={e => setFormData({ ...formData, show_once_per_session: e.target.checked })} className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">1x par session</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={formData.show_once_per_user} onChange={e => setFormData({ ...formData, show_once_per_user: e.target.checked })} className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">1x par utilisateur</span>
                      </label>
                    </div>
                  </>
                )}

                {activeTab === 'design' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position</label>
                        <select value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value as typeof formData.position })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm">
                          <option value="center">Centre</option>
                          <option value="bottom_right">Bas droite</option>
                          <option value="bottom_left">Bas gauche</option>
                          <option value="top_banner">Bandeau haut</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Largeur max (px)</label>
                        <input type="number" min="300" max="800" value={formData.max_width} onChange={e => setFormData({ ...formData, max_width: parseInt(e.target.value) || 500 })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fond</label>
                        <input type="color" value={formData.background_color} onChange={e => setFormData({ ...formData, background_color: e.target.value })} className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Texte</label>
                        <input type="color" value={formData.text_color} onChange={e => setFormData({ ...formData, text_color: e.target.value })} className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CTA</label>
                        <input type="color" value={formData.cta_color} onChange={e => setFormData({ ...formData, cta_color: e.target.value })} className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                <Button onClick={handleCancel} variant="secondary">Annuler</Button>
                <Button onClick={handleSave} disabled={!formData.name}>Sauvegarder</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
