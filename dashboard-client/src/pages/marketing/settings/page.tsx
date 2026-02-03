import { Link } from 'react-router-dom';
import { Breadcrumbs } from '@/components/common';
import {
  Mail,
  MessageSquare,
  ArrowRight,
  Settings,
} from 'lucide-react';

export default function MarketingSettingsPage() {
  const sections = [
    {
      title: 'Email',
      description: 'Configuration du provider email (Brevo, SMTP)',
      icon: Mail,
      href: '/marketing/settings/email',
      color: 'blue',
    },
    {
      title: 'SMS',
      description: 'Configuration du provider SMS Tunisie',
      icon: MessageSquare,
      href: '/marketing/settings/sms',
      color: 'green',
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <Breadcrumbs
        items={[
          { label: 'Accueil', href: '/dashboard' },
          { label: 'Marketing', href: '/marketing' },
          { label: 'Paramètres' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Settings className="w-7 h-7 text-pink-500" />
          Paramètres Marketing
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configuration des canaux de communication
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          const colorClasses = {
            blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600',
            green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:border-green-300 dark:hover:border-green-600',
          };

          return (
            <Link
              key={section.title}
              to={section.href}
              className={`flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition group`}
            >
              <div className={`p-3 rounded-lg ${colorClasses[section.color as keyof typeof colorClasses].split(' hover:')[0]!}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">{section.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{section.description}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition" />
            </Link>
          );
        })}
      </div>
      </div>
    </>
  );
}
