import { useState } from 'react'
import { Layout } from '../components/Layout'
import { useTenants, useTenant, useUpdateTenantTheme, useUploadTenantLogo, useUploadTenantFavicon, Tenant } from '../hooks/useTenants'
import { Button, Modal, ImageUpload, SkeletonTable } from '../components/common'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/common/Toast'

export default function Tenants() {
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'theme'>('general')

  const { data: tenants, isLoading } = useTenants()
  const { data: tenantDetail } = useTenant(editingTenant?.id || 0)
  const updateThemeMutation = useUpdateTenantTheme()
  const uploadLogoMutation = useUploadTenantLogo()
  const uploadFaviconMutation = useUploadTenantFavicon()
  const toast = useToast()

  const [themeData, setThemeData] = useState({
    primary: '#01613a',
    secondary: '#c9c18f',
    accent: '#f59e0b',
    font_family: 'inter' as const,
    enable_dark_mode: true,
  })

  const handleOpenEdit = (tenant: Tenant) => {
    setEditingTenant(tenant)
    setActiveTab('general')
    setThemeData({
      primary: tenant.primary_color,
      secondary: tenant.secondary_color,
      accent: tenant.accent_color,
      font_family: tenant.font_family,
      enable_dark_mode: tenant.enable_dark_mode,
    })
  }

  const handleSaveTheme = async () => {
    if (!editingTenant) return

    try {
      await updateThemeMutation.mutateAsync({
        id: editingTenant.id,
        theme: {
          colors: {
            primary: themeData.primary,
            secondary: themeData.secondary,
            accent: themeData.accent,
          },
          fonts: {
            family: themeData.font_family,
          },
          options: {
            enable_dark_mode: themeData.enable_dark_mode,
          },
        },
      })
      toast.success('Thème mis à jour avec succès')
      setEditingTenant(null)
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du thème')
    }
  }

  const handleUploadLogo = async (file: File) => {
    if (!editingTenant) return
    await uploadLogoMutation.mutateAsync({ id: editingTenant.id, file })
    toast.success('Logo téléchargé')
  }

  const handleUploadFavicon = async (file: File) => {
    if (!editingTenant) return
    await uploadFaviconMutation.mutateAsync({ id: editingTenant.id, file })
    toast.success('Favicon téléchargé')
  }

  return (
    <Layout>
      <div className="p-6 bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tenants / Boutiques</h1>
        </div>

        {isLoading ? (
          <SkeletonTable rows={5} columns={5} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Domaine</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {tenants?.map((tenant) => (
                  <tr key={tenant.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{tenant.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{tenant.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{tenant.domain}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded ${tenant.active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                        {tenant.active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <Button onClick={() => handleOpenEdit(tenant)} size="sm">
                        Éditer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingTenant && (
        <Modal
          isOpen={true}
          onClose={() => setEditingTenant(null)}
          title={`Éditer ${editingTenant.name}`}
          size="xl"
        >
          <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'general'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Général
              </button>
              <button
                onClick={() => setActiveTab('theme')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'theme'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Thème
              </button>
            </nav>
          </div>

          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom</label>
                <input
                  type="text"
                  value={editingTenant.name}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code</label>
                <input
                  type="text"
                  value={editingTenant.code}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Domaine</label>
                <input
                  type="text"
                  value={editingTenant.domain}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Logos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <ImageUpload
                    label="Logo"
                    currentImageUrl={tenantDetail?.logo_url}
                    onUpload={handleUploadLogo}
                    maxSizeMB={2}
                  />
                  <ImageUpload
                    label="Favicon"
                    currentImageUrl={tenantDetail?.favicon_url}
                    onUpload={handleUploadFavicon}
                    maxSizeMB={1}
                    accept="image/x-icon,image/png"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Couleurs</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Primaire</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={themeData.primary}
                        onChange={(e) => setThemeData({ ...themeData, primary: e.target.value })}
                        className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={themeData.primary}
                        onChange={(e) => setThemeData({ ...themeData, primary: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Secondaire</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={themeData.secondary}
                        onChange={(e) => setThemeData({ ...themeData, secondary: e.target.value })}
                        className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={themeData.secondary}
                        onChange={(e) => setThemeData({ ...themeData, secondary: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Accent</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={themeData.accent}
                        onChange={(e) => setThemeData({ ...themeData, accent: e.target.value })}
                        className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={themeData.accent}
                        onChange={(e) => setThemeData({ ...themeData, accent: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Typographie</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Police</label>
                  <select
                    value={themeData.font_family}
                    onChange={(e) => setThemeData({ ...themeData, font_family: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="inter">Inter</option>
                    <option value="roboto">Roboto</option>
                    <option value="poppins">Poppins</option>
                    <option value="montserrat">Montserrat</option>
                    <option value="open-sans">Open Sans</option>
                    <option value="lato">Lato</option>
                  </select>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Options</h3>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={themeData.enable_dark_mode}
                    onChange={(e) => setThemeData({ ...themeData, enable_dark_mode: e.target.checked })}
                    className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Activer le mode sombre</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button onClick={() => setEditingTenant(null)} variant="secondary">
                  Annuler
                </Button>
                <Button onClick={handleSaveTheme} disabled={updateThemeMutation.isPending}>
                  {updateThemeMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      <ToastContainer />
    </Layout>
  )
}
