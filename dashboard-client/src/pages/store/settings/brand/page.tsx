import { useState, useEffect, useRef } from "react";
import { Layout } from '@/components/Layout'
import { Breadcrumbs } from "@/components/common";
import { Button } from "@/components/common/Button";
import { useToast } from "@/contexts/ToastContext";
import { Palette, Save, Loader2, Info, Sparkles, Image, Type, Check, RotateCcw } from "lucide-react";
import { logger } from '@quelyos/logger';
import { useSiteConfig, useUpdateSiteConfig } from "@/hooks/useSiteConfig";
import { useMyTenant, useUpdateMyTenant } from "@/hooks/useMyTenant";
import { FONT_OPTIONS, DEFAULT_COLORS } from "@/hooks/useTenants";
import { THEME_PRESETS } from "@/data/themePresets";

// Color groups for the palette
const COLOR_GROUPS = [
  {
    title: "Couleurs principales",
    colors: [
      { key: "primary_color", label: "Primaire" },
      { key: "primary_dark", label: "Primaire foncé" },
      { key: "primary_light", label: "Primaire clair" },
    ],
  },
  {
    title: "Couleurs secondaires",
    colors: [
      { key: "secondary_color", label: "Secondaire" },
      { key: "secondary_dark", label: "Secondaire foncé" },
      { key: "secondary_light", label: "Secondaire clair" },
    ],
  },
  {
    title: "Accent et fond",
    colors: [
      { key: "accent_color", label: "Accent" },
      { key: "background_color", label: "Fond" },
      { key: "foreground_color", label: "Texte" },
    ],
  },
  {
    title: "Éléments UI",
    colors: [
      { key: "muted_color", label: "Muted" },
      { key: "muted_foreground", label: "Muted texte" },
      { key: "border_color", label: "Bordure" },
      { key: "ring_color", label: "Focus ring" },
    ],
  },
];

interface BrandConfig {
  // Basic branding
  brand_name: string;
  slogan: string;
  description: string;
  logo_url: string;
  favicon_url: string;
  // Colors (13 total)
  primary_color: string;
  primary_dark: string;
  primary_light: string;
  secondary_color: string;
  secondary_dark: string;
  secondary_light: string;
  accent_color: string;
  background_color: string;
  foreground_color: string;
  muted_color: string;
  muted_foreground: string;
  border_color: string;
  ring_color: string;
  // Typography
  font_family: string;
}

export default function BrandSettingsPage() {
  const toast = useToast();
  const { data: tenant, isLoading: tenantLoading, refetch } = useMyTenant();
  const updateTenantMutation = useUpdateMyTenant();
  const { data: _config, isLoading: configLoading } = useSiteConfig();
  const updateConfigMutation = useUpdateSiteConfig();

  const [activeTab, setActiveTab] = useState<"themes" | "colors" | "branding" | "typography">("themes");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

  const [brandConfig, setBrandConfig] = useState<BrandConfig>({
    brand_name: "",
    slogan: "",
    description: "",
    logo_url: "",
    favicon_url: "",
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
    font_family: "inter",
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Initialize from tenant data
  useEffect(() => {
    if (tenant) {
      setBrandConfig({
        brand_name: tenant.name || "",
        slogan: tenant.branding?.slogan || "",
        description: tenant.branding?.description || "",
        logo_url: tenant.branding?.logoUrl || "",
        favicon_url: tenant.branding?.faviconUrl || "",
        primary_color: tenant.theme?.colors?.primary || DEFAULT_COLORS.primary,
        primary_dark: tenant.theme?.colors?.primaryDark || DEFAULT_COLORS.primaryDark,
        primary_light: tenant.theme?.colors?.primaryLight || DEFAULT_COLORS.primaryLight,
        secondary_color: tenant.theme?.colors?.secondary || DEFAULT_COLORS.secondary,
        secondary_dark: tenant.theme?.colors?.secondaryDark || DEFAULT_COLORS.secondaryDark,
        secondary_light: tenant.theme?.colors?.secondaryLight || DEFAULT_COLORS.secondaryLight,
        accent_color: tenant.theme?.colors?.accent || DEFAULT_COLORS.accent,
        background_color: tenant.theme?.colors?.background || DEFAULT_COLORS.background,
        foreground_color: tenant.theme?.colors?.foreground || DEFAULT_COLORS.foreground,
        muted_color: tenant.theme?.colors?.muted || DEFAULT_COLORS.muted,
        muted_foreground: tenant.theme?.colors?.mutedForeground || DEFAULT_COLORS.mutedForeground,
        border_color: tenant.theme?.colors?.border || DEFAULT_COLORS.border,
        ring_color: tenant.theme?.colors?.ring || DEFAULT_COLORS.ring,
        font_family: tenant.theme?.typography?.fontFamily || "inter",
      });

      if (tenant.branding?.logoUrl) {
        setLogoPreview(tenant.branding.logoUrl);
      }
      if (tenant.branding?.faviconUrl) {
        setFaviconPreview(tenant.branding.faviconUrl);
      }
    }
  }, [tenant]);

  const updateField = (key: keyof BrandConfig, value: string) => {
    setBrandConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setLogoPreview(base64);
      updateField("logo_url", base64);
    };
    reader.readAsDataURL(file);
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFaviconPreview(base64);
      updateField("favicon_url", base64);
    };
    reader.readAsDataURL(file);
  };

  const applyThemePreset = async (preset: typeof THEME_PRESETS[number]) => {
    if (hasChanges) {
      toast.info("Enregistrez ou annulez vos modifications avant d'appliquer un thème.");
      return;
    }

    const newConfig: Partial<BrandConfig> = {
      primary_color: preset.colors.primary,
      primary_dark: preset.colors.primaryDark,
      primary_light: preset.colors.primaryLight,
      secondary_color: preset.colors.secondary,
      secondary_dark: preset.colors.secondaryDark,
      secondary_light: preset.colors.secondaryLight,
      accent_color: preset.colors.accent,
      background_color: preset.colors.background,
      foreground_color: preset.colors.foreground,
      muted_color: preset.colors.muted,
      muted_foreground: preset.colors.mutedForeground,
      border_color: preset.colors.border,
      ring_color: preset.colors.ring,
      font_family: preset.fontFamily,
    };

    setBrandConfig((prev) => ({ ...prev, ...newConfig }));

    try {
      await updateTenantMutation.mutateAsync(newConfig);
      toast.success(`Thème "${preset.label}" appliqué`);
      refetch();
    } catch (error) {
      logger.error("Erreur:", error);
      toast.error("Erreur lors de l'application du thème");
    }
  };

  const resetToDefaults = () => {
    setBrandConfig((prev) => ({
      ...prev,
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
      font_family: "inter",
    }));
    setHasChanges(true);
    toast.info("Couleurs réinitialisées aux valeurs par défaut");
  };

  const handleSave = async () => {
    try {
      await updateTenantMutation.mutateAsync(brandConfig);
      toast.success("Identité de marque mise à jour");
      setHasChanges(false);
      refetch();
    } catch (error) {
      logger.error("Erreur:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const isLoading = tenantLoading || configLoading;
  const isSaving = updateTenantMutation.isPending || updateConfigMutation.isPending;

  const isThemeActive = (preset: typeof THEME_PRESETS[number]) => {
    return (
      brandConfig.primary_color === preset.colors.primary &&
      brandConfig.secondary_color === preset.colors.secondary &&
      brandConfig.accent_color === preset.colors.accent &&
      brandConfig.font_family === preset.fontFamily
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Breadcrumbs
            items={[
              { label: "Boutique", href: "/store" },
              { label: "Paramètres", href: "/store/settings" },
              { label: "Marque & Identité", href: "/store/settings/brand" },
            ]}
          />
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Boutique", href: "/store" },
          { label: "Paramètres", href: "/store/settings" },
          { label: "Marque & Identité", href: "/store/settings/brand" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-indigo-100 dark:bg-indigo-900/30 p-3">
            <Palette className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Marque & Identité
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Personnalisez l'apparence complète de votre boutique
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={resetToDefaults}
            disabled={isSaving}
            icon={<RotateCcw className="h-4 w-4" />}
          >
            Réinitialiser
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            icon={isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          >
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Ces paramètres définissent l'apparence de votre boutique en ligne pour vos clients.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4 -mb-px">
          {[
            { id: "themes", label: "Thèmes", icon: Sparkles },
            { id: "colors", label: "Couleurs", icon: Palette },
            { id: "branding", label: "Branding", icon: Image },
            { id: "typography", label: "Typographie", icon: Type },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === id
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white dark:hover:text-gray-300 hover:border-gray-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        {/* Themes Tab */}
        {activeTab === "themes" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Thèmes prédéfinis
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Appliquez un thème complet en un clic. Le frontend sera mis à jour après la sauvegarde.
              </p>
            </div>

            {hasChanges && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
                Enregistrez ou annulez vos modifications avant d'appliquer un thème.
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {THEME_PRESETS.map((preset) => {
                const isActive = isThemeActive(preset);
                return (
                  <div
                    key={preset.id}
                    className={`rounded-xl border p-4 transition-shadow ${
                      isActive
                        ? "border-indigo-500 shadow-md"
                        : "border-gray-200 dark:border-gray-700 hover:shadow-md"
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
                        <span className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-300">
                          <Check className="h-3 w-3" />
                          Actif
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      {[
                        preset.colors.primary,
                        preset.colors.secondary,
                        preset.colors.accent,
                        preset.colors.muted,
                        preset.colors.border,
                      ].map((color, index) => (
                        <span
                          key={`${preset.id}-swatch-${index}`}
                          className="h-6 w-6 rounded-full border border-gray-200 dark:border-gray-700"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Font: {preset.fontFamily}
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => applyThemePreset(preset)}
                        disabled={hasChanges || isSaving}
                      >
                        Appliquer
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Colors Tab */}
        {activeTab === "colors" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Palette de couleurs
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Personnalisez les 13 couleurs de votre boutique.
              </p>
            </div>

            {COLOR_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-3">
                  {group.title}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.colors.map((color) => {
                    const colorKey = color.key as keyof BrandConfig;
                    const colorValue = (brandConfig[colorKey] as string) || "#000000";
                    return (
                      <div key={color.key} className="space-y-2">
                        <label className="text-xs text-gray-500 dark:text-gray-400">
                          {color.label}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={colorValue}
                            onChange={(e) => updateField(colorKey, e.target.value)}
                            className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={colorValue}
                            onChange={(e) => updateField(colorKey, e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Color Preview */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-4">
                Prévisualisation
              </h3>
              <div
                className="rounded-lg p-4"
                style={{ backgroundColor: brandConfig.background_color }}
              >
                <div
                  className="text-lg font-semibold mb-2"
                  style={{ color: brandConfig.foreground_color }}
                >
                  Titre exemple
                </div>
                <p
                  className="text-sm mb-4"
                  style={{ color: brandConfig.muted_foreground }}
                >
                  Texte secondaire avec couleur muted
                </p>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: brandConfig.primary_color }}
                  >
                    Bouton primaire
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: brandConfig.secondary_color,
                      color: brandConfig.foreground_color,
                    }}
                  >
                    Bouton secondaire
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: brandConfig.accent_color }}
                  >
                    Accent
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Branding Tab */}
        {activeTab === "branding" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Informations de marque
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Logo, favicon et informations de votre boutique.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                  Logo
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <Image className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    Changer le logo
                  </Button>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  PNG ou SVG transparent, 200x60 pixels minimum.
                </p>
              </div>

              {/* Favicon */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                  Favicon
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700">
                    {faviconPreview ? (
                      <img src={faviconPreview} alt="Favicon" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <Image className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFaviconChange}
                    className="hidden"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => faviconInputRef.current?.click()}
                  >
                    Changer le favicon
                  </Button>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  ICO ou PNG, 32x32 pixels recommandé.
                </p>
              </div>
            </div>

            {/* Brand name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                Nom de la marque
              </label>
              <input
                type="text"
                value={brandConfig.brand_name}
                onChange={(e) => updateField("brand_name", e.target.value)}
                placeholder="Ma Boutique"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Ce nom apparaîtra dans l'en-tête et le pied de page du site.
              </p>
            </div>

            {/* Slogan */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                Slogan
              </label>
              <input
                type="text"
                value={brandConfig.slogan}
                onChange={(e) => updateField("slogan", e.target.value)}
                placeholder="Votre slogan accrocheur"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={brandConfig.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={4}
                placeholder="Description de votre boutique..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        )}

        {/* Typography Tab */}
        {activeTab === "typography" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Typographie
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choisissez la police de caractères de votre boutique.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                Police principale
              </label>
              <select
                value={brandConfig.font_family}
                onChange={(e) => updateField("font_family", e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Preview */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-4">
                Aperçu de la police
              </h3>
              <div
                className="space-y-4"
                style={{ fontFamily: brandConfig.font_family === "open-sans" ? "'Open Sans', sans-serif" : `${brandConfig.font_family}, sans-serif` }}
              >
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Titre (32px)</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    Bienvenue sur notre boutique
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sous-titre (24px)</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Découvrez nos produits
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Corps de texte (16px)</p>
                  <p className="text-base text-gray-900 dark:text-white dark:text-gray-300">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                    incididunt ut labore et dolore magna aliqua.
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Petit texte (14px)</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Informations supplémentaires et notes de bas de page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </Layout>
  );
}
