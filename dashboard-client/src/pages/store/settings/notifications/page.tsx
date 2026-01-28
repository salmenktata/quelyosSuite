import { useState } from "react";
import { Breadcrumbs } from "@/components/common";
import { Button } from "@/components/common/Button";
import { useToast } from "@/contexts/ToastContext";
import {
  Mail,
  MessageSquare,
  Send,
  Eye,
  EyeOff,
  Loader2,
  Check,
  Clock,
  ShoppingCart,
  Package,
  Truck,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import {
  useSMSConfig,
  useUpdateSMSConfig,
  useSMSPreferences,
  useUpdateSMSPreferences,
  useSendTestSMS,
  useSMSHistory,
  useSMSQuota,
} from "@/hooks/useSMSConfig";

const NOTIFICATION_TYPES = [
  {
    key: "abandonedCart",
    icon: ShoppingCart,
    label: "Paniers abandonnés",
    description: "Relancer les clients qui ont abandonné leur panier",
    hasDelay: true,
  },
  {
    key: "orderConfirmation",
    icon: Package,
    label: "Confirmation de commande",
    description: "Confirmer la réception de la commande",
    hasDelay: false,
  },
  {
    key: "shippingUpdate",
    icon: Truck,
    label: "Statut de livraison",
    description: "Informer des changements de statut de livraison",
    hasDelay: false,
  },
];

const SMS_STATUS_LABELS = {
  pending: { label: "En attente", color: "text-yellow-600 dark:text-yellow-400" },
  sent: { label: "Envoyé", color: "text-blue-600 dark:text-blue-400" },
  delivered: { label: "Délivré", color: "text-green-600 dark:text-green-400" },
  failed: { label: "Échec", color: "text-red-600 dark:text-red-400" },
  fallback_email: { label: "Fallback email", color: "text-purple-600 dark:text-purple-400" },
};

export default function NotificationsPage() {
  const toast = useToast();

  // SMS Config hooks (will be enabled when backend is ready)
  const { data: smsConfig } = useSMSConfig();
  const { data: preferences } = useSMSPreferences();
  const { data: history } = useSMSHistory();
  const { data: quota } = useSMSQuota();

  const updateSMSConfigMutation = useUpdateSMSConfig();
  const updatePreferencesMutation = useUpdateSMSPreferences();
  const sendTestSMSMutation = useSendTestSMS();

  const [showApiKey, setShowApiKey] = useState(false);
  const [smsApiKey, setSmsApiKey] = useState("");
  const [smsSenderName, setSmsSenderName] = useState("");
  const [testMobile, setTestMobile] = useState("");
  const [testMessage, setTestMessage] = useState("");

  // Temporary mock data until backend is ready
  const mockPreferences = preferences || {
    abandonedCartEmailEnabled: true,
    abandonedCartSmsEnabled: false,
    abandonedCartDelay: 24,
    orderConfirmationEmailEnabled: true,
    orderConfirmationSmsEnabled: false,
    shippingUpdateEmailEnabled: true,
    shippingUpdateSmsEnabled: false,
  };

  const mockQuota = quota || {
    used: 234,
    total: 1000,
    period: "month",
  };

  const quotaPercentage = (mockQuota.used / mockQuota.total) * 100;

  const handleSaveSMSConfig = async () => {
    try {
      await updateSMSConfigMutation.mutateAsync({
        apiKey: smsApiKey,
        senderName: smsSenderName,
      });
      toast.success("Configuration SMS enregistrée");
    } catch (error) {
      toast.error(`Erreur: ${error}`);
    }
  };

  const handleSendTestSMS = async () => {
    if (!testMobile || !testMessage) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      await sendTestSMSMutation.mutateAsync({
        mobile: testMobile,
        message: testMessage,
      });
      toast.success("SMS de test envoyé avec succès");
      setTestMobile("");
      setTestMessage("");
    } catch (error) {
      toast.error(`Erreur lors de l'envoi: ${error}`);
    }
  };

  const handleTogglePreference = async (key: string, value: boolean | number) => {
    try {
      await updatePreferencesMutation.mutateAsync({ [key]: value });
      toast.success("Préférence mise à jour");
    } catch (error) {
      toast.error(`Erreur: ${error}`);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Store", href: "/store" },
          { label: "Paramètres", href: "/store/settings" },
          { label: "Notifications" },
        ]}
      />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Notifications
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configurez les notifications par email et SMS pour vos clients
          </p>
        </div>

        {/* SMS Configuration Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configuration SMS
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Paramètres API Tunisie SMS
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Key *
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={smsApiKey}
                  onChange={(e) => setSmsApiKey(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  placeholder="Entrez votre API Key"
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

            {/* Sender Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom de l'expéditeur (max 11 caractères)
              </label>
              <input
                type="text"
                value={smsSenderName}
                onChange={(e) => setSmsSenderName(e.target.value.slice(0, 11))}
                maxLength={11}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                placeholder="Quelyos"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {smsSenderName.length}/11 caractères
              </p>
            </div>
          </div>

          {/* Endpoint (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Endpoint API
            </label>
            <input
              type="text"
              value="https://api.tunisiesms.tn/api/v1/send"
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400"
            />
          </div>

          <Button onClick={handleSaveSMSConfig} disabled={updateSMSConfigMutation.isPending}>
            {updateSMSConfigMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Enregistrer la configuration
              </>
            )}
          </Button>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6">
          <div className="flex items-center space-x-3">
            <Mail className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Préférences par type de notification
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Activez les canaux de notification pour chaque type d'événement
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {NOTIFICATION_TYPES.map((type) => {
              const Icon = type.icon;
              const emailKey = `${type.key}EmailEnabled` as keyof typeof mockPreferences;
              const smsKey = `${type.key}SmsEnabled` as keyof typeof mockPreferences;
              const delayKey = `${type.key}Delay` as keyof typeof mockPreferences;

              return (
                <div
                  key={type.key}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start space-x-3">
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {type.label}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {type.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-8">
                    {/* Email Toggle */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`${type.key}-email`}
                        checked={mockPreferences[emailKey] as boolean}
                        onChange={(e) => handleTogglePreference(emailKey, e.target.checked)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400"
                      />
                      <label
                        htmlFor={`${type.key}-email`}
                        className="text-sm text-gray-700 dark:text-gray-300"
                      >
                        Email
                      </label>
                    </div>

                    {/* SMS Toggle */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`${type.key}-sms`}
                        checked={mockPreferences[smsKey] as boolean}
                        onChange={(e) => handleTogglePreference(smsKey, e.target.checked)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400"
                      />
                      <label
                        htmlFor={`${type.key}-sms`}
                        className="text-sm text-gray-700 dark:text-gray-300"
                      >
                        SMS
                      </label>
                    </div>

                    {/* Delay (for abandoned cart) */}
                    {type.hasDelay && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          value={mockPreferences[delayKey] as number}
                          onChange={(e) =>
                            handleTogglePreference(delayKey, parseInt(e.target.value))
                          }
                          className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                          min="1"
                          max="72"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">heures</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Test SMS Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <Send className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Test SMS
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Envoyez un SMS de test pour vérifier la configuration
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Numéro de téléphone
              </label>
              <input
                type="tel"
                value={testMobile}
                onChange={(e) => setTestMobile(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                placeholder="+216 12 345 678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message
              </label>
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                placeholder="Message de test"
                maxLength={160}
              />
            </div>
          </div>

          <Button onClick={handleSendTestSMS} disabled={sendTestSMSMutation.isPending}>
            {sendTestSMSMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Envoyer le test
              </>
            )}
          </Button>
        </div>

        {/* SMS Quota */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
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

          {/* Progress Bar */}
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
                style={{ width: `${quotaPercentage}%` }}
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

        {/* SMS History */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Historique récent
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                10 derniers SMS envoyés
              </p>
            </div>
          </div>

          {/* Placeholder for when backend is ready */}
          <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              L'historique des SMS s'affichera ici une fois la configuration activée
            </p>
          </div>

          {/* Future table structure (commented for now)
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">Numéro</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">Message</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">Statut</th>
                </tr>
              </thead>
              <tbody>
                {history?.map((log) => (
                  <tr key={log.id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {new Date(log.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{log.mobile}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{log.message}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{log.notificationType}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={SMS_STATUS_LABELS[log.status].color}>
                        {SMS_STATUS_LABELS[log.status].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          */}
        </div>
      </div>
    </div>
  );
}
