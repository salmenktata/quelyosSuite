/**
 * Paramètres Boutique - Vue d'ensemble configuration e-commerce
 *
 * Fonctionnalités :
 * - Navigation organisée par groupes (Identité, Logistique, Expérience UX)
 * - Accès rapide aux 8 rubriques de configuration
 * - Cartes interactives avec descriptions et icônes
 * - Layout responsive adaptatif mobile/desktop
 * - Breadcrumbs et PageNotice intégrés
 */

import { Link } from "react-router-dom";
import { Breadcrumbs, PageNotice } from "@/components/common";
import {
  Settings,
  ArrowRight,
  Palette,
  Phone,
  Truck,
  ToggleLeft,
  RotateCcw,
  Share2,
  Search,
  Store,
} from "lucide-react";
import { storeNotices } from "@/lib/notices/store-notices";

const settingsGroups = [
  {
    group: "Identité & Contact",
    description: "Informations de marque et coordonnées client",
    icon: Store,
    sections: [
      {
        title: "Marque & Identité",
        desc: "Nom, logo, couleurs et identité visuelle de votre boutique.",
        href: "/store/settings/brand",
        icon: Palette,
      },
      {
        title: "Contact & Support",
        desc: "Email, téléphone, WhatsApp et horaires d'assistance.",
        href: "/store/settings/contact",
        icon: Phone,
      },
    ],
  },
  {
    group: "Logistique",
    description: "Livraison, retours et garantie",
    icon: Truck,
    sections: [
      {
        title: "Livraison",
        desc: "Délais, seuil de livraison gratuite et options express.",
        href: "/store/settings/shipping",
        icon: Truck,
      },
      {
        title: "Retours & Garantie",
        desc: "Politique de retour, délai de remboursement et garantie.",
        href: "/store/settings/returns",
        icon: RotateCcw,
      },
    ],
  },
  {
    group: "Expérience Utilisateur",
    description: "Fonctionnalités et visibilité",
    icon: ToggleLeft,
    sections: [
      {
        title: "Fonctionnalités",
        desc: "Wishlist, avis clients, comparateur et newsletter.",
        href: "/store/settings/features",
        icon: ToggleLeft,
      },
      {
        title: "Réseaux sociaux",
        desc: "Liens vers vos pages Facebook, Instagram, etc.",
        href: "/store/settings/social",
        icon: Share2,
      },
      {
        title: "SEO",
        desc: "Métadonnées, titres et descriptions pour le référencement.",
        href: "/store/settings/seo",
        icon: Search,
      },
    ],
  },
];

export default function StoreSettingsOverviewPage() {
  return (
    <>
      <div className="p-4 md:p-8 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Boutique", href: "/store" },
          { label: "Paramètres", href: "/store/settings" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-indigo-100 dark:bg-indigo-900/30 p-3">
            <Settings className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Paramètres Boutique
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Choisissez une rubrique pour configurer votre boutique en ligne
            </p>
          </div>
        </div>
      </div>

      <PageNotice
        config={storeNotices['settings']}
        className="mb-6"
      />

      <div className="space-y-8">
        {settingsGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <div className="mb-4 flex items-center gap-3">
              <group.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
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
                  className="group flex h-full flex-col justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm transition hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-600"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <section.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{section.title}</p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{section.desc}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 group-hover:gap-3 transition-all">
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
