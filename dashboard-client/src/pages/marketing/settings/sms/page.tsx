import { useState, useEffect } from "react";
import { Breadcrumbs, Badge } from "@/components/common";
import { Button } from "@/components/common/Button";
import { useToast } from "@/contexts/ToastContext";
import {
  Eye,
  EyeOff,
  Loader2,
  Check,
  Key,
  Send,
  Clock,
} from "lucide-react";
import { logger } from '@quelyos/logger';
import {
  useSMSConfig,
  useUpdateSMSConfig,
  useSendTestSMS,
  useSMSHistory,
  useSMSQuota,
} from "@/hooks/useSMSConfig";

export default function MarketingSMSSettingsPage() {
  const toast = useToast();
  const { data: config, isLoading } = useSMSConfig();
  const { data: history } = useSMSHistory();
  const { data: quota } = useSMSQuota();
  const updateMutation = useUpdateSMSConfig();
  const testMutation = useSendTestSMS();

  const [showApiKey, setShowApiKey] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Test SMS depuis Quelyos Marketing");

  const [formData, setFormData] = useState({
    apiKey: "",
    senderName: "",
    endpoint: "",
    isActive: false,
    marketingEnabled: true,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        apiKey: "",
        senderName: config.senderName,
        endpoint: config.endpoint,
        isActive: config.isActive,
        marketingEnabled: config.marketingEnabled,
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

  const handleTestSMS = async () => {
    if (!testPhone) {
      toast.error("Numéro de téléphone requis");
      return;
    }
    try {
      await testMutation.mutateAsync({ mobile: testPhone, message: testMessage });
      toast.success("SMS de test envoyé");
    } catch (error) {
      logger.error("Erreur:", error);
      toast.error(`Erreur: ${error}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
      sent: { label: 'Envoyé', variant: 'success' },
      delivered: { label: 'Délivré', variant: 'success' },
      pending: { label: 'En attente', variant: 'warning' },
      failed: { label: 'Échec', variant: 'error' },
      fallback_email: { label: 'Email fallback', variant: 'info' },
    };
    const c = config[status] || { label: status, variant: 'info' };
    return <Badge variant={c.variant} size="sm">{c.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Breadcrumbs
        items={[
          { label: "Marketing", href: "/marketing" },
          { label: "Paramètres", href: "/marketing/settings" },
          { label: "SMS" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Configuration SMS
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Paramètres d'envoi de SMS pour les campagnes marketing
        </p>
      </div>

      {/* Statut + Quota */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${formData.isActive && formData.marketingEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">SMS Marketing</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formData.isActive && formData.marketingEnabled ? 'Actif' : 'Inactif'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.marketingEnabled}
                onChange={(e) => setFormData((d) => ({ ...d, marketingEnabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
            </label>
          </div>
        </div>

        {quota && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Quota mensuel</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      quota.used / quota.total > 0.9 ? 'bg-red-500' : quota.used / quota.total > 0.7 ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((quota.used / quota.total) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {quota.used} / {quota.total}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* API Configuration */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <Key className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Configuration API</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">API Key *</label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={formData.apiKey}
                onChange={(e) => setFormData((d) => ({ ...d, apiKey: e.target.value }))}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
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
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Nom expéditeur</label>
            <input
              type="text"
              value={formData.senderName}
              onChange={(e) => setFormData((d) => ({ ...d, senderName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
              placeholder="Quelyos"
              maxLength={11}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max 11 caractères</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Endpoint API</label>
            <input
              type="text"
              value={formData.endpoint}
              onChange={(e) => setFormData((d) => ({ ...d, endpoint: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
              placeholder="https://api.tunisiesms.tn/v1"
            />
          </div>
        </div>
      </div>

      {/* Test SMS */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <Send className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Envoyer un SMS test</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Numéro *</label>
            <input
              type="tel"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+216 XX XXX XXX"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Message</label>
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>
        <Button onClick={handleTestSMS} loading={testMutation.isPending} variant="secondary">
          {testMutation.isSuccess ? <Check className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
          Envoyer test
        </Button>
      </div>

      {/* Historique récent */}
      {history && history.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Historique récent</h2>
          </div>
          <div className="space-y-2">
            {history.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{log.mobile}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{log.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(log.status)}
                  <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString('fr-FR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button onClick={handleSave} loading={updateMutation.isPending}>
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
