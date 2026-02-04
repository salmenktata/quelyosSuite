/**
 * Moyens de Paiement - Configuration passerelles et méthodes
 *
 * Fonctionnalités :
 * - Activation/désactivation moyens (CB, PayPal, virement, espèces)
 * - Configuration clés API Stripe/PayPal
 * - Frais et commissions par méthode
 * - Ordre d'affichage au checkout
 * - Paiement test vs production
 */

import { useState } from "react";
import { Layout } from '@/components/Layout'
import { Breadcrumbs } from "@/components/common";
import { Button } from "@/components/common/Button";
import { useToast } from "@/contexts/ToastContext";
import { Check, X, Settings, TestTube2, Loader2, Eye, EyeOff } from "lucide-react";
import { logger } from '@quelyos/logger';
import {
  usePaymentProviders,
  useUpdatePaymentProvider,
  useTestPaymentProvider,
  PaymentProvider,
} from "@/hooks/usePaymentProviders";

const PROVIDER_INFO = {
  stripe: {
    title: "Stripe",
    description: "Plateforme de paiement internationale avec cartes bancaires",
    logo: "💳",
    color: "bg-blue-500",
  },
  flouci: {
    title: "Flouci",
    description: "Solution de paiement mobile tunisienne",
    logo: "📱",
    color: "bg-green-500",
  },
  konnect: {
    title: "Konnect",
    description: "Gateway de paiement tunisien multi-méthodes",
    logo: "🔗",
    color: "bg-purple-500",
  },
};

const STATE_BADGE = {
  disabled: { label: "Désactivé", color: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300" },
  test: { label: "Mode Test", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300" },
  enabled: { label: "Actif", color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" },
};

export default function PaymentMethodsPage() {
  const toast = useToast();
  const { data: providers, isLoading } = usePaymentProviders();
  const updateProviderMutation = useUpdatePaymentProvider();
  const testProviderMutation = useTestPaymentProvider();

  const [editingProvider, setEditingProvider] = useState<PaymentProvider | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const handleStateToggle = async (provider: PaymentProvider) => {
    const newState = provider.state === 'enabled' ? 'disabled' : 'enabled';

    try {
      await updateProviderMutation.mutateAsync({
        provider_id: provider.id,
        state: newState,
      });
      toast.success(`${provider.name} ${newState === 'enabled' ? 'activé' : 'désactivé'}`);
    } catch (error) {
      logger.error("Erreur:", error);
      toast.error(`Erreur lors de la modification: ${error}`);
    }
  };

  const handleTestConnection = async (provider: PaymentProvider) => {
    try {
      const result = await testProviderMutation.mutateAsync(provider.id);
      toast.success(result.message || "Connexion réussie !");
    } catch (error) {
      logger.error("Erreur:", error);
      toast.error(`Test échoué: ${error}`);
    }
  };

  const handleSaveConfig = async (provider: PaymentProvider, formData: Record<string, string | boolean | number>) => {
    try {
      await updateProviderMutation.mutateAsync({
        provider_id: provider.id,
        ...formData,
      });
      toast.success(`Configuration de ${provider.name} enregistrée`);
      setEditingProvider(null);
    } catch (error) {
      logger.error("Erreur:", error);
      toast.error(`Erreur lors de l'enregistrement: ${error}`);
    }
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Store", href: "/store" },
          { label: "Paramètres", href: "/store/settings" },
          { label: "Moyens de paiement" },
        ]}
      />

      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Moyens de paiement
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configurez les providers de paiement disponibles sur votre boutique en ligne
          </p>
        </div>

        {/* Provider Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers?.map((provider) => {
            const info = PROVIDER_INFO[provider.code];
            const badge = STATE_BADGE[provider.state];

            return (
              <div
                key={provider.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 ${info.color} rounded-lg flex items-center justify-center text-2xl`}>
                      {info.logo}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {info.title}
                      </h3>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {info.description}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Toggle State */}
                  <Button
                    onClick={() => handleStateToggle(provider)}
                    disabled={updateProviderMutation.isPending}
                    size="sm"
                    variant={provider.state === 'enabled' ? 'danger' : 'primary'}
                  >
                    {provider.state === 'enabled' ? (
                      <>
                        <X className="w-4 h-4 mr-1" />
                        Désactiver
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Activer
                      </>
                    )}
                  </Button>

                  {/* Configure */}
                  <Button
                    onClick={() => setEditingProvider(provider)}
                    size="sm"
                    variant="secondary"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Configurer
                  </Button>

                  {/* Test Connection */}
                  {provider.state !== 'disabled' && (
                    <Button
                      onClick={() => handleTestConnection(provider)}
                      disabled={testProviderMutation.isPending}
                      size="sm"
                      variant="ghost"
                      title="Tester la connexion"
                    >
                      <TestTube2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Configuration Modal */}
      {editingProvider && (
        <ConfigModal
          provider={editingProvider}
          onClose={() => setEditingProvider(null)}
          onSave={handleSaveConfig}
          showSecrets={showSecrets}
          toggleSecretVisibility={toggleSecretVisibility}
          isSaving={updateProviderMutation.isPending}
        />
      )}
      </div>
    </Layout>
  );
}

// Configuration Modal Component
interface ConfigModalProps {
  provider: PaymentProvider;
  onClose: () => void;
  onSave: (provider: PaymentProvider, formData: Record<string, string | boolean | number>) => void;
  showSecrets: Record<string, boolean>;
  toggleSecretVisibility: (key: string) => void;
  isSaving: boolean;
}

function ConfigModal({
  provider,
  onClose,
  onSave,
  showSecrets,
  toggleSecretVisibility,
  isSaving,
}: ConfigModalProps) {
  const [formData, setFormData] = useState<Record<string, string | boolean | number>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(provider, formData);
  };

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Configuration {provider.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Saisissez vos identifiants API
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Flouci Fields */}
          {provider.code === 'flouci' && (
            <div className="space-y-4">
              {/* App Token */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  App Token *
                </label>
                <div className="relative">
                  <input
                    type={showSecrets['flouci_token'] ? 'text' : 'password'}
                    defaultValue={provider.appToken}
                    onChange={(e) => handleChange('flouci_app_token', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                    placeholder="Entrez votre App Token"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility('flouci_token')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showSecrets['flouci_token'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* App Secret */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  App Secret *
                </label>
                <div className="relative">
                  <input
                    type={showSecrets['flouci_secret'] ? 'text' : 'password'}
                    onChange={(e) => handleChange('flouci_app_secret', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                    placeholder="Entrez votre App Secret"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility('flouci_secret')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showSecrets['flouci_secret'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Timeout */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  Timeout (minutes)
                </label>
                <input
                  type="number"
                  defaultValue={provider.timeout || 60}
                  onChange={(e) => handleChange('flouci_timeout', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  min="1"
                  max="120"
                />
              </div>

              {/* Accept Cards */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="accept_cards"
                  defaultChecked={provider.acceptCards ?? true}
                  onChange={(e) => handleChange('flouci_accept_cards', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400"
                />
                <label htmlFor="accept_cards" className="ml-2 text-sm text-gray-900 dark:text-white dark:text-gray-300">
                  Accepter les cartes bancaires
                </label>
              </div>
            </div>
          )}

          {/* Konnect Fields */}
          {provider.code === 'konnect' && (
            <div className="space-y-4">
              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  API Key *
                </label>
                <div className="relative">
                  <input
                    type={showSecrets['konnect_key'] ? 'text' : 'password'}
                    onChange={(e) => handleChange('konnect_api_key', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                    placeholder="Entrez votre API Key"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility('konnect_key')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showSecrets['konnect_key'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Wallet ID */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  Wallet ID *
                </label>
                <input
                  type="text"
                  defaultValue={provider.walletId}
                  onChange={(e) => handleChange('konnect_wallet_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  placeholder="Entrez votre Wallet ID"
                />
              </div>

              {/* Lifespan */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  Durée de vie lien (minutes)
                </label>
                <input
                  type="number"
                  defaultValue={provider.lifespan || 10}
                  onChange={(e) => handleChange('konnect_lifespan', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  min="1"
                  max="60"
                />
              </div>

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  Thème checkout
                </label>
                <select
                  defaultValue={provider.theme || 'light'}
                  onChange={(e) => handleChange('konnect_theme', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                >
                  <option value="light">Clair</option>
                  <option value="dark">Sombre</option>
                </select>
              </div>
            </div>
          )}

          {/* Stripe notice */}
          {provider.code === 'stripe' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                La configuration Stripe se fait via les paramètres Stripe existants.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
            <Button type="button" onClick={onClose} variant="secondary">
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
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
        </form>
      </div>
    </div>
  );
}
