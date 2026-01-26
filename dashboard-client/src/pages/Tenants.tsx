import { useState } from 'react'
import { Layout } from '../components/Layout'
import { useTenants, useTenant, useUpdateTenantTheme, useUploadTenantLogo, useUploadTenantFavicon, Tenant } from '../hooks/useTenants'
import { Button, ImageUpload, SkeletonTable } from '../components/common'
import { useToast } from '../hooks/useToast'

export default function Tenants() {
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'theme'>('general')

  const { data: tenants, isLoading } = useTenants()
  const { data: tenantDetail } = useTenant(editingTenant?.id || 0)
  const updateThemeMutation = useUpdateTenantTheme()
  const uploadLogoMutation = useUploadTenantLogo()
  const uploadFaviconMutation = useUploadTenantFavicon()
  const toast = useToast()

  const [themeData, setThemeData] = useState<{
    primary: string
    secondary: string
    accent: string
    font_family: 'inter' | 'roboto' | 'poppins' | 'montserrat' | 'open-sans' | 'lato'
    enable_dark_mode: boolean
  }>({
    primary: '#01613a',
    secondary: '#c9c18f',
    accent: '#f59e0b',
    font_family: 'inter',
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

  const handleCancel = () => {
    setEditingTenant(null)
    setActiveTab('general')
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
      handleCancel()
    } catch {
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
      <div className="p-6 bg-white dark:bg-gray-800 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tenants / Boutiques</h1>
        </div>

        <div className={`grid gap-6 ${editingTenant ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Liste */}
          <div className="overflow-hidden">
            {isLoading ? <SkeletonTable rows={5} columns={5} /> : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Domaine</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {tenants?.map((tenant: Tenant) => (
                    <tr
                      key={tenant.id}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${editingTenant?.id === tenant.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                      onClick={() => handleOpenEdit(tenant)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{tenant.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{tenant.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{tenant.domain}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${tenant.active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {tenant.active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!tenants || tenants.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        Aucun tenant configuré.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Formulaire inline */}
          {editingTenant && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {editingTenant.name}
                </h2>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-4">
                  <button
                    onClick={() => setActiveTab('general')}
                    className={`px-3 py-2 text-sm font-medium ${
                      activeTab === 'general'
                        ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Infos
                  </button>
                  <button
                    onClick={() => setActiveTab('theme')}
                    className={`px-3 py-2 text-sm font-medium ${
                      activeTab === 'theme'
                        ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
                    <input
                      type="text"
                      value={editingTenant.name}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code</label>
                    <input
                      type="text"
                      value={editingTenant.code}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domaine</label>
                    <input
                      type="text"
                      value={editingTenant.domain}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Les informations de base sont gérées via l'interface d'administration système.
                  </p>
                </div>
              )}

              {activeTab === 'theme' && (
                <div className="space-y-5">
                  {/* Logos */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Logos</h3>
                    <div className="grid grid-cols-2 gap-3">
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

                  {/* Couleurs */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Couleurs</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={themeData.primary}
                          onChange={(e) => setThemeData({ ...themeData, primary: e.target.value })}
                          className="w-10 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                        />
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 dark:text-gray-400">Primaire</label>
                          <input
                            type="text"
                            value={themeData.primary}
                            onChange={(e) => setThemeData({ ...themeData, primary: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={themeData.secondary}
                          onChange={(e) => setThemeData({ ...themeData, secondary: e.target.value })}
                          className="w-10 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                        />
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 dark:text-gray-400">Secondaire</label>
                          <input
                            type="text"
                            value={themeData.secondary}
                            onChange={(e) => setThemeData({ ...themeData, secondary: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={themeData.accent}
                          onChange={(e) => setThemeData({ ...themeData, accent: e.target.value })}
                          className="w-10 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                        />
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 dark:text-gray-400">Accent</label>
                          <input
                            type="text"
                            value={themeData.accent}
                            onChange={(e) => setThemeData({ ...themeData, accent: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Typographie */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Police</label>
                    <select
                      value={themeData.font_family}
                      onChange={(e) => setThemeData({ ...themeData, font_family: e.target.value as typeof themeData.font_family })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="inter">Inter</option>
                      <option value="roboto">Roboto</option>
                      <option value="poppins">Poppins</option>
                      <option value="montserrat">Montserrat</option>
                      <option value="open-sans">Open Sans</option>
                      <option value="lato">Lato</option>
                    </select>
                  </div>

                  {/* Options */}
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={themeData.enable_dark_mode}
                        onChange={(e) => setThemeData({ ...themeData, enable_dark_mode: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Activer le mode sombre</span>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button onClick={handleCancel} variant="secondary" size="sm">
                      Annuler
                    </Button>
                    <Button onClick={handleSaveTheme} disabled={updateThemeMutation.isPending} size="sm">
                      {updateThemeMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
