"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  ArrowRight,
  Sparkles,
  Calculator,
  ChevronDown,
  TrendingUp,
  Clock,
  Euro,
  Layers,
  Building2,
  Rocket,
  Crown,
  Shield,
  Users,
  Zap,
  BarChart3,
  Lock,
  HelpCircle,
  Star,
  Quote,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Container from "../components/Container";
import config from "@/app/lib/config";

// ═══════════════════════════════════════════════════════════════════════════
// DONNÉES DES PLANS - SUITE QUELYOS (Ordre: Enterprise → Business → Starter)
// ═══════════════════════════════════════════════════════════════════════════

const suitePlans = [
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Solution sur mesure, support dédié",
    price: "Sur devis",
    period: "",
    highlight: false,
    cta: "Contacter commercial",
    href: "/contact",
    icon: Crown,
    color: "amber" as const,
    features: [
      "Utilisateurs illimités",
      "Tous les 8 modules",
      "SLA garanti 99.9%",
      "Account manager dédié",
      "Personnalisation complète",
      "Intégrations sur mesure",
      "Formation sur site",
      "Support téléphonique 24/7",
    ],
    limitations: [],
  },
  {
    id: "business",
    name: "Business",
    description: "L'ERP complet pour les PME ambitieuses",
    price: "49",
    originalPrice: "99",
    period: "/mois",
    annualPrice: "37",
    highlight: true,
    badge: "Meilleure offre",
    cta: "Essai gratuit 30 jours",
    href: "/register?plan=business",
    icon: Rocket,
    color: "indigo" as const,
    features: [
      "10 utilisateurs inclus",
      "Tous les 8 modules inclus",
      "Prévisions IA avancées 24 mois",
      "API REST complète",
      "Intégrations 50+ apps",
      "Support prioritaire 4h",
      "Formations illimitées",
      "Export FEC + rapports PDF",
    ],
    limitations: [],
  },
  {
    id: "starter",
    name: "Starter",
    description: "Tout pour bien démarrer",
    price: "19",
    originalPrice: "49",
    period: "/mois",
    annualPrice: "14",
    highlight: false,
    cta: "Essai gratuit 30 jours",
    href: "/register?plan=starter",
    icon: Layers,
    color: "emerald" as const,
    features: [
      "3 utilisateurs inclus",
      "Finance + 2 modules au choix",
      "Prévisions IA 12 mois",
      "API basique incluse",
      "Support prioritaire 24h",
      "Export FEC comptable",
    ],
    limitations: [],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// MODULES INDIVIDUELS (collapsed by default)
// ═══════════════════════════════════════════════════════════════════════════

const moduleFinance = [
  {
    name: "Freemium",
    price: "0€",
    period: "à vie",
    description: "Vraiment gratuit, vraiment utile",
    features: [
      "5 comptes bancaires",
      "500 transactions/mois",
      "Dashboard complet",
      "Prévisions IA 3 mois",
      "Export CSV & PDF",
    ],
    limitations: [],
    cta: "Commencer gratuitement",
    href: config.finance.app,
  },
  {
    name: "Pro",
    price: "9€",
    originalPrice: "29€",
    period: "/mois",
    description: "Pour TPE actives",
    features: [
      "Comptes illimités",
      "Transactions illimitées",
      "Prévisions IA 12 mois",
      "Export FEC comptable",
      "Support prioritaire",
    ],
    limitations: [],
    cta: "Essai 30 jours",
    href: config.finance.app,
    highlight: true,
  },
  {
    name: "Expert",
    price: "29€",
    originalPrice: "79€",
    period: "/mois",
    description: "Multi-devises & API",
    features: [
      "Tout Pro inclus",
      "Multi-devises (MENA)",
      "API REST complète",
      "Scénarios what-if",
      "SLA garanti",
    ],
    limitations: [],
    cta: "Essai 30 jours",
    href: config.finance.app,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// TABLEAU COMPARATIF FEATURES SUITE vs MODULES
// ═══════════════════════════════════════════════════════════════════════════

interface ComparisonRow {
  feature: string;
  moduleSeul: string | boolean;
  suite: string | boolean;
  tooltip?: string;
}

const suiteVsModuleComparison: ComparisonRow[] = [
  { feature: "Prévisions IA avancées", moduleSeul: false, suite: true },
  { feature: "API REST complète", moduleSeul: "Limitée", suite: "Complète" },
  { feature: "Intégrations 50+ apps", moduleSeul: false, suite: true },
  { feature: "Support prioritaire", moduleSeul: "Email 48h", suite: "24h" },
  { feature: "Multi-utilisateurs", moduleSeul: "1 seul", suite: "5+" },
  { feature: "Personnalisation", moduleSeul: false, suite: true },
  { feature: "Export FEC comptable", moduleSeul: "Pro+", suite: true },
  { feature: "Formation incluse", moduleSeul: false, suite: true },
];

// ═══════════════════════════════════════════════════════════════════════════
// SOCIAL PROOF - Témoignages & Logos
// ═══════════════════════════════════════════════════════════════════════════

const testimonials = [
  {
    quote:
      "Depuis que j'utilise Quelyos, je passe 70% de temps en moins sur ma compta. L'IA me prévient avant les problèmes de trésorerie.",
    author: "Marie D.",
    role: "Fondatrice @ModaShop",
    detail: "E-commerce mode • Cliente depuis 8 mois • Plan Business",
  },
  {
    quote:
      "Le ROI est évident : j'ai récupéré 3 factures impayées le premier mois. L'outil s'est rentabilisé en 2 semaines.",
    author: "Thomas L.",
    role: "Gérant Cabinet Martin",
    detail: "Comptabilité • Client depuis 1 an • Plan Pro",
  },
];

const trustLogos = [
  { name: "Cabinet Martin", type: "Comptabilité" },
  { name: "Le Bistrot", type: "Restaurant" },
  { name: "WebFlow Agency", type: "Agence digitale" },
  { name: "ModaShop", type: "E-commerce" },
  { name: "Artisan Durand", type: "Artisanat" },
];

const trustMetrics = [
  { value: "+500", label: "entreprises accompagnées" },
  { value: "92%", label: "de précision IA sur 12 mois" },
  { value: "4.8/5", label: "note moyenne clients" },
];

// ═══════════════════════════════════════════════════════════════════════════
// FAQ GROUPÉE
// ═══════════════════════════════════════════════════════════════════════════

const faqs = [
  {
    category: "Offre de lancement",
    questions: [
      {
        q: "Pourquoi ces prix sont-ils si bas ?",
        a: "Offre de lancement : nous voulons conquérir le marché français. Profitez de -50% maintenant, ce tarif sera verrouillé à vie pour vous.",
      },
      {
        q: "Le Freemium est-il vraiment gratuit à vie ?",
        a: "Oui, à vie. 5 comptes bancaires, 500 transactions/mois, prévisions IA 3 mois incluses. Pas de watermark, pas de limitation cachée.",
      },
      {
        q: "Comment fonctionne l'essai 30 jours ?",
        a: "30 jours d'accès complet au plan choisi. Aucune carte bancaire requise. Satisfait ou remboursé. À la fin, continuez ou passez au Freemium.",
      },
    ],
  },
  {
    category: "Tarifs & Facturation",
    questions: [
      {
        q: "Puis-je changer de formule à tout moment ?",
        a: "Oui, upgrade ou downgrade instantané. Le changement est proratisé au jour près.",
      },
      {
        q: "Y a-t-il un engagement ?",
        a: "Aucun engagement. Annulation en 1 clic. Satisfait ou remboursé 30 jours.",
      },
      {
        q: "Les tarifs sont-ils HT ou TTC ?",
        a: "Tous les tarifs affichés sont HT. La TVA applicable sera ajoutée lors de la facturation.",
      },
    ],
  },
  {
    category: "Sécurité & RGPD",
    questions: [
      {
        q: "Où sont hébergées mes données ?",
        a: "France uniquement, datacenters certifiés ISO 27001. Conformité RGPD garantie.",
      },
      {
        q: "L'export FEC est-il compatible ?",
        a: "Format officiel DGFiP. Compatible Sage, Ciel, EBP, Pennylane et tous les autres.",
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// CALCULATEUR ROI
// ═══════════════════════════════════════════════════════════════════════════

function ROICalculator() {
  const [hoursPerMonth, setHoursPerMonth] = useState(10);
  const [hourlyRate, setHourlyRate] = useState(50);
  const [missedInvoices, setMissedInvoices] = useState(2);
  const [avgInvoiceAmount, setAvgInvoiceAmount] = useState(500);

  const timeSaved = hoursPerMonth * 0.7;
  const timeSavings = timeSaved * hourlyRate * 12;
  const invoiceSavings = missedInvoices * avgInvoiceAmount * 12 * 0.8;
  const totalSavings = timeSavings + invoiceSavings;
  const businessCost = 49 * 12; // Nouveau prix agressif
  const roi = ((totalSavings - businessCost) / businessCost) * 100;

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
          <Calculator className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">
            Calculez vos économies
          </h3>
          <p className="text-sm text-slate-400">Estimation ROI annuel</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <div className="space-y-5">
          <div>
            <label className="mb-2 flex items-center justify-between text-sm text-slate-400">
              <span>Heures/mois sur la gestion</span>
              <span className="font-medium text-white">{hoursPerMonth}h</span>
            </label>
            <input
              type="range"
              min="2"
              max="40"
              value={hoursPerMonth}
              onChange={(e) => setHoursPerMonth(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-indigo-500"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center justify-between text-sm text-slate-400">
              <span>Votre taux horaire</span>
              <span className="font-medium text-white">{hourlyRate}€</span>
            </label>
            <input
              type="range"
              min="20"
              max="150"
              step="5"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-indigo-500"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center justify-between text-sm text-slate-400">
              <span>Factures oubliées/mois</span>
              <span className="font-medium text-white">{missedInvoices}</span>
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={missedInvoices}
              onChange={(e) => setMissedInvoices(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-indigo-500"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center justify-between text-sm text-slate-400">
              <span>Montant moyen facture</span>
              <span className="font-medium text-white">{avgInvoiceAmount}€</span>
            </label>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={avgInvoiceAmount}
              onChange={(e) => setAvgInvoiceAmount(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-indigo-500"
            />
          </div>
        </div>

        {/* Results */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <h4 className="mb-4 text-sm font-medium uppercase tracking-wider text-emerald-400">
            Vos économies estimées
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-slate-400">
                <Clock size={14} />
                Temps gagné/an
              </span>
              <span className="font-medium text-white">
                {(timeSaved * 12).toFixed(0)}h
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-slate-400">
                <Euro size={14} />
                Valeur temps gagné
              </span>
              <span className="font-medium text-white">
                {timeSavings.toLocaleString("fr-FR")}€
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-slate-400">
                <TrendingUp size={14} />
                Factures récupérées
              </span>
              <span className="font-medium text-white">
                {invoiceSavings.toLocaleString("fr-FR")}€
              </span>
            </div>

            <div className="my-3 border-t border-white/10" />

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Coût Business/an</span>
              <span className="font-medium text-slate-400">
                -{businessCost}€
              </span>
            </div>

            <div className="rounded-lg bg-emerald-500/10 p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-400">
                  Économie nette/an
                </span>
                <span className="text-2xl font-bold text-emerald-400">
                  +{(totalSavings - businessCost).toLocaleString("fr-FR")}€
                </span>
              </div>
              <p className="mt-1 text-right text-xs text-emerald-400/70">
                ROI : {roi.toFixed(0)}%
              </p>
            </div>
          </div>

          <Link
            href="/register?plan=business"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-400"
          >
            Essayer Business gratuitement
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FAQ ACCORDÉON
// ═══════════════════════════════════════════════════════════════════════════

function FAQSection() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8">
      {faqs.map((category) => (
        <div key={category.category}>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <HelpCircle size={18} className="text-indigo-400" />
            {category.category}
          </h3>
          <div className="space-y-2">
            {category.questions.map((faq, index) => {
              const itemId = `${category.category}-${index}`;
              const isOpen = openItems.includes(itemId);

              return (
                <div
                  key={index}
                  className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]"
                >
                  <button
                    onClick={() => toggleItem(itemId)}
                    className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-white/[0.02]"
                  >
                    <span className="font-medium text-white">{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-slate-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="border-t border-white/5 px-4 pb-4 pt-3">
                          <p className="text-sm leading-relaxed text-slate-400">
                            {faq.a}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════

export default function TarifsPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [showModules, setShowModules] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const getPrice = (basePrice: string, annualPrice?: string) => {
    if (basePrice === "Sur devis") return basePrice;
    if (billingPeriod === "yearly" && annualPrice) return annualPrice;
    return basePrice;
  };

  const colorClasses = {
    amber: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/50" },
    indigo: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/50" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/50" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      <Header />

      {/* ═══════════════════════════════════════════════════════════════════
          PROMO BANNER
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-center">
        <p className="text-sm font-medium text-white">
          🚀 <strong>Offre de lancement</strong> : -50% sur tous les plans + 30 jours d&apos;essai gratuit
          <span className="ml-2 rounded bg-white/20 px-2 py-0.5 text-xs">
            Temps limité
          </span>
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pb-8 pt-16">
        <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="pointer-events-none absolute -right-40 top-40 h-[400px] w-[400px] rounded-full bg-violet-500/15 blur-[100px]" />

        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
              <Sparkles size={14} />
              30 jours d&apos;essai gratuit • Sans carte bancaire • Sans engagement
            </span>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Gérez votre entreprise,
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                pas votre administratif
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
              Rejoignez +500 TPE qui automatisent leur gestion. Pas
              d&apos;engagement, résiliation en 1 clic.
            </p>

            {/* Toggle Mensuel/Annuel */}
            <div className="mt-8 flex items-center justify-center gap-3">
              <span
                className={`text-sm transition-colors ${
                  billingPeriod === "monthly" ? "text-white" : "text-slate-500"
                }`}
              >
                Mensuel
              </span>
              <button
                onClick={() =>
                  setBillingPeriod(
                    billingPeriod === "monthly" ? "yearly" : "monthly"
                  )
                }
                className={`relative h-7 w-14 rounded-full transition-colors ${
                  billingPeriod === "yearly" ? "bg-indigo-500" : "bg-white/20"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    billingPeriod === "yearly" ? "left-8" : "left-1"
                  }`}
                />
              </button>
              <span
                className={`text-sm transition-colors ${
                  billingPeriod === "yearly" ? "text-white" : "text-slate-500"
                }`}
              >
                Annuel
              </span>
              {billingPeriod === "yearly" && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  3 mois offerts (-25%)
                </span>
              )}
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SUITE QUELYOS - PLANS PRINCIPAUX (3 cards, ordre ancré)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-12">
        <Container>
          <div className="mb-8 flex items-center justify-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-2">
              <Layers className="h-6 w-6 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Suite Quelyos</h2>
            <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs text-indigo-400">
              ERP Complet
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {suitePlans.map((plan, index) => {
              const Icon = plan.icon;
              const colors = colorClasses[plan.color];

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative flex flex-col rounded-2xl border p-6 ${
                    plan.highlight
                      ? "border-indigo-500/50 bg-gradient-to-b from-indigo-500/10 to-transparent shadow-xl shadow-indigo-500/10 lg:scale-105 lg:z-10"
                      : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-1 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25">
                        <Star size={12} />
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {plan.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {plan.description}
                      </p>
                    </div>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg}`}
                    >
                      <Icon className={`h-5 w-5 ${colors.text}`} />
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      {plan.price === "Sur devis" ? (
                        <span className="text-3xl font-bold text-white">
                          Sur devis
                        </span>
                      ) : (
                        <>
                          <span className="text-4xl font-bold text-white">
                            {getPrice(plan.price, plan.annualPrice)}€
                          </span>
                          <span className="text-slate-400">{plan.period}</span>
                          {plan.originalPrice && (
                            <span className="text-lg text-slate-500 line-through">
                              {plan.originalPrice}€
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    {billingPeriod === "yearly" &&
                      plan.annualPrice &&
                      plan.price !== "Sur devis" && (
                        <p className="mt-1 text-sm text-emerald-400">
                          Soit {plan.annualPrice}€/mois • Économisez {parseInt(plan.price) * 3}€/an
                        </p>
                      )}
                    {billingPeriod === "monthly" && plan.originalPrice && (
                      <p className="mt-1 text-sm text-emerald-400">
                        -{Math.round((1 - parseInt(plan.price) / parseInt(plan.originalPrice)) * 100)}% vs tarif normal
                      </p>
                    )}
                  </div>

                  <Link
                    href={plan.href}
                    className={`mb-6 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                      plan.highlight
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/25"
                        : "bg-white/5 text-white ring-1 ring-white/10 hover:bg-white/10"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight size={14} />
                  </Link>

                  <ul className="flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check
                          size={16}
                          className={`mt-0.5 shrink-0 ${colors.text}`}
                        />
                        <span className="text-sm text-slate-300">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation) => (
                      <li
                        key={limitation}
                        className="flex items-start gap-3 text-slate-500"
                      >
                        <Lock size={14} className="mt-0.5 shrink-0" />
                        <span className="text-sm">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          MODULES INDIVIDUELS (collapsed by default)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative border-t border-white/5 py-8">
        <Container>
          <button
            onClick={() => setShowModules(!showModules)}
            className="mx-auto flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
          >
            <span className="text-sm">
              Vous préférez commencer petit ? Découvrez nos modules individuels
            </span>
            <ChevronDown
              size={18}
              className={`transition-transform ${showModules ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {showModules && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/50 p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-500/20 p-2">
                      <BarChart3 className="h-5 w-5 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      Module Finance seul
                    </h3>
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
                      Disponible
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {moduleFinance.map((plan, i) => (
                      <div
                        key={i}
                        className={`rounded-xl p-5 ${
                          plan.highlight
                            ? "border-2 border-emerald-500/50 bg-emerald-500/5"
                            : "border border-white/10 bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-white">
                            {plan.name}
                          </h4>
                          <div className="text-right">
                            <span className="text-lg font-bold text-white">
                              {plan.price}
                            </span>
                            <span className="text-sm text-slate-400">
                              {plan.period}
                            </span>
                            {plan.originalPrice && (
                              <span className="ml-2 text-sm text-slate-500 line-through">
                                {plan.originalPrice}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                          {plan.description}
                        </p>
                        <ul className="mt-4 space-y-2">
                          {plan.features.map((f, j) => (
                            <li
                              key={j}
                              className="flex items-center gap-2 text-xs text-slate-300"
                            >
                              <Check size={12} className="text-emerald-400" />
                              {f}
                            </li>
                          ))}
                          {plan.limitations.map((l, j) => (
                            <li
                              key={j}
                              className="flex items-center gap-2 text-xs text-slate-500"
                            >
                              <X size={12} />
                              {l}
                            </li>
                          ))}
                        </ul>
                        <Link
                          href={plan.href}
                          className={`mt-4 block w-full rounded-lg py-2 text-center text-sm font-medium transition-all ${
                            plan.highlight
                              ? "bg-emerald-500 text-white hover:bg-emerald-400"
                              : "bg-white/5 text-white hover:bg-white/10"
                          }`}
                        >
                          {plan.cta}
                        </Link>
                      </div>
                    ))}
                  </div>

                  {/* Message différenciation */}
                  <div className="mt-6 flex items-start gap-3 rounded-lg bg-indigo-500/10 p-4">
                    <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        Les modules individuels sont parfaits pour tester.
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        La Suite débloque l&apos;IA avancée, l&apos;API
                        complète, les intégrations 50+ apps et le
                        multi-utilisateurs.
                      </p>
                    </div>
                  </div>

                  {/* Comparatif Suite vs Module */}
                  <button
                    onClick={() => setShowComparison(!showComparison)}
                    className="mt-4 flex items-center gap-2 text-sm text-indigo-400 transition-colors hover:text-indigo-300"
                  >
                    Voir le comparatif détaillé Suite vs Module
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${showComparison ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {showComparison && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 overflow-hidden"
                      >
                        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-white/10">
                                <th className="py-2 text-left text-slate-400">
                                  Fonctionnalité
                                </th>
                                <th className="py-2 text-center text-slate-400">
                                  Module seul
                                </th>
                                <th className="py-2 text-center text-indigo-400">
                                  Suite Quelyos
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {suiteVsModuleComparison.map((row, i) => (
                                <tr key={i} className="border-b border-white/5">
                                  <td className="py-2 text-slate-300">
                                    {row.feature}
                                  </td>
                                  <td className="py-2 text-center">
                                    {row.moduleSeul === true ? (
                                      <Check
                                        size={16}
                                        className="mx-auto text-emerald-400"
                                      />
                                    ) : row.moduleSeul === false ? (
                                      <X
                                        size={16}
                                        className="mx-auto text-slate-600"
                                      />
                                    ) : (
                                      <span className="text-slate-400">
                                        {row.moduleSeul}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2 text-center">
                                    {row.suite === true ? (
                                      <Check
                                        size={16}
                                        className="mx-auto text-emerald-400"
                                      />
                                    ) : (
                                      <span className="text-white">
                                        {row.suite}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CALCULATEUR ROI
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-16">
        <Container narrow>
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-white">
              Combien allez-vous économiser ?
            </h2>
            <p className="mt-2 text-slate-400">
              Calculez votre ROI en quelques secondes
            </p>
          </div>
          <ROICalculator />
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SOCIAL PROOF - Trust Section
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative border-y border-white/5 bg-slate-900/30 py-16">
        <Container>
          {/* Metrics */}
          <div className="mb-12 grid gap-8 text-center md:grid-cols-3">
            {trustMetrics.map((metric, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-3xl font-bold text-white">
                  {metric.value}
                </div>
                <div className="mt-1 text-sm text-slate-400">{metric.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Logos */}
          <div className="mb-12">
            <p className="mb-6 text-center text-sm text-slate-500">
              Ils nous font confiance
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {trustLogos.map((logo, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2"
                >
                  <Building2 size={16} className="text-slate-500" />
                  <div>
                    <div className="text-sm font-medium text-white">
                      {logo.name}
                    </div>
                    <div className="text-xs text-slate-500">{logo.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonials */}
          <div className="grid gap-6 md:grid-cols-2">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
              >
                <Quote className="mb-4 h-8 w-8 text-indigo-500/50" />
                <p className="text-slate-300">{testimonial.quote}</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20">
                    <Users size={16} className="text-indigo-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-slate-400">
                      {testimonial.role}
                    </div>
                    <div className="text-xs text-slate-500">
                      {testimonial.detail}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* RGPD Badge */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
              <Shield size={16} className="text-emerald-400" />
              <span className="text-sm text-emerald-400">
                Données hébergées en France (RGPD)
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FAQ SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-16">
        <Container narrow>
          <h2 className="mb-8 text-center text-2xl font-bold text-white">
            Questions fréquentes
          </h2>
          <FAQSection />
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA FINAL
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20">
        <Container narrow>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 to-purple-950/50 p-8 text-center backdrop-blur-sm sm:p-12"
          >
            <Zap className="mx-auto mb-4 h-12 w-12 text-indigo-400" />
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Prêt à économiser 70% de votre temps ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
              30 jours d&apos;essai gratuit. Sans carte bancaire. Sans engagement.
            </p>
            <p className="mt-2 text-emerald-400 font-semibold">
              🚀 Offre -50% • Tarif verrouillé à vie
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register?plan=business"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 text-lg font-bold text-white transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/25"
              >
                Essayer Business à 49€/mois
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href={config.finance.app}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3 font-medium text-white transition-all hover:bg-white/10"
              >
                Ou commencer gratuitement
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}
