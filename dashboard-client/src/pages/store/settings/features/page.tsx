/**
 * Fonctionnalités - Activation/désactivation modules e-commerce
 *
 * Fonctionnalités :
 * - Toggle Wishlist (liste de souhaits produits)
 * - Toggle Avis clients avec modération
 * - Toggle Comparateur produits
 * - Toggle Newsletter inscription
 * - Toggle Compte client requis pour commande
 */

import { useState, useEffect } from "react";
import { Layout } from '@/components/Layout'
import { Breadcrumbs } from "@/components/common";
import { Button } from "@/components/common/Button";
import { useToast } from "@/contexts/ToastContext";
import { ToggleLeft, Save, Loader2, Heart, Star, Layers, Mail, Info, Moon, UserX, AlertCircle, RefreshCw } from "lucide-react";
import { logger } from '@quelyos/logger';
import { useSiteConfig, useUpdateSiteConfig } from "@/hooks/useSiteConfig";
import { useMyTenant, useUpdateMyTenant } from "@/hooks/useMyTenant";

const featureLabels = {
  wishlist_enabled: {
    label: "Liste de souhaits",
    description: "Permettre aux clients de sauvegarder des produits pour plus tard.",
    icon: Heart,
    category: "shopping",
  },
  reviews_enabled: {
    label: "Avis clients",
    description: "Afficher les avis et notes des clients sur les produits.",
    icon: Star,
    category: "shopping",
  },
  compare_enabled: {
    label: "Comparateur de produits",
    description: "Permettre aux clients de comparer plusieurs produits côte à côte.",
    icon: Layers,
    category: "shopping",
  },
  newsletter_enabled: {
    label: "Newsletter",
    description: "Afficher le formulaire d'inscription à la newsletter.",
    icon: Mail,
    category: "marketing",
  },
  guest_checkout_enabled: {
    label: "Commande invité",
    description: "Permettre aux clients de commander sans créer de compte.",
    icon: UserX,
    category: "checkout",
  },
};

const darkModeLabels = {
  dark_mode_enabled: {
    label: "Mode sombre",
    description: "Activer l'option de mode sombre sur votre boutique.",
    icon: Moon,
  },
  dark_mode_default: {
    label: "Mode sombre par défaut",
    description: "Afficher le site en mode sombre par défaut pour les nouveaux visiteurs.",
    icon: Moon,
  },
};

const categories = [
  { key: "shopping", label: "Expérience d'achat" },
  { key: "checkout", label: "Paiement" },
  { key: "marketing", label: "Marketing" },
];

export default function FeaturesSettingsPage() {
  const toast = useToast();
  const { data: config, isLoading: configLoading, error: configError, refetch: refetchConfig } = useSiteConfig();
  const updateConfigMutation = useUpdateSiteConfig();
  const { data: tenant, isLoading: tenantLoading, error: tenantError, refetch: refetchTenant } = useMyTenant();
  const updateTenantMutation = useUpdateMyTenant();

  const [features, setFeatures] = useState({
    wishlist_enabled: true,
    reviews_enabled: true,
    compare_enabled: true,
    newsletter_enabled: true,
    guest_checkout_enabled: true,
  });

  const [darkModeSettings, setDarkModeSettings] = useState({
    dark_mode_enabled: true,
    dark_mode_default: false,
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (config) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFeatures({
        wishlist_enabled: config.wishlist_enabled ?? true,
        reviews_enabled: config.reviews_enabled ?? true,
        compare_enabled: config.compare_enabled ?? true,
        newsletter_enabled: config.newsletter_enabled ?? true,
        guest_checkout_enabled: (config).guest_checkout_enabled ?? true,
      });
    }
  }, [config]);

  useEffect(() => {
    if (tenant) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDarkModeSettings({
        dark_mode_enabled: tenant.theme?.darkMode?.enabled ?? true,
        dark_mode_default: tenant.theme?.darkMode?.defaultDark ?? false,
      });
    }
  }, [tenant]);

  const error = tenantError || configError;
  const handleRefetch = () => {
    refetchTenant();
    refetchConfig();
  };

  if (error) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <Breadcrumbs
            items={[
              { label: "Accueil", href: "/dashboard" },
              { label: "Boutique", href: "/store" },
              { label: "Paramètres", href: "/store/settings" },
              { label: "Fonctionnalités" },
            ]}
          />
          <div role="alert" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement de la configuration des fonctionnalités.
              </p>
              <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={handleRefetch}>
                Réessayer
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const handleToggle = (key: keyof typeof features) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const handleDarkModeToggle = (key: keyof typeof darkModeSettings) => {
    setDarkModeSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      // Save features to site config
      await updateConfigMutation.mutateAsync(features);

      // Save dark mode settings to tenant
      await updateTenantMutation.mutateAsync({
        enable_dark_mode: darkModeSettings.dark_mode_enabled,
        default_dark: darkModeSettings.dark_mode_default,
      });

      toast.success("Fonctionnalités mises à jour");
      setHasChanges(false);
      refetch();
    } catch (error) {
      logger.error("Erreur:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const isLoading = configLoading || tenantLoading;
  const isSaving = updateConfigMutation.isPending || updateTenantMutation.isPending;

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Breadcrumbs
            items={[
              { label: "Boutique", href: "/store" },
              { label: "Paramètres", href: "/store/settings" },
              { label: "Fonctionnalités", href: "/store/settings/features" },
            ]}
          />
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        </div>
      </Layout>
    );
  }

  // Group features by category
  const featuresByCategory = categories.map((cat) => ({
    ...cat,
    features: Object.entries(featureLabels).filter(
      ([_, config]) => config.category === cat.key
    ),
  }));

  return (
    <Layout>
      <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Boutique", href: "/store" },
          { label: "Paramètres", href: "/store/settings" },
          { label: "Fonctionnalités", href: "/store/settings/features" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-indigo-100 dark:bg-indigo-900/30 p-3">
            <ToggleLeft className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Fonctionnalités
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Activez ou désactivez les fonctionnalités de votre boutique
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          icon={isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        >
          Enregistrer
        </Button>
      </div>

      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Personnalisez l'expérience d'achat en activant ou désactivant des fonctionnalités.
          </p>
        </div>
      </div>

      {/* Dark Mode Section */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Moon className="h-4 w-4 text-indigo-500" />
            Mode sombre
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {(Object.keys(darkModeLabels) as (keyof typeof darkModeLabels)[]).map((key) => {
            const setting = darkModeLabels[key];
            const Icon = setting.icon;
            const isEnabled = darkModeSettings[key];
            const isDisabled = key === "dark_mode_default" && !darkModeSettings.dark_mode_enabled;

            return (
              <div
                key={key}
                className={`flex items-center justify-between p-4 transition ${
                  isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`rounded-lg p-2 ${isEnabled && !isDisabled ? "bg-indigo-100 dark:bg-indigo-900/30" : "bg-gray-100 dark:bg-gray-700"}`}>
                    <Icon className={`h-5 w-5 ${isEnabled && !isDisabled ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {setting.label}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {setting.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDarkModeToggle(key)}
                  disabled={isDisabled}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                    isEnabled ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-600"
                  } ${isDisabled ? "cursor-not-allowed" : ""}`}
                  role="switch"
                  aria-checked={isEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature toggles by category */}
      {featuresByCategory.map((category) => (
        <div
          key={category.key}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {category.label}
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {category.features.map(([key, config]) => {
              const Icon = config.icon;
              const isEnabled = features[key as keyof typeof features];

              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                >
                  <div className="flex items-start gap-4">
                    <div className={`rounded-lg p-2 ${isEnabled ? "bg-indigo-100 dark:bg-indigo-900/30" : "bg-gray-100 dark:bg-gray-700"}`}>
                      <Icon className={`h-5 w-5 ${isEnabled ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {config.label}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {config.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle(key as keyof typeof features)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                      isEnabled ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-600"
                    }`}
                    role="switch"
                    aria-checked={isEnabled}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 p-4">
        <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-2">
          Résumé
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-indigo-800 dark:text-indigo-200">
          <span>
            {Object.values(features).filter(Boolean).length} fonctionnalité(s) activée(s) sur {Object.keys(features).length}
          </span>
          <span>•</span>
          <span>
            Mode sombre : {darkModeSettings.dark_mode_enabled ? "activé" : "désactivé"}
            {darkModeSettings.dark_mode_enabled && darkModeSettings.dark_mode_default && " (par défaut)"}
          </span>
        </div>
      </div>
      </div>
    </Layout>
  );
}
