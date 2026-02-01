import { useState, useEffect } from "react";
import { Layout } from '@/components/Layout';
import { Breadcrumbs } from "@/components/common";
import { Button } from "@/components/common/Button";
import { useToast } from "@/contexts/ToastContext";
import {
  Mail,
  Eye,
  EyeOff,
  Loader2,
  Check,
  Server,
  Key,
  Send,
  Settings,
} from "lucide-react";
import { logger } from '@quelyos/logger';
import {
  useEmailConfig,
  useUpdateEmailConfig,
  useTestEmailConnection,
  type EmailProvider,
  type SmtpEncryption,
} from "@/hooks/useEmailConfig";

const PROVIDERS = [
  { value: "smtp", label: "SMTP personnalisé", icon: Server },
  { value: "brevo", label: "Brevo (Sendinblue)", icon: Mail },
  { value: "sendgrid", label: "SendGrid", icon: Send },
  { value: "mailgun", label: "Mailgun", icon: Mail },
] as const;

export default function MarketingEmailSettingsPage() {
  const toast = useToast();
  const { data: config, isLoading } = useEmailConfig();
  const updateMutation = useUpdateEmailConfig();
  const testMutation = useTestEmailConnection();

  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const [formData, setFormData] = useState({
    provider: "smtp" as EmailProvider,
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    smtpEncryption: "tls" as SmtpEncryption,
    apiKey: "",
    emailFrom: "",
    emailFromName: "",
    isActive: false,
    marketingEnabled: true,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        provider: config.provider,
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpUser: config.smtpUser,
        smtpPassword: "",
        smtpEncryption: config.smtpEncryption,
        apiKey: "",
        emailFrom: config.emailFrom,
        emailFromName: config.emailFromName,
        isActive: config.isActive,
        marketingEnabled: config.marketingEnabled,
      });
    }
  }, [config]);

  const handleSave = async () => {
    try {
      const dataToSend = { ...formData };
      if (!dataToSend.smtpPassword) delete (dataToSend as Record<string, unknown>).smtpPassword;
      if (!dataToSend.apiKey) delete (dataToSend as Record<string, unknown>).apiKey;

      await updateMutation.mutateAsync(dataToSend);
      toast.success("Configuration email enregistrée");
    } catch (error) {
      logger.error("Erreur:", error);
      toast.error(`Erreur: ${error}`);
    }
  };

  const handleTestConnection = async () => {
    try {
      const result = await testMutation.mutateAsync(testEmail ? { testEmail } : undefined);
      toast.success(result.message || "Connexion réussie");
    } catch (error) {
      logger.error("Erreur:", error);
      toast.error(`Erreur: ${error}`);
    }
  };

  const isSmtp = formData.provider === "smtp";

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <Breadcrumbs
        items={[
          { label: "Marketing", href: "/marketing" },
          { label: "Paramètres", href: "/marketing/settings" },
          { label: "Email" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Configuration Email
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Paramètres d'envoi d'emails pour les campagnes marketing
        </p>
      </div>

      {/* Statut Marketing */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${formData.isActive && formData.marketingEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Email Marketing</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formData.isActive && formData.marketingEnabled ? 'Actif - prêt pour les campagnes' : 'Inactif'}
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

      {/* Provider Selection */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <Settings className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Provider</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PROVIDERS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setFormData((d) => ({ ...d, provider: p.value }))}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.provider === p.value
                    ? "border-pink-500 bg-pink-50 dark:bg-pink-900/30"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 ${formData.provider === p.value ? "text-pink-600 dark:text-pink-400" : "text-gray-400"}`} />
                <span className={`text-sm font-medium ${formData.provider === p.value ? "text-pink-700 dark:text-pink-300" : "text-gray-600 dark:text-gray-400"}`}>
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SMTP Configuration */}
      {isSmtp && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <Server className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Configuration SMTP</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Serveur SMTP *</label>
              <input
                type="text"
                value={formData.smtpHost}
                onChange={(e) => setFormData((d) => ({ ...d, smtpHost: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
                placeholder="smtp.example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Port</label>
              <input
                type="number"
                value={formData.smtpPort}
                onChange={(e) => setFormData((d) => ({ ...d, smtpPort: parseInt(e.target.value) || 587 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Utilisateur</label>
              <input
                type="text"
                value={formData.smtpUser}
                onChange={(e) => setFormData((d) => ({ ...d, smtpUser: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.smtpPassword}
                  onChange={(e) => setFormData((d) => ({ ...d, smtpPassword: e.target.value }))}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
                  placeholder={config?.smtpPassword ? "••••••••" : ""}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Chiffrement</label>
              <select
                value={formData.smtpEncryption}
                onChange={(e) => setFormData((d) => ({ ...d, smtpEncryption: e.target.value as SmtpEncryption }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
              >
                <option value="none">Aucun</option>
                <option value="tls">TLS (port 587)</option>
                <option value="ssl">SSL (port 465)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* API Configuration */}
      {!isSmtp && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <Key className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Configuration API</h2>
          </div>
          <div>
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
        </div>
      )}

      {/* Sender Configuration */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <Mail className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email expéditeur</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Adresse email *</label>
            <input
              type="email"
              value={formData.emailFrom}
              onChange={(e) => setFormData((d) => ({ ...d, emailFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
              placeholder="marketing@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Nom affiché</label>
            <input
              type="text"
              value={formData.emailFromName}
              onChange={(e) => setFormData((d) => ({ ...d, emailFromName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
              placeholder="Marketing Quelyos"
            />
          </div>
        </div>
      </div>

      {/* Test Connection */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <Send className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tester la connexion</h2>
        </div>
        <div className="flex gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Email de test (optionnel)"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
          />
          <Button
            onClick={handleTestConnection}
            loading={testMutation.isPending}
            variant="secondary"
          >
            {testMutation.isSuccess ? <Check className="w-4 h-4" /> : "Tester"}
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button onClick={handleSave} loading={updateMutation.isPending}>
          Enregistrer
        </Button>
      </div>
      </div>
    </Layout>
  );
}
