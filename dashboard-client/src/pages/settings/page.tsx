import { Layout } from "@/components/Layout";
import { Breadcrumbs } from "@/components/common";
import { Link } from "react-router-dom";
import {
  Mail,
  MessageSquare,
  Settings,
  ChevronRight,
  Bell,
  Shield,
} from "lucide-react";

const SETTINGS_SECTIONS = [
  {
    title: "Notifications",
    description: "Configuration globale des canaux de communication",
    items: [
      {
        to: "/settings/email",
        icon: Mail,
        label: "Email",
        description: "SMTP, Brevo, SendGrid - Configuration expéditeur",
      },
      {
        to: "/settings/sms",
        icon: MessageSquare,
        label: "SMS",
        description: "Tunisie SMS - API et quotas",
      },
    ],
  },
  {
    title: "Sécurité",
    description: "Paramètres de sécurité et authentification",
    items: [
      {
        to: "/settings/security",
        icon: Shield,
        label: "Sécurité",
        description: "Mot de passe, 2FA et sessions actives",
      },
    ],
  },
];

export default function GlobalSettingsPage() {
  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6 max-w-4xl">
        <Breadcrumbs items={[{ label: "Paramètres Généraux" }]} />

        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Paramètres Généraux
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configuration globale applicable à tous les modules
              </p>
            </div>
          </div>
        </div>

        {SETTINGS_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-3">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                {section.title}
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {section.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {item.label}
                          </h3>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-transform group-hover:translate-x-1" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Info box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Configuration à 2 niveaux
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Les paramètres ici sont globaux. Chaque module (Store, Finance, CRM...)
                possède ses propres pages de paramètres pour affiner les préférences
                spécifiques.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
