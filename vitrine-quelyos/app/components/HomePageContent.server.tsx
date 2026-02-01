import Link from "next/link";
import { MapPin, Sparkles, Zap, ArrowRight } from "./Icons";
import { Compass } from "lucide-react";
import Footer from "./Footer";
import Container from "./Container";
import Header from "./Header";
import { getAllSolutions } from "../lib/solutions-data";
import { WebSiteSchema } from "./StructuredData";

const _modules = [
  {
    id: "home",
    name: "Dashboard",
    tagline: "Vue unifiée",
    description: "Tableau de bord consolidé avec KPIs temps réel de toutes vos solutions.",
    features: ["KPIs consolidés", "Alertes", "Raccourcis", "Analytics global"],
    status: "production",
    color: "slate",
  },
  {
    id: "finance",
    name: "Finance",
    tagline: "Trésorerie & Prévisions IA 90j",
    description: "Pilotez votre trésorerie avec l'IA. Précision 85-90% sur 90 jours.",
    features: ["Prévisions IA 85-90%", "Multi-comptes", "Rapports PDF", "Export FEC"],
    status: "production",
    color: "emerald",
  },
  {
    id: "store",
    name: "Boutique",
    tagline: "E-commerce omnicanal",
    description: "Catalogue, commandes, promotions. Synchronisation Stock automatique.",
    features: ["Catalogue produits", "Commandes", "Promotions", "Sync Stock auto"],
    status: "production",
    color: "indigo",
  },
  {
    id: "crm",
    name: "CRM",
    tagline: "Pipeline & Facturation",
    description: "Pipeline ventes, fiches 360°, devis → factures en un clic.",
    features: ["Pipeline ventes", "Fiches 360°", "Devis → Factures", "Sync Finance"],
    status: "production",
    color: "violet",
  },
  {
    id: "stock",
    name: "Stock",
    tagline: "Multi-entrepôts temps réel",
    description: "Gestion multi-sites, alertes seuils, valorisation FIFO/LIFO.",
    features: ["Multi-sites", "Alertes stock", "Valorisation", "Scan codes-barres"],
    status: "production",
    color: "orange",
  },
  {
    id: "hr",
    name: "RH",
    tagline: "SIRH complet",
    description: "Gestion employés, congés, pointage, évaluations annuelles.",
    features: ["Employés", "Congés", "Pointage", "Évaluations"],
    status: "production",
    color: "cyan",
  },
  {
    id: "pos",
    name: "Point de Vente",
    tagline: "Caisse moderne",
    description: "Terminal tactile, Click & Collect, mode rush, écran cuisine.",
    features: ["Terminal tactile", "Click & Collect", "Mode Rush", "Écran cuisine"],
    status: "production",
    color: "teal",
  },
  {
    id: "marketing",
    name: "Marketing",
    tagline: "Email & SMS",
    description: "Campagnes multicanal, templates, segmentation audiences.",
    features: ["Campagnes", "Templates", "Audiences", "Analytics"],
    status: "production",
    color: "pink",
  },
];

const _colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  slate: { bg: "bg-slate-500/20", text: "text-slate-300", border: "border-slate-500/30" },
  emerald: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
  indigo: { bg: "bg-indigo-500/20", text: "text-indigo-400", border: "border-indigo-500/30" },
  violet: { bg: "bg-violet-500/20", text: "text-violet-400", border: "border-violet-500/30" },
  orange: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30" },
  cyan: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30" },
  teal: { bg: "bg-teal-500/20", text: "text-teal-400", border: "border-teal-500/30" },
  pink: { bg: "bg-pink-500/20", text: "text-pink-400", border: "border-pink-500/30" },
};

const _secteurs = [
  { emoji: "🏪", name: "Commerce & Retail", desc: "Boutiques, e-commerce, click & collect", modules: ["Boutique", "Stock", "POS", "CRM"] },
  { emoji: "🍽️", name: "Restauration", desc: "Restaurants, traiteurs, food trucks", modules: ["POS", "Stock", "Finance", "Marketing"] },
  { emoji: "🔧", name: "Services B2B", desc: "Agences, conseil, prestataires", modules: ["CRM", "Finance", "Marketing", "RH"] },
  { emoji: "🏭", name: "Artisans & Production", desc: "Ateliers, fabrication, BTP", modules: ["Stock", "CRM", "Finance", "RH"] },
];

const _moduleHrefs: Record<string, string> = {
  home: "/modules",
  finance: "/finance",
  store: "/ecommerce",
  crm: "/crm",
  stock: "/stock",
  hr: "/hr",
  pos: "/pos",
  marketing: "/marketing",
};

// Server Component sans animations (hydratation immédiate)
export default function HomePageContentServer() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      <WebSiteSchema />
      <Header />

      {/* Hero */}
      <section className="relative py-20 sm:py-32">
        <Container>
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300">
              <MapPin className="h-4 w-4" />
              Suite ERP Complète • Solutions Métier Intégrées
            </div>
            <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
              Des solutions métier{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                qui s&apos;adaptent à votre activité
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 sm:text-xl">
              Pas de modules à choisir, des packages clés en main pour votre métier.
              Restaurant, Commerce, E-commerce, Services — solutions complètes.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <Compass className="h-4 w-4 text-indigo-400" />
                8 solutions métier
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-purple-400" />
                Tout-en-un par secteur
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-emerald-400" />
                Opérationnel en 1h
              </span>
            </div>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-8 py-4 text-lg font-medium text-white transition-all hover:from-indigo-600 hover:to-indigo-700"
              >
                Essai gratuit 30 jours
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/tarifs"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-8 py-4 text-lg font-medium text-white transition-all hover:bg-white/10"
              >
                Voir les tarifs
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Solutions métier */}
      <section id="solutions" className="relative py-20">
        <Container>
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Solutions complètes par métier
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Pas de modules à choisir. Des packages clés en main pensés pour votre activité.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {getAllSolutions().map((solution) => {
              return (
                <Link
                  key={solution.id}
                  href={`/solutions/${solution.id}`}
                  className="group relative overflow-hidden rounded-xl border border-indigo-500/20 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-indigo-500/40 hover:shadow-lg"
                >
                  <div className="relative">
                    <div className="mb-4 inline-flex rounded-xl bg-indigo-500/10 p-3">
                      <Sparkles className="h-8 w-8 text-indigo-400" />
                    </div>
                    <h3 className="mb-1 text-xl font-bold text-white">
                      {solution.name}
                    </h3>
                    <p className="mb-3 text-sm font-medium text-cyan-400">
                      {solution.sectorName}
                    </p>
                    <p className="mb-4 text-sm text-slate-400">
                      {solution.subheadline}
                    </p>
                    <div className="mb-4 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">{solution.pricing.basePrice}€</span>
                      <span className="text-sm text-slate-500">/mois</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-400 transition-all group-hover:underline">
                        Découvrir
                        <ArrowRight className="h-4 w-4" />
                      </span>
                      <div className="text-xs text-slate-500">
                        {solution.stats.clients}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/solutions"
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
            >
              Voir toutes les solutions métier
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}
