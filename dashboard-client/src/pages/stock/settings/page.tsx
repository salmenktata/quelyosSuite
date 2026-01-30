import { Link } from "react-router-dom";
import { Breadcrumbs } from "@/components/common";
import {
  Settings,
  ArrowRight,
  Layers,
  RefreshCw,
  Ruler,
  Bell,
  Info,
} from "lucide-react";

const settingsGroups = [
  {
    group: "Valorisation & Comptabilité",
    description: "Méthode de calcul et valeur du stock",
    icon: Layers,
    sections: [
      {
        title: "Valorisation",
        desc: "Méthode de valorisation (FIFO, LIFO, coût moyen) et paramètres comptables.",
        href: "/stock/settings/valuation",
        icon: Layers,
      },
    ],
  },
  {
    group: "Réapprovisionnement",
    description: "Automatisation et seuils de commande",
    icon: RefreshCw,
    sections: [
      {
        title: "Réappro. automatique",
        desc: "Règles de réapprovisionnement, seuils minimum et quantités de commande.",
        href: "/stock/settings/reordering",
        icon: RefreshCw,
      },
      {
        title: "Alertes stock",
        desc: "Notifications de rupture, seuils critiques et alertes personnalisées.",
        href: "/stock/settings/alerts",
        icon: Bell,
      },
    ],
  },
  {
    group: "Configuration",
    description: "Paramètres généraux du module Stock",
    icon: Settings,
    sections: [
      {
        title: "Unités de mesure",
        desc: "Catégories d'unités et conversions entre unités.",
        href: "/stock/settings/units",
        icon: Ruler,
      },
    ],
  },
];

export default function StockSettingsOverviewPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Stock", href: "/stock" },
          { label: "Paramètres", href: "/stock/settings" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-orange-100 dark:bg-orange-900/30 p-3">
            <Settings className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Paramètres Stock
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Choisissez une rubrique pour configurer votre inventaire
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 mb-6">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Définissez les règles de valorisation, de réapprovisionnement et les alertes pour optimiser la gestion de votre inventaire.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {settingsGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <div className="mb-4 flex items-center gap-3">
              <group.icon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
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
                  className="group flex h-full flex-col justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm transition hover:shadow-md hover:border-orange-500 dark:hover:border-orange-600"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <section.icon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{section.title}</p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{section.desc}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-orange-600 dark:text-orange-400 group-hover:gap-3 transition-all">
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
  );
}
