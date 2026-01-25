/**
 * Page "Ma Boutique" - Personnalisation du thème par le client
 *
 * Permet au client de personnaliser :
 * - Couleurs (palette complète)
 * - Logo et favicon
 * - Typographie
 * - Informations de contact
 * - Réseaux sociaux
 * - SEO
 * - Options (dark mode, fonctionnalités)
 */

import { useState, useEffect, useRef } from 'react'
import { Layout } from '../components/Layout'
import { useMyTenant, useUpdateMyTenant } from '../hooks/useMyTenant'
import { FONT_OPTIONS, DEFAULT_COLORS } from '../hooks/useTenants'
import type { TenantConfig } from '../hooks/useTenants'
import { useToast } from '../contexts/ToastContext'
import { THEME_PRESETS } from '../data/themePresets'
import type { ThemePreset } from '../data/themePresets'
import {
  SwatchIcon,
  SparklesIcon,
  PhotoIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  CheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

// Types locaux pour le formulaire
interface FormData {
  // Branding
  name: string
  slogan: string
  description: string

  // Couleurs
  primary_color: string
  primary_dark: string
  primary_light: string
  secondary_color: string
  secondary_dark: string
  secondary_light: string
  accent_color: string
  background_color: string
  foreground_color: string
  muted_color: string
  muted_foreground: string
  border_color: string
  ring_color: string

  // Typographie
  font_family: string

  // Contact
  email: string
  phone: string
  whatsapp: string

  // Social
  social: Record<string, string>

  // SEO
  meta_title: string
  meta_description: string

  // Options
  enable_dark_mode: boolean
  default_dark: boolean
  feature_wishlist: boolean
  feature_comparison: boolean
  feature_reviews: boolean
  feature_newsletter: boolean
  feature_guest_checkout: boolean

  // Assets
  logo?: string
  logo_filename?: string
  favicon?: string
  favicon_filename?: string
}

type ThemeSnapshot = Pick<ThemePreset, 'colors' | 'fontFamily' | 'darkMode'>

const buildThemeSnapshotFromTenant = (tenant: TenantConfig): ThemeSnapshot => ({
  colors: {
    primary: tenant.theme?.colors?.primary || DEFAULT_COLORS.primary,
    primaryDark: tenant.theme?.colors?.primaryDark || DEFAULT_COLORS.primaryDark,
    primaryLight: tenant.theme?.colors?.primaryLight || DEFAULT_COLORS.primaryLight,
    secondary: tenant.theme?.colors?.secondary || DEFAULT_COLORS.secondary,
    secondaryDark: tenant.theme?.colors?.secondaryDark || DEFAULT_COLORS.secondaryDark,
    secondaryLight: tenant.theme?.colors?.secondaryLight || DEFAULT_COLORS.secondaryLight,
    accent: tenant.theme?.colors?.accent || DEFAULT_COLORS.accent,
    background: tenant.theme?.colors?.background || DEFAULT_COLORS.background,
    foreground: tenant.theme?.colors?.foreground || DEFAULT_COLORS.foreground,
    muted: tenant.theme?.colors?.muted || DEFAULT_COLORS.muted,
    mutedForeground: tenant.theme?.colors?.mutedForeground || DEFAULT_COLORS.mutedForeground,
    border: tenant.theme?.colors?.border || DEFAULT_COLORS.border,
    ring: tenant.theme?.colors?.ring || DEFAULT_COLORS.ring,
  },
  fontFamily: tenant.theme?.typography?.fontFamily || 'inter',
  darkMode: {
    enabled: tenant.theme?.darkMode?.enabled ?? true,
    defaultDark: tenant.theme?.darkMode?.defaultDark ?? false,
  },
})

const buildThemeFormFields = (snapshot: ThemeSnapshot) => ({
  primary_color: snapshot.colors.primary,
  primary_dark: snapshot.colors.primaryDark,
  primary_light: snapshot.colors.primaryLight,
  secondary_color: snapshot.colors.secondary,
  secondary_dark: snapshot.colors.secondaryDark,
  secondary_light: snapshot.colors.secondaryLight,
  accent_color: snapshot.colors.accent,
  background_color: snapshot.colors.background,
  foreground_color: snapshot.colors.foreground,
  muted_color: snapshot.colors.muted,
  muted_foreground: snapshot.colors.mutedForeground,
  border_color: snapshot.colors.border,
  ring_color: snapshot.colors.ring,
  font_family: snapshot.fontFamily,
  enable_dark_mode: snapshot.darkMode.enabled,
  default_dark: snapshot.darkMode.defaultDark,
})

const isThemeMatch = (snapshot: ThemeSnapshot, data: FormData) => {
  const fields = buildThemeFormFields(snapshot)
  return Object.entries(fields).every(([key, value]) => data[key as keyof FormData] === value)
}

// Sections du formulaire
const SECTIONS = [
  { id: 'themes', label: 'Themes', icon: SparklesIcon },
  { id: 'colors', label: 'Couleurs', icon: SwatchIcon },
  { id: 'branding', label: 'Branding', icon: PhotoIcon },
  { id: 'contact', label: 'Contact', icon: DevicePhoneMobileIcon },
  { id: 'social', label: 'Réseaux sociaux', icon: GlobeAltIcon },
  { id: 'seo', label: 'SEO', icon: MagnifyingGlassIcon },
  { id: 'options', label: 'Options', icon: Cog6ToothIcon },
]

// Réseaux sociaux disponibles
const SOCIAL_NETWORKS = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
  { key: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/...' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/...' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/...' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/...' },
]

// Groupes de couleurs pour l'affichage
const COLOR_GROUPS = [
  {
    title: 'Couleurs principales',
    colors: [
      { key: 'primary_color', label: 'Primaire' },
      { key: 'primary_dark', label: 'Primaire foncé' },
      { key: 'primary_light', label: 'Primaire clair' },
    ],
  },
  {
    title: 'Couleurs secondaires',
    colors: [
      { key: 'secondary_color', label: 'Secondaire' },
      { key: 'secondary_dark', label: 'Secondaire foncé' },
      { key: 'secondary_light', label: 'Secondaire clair' },
    ],
  },
  {
    title: 'Accent et fond',
    colors: [
      { key: 'accent_color', label: 'Accent' },
      { key: 'background_color', label: 'Fond' },
      { key: 'foreground_color', label: 'Texte' },
    ],
  },
  {
    title: 'Éléments UI',
    colors: [
      { key: 'muted_color', label: 'Muted' },
      { key: 'muted_foreground', label: 'Muted texte' },
      { key: 'border_color', label: 'Bordure' },
      { key: 'ring_color', label: 'Focus ring' },
    ],
  },
]

export default function MyShop() {
  const { data: tenant, isLoading, error, refetch } = useMyTenant()
  const updateMutation = useUpdateMyTenant()
  const toast = useToast()

  const [activeSection, setActiveSection] = useState('themes')
  const [formData, setFormData] = useState<FormData | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [initialThemeSnapshot, setInitialThemeSnapshot] = useState<ThemeSnapshot | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  // Initialiser le formulaire quand le tenant est chargé
  useEffect(() => {
    if (tenant) {
      const themeSnapshot = buildThemeSnapshotFromTenant(tenant)
      setFormData({
        name: tenant.name || '',
        slogan: tenant.branding?.slogan || '',
        description: tenant.branding?.description || '',

        ...buildThemeFormFields(themeSnapshot),

        email: tenant.contact?.email || '',
        phone: tenant.contact?.phone || '',
        whatsapp: tenant.contact?.whatsapp || '',

        social: tenant.social || {},

        meta_title: tenant.seo?.title || '',
        meta_description: tenant.seo?.description || '',

        feature_wishlist: tenant.features?.wishlist ?? true,
        feature_comparison: tenant.features?.comparison ?? true,
        feature_reviews: tenant.features?.reviews ?? true,
        feature_newsletter: tenant.features?.newsletter ?? true,
        feature_guest_checkout: tenant.features?.guestCheckout ?? true,
      })

      if (!initialThemeSnapshot) {
        setInitialThemeSnapshot(themeSnapshot)
      }

      // Set logo/favicon previews if they exist
      if (tenant.branding?.logoUrl) {
        setLogoPreview(tenant.branding.logoUrl)
      }
      if (tenant.branding?.faviconUrl) {
        setFaviconPreview(tenant.branding.faviconUrl)
      }
    }
  }, [tenant, initialThemeSnapshot])

  // Mise à jour d'un champ
  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    if (!formData) return
    setFormData({ ...formData, [key]: value })
    setHasChanges(true)
  }

  // Mise à jour d'un réseau social
  const updateSocial = (key: string, value: string) => {
    if (!formData) return
    setFormData({
      ...formData,
      social: { ...formData.social, [key]: value },
    })
    setHasChanges(true)
  }

  const applyThemePreset = async (preset: ThemePreset) => {
    if (!formData) return
    if (hasChanges) {
      toast.info('Enregistrez ou annulez vos modifications avant d\'appliquer un theme.')
      return
    }

    const themeFields = buildThemeFormFields({
      colors: preset.colors,
      fontFamily: preset.fontFamily,
      darkMode: preset.darkMode,
    })
    const nextData = { ...formData, ...themeFields }

    setFormData(nextData)
    setHasChanges(true)

    try {
      await updateMutation.mutateAsync(themeFields)
      toast.success(`Theme applique: ${preset.label}`)
      setHasChanges(false)
      refetch()
    } catch (err) {
      toast.error((err as Error).message || 'Erreur lors de l\'application du theme')
    }
  }

  const restoreInitialTheme = async () => {
    if (!formData || !initialThemeSnapshot) return
    if (hasChanges) {
      toast.info('Enregistrez ou annulez vos modifications avant de restaurer le theme.')
      return
    }

    const themeFields = buildThemeFormFields(initialThemeSnapshot)
    const nextData = { ...formData, ...themeFields }

    setFormData(nextData)
    setHasChanges(true)

    try {
      await updateMutation.mutateAsync(themeFields)
      toast.success('Theme initial restaure')
      setHasChanges(false)
      refetch()
    } catch (err) {
      toast.error((err as Error).message || 'Erreur lors de la restauration du theme')
    }
  }

  // Gestion du fichier logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setLogoPreview(base64)
      updateField('logo', base64)
      updateField('logo_filename', file.name)
    }
    reader.readAsDataURL(file)
  }

  // Gestion du fichier favicon
  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setFaviconPreview(base64)
      updateField('favicon', base64)
      updateField('favicon_filename', file.name)
    }
    reader.readAsDataURL(file)
  }

  // Sauvegarde
  const handleSave = async () => {
    if (!formData) return

    try {
      await updateMutation.mutateAsync(formData)
      toast.success('Modifications enregistrées')
      setHasChanges(false)
      refetch()
    } catch (err) {
      toast.error((err as Error).message || 'Erreur lors de la sauvegarde')
    }
  }

  // Réinitialiser aux valeurs par défaut
  const handleReset = () => {
    if (tenant) {
      setFormData({
        name: tenant.name || '',
        slogan: tenant.branding?.slogan || '',
        description: tenant.branding?.description || '',

        primary_color: DEFAULT_COLORS.primary,
        primary_dark: DEFAULT_COLORS.primaryDark,
        primary_light: DEFAULT_COLORS.primaryLight,
        secondary_color: DEFAULT_COLORS.secondary,
        secondary_dark: DEFAULT_COLORS.secondaryDark,
        secondary_light: DEFAULT_COLORS.secondaryLight,
        accent_color: DEFAULT_COLORS.accent,
        background_color: DEFAULT_COLORS.background,
        foreground_color: DEFAULT_COLORS.foreground,
        muted_color: DEFAULT_COLORS.muted,
        muted_foreground: DEFAULT_COLORS.mutedForeground,
        border_color: DEFAULT_COLORS.border,
        ring_color: DEFAULT_COLORS.ring,

        font_family: 'inter',

        email: tenant.contact?.email || '',
        phone: tenant.contact?.phone || '',
        whatsapp: tenant.contact?.whatsapp || '',

        social: tenant.social || {},

        meta_title: tenant.seo?.title || '',
        meta_description: tenant.seo?.description || '',

        enable_dark_mode: true,
        default_dark: false,
        feature_wishlist: true,
        feature_comparison: true,
        feature_reviews: true,
        feature_newsletter: true,
        feature_guest_checkout: true,
      })
      setHasChanges(true)
      toast.info('Couleurs réinitialisées aux valeurs par défaut')
    }
  }

  // État de chargement
  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </Layout>
    )
  }

  // Erreur ou pas de tenant
  if (error || !tenant) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <h2 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
              {(error as Error)?.message || 'Aucun tenant associé'}
            </h2>
            <p className="text-sm text-red-600 dark:text-red-300">
              Contactez votre administrateur pour configurer votre boutique.
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!formData) return null

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Ma Boutique
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Personnalisez l'apparence de votre boutique : {tenant.name}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Réinitialiser
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {updateMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <CheckIcon className="w-4 h-4" />
              )}
              Enregistrer
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Navigation latérale */}
          <div className="w-48 flex-shrink-0">
            <nav className="space-y-1 sticky top-6">
              {SECTIONS.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {section.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Contenu principal */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {/* Section Themes */}
            {activeSection === 'themes' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Themes predefinis
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Appliquez un theme complet en un clic. Le frontend sera mis a jour apres la
                    sauvegarde.
                  </p>
                </div>

                {hasChanges && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
                    Enregistrez ou annulez vos modifications avant d'appliquer un theme.
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {THEME_PRESETS.map((preset) => {
                    const isActive = isThemeMatch(
                      {
                        colors: preset.colors,
                        fontFamily: preset.fontFamily,
                        darkMode: preset.darkMode,
                      },
                      formData
                    )

                    return (
                      <div
                        key={preset.id}
                        className={`rounded-xl border p-4 transition-shadow ${
                          isActive
                            ? 'border-indigo-500 shadow-md'
                            : 'border-gray-200 dark:border-gray-700 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                              {preset.label}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {preset.description}
                            </p>
                          </div>
                          {isActive && (
                            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-300">
                              Actif
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                          {[preset.colors.primary, preset.colors.secondary, preset.colors.accent, preset.colors.muted, preset.colors.border].map((color, index) => (
                            <span
                              key={`${preset.id}-swatch-${index}`}
                              className="h-6 w-6 rounded-full border border-gray-200 dark:border-gray-700"
                              style={{ backgroundColor: color }}
                              aria-hidden="true"
                            />
                          ))}
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Font: {preset.fontFamily}
                          </span>
                          <button
                            onClick={() => applyThemePreset(preset)}
                            disabled={hasChanges || updateMutation.isPending}
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Appliquer
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/30 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Revenir au theme initial
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Restaure la configuration du theme chargee au debut.
                    </p>
                  </div>
                  <button
                    onClick={restoreInitialTheme}
                    disabled={!initialThemeSnapshot || hasChanges || updateMutation.isPending}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    Restaurer
                  </button>
                </div>
              </div>
            )}

            {/* Section Couleurs */}
            {activeSection === 'colors' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Palette de couleurs
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Personnalisez les couleurs de votre boutique. Ces couleurs seront utilisées
                    sur l'ensemble du site.
                  </p>
                </div>

                {COLOR_GROUPS.map((group) => (
                  <div key={group.title}>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      {group.title}
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {group.colors.map((color) => {
                        const colorKey = color.key as keyof FormData
                        const colorValue = formData[colorKey] as string || '#000000'
                        return (
                          <div key={color.key} className="space-y-2">
                            <label className="text-xs text-gray-500 dark:text-gray-400">
                              {color.label}
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={colorValue}
                                onChange={(e) =>
                                  updateField(colorKey, e.target.value as never)
                                }
                                className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={colorValue}
                                onChange={(e) =>
                                  updateField(colorKey, e.target.value as never)
                                }
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="#000000"
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {/* Typographie */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Typographie
                  </h3>
                  <select
                    value={formData.font_family}
                    onChange={(e) => updateField('font_family', e.target.value)}
                    className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prévisualisation */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Prévisualisation
                  </h3>
                  <div
                    className="rounded-lg p-4"
                    style={{ backgroundColor: formData.background_color }}
                  >
                    <div
                      className="text-lg font-semibold mb-2"
                      style={{ color: formData.foreground_color }}
                    >
                      Titre exemple
                    </div>
                    <p
                      className="text-sm mb-4"
                      style={{ color: formData.muted_foreground }}
                    >
                      Texte secondaire avec couleur muted
                    </p>
                    <div className="flex gap-2">
                      <button
                        className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                        style={{ backgroundColor: formData.primary_color }}
                      >
                        Bouton primaire
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg text-sm font-medium"
                        style={{
                          backgroundColor: formData.secondary_color,
                          color: formData.foreground_color,
                        }}
                      >
                        Bouton secondaire
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                        style={{ backgroundColor: formData.accent_color }}
                      >
                        Accent
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section Branding */}
            {activeSection === 'branding' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Branding
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Logo, favicon et informations de marque.
                  </p>
                </div>

                {/* Logo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Logo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo"
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <PhotoIcon className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-600 dark:border-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    >
                      Changer le logo
                    </button>
                  </div>
                </div>

                {/* Favicon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Favicon
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700">
                      {faviconPreview ? (
                        <img
                          src={faviconPreview}
                          alt="Favicon"
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <PhotoIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <input
                      ref={faviconInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFaviconChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => faviconInputRef.current?.click()}
                      className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-600 dark:border-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    >
                      Changer le favicon
                    </button>
                  </div>
                </div>

                {/* Slogan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Slogan
                  </label>
                  <input
                    type="text"
                    value={formData.slogan}
                    onChange={(e) => updateField('slogan', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Votre slogan accrocheur"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Description de votre boutique..."
                  />
                </div>
              </div>
            )}

            {/* Section Contact */}
            {activeSection === 'contact' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Informations de contact
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Ces informations seront affichées sur votre boutique.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="contact@exemple.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={formData.whatsapp}
                      onChange={(e) => updateField('whatsapp', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section Réseaux sociaux */}
            {activeSection === 'social' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Réseaux sociaux
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Liens vers vos profils sur les réseaux sociaux.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {SOCIAL_NETWORKS.map((network) => (
                    <div key={network.key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {network.label}
                      </label>
                      <input
                        type="url"
                        value={formData.social[network.key] || ''}
                        onChange={(e) => updateSocial(network.key, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder={network.placeholder}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section SEO */}
            {activeSection === 'seo' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Référencement (SEO)
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Optimisez votre visibilité sur les moteurs de recherche.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Titre de la page d'accueil
                  </label>
                  <input
                    type="text"
                    value={formData.meta_title}
                    onChange={(e) => updateField('meta_title', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Nom de votre boutique | Slogan"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Idéalement entre 50 et 60 caractères
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => updateField('meta_description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Description de votre boutique pour les moteurs de recherche..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Idéalement entre 150 et 160 caractères
                  </p>
                </div>

                {/* Prévisualisation Google */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Aperçu Google
                  </h3>
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-lg">
                    <div className="text-blue-600 dark:text-blue-400 text-lg hover:underline cursor-pointer truncate">
                      {formData.meta_title || 'Titre de votre page'}
                    </div>
                    <div className="text-green-700 dark:text-green-500 text-sm">
                      {tenant.domain || 'www.votresite.com'}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                      {formData.meta_description || 'Description de votre page qui apparaîtra dans les résultats de recherche...'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section Options */}
            {activeSection === 'options' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Options
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Configurez les fonctionnalités de votre boutique.
                  </p>
                </div>

                {/* Mode sombre */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Mode sombre
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.enable_dark_mode}
                        onChange={(e) => updateField('enable_dark_mode', e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Permettre aux visiteurs d'activer le mode sombre
                      </span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.default_dark}
                        onChange={(e) => updateField('default_dark', e.target.checked)}
                        disabled={!formData.enable_dark_mode}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 disabled:opacity-50"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Activer le mode sombre par défaut
                      </span>
                    </label>
                  </div>
                </div>

                {/* Fonctionnalités */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Fonctionnalités
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.feature_wishlist}
                        onChange={(e) => updateField('feature_wishlist', e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Liste de souhaits (Wishlist)
                      </span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.feature_comparison}
                        onChange={(e) => updateField('feature_comparison', e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Comparateur de produits
                      </span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.feature_reviews}
                        onChange={(e) => updateField('feature_reviews', e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Avis clients
                      </span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.feature_newsletter}
                        onChange={(e) => updateField('feature_newsletter', e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Newsletter
                      </span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.feature_guest_checkout}
                        onChange={(e) => updateField('feature_guest_checkout', e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Achat sans compte (Guest checkout)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
