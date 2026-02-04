/**
 * Paramètres CRM - Hub central de configuration
 *
 * Fonctionnalités :
 * - Navigation vers toutes les sections de configuration CRM
 * - Organisation par groupe thématique (Pipeline, Clients & Tarification)
 * - Accès rapide aux étapes du pipeline de vente
 * - Gestion du scoring automatique des leads
 * - Configuration des listes de prix et segments clients
 * - Interface visuelle avec icônes et descriptions
 */
import { Link } from "react-router-dom";
import { Breadcrumbs } from "@/components/common";
import {
  Settings,
  ArrowRight,
  Kanban,
  ClipboardList,
  Tag,
  Target,
  Users,
  Info,
} from "lucide-react";

const settingsGroups = [
  {
    group: "Pipeline de vente",
    description: "Étapes et workflow des opportunités",
    icon: Kanban,
    sections: [
      {
        title: "Étapes pipeline",
        desc: "Définissez les étapes de votre funnel de vente et leur ordre.",
        href: "/crm/settings/stages",
        icon: Kanban,
      },
      {
        title: "Scoring leads",
        desc: "Critères de notation et qualification automatique des prospects.",
        href: "/crm/settings/scoring",
        icon: Target,
      },
    ],
  },
  {
    group: "Clients & Tarification",
    description: "Segmentation et politiques de prix",
    icon: Users,
    sections: [
      {
        title: "Listes de prix",
        desc: "Gérez les grilles tarifaires par segment client ou période.",
        href: "/crm/settings/pricelists",
        icon: ClipboardList,
      },
      {
        title: "Catégories clients",
        desc: "Segmentez vos clients par type, secteur ou comportement.",
        href: "/crm/settings/categories",
        icon: Tag,
      },
    ],
  },
];

export default function CrmSettingsOverviewPage() {
  return (
    <>
      <div className="space-y-6">
        <Breadcrumbs
        items={[
          { label: "CRM", href: "/crm" },
          { label: "Paramètres", href: "/crm/settings" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-violet-100 dark:bg-violet-900/30 p-3">
            <Settings className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Paramètres CRM
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Choisissez une rubrique pour configurer votre gestion client
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 mb-6">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Personnalisez votre pipeline de vente, vos listes de prix et la segmentation de vos clients.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {settingsGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <div className="mb-4 flex items-center gap-3">
              <group.icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{group.group}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">{group.description}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {group.sections.map((section) => (
                <Link
                  key={section.href}
                  to={section.href}
                  className="group flex h-full flex-col justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm transition hover:shadow-md hover:border-violet-500 dark:hover:border-violet-600"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <section.icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{section.title}</p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{section.desc}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-violet-600 dark:text-violet-400 group-hover:gap-3 transition-all">
                    <span className="text-xs font-medium">Configurer</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      </div>
    </>
  );
}
