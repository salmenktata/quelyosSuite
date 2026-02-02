import { useState, useEffect } from "react";
import { Layout } from '@/components/Layout'
import { Breadcrumbs } from "@/components/common";
import { Button } from "@/components/common/Button";
import { useToast } from "@/contexts/ToastContext";
import { Phone, Save, Loader2, Mail, MessageCircle, Info } from "lucide-react";
import { logger } from '@quelyos/logger';
import { useSiteConfig, useUpdateSiteConfig } from "@/hooks/useSiteConfig";
import { z } from "zod";

const contactSchema = z.object({
  contact_email: z.string().email("Email invalide"),
  contact_phone: z.string().min(1, "Téléphone requis"),
  whatsapp_number: z.string().optional(),
});

export default function ContactSettingsPage() {
  const toast = useToast();
  const { data: config, isLoading } = useSiteConfig();
  const updateMutation = useUpdateSiteConfig();

  const [contactConfig, setContactConfig] = useState({
    contact_email: "",
    contact_phone: "",
    whatsapp_number: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (config) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setContactConfig({
        contact_email: config.contact_email || "",
        contact_phone: config.contact_phone || "",
        whatsapp_number: config.whatsapp_number || "",
      });
    }
  }, [config]);

  const validate = () => {
    try {
      contactSchema.parse(contactConfig);
      setErrors({});
      return true;
    } catch (error) {
      logger.error("Erreur:", error);
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("Veuillez corriger les erreurs");
      return;
    }

    try {
      await updateMutation.mutateAsync(contactConfig);
      toast.success("Informations de contact mises à jour");
    } catch (error) {
      logger.error("Erreur:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Breadcrumbs
            items={[
              { label: "Boutique", href: "/store" },
              { label: "Paramètres", href: "/store/settings" },
              { label: "Contact & Support", href: "/store/settings/contact" },
            ]}
          />
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <Breadcrumbs
        items={[
          { label: "Boutique", href: "/store" },
          { label: "Paramètres", href: "/store/settings" },
          { label: "Contact & Support", href: "/store/settings/contact" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-indigo-100 dark:bg-indigo-900/30 p-3">
            <Phone className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Contact & Support
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Informations de contact affichées sur votre site
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
            Ces informations seront visibles dans le footer et la page contact de votre boutique.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="space-y-6">
          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
              <Mail className="h-4 w-4" />
              Email de contact
            </label>
            <input
              type="email"
              value={contactConfig.contact_email}
              onChange={(e) => setContactConfig({ ...contactConfig, contact_email: e.target.value })}
              placeholder="contact@maboutique.com"
              className={`w-full rounded-lg border px-4 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500/20 ${
                errors.contact_email
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-300 dark:border-gray-600 focus:border-indigo-500"
              }`}
            />
            {errors.contact_email && (
              <p className="mt-1 text-xs text-red-500">{errors.contact_email}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Adresse email pour les demandes client et le support.
            </p>
          </div>

          {/* Téléphone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
              <Phone className="h-4 w-4" />
              Téléphone
            </label>
            <input
              type="tel"
              value={contactConfig.contact_phone}
              onChange={(e) => setContactConfig({ ...contactConfig, contact_phone: e.target.value })}
              placeholder="+216 XX XXX XXX"
              className={`w-full rounded-lg border px-4 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500/20 ${
                errors.contact_phone
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-300 dark:border-gray-600 focus:border-indigo-500"
              }`}
            />
            {errors.contact_phone && (
              <p className="mt-1 text-xs text-red-500">{errors.contact_phone}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Numéro de téléphone principal pour le service client.
            </p>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
              <MessageCircle className="h-4 w-4" />
              WhatsApp (optionnel)
            </label>
            <input
              type="tel"
              value={contactConfig.whatsapp_number}
              onChange={(e) => setContactConfig({ ...contactConfig, whatsapp_number: e.target.value })}
              placeholder="+216 XX XXX XXX"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Numéro WhatsApp pour le chat instantané avec les clients.
            </p>
          </div>
        </div>
      </div>
      </div>
    </Layout>
  );
}
