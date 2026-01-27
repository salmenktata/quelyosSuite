/**
 * Page Menus Navigation - Gestion des menus header et footer
 *
 * Fonctionnalités :
 * - Liste des menus avec réorganisation par glisser-déposer
 * - Création/édition/suppression de menus
 * - Configuration complète (libellé, URL, icône, classes CSS)
 * - Options avancées (nouvel onglet, authentification requise)
 * - Compteur d'éléments enfants
 * - Séquence de tri personnalisable
 */

import { useState, useCallback } from 'react'
import { Plus, Trash2, X, Save, GripVertical } from 'lucide-react'
import { Layout } from '../../components/Layout'
import {
  useMenus,
  useCreateMenu,
  useUpdateMenu,
  useDeleteMenu,
  useReorderMenus,
  type MenuItem,
} from '../../hooks/useMenus'
import { PageNotice, Breadcrumbs } from '../../components/common'
import { storeNotices } from '@/lib/notices'
import { Badge, Button, SkeletonTable } from '../../components/common'
import { useToast } from '../../hooks/useToast'

export default function Menus() {
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [draggedId, setDraggedId] = useState<number | null>(null)

  const defaultFormData = {
    name: '',
    code: '',
    label: '',
    url: '',
    icon: '',
    description: '',
    parent_id: null as number | null,
    active: true,
    open_new_tab: false,
    requires_auth: false,
    css_class: '',
  }

  const [formData, setFormData] = useState(defaultFormData)

  const { data, isLoading, error } = useMenus()
  const createMutation = useCreateMenu()
  const updateMutation = useUpdateMenu()
  const deleteMutation = useDeleteMenu()
  const reorderMutation = useReorderMenus()
  const toast = useToast()

  const menus = (data?.data?.menus || []) as MenuItem[]

  const handleNew = () => {
    setIsCreating(true)
    setEditingMenu(null)
    setFormData(defaultFormData)
  }

  const handleEdit = (menu: MenuItem) => {
    setEditingMenu(menu)
    setIsCreating(false)
    setFormData({
      name: menu.name,
      code: menu.code,
      label: menu.label,
      url: menu.url,
      icon: menu.icon || '',
      description: menu.description || '',
      parent_id: menu.parent_id || null,
      active: menu.active,
      open_new_tab: menu.open_new_tab,
      requires_auth: menu.requires_auth,
      css_class: menu.css_class || '',
    })
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingMenu(null)
  }

  const handleSave = async () => {
    try {
      if (isCreating) {
        await createMutation.mutateAsync(formData)
        toast.success('Menu créé')
      } else if (editingMenu) {
        await updateMutation.mutateAsync({ id: editingMenu.id, ...formData })
        toast.success('Menu mis à jour')
      }
      handleCancel()
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce menu ?')) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Menu supprimé')
      if (editingMenu?.id === id) handleCancel()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleDragStart = useCallback((e: React.DragEvent, menuId: number) => {
    setDraggedId(menuId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', menuId.toString())
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetId: number) => {
      e.preventDefault()
      if (draggedId === null || draggedId === targetId) {
        setDraggedId(null)
        return
      }

      const currentOrder = menus.map((m) => m.id)
      const draggedIndex = currentOrder.indexOf(draggedId)
      const targetIndex = currentOrder.indexOf(targetId)

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedId(null)
        return
      }

      const newOrder = [...currentOrder]
      newOrder.splice(draggedIndex, 1)
      newOrder.splice(targetIndex, 0, draggedId)

      setDraggedId(null)

      try {
        await reorderMutation.mutateAsync(newOrder)
        toast.success('Ordre mis à jour')
      } catch {
        toast.error("Erreur lors de la mise à jour de l'ordre")
      }
    },
    [draggedId, menus, reorderMutation, toast]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
  }, [])

  const showForm = isCreating || editingMenu

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Store', href: '/store' },
            { label: 'Menus Navigation' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Menus Navigation</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Menus du header et footer (glisser-déposer pour réordonner)
            </p>
          </div>
          {!showForm && (
            <Button onClick={handleNew} icon={<Plus className="h-4 w-4" />}>
              Nouveau
            </Button>
          )}
        </div>

        <PageNotice config={storeNotices.menus} className="mb-6" />

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-300">
            Erreur lors du chargement des menus
          </div>
        )}

        <div className={`grid gap-6 ${showForm ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Liste */}
          <div className="overflow-hidden">
            {isLoading ? <SkeletonTable rows={5} columns={5} /> : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Libellé</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actif</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {menus.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        Aucun menu. Cliquez sur "Nouveau" pour en créer.
                      </td>
                    </tr>
                  ) : (
                    menus.map((menu) => (
                      <tr
                        key={menu.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, menu.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, menu.id)}
                        onDragEnd={handleDragEnd}
                        className={`cursor-move hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          draggedId === menu.id ? 'opacity-50' : ''
                        } ${editingMenu?.id === menu.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                        onClick={() => handleEdit(menu)}
                      >
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          <span className="inline-flex items-center">
                            <GripVertical className="mr-1 h-4 w-4 text-gray-400" />
                            {menu.sequence}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">{menu.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {menu.icon && <span className="mr-1">{menu.icon}</span>}
                          {menu.label}
                          {menu.children_count ? (
                            <Badge variant="info" className="ml-2">{menu.children_count}</Badge>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${menu.active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                            {menu.active ? 'Oui' : 'Non'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            onClick={(e) => { e.stopPropagation(); handleDelete(menu.id) }}
                            size="sm"
                            variant="danger"
                            icon={<Trash2 className="h-3.5 w-3.5" />}
                          >
                            Supprimer
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Formulaire inline */}
          {showForm && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {isCreating ? 'Nouveau Menu' : 'Modifier le Menu'}
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Nom interne *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm"
                      placeholder="Menu Principal"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Code *</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm font-mono"
                      placeholder="header"
                      disabled={!!editingMenu}
                    />
                    {editingMenu && <p className="text-xs text-gray-500 mt-1">Code non modifiable</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Libellé affiché *</label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm"
                    placeholder="Accueil"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL *</label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm"
                    placeholder="/products"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Icône</label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm"
                      placeholder="🏠"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Classes CSS</label>
                    <input
                      type="text"
                      value={formData.css_class}
                      onChange={(e) => setFormData({ ...formData, css_class: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm"
                      placeholder="text-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 text-sm"
                    placeholder="Tooltip ou sous-texte"
                  />
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Actif</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.open_new_tab} onChange={(e) => setFormData({ ...formData, open_new_tab: e.target.checked })} className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Nouvel onglet</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.requires_auth} onChange={(e) => setFormData({ ...formData, requires_auth: e.target.checked })} className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Auth requise</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button onClick={handleCancel} variant="secondary" icon={<X className="h-4 w-4" />}>
                  Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!formData.name || !formData.code || !formData.label || !formData.url}
                  icon={<Save className="h-4 w-4" />}
                >
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
