import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Breadcrumbs } from "@/components/common";
import { Button } from "@/components/common/Button";
import { useToast } from "@/contexts/ToastContext";
import {
  MessageSquare,
  Eye,
  EyeOff,
  Loader2,
  Check,
  Send,
  Settings,
  Store,
  Calculator,
  Megaphone,
  Users,
  Briefcase,
  Package,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import { logger } from '@quelyos/logger';
import {
  useSMSConfig,
  useUpdateSMSConfig,
  useSendTestSMS,
  useSMSQuota,
  useSMSHistory,
} from "@/hooks/useSMSConfig";

const MODULES = [
  { key: "storeEnabled", label: "Store", description: "Notifications clients e-commerce", icon: Store },
  { key: "financeEnabled", label: "Finance", description: "Alertes paiements", icon: Calculator },
  { key: "marketingEnabled", label: "Marketing", description: "Campagnes SMS", icon: Megaphone },
  { key: "crmEnabled", label: "CRM", description: "Leads et prospects", icon: Users },
  { key: "hrEnabled", label: "RH", description: "Notifications employés", icon: Briefcase },
  { key: "stockEnabled", label: "Stock", description: "Alertes rupture", icon: Package },
] as const;

const SMS_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "text-yellow-600 dark:text-yellow-400" },
  sent: { label: "Envoyé", color: "text-blue-600 dark:text-blue-400" },
  delivered: { label: "Délivré", color: "text-green-600 dark:text-green-400" },
  failed: { label: "Échec", color: "text-red-600 dark:text-red-400" },
  fallback_email: { label: "Email", color: "text-purple-600 dark:text-purple-400" },
};

export default function SMSSettingsPage() {
  const toast = useToast();
  const { data: config, isLoading } = useSMSConfig();
  const { data: quota } = useSMSQuota();
  const { data: history } = useSMSHistory();
  const updateMutation = useUpdateSMSConfig();
  const sendTestMutation = useSendTestSMS();

  const [showApiKey, setShowApiKey] = useState(false);
  const [testMobile, setTestMobile] = useState("");
  const [testMessage, setTestMessage] = useState("Ceci est un SMS de test depuis Quelyos.");

  const [formData, setFormData] = useState({
    apiKey: "",
    senderName: "",
    isActive: false,
    storeEnabled: true,
    financeEnabled: false,
    marketingEnabled: false,
    crmEnabled: false,
    hrEnabled: false,
    stockEnabled: false,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        apiKey: "",
        senderName: config.senderName,
        isActive: config.isActive,
        storeEnabled: config.storeEnabled,
        financeEnabled: config.financeEnabled,
        marketingEnabled: config.marketingEnabled,
        crmEnabled: config.crmEnabled,
        hrEnabled: config.hrEnabled,
        stockEnabled: config.stockEnabled,
      });
    }
  }, [config]);

  const handleSave = async () => {
    try {
      const dataToSend = { ...formData };
      if (!dataToSend.apiKey) delete (dataToSend as Record<string, unknown>).apiKey;

      await updateMutation.mutateAsync(dataToSend);
      toast.success("Configuration SMS enregistrée");
    } catch (error) {
      logger.error("Erreur:", error);
      toast.error(`Erreur: ${error}`);
    }
  };

  const handleSendTest = async () => {
    if (!testMobile) {
      toast.error("Veuillez entrer un numéro de téléphone");
      return;
    }

    try {
      await sendTestMutation.mutateAsync({
        mobile: testMobile,
        message: testMessage,
      });
      toast.success("SMS de test envoyé");
      setTestMobile("");
    } catch (error) {
      logger.error("Erreur:", error);
      toast.error(`Erreur: ${error}`);
    }
  };

  const mockQuota = quota || { used: 0, total: 1000, period: "month" };
  const quotaPercentage = (mockQuota.used / mockQuota.total) * 100;

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 flex justify-center items-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6 max-w-4xl">
        <Breadcrumbs
          items={[
            { label: "Paramètres", href: "/settings" },
            { label: "SMS" },
          ]}
        />

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Configuration SMS
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configurez les paramètres d'envoi de SMS pour tous les modules
          </p>
        </div>

        {/* Provider */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Provider SMS
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tunisie SMS
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                API Key *
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={formData.apiKey}
                  onChange={(e) => setFormData((d) => ({ ...d, apiKey: e.target.value }))}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder={config?.apiKey ? "••••••••" : "Entrez votre API Key"}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                Nom expéditeur (max 11 caractères)
              </label>
              <input
                type="text"
                value={formData.senderName}
                onChange={(e) => setFormData((d) => ({ ...d, senderName: e.target.value.slice(0, 11) }))}
                maxLength={11}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                placeholder="Quelyos"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.senderName.length}/11 caractères
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
              Endpoint API
            </label>
            <input
              type="text"
              value={config?.endpoint || "https://api.tunisiesms.tn/api/v1/send"}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400"
            />
          </div>
        </div>

        {/* Module Activation */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Activation par module
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sélectionnez les modules qui utiliseront les SMS
                </p>
              </div>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData((d) => ({ ...d, isActive: e.target.checked }))}
                className="w-5 h-5 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300">
                SMS actif
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              const isEnabled = formData[mod.key as keyof typeof formData] as boolean;

              return (
                <label
                  key={mod.key}
                  className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    isEnabled
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) =>
                      setFormData((d) => ({ ...d, [mod.key]: e.target.checked }))
                    }
                    className="w-4 h-4 mt-0.5 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Icon
                        className={`w-4 h-4 ${
                          isEnabled
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-gray-400"
                        }`}
                      />
                      <span
                        className={`font-medium ${
                          isEnabled
                            ? "text-indigo-700 dark:text-indigo-300"
                            : "text-gray-900 dark:text-white dark:text-gray-300"
                        }`}
                      >
                        {mod.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {mod.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Quota */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Quota SMS
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Utilisation ce mois
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockQuota.used} / {mockQuota.total}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">SMS envoyés</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  quotaPercentage > 80
                    ? "bg-red-500"
                    : quotaPercentage > 50
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(quotaPercentage, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {quotaPercentage.toFixed(1)}% utilisé
              </span>
              {quotaPercentage > 80 && (
                <span className="flex items-center text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Quota bientôt atteint
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Test SMS */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <Send className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Envoyer un SMS test
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vérifiez que la configuration fonctionne
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                Numéro de téléphone
              </label>
              <input
                type="tel"
                value={testMobile}
                onChange={(e) => setTestMobile(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                placeholder="+216 12 345 678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                Message
              </label>
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                maxLength={160}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={handleSendTest}
            disabled={sendTestMutation.isPending}
          >
            {sendTestMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Envoyer le test
              </>
            )}
          </Button>
        </div>

        {/* SMS History */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Historique récent
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                10 derniers SMS envoyés
              </p>
            </div>
          </div>

          {history && history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">
                      Numéro
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">
                      Type
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((log) => (
                    <tr
                      key={log.id}
                      className="border-t border-gray-200 dark:border-gray-700"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {new Date(log.createdAt).toLocaleString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {log.mobile}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {log.notificationType}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={
                            SMS_STATUS_LABELS[log.status]?.color ||
                            "text-gray-600 dark:text-gray-400"
                          }
                        >
                          {SMS_STATUS_LABELS[log.status]?.label || log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                Aucun SMS envoyé récemment
              </p>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
