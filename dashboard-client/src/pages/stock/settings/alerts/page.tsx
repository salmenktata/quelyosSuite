import { useState } from "react";
import { Breadcrumbs } from "@/components/common";
import { Button } from "@/components/common/Button";
import { useToast } from "@/contexts/ToastContext";
import { Bell, Save, Loader2, Mail, MessageSquare, AlertTriangle , Info } from "lucide-react";

export default function AlertsSettingsPage() {
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState({
    low_stock_enabled: true,
    low_stock_threshold: 10,
    out_of_stock_enabled: true,
    overstock_enabled: false,
    overstock_threshold: 500,
    expiry_enabled: true,
    expiry_days_before: 30,
    notify_email: true,
    notify_dashboard: true,
    notify_sms: false,
    email_recipients: "",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Configuration des alertes mise à jour");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Stock", href: "/stock" },
          { label: "Paramètres", href: "/stock/settings" },
          { label: "Alertes stock", href: "/stock/settings/alerts" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-orange-100 dark:bg-orange-900/30 p-3">
            <Bell className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Alertes stock
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Notifications et seuils d'alerte
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        >
          Enregistrer
        </Button>
      </div>

      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Configurez les notifications pour anticiper les ruptures de stock et optimiser vos commandes.
          </p>
        </div>
      </div>

      {/* Types d'alertes */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
          Types d'alertes
        </h3>
        <div className="space-y-4">
          {/* Stock bas */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Stock bas
                </p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Alerte quand le stock descend sous un seuil.
              </p>
              {config.low_stock_enabled && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Seuil :</span>
                  <input
                    type="number"
                    value={config.low_stock_threshold}
                    onChange={(e) => setConfig({ ...config, low_stock_threshold: Number(e.target.value) })}
                    min={0}
                    className="w-24 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm text-gray-900 dark:text-white"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">unités</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setConfig({ ...config, low_stock_enabled: !config.low_stock_enabled })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                config.low_stock_enabled ? "bg-orange-600" : "bg-gray-200 dark:bg-gray-600"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  config.low_stock_enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Rupture de stock */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Rupture de stock
                </p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Alerte immédiate quand un produit atteint zéro.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfig({ ...config, out_of_stock_enabled: !config.out_of_stock_enabled })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                config.out_of_stock_enabled ? "bg-orange-600" : "bg-gray-200 dark:bg-gray-600"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  config.out_of_stock_enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Surstock */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-blue-500" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Surstock
                </p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Alerte quand le stock dépasse un seuil maximum.
              </p>
              {config.overstock_enabled && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Seuil :</span>
                  <input
                    type="number"
                    value={config.overstock_threshold}
                    onChange={(e) => setConfig({ ...config, overstock_threshold: Number(e.target.value) })}
                    min={0}
                    className="w-24 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm text-gray-900 dark:text-white"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">unités</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setConfig({ ...config, overstock_enabled: !config.overstock_enabled })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                config.overstock_enabled ? "bg-orange-600" : "bg-gray-200 dark:bg-gray-600"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  config.overstock_enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Expiration */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-purple-500" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Expiration produits
                </p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Alerte avant expiration des lots.
              </p>
              {config.expiry_enabled && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Alerter</span>
                  <input
                    type="number"
                    value={config.expiry_days_before}
                    onChange={(e) => setConfig({ ...config, expiry_days_before: Number(e.target.value) })}
                    min={1}
                    className="w-20 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm text-gray-900 dark:text-white"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">jours avant</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setConfig({ ...config, expiry_enabled: !config.expiry_enabled })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                config.expiry_enabled ? "bg-orange-600" : "bg-gray-200 dark:bg-gray-600"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  config.expiry_enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Canaux de notification */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
          Canaux de notification
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-white">Email</span>
            </div>
            <button
              type="button"
              onClick={() => setConfig({ ...config, notify_email: !config.notify_email })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                config.notify_email ? "bg-orange-600" : "bg-gray-200 dark:bg-gray-600"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  config.notify_email ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-white">Dashboard</span>
            </div>
            <button
              type="button"
              onClick={() => setConfig({ ...config, notify_dashboard: !config.notify_dashboard })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                config.notify_dashboard ? "bg-orange-600" : "bg-gray-200 dark:bg-gray-600"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  config.notify_dashboard ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-white">SMS</span>
            </div>
            <button
              type="button"
              onClick={() => setConfig({ ...config, notify_sms: !config.notify_sms })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                config.notify_sms ? "bg-orange-600" : "bg-gray-200 dark:bg-gray-600"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  config.notify_sms ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </label>
        </div>

        {config.notify_email && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
              Destinataires email
            </label>
            <input
              type="text"
              value={config.email_recipients}
              onChange={(e) => setConfig({ ...config, email_recipients: e.target.value })}
              placeholder="email1@example.com, email2@example.com"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Séparez les adresses par des virgules.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
