import { useState, useEffect } from "react";
import { Breadcrumbs } from "@/components/common";
import { Button } from "@/components/common/Button";
import { useToast } from "@/contexts/ToastContext";
import { RotateCcw, Save, Loader2, Clock, Shield , Info } from "lucide-react";
import { useSiteConfig, useUpdateSiteConfig } from "@/hooks/useSiteConfig";

export default function ReturnsSettingsPage() {
  const toast = useToast();
  const { data: config, isLoading } = useSiteConfig();
  const updateMutation = useUpdateSiteConfig();

  const [returnsConfig, setReturnsConfig] = useState({
    return_delay_days: 30,
    refund_delay_days: "7-10",
    warranty_years: 2,
  });

  useEffect(() => {
    if (config) {
      setReturnsConfig({
        return_delay_days: config.return_delay_days || 30,
        refund_delay_days: config.refund_delay_days || "7-10",
        warranty_years: config.warranty_years || 2,
      });
    }
  }, [config]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(returnsConfig);
      toast.success("Politique de retours mise à jour");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Boutique", href: "/store" },
            { label: "Paramètres", href: "/store/settings" },
            { label: "Retours & Garantie", href: "/store/settings/returns" },
          ]}
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Boutique", href: "/store" },
          { label: "Paramètres", href: "/store/settings" },
          { label: "Retours & Garantie", href: "/store/settings/returns" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-indigo-100 dark:bg-indigo-900/30 p-3">
            <RotateCcw className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Retours & Garantie
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Politique de retour et garantie produits
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
            Ces informations sont affichées sur les fiches produits et dans les conditions générales.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="space-y-6">
          {/* Délai retour */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
              <RotateCcw className="h-4 w-4" />
              Délai de retour
            </label>
            <div className="relative">
              <input
                type="number"
                value={returnsConfig.return_delay_days}
                onChange={(e) => setReturnsConfig({ ...returnsConfig, return_delay_days: Number(e.target.value) })}
                min={0}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 pr-16 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                jours
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Nombre de jours après réception pour retourner un produit.
            </p>
          </div>

          {/* Délai remboursement */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
              <Clock className="h-4 w-4" />
              Délai de remboursement
            </label>
            <input
              type="text"
              value={returnsConfig.refund_delay_days}
              onChange={(e) => setReturnsConfig({ ...returnsConfig, refund_delay_days: e.target.value })}
              placeholder="7-10"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Exemple : "7-10" pour 7 à 10 jours ouvrés après réception du retour.
            </p>
          </div>

          {/* Garantie */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
              <Shield className="h-4 w-4" />
              Durée de garantie
            </label>
            <div className="relative">
              <input
                type="number"
                value={returnsConfig.warranty_years}
                onChange={(e) => setReturnsConfig({ ...returnsConfig, warranty_years: Number(e.target.value) })}
                min={0}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 pr-12 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                an(s)
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Durée de la garantie constructeur par défaut. Mettre 0 pour désactiver.
            </p>
          </div>

          {/* Preview */}
          <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 p-4">
            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-2">
              Aperçu client
            </p>
            <div className="space-y-2 text-sm text-indigo-800 dark:text-indigo-200">
              <p>Retours acceptés sous {returnsConfig.return_delay_days} jours</p>
              <p>Remboursement sous {returnsConfig.refund_delay_days} jours ouvrés</p>
              {returnsConfig.warranty_years > 0 && (
                <p>Garantie : {returnsConfig.warranty_years} an{returnsConfig.warranty_years > 1 ? "s" : ""}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
