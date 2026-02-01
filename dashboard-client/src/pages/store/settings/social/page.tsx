import { useState, useEffect } from "react";
import { Breadcrumbs } from "@/components/common";
import { Button } from "@/components/common/Button";
import { useToast } from "@/contexts/ToastContext";
import { Share2, Save, Loader2, Facebook, Instagram, Twitter, Youtube, Linkedin, Info } from "lucide-react";
import { logger } from '@quelyos/logger';
import { useSiteConfig, useUpdateSiteConfig } from "@/hooks/useSiteConfig";

// TikTok icon component (not available in lucide-react)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const socialNetworks = [
  { key: "facebook_url", label: "Facebook", icon: Facebook, placeholder: "https://facebook.com/maboutique" },
  { key: "instagram_url", label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/maboutique" },
  { key: "twitter_url", label: "Twitter / X", icon: Twitter, placeholder: "https://twitter.com/maboutique" },
  { key: "youtube_url", label: "YouTube", icon: Youtube, placeholder: "https://youtube.com/@maboutique" },
  { key: "linkedin_url", label: "LinkedIn", icon: Linkedin, placeholder: "https://linkedin.com/company/maboutique" },
  { key: "tiktok_url", label: "TikTok", icon: TikTokIcon, placeholder: "https://tiktok.com/@maboutique" },
];

export default function SocialSettingsPage() {
  const toast = useToast();
  const { data: config, isLoading } = useSiteConfig();
  const updateMutation = useUpdateSiteConfig();

  const [socialConfig, setSocialConfig] = useState<Record<string, string>>({
    facebook_url: "",
    instagram_url: "",
    twitter_url: "",
    youtube_url: "",
    linkedin_url: "",
    tiktok_url: "",
  });

  useEffect(() => {
    if (config) {
      const configData = config as any;
      setSocialConfig({
        facebook_url: configData.facebook_url || "",
        instagram_url: configData.instagram_url || "",
        twitter_url: configData.twitter_url || "",
        youtube_url: configData.youtube_url || "",
        linkedin_url: configData.linkedin_url || "",
        tiktok_url: configData.tiktok_url || "",
      });
    }
  }, [config]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(socialConfig);
      toast.success("Réseaux sociaux mis à jour");
    } catch (error) {
      logger.error("Erreur:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const activeCount = Object.values(socialConfig).filter((url) => url.trim() !== "").length;

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: "Boutique", href: "/store" },
            { label: "Paramètres", href: "/store/settings" },
            { label: "Réseaux sociaux", href: "/store/settings/social" },
          ]}
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Boutique", href: "/store" },
          { label: "Paramètres", href: "/store/settings" },
          { label: "Réseaux sociaux", href: "/store/settings/social" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-indigo-100 dark:bg-indigo-900/30 p-3">
            <Share2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Réseaux sociaux
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Liens vers vos pages sur les réseaux sociaux
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          icon={updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        >
          Enregistrer
        </Button>
      </div>

      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Ces liens seront affichés dans le footer et sur la page contact de votre boutique.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="space-y-6">
          {socialNetworks.map((network) => {
            const Icon = network.icon;
            const hasValue = socialConfig[network.key]?.trim() !== "";

            return (
              <div key={network.key}>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                  <Icon className={`h-4 w-4 ${hasValue ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"}`} />
                  {network.label}
                </label>
                <input
                  type="url"
                  value={socialConfig[network.key]}
                  onChange={(e) => setSocialConfig({ ...socialConfig, [network.key]: e.target.value })}
                  placeholder={network.placeholder}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 p-4">
        <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-2">
          Résumé
        </p>
        <p className="text-sm text-indigo-800 dark:text-indigo-200">
          {activeCount} réseau{activeCount > 1 ? "x" : ""} configuré{activeCount > 1 ? "s" : ""} sur {socialNetworks.length}
        </p>
      </div>
      </div>
    </>
  );
}
