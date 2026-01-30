import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
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
  Store,
  Calculator,
  Megaphone,
  Users,
  Briefcase,
  Package,
} from "lucide-react";
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

const MODULES = [
  { key: "storeEnabled", label: "Store", description: "Notifications clients e-commerce", icon: Store },
  { key: "financeEnabled", label: "Finance", description: "Factures et paiements", icon: Calculator },
  { key: "marketingEnabled", label: "Marketing", description: "Campagnes et newsletters", icon: Megaphone },
  { key: "crmEnabled", label: "CRM", description: "Leads et opportunités", icon: Users },
  { key: "hrEnabled", label: "RH", description: "Employés et recrutement", icon: Briefcase },
  { key: "stockEnabled", label: "Stock", description: "Alertes inventaire", icon: Package },
] as const;

export default function EmailSettingsPage() {
  const toast = useToast();
  const { data: config, isLoading } = useEmailConfig();
  const updateMutation = useUpdateEmailConfig();
  const testMutation = useTestEmailConnection();

  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  // Form state
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
      if (!dataToSend.smtpPassword) delete (dataToSend as Record<string, unknown>).smtpPassword;
      if (!dataToSend.apiKey) delete (dataToSend as Record<string, unknown>).apiKey;

      await updateMutation.mutateAsync(dataToSend);
      toast.success("Configuration email enregistrée");
    } catch (error) {
      toast.error(`Erreur: ${error}`);
    }
  };

  const handleTestConnection = async () => {
    try {
      const result = await testMutation.mutateAsync(testEmail ? { testEmail } : undefined);
      toast.success(result.message || "Connexion réussie");
    } catch (error) {
      toast.error(`Erreur: ${error}`);
    }
  };

  const isSmtp = formData.provider === "smtp";

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
            { label: "Email" },
          ]}
        />

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Configuration Email
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configurez les paramètres d'envoi d'emails pour tous les modules
          </p>
        </div>

        {/* Provider Selection */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Provider
            </h2>
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
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 mx-auto mb-2 ${
                      formData.provider === p.value
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      formData.provider === p.value
                        ? "text-indigo-700 dark:text-indigo-300"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
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
              <Server className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configuration SMTP
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  Serveur SMTP *
                </label>
                <input
                  type="text"
                  value={formData.smtpHost}
                  onChange={(e) => setFormData((d) => ({ ...d, smtpHost: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="smtp.example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  Port
                </label>
                <input
                  type="number"
                  value={formData.smtpPort}
                  onChange={(e) => setFormData((d) => ({ ...d, smtpPort: parseInt(e.target.value) || 587 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  Utilisateur
                </label>
                <input
                  type="text"
                  value={formData.smtpUser}
                  onChange={(e) => setFormData((d) => ({ ...d, smtpUser: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.smtpPassword}
                    onChange={(e) => setFormData((d) => ({ ...d, smtpPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
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
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  Chiffrement
                </label>
                <select
                  value={formData.smtpEncryption}
                  onChange={(e) => setFormData((d) => ({ ...d, smtpEncryption: e.target.value as SmtpEncryption }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="none">Aucun</option>
                  <option value="tls">TLS (port 587)</option>
                  <option value="ssl">SSL (port 465)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* API Configuration (for Brevo, SendGrid, Mailgun) */}
        {!isSmtp && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configuration API
              </h2>
            </div>

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
          </div>
        )}

        {/* Sender Configuration */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Email expéditeur
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                Adresse email *
              </label>
              <input
                type="email"
                value={formData.emailFrom}
                onChange={(e) => setFormData((d) => ({ ...d, emailFrom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                placeholder="noreply@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                Nom affiché
              </label>
              <input
                type="text"
                value={formData.emailFromName}
                onChange={(e) => setFormData((d) => ({ ...d, emailFromName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                placeholder="Ma Boutique"
              />
            </div>
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
                  Sélectionnez les modules qui utiliseront cette configuration email
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
                Configuration active
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

        {/* Test Connection */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <Send className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tester la connexion
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vérifiez que la configuration fonctionne
              </p>
            </div>
          </div>

          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                Email de test (optionnel)
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                placeholder="test@example.com"
              />
            </div>
            <Button
              variant="secondary"
              onClick={handleTestConnection}
              disabled={testMutation.isPending}
            >
              {testMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Test...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Tester
                </>
              )}
            </Button>
          </div>
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
