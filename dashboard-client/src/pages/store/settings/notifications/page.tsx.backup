import { Breadcrumbs } from "@/components/common";
import { useToast } from "@/contexts/ToastContext";
import {
  Mail,
  MessageSquare,
  Clock,
  ShoppingCart,
  Package,
  Truck,
  Settings,
  ExternalLink,
} from "lucide-react";
import { logger } from '@quelyos/logger';
import { Link } from "react-router-dom";
import {
  useSMSPreferences,
  useUpdateSMSPreferences,
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

export default function NotificationsPage() {
  const toast = useToast();
  const { data: preferences } = useSMSPreferences();
  const updatePreferencesMutation = useUpdateSMSPreferences();

  const mockPreferences = preferences || {
    abandonedCartEmailEnabled: true,
    abandonedCartSmsEnabled: false,
    abandonedCartDelay: 24,
    orderConfirmationEmailEnabled: true,
    orderConfirmationSmsEnabled: false,
    shippingUpdateEmailEnabled: true,
    shippingUpdateSmsEnabled: false,
  };

  const handleTogglePreference = async (key: string, value: boolean | number) => {
    try {
      await updatePreferencesMutation.mutateAsync({ [key]: value });
      toast.success("Préférence mise à jour");
    } catch (error) {
      logger.error("Erreur:", error);
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
            Notifications Store
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configurez les événements qui déclenchent des notifications clients
          </p>
        </div>

        {/* Link to global settings */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                Configuration globale
              </h3>
              <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                Les paramètres de connexion Email et SMS se trouvent dans les Paramètres Généraux.
              </p>
              <div className="flex space-x-4 mt-3">
                <Link
                  to="/settings/email"
                  className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  <Mail className="w-4 h-4 mr-1.5" />
                  Config Email
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Link>
                <Link
                  to="/settings/sms"
                  className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  Config SMS
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6">
          <div className="flex items-center space-x-3">
            <Mail className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Préférences par événement
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Activez les canaux de notification pour chaque type d'événement Store
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
                        className="flex items-center text-sm text-gray-900 dark:text-white dark:text-gray-300"
                      >
                        <Mail className="w-4 h-4 mr-1.5 text-gray-400" />
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
                        className="flex items-center text-sm text-gray-900 dark:text-white dark:text-gray-300"
                      >
                        <MessageSquare className="w-4 h-4 mr-1.5 text-gray-400" />
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
      </div>
    </div>
  );
}
