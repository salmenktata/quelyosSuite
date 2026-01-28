"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  X, 
  ArrowRight, 
  Zap, 
  Building2, 
  Sparkles, 
  Calculator,
  ChevronDown,
  TrendingUp,
  Clock,
  Shield,
  Euro,
  BarChart3,
  PiggyBank,
  Target,
  HelpCircle
} from "lucide-react";
import Header from "@/app/components/Header";

import Footer from "@/app/components/Footer";
import Container from "@/app/components/Container";
// ═══════════════════════════════════════════════════════════════════════════
// DONNÉES DES PLANS
// ═══════════════════════════════════════════════════════════════════════════

const plans = [
  {
    id: "free",
    name: "Freemium",
    description: "Pour découvrir et tester",
    price: "0",
    period: "Pour toujours",
    highlight: false,
    cta: "Commencer gratuitement",
    ctaHref: "/finance/register",
    icon: PiggyBank,
    color: "emerald",
    features: [
      "1 utilisateur",
      "2 comptes bancaires",
      "100 transactions/mois",
      "Tableau de bord basique",
      "Export CSV",
      "Support email (48h)",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Pour les indépendants & TPE",
    price: "19",
    originalPrice: "29",
    period: "par mois",
    highlight: true,
    badge: "Le + populaire",
    cta: "Essai gratuit 14 jours",
    ctaHref: "/finance/register?plan=pro",
    icon: Target,
    color: "indigo",
    features: [
      "1 utilisateur",
      "Comptes illimités",
      "Transactions illimitées",
      "Budgets intelligents",
      "Prévisions IA 12 mois",
      "Rapports avancés",
      "Export comptable (FEC)",
      "Support prioritaire (24h)",
    ],
  },
  {
    id: "expert",
    name: "Expert",
    description: "Pour les équipes & multi-sociétés",
    price: "49",
    period: "par utilisateur/mois",
    highlight: false,
    badge: "Multi-users",
    cta: "Essai gratuit 14 jours",
    ctaHref: "/finance/register?plan=expert",
    icon: BarChart3,
    color: "violet",
    features: [
      "Jusqu'à 10 utilisateurs",
      "Tout le plan Pro",
      "Multi-entreprises",
      "Rôles & permissions",
      "Tableaux partagés",
      "API complète",
      "SSO (SAML/OAuth)",
      "Onboarding personnalisé",
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// TABLEAU COMPARATIF DÉTAILLÉ
// ═══════════════════════════════════════════════════════════════════════════

type FeatureValue = string | boolean;

interface FeatureRow {
  name: string;
  free: FeatureValue;
  pro: FeatureValue;
  expert: FeatureValue;
}

const featureComparison: Record<string, FeatureRow[]> = {
  "Gestion de base": [
    { name: "Utilisateurs", free: "1", pro: "1", expert: "10" },
    { name: "Comptes bancaires", free: "2", pro: "Illimité", expert: "Illimité" },
    { name: "Transactions/mois", free: "100", pro: "Illimité", expert: "Illimité" },
    { name: "Historique conservé", free: "6 mois", pro: "Illimité", expert: "Illimité" },
    { name: "Import CSV/OFX", free: true, pro: true, expert: true },
    { name: "Connexion bancaire auto", free: false, pro: true, expert: true },
  ],
  "Budgets & Prévisions": [
    { name: "Budgets mensuels", free: "3", pro: "Illimité", expert: "Illimité" },
    { name: "Alertes dépassement", free: false, pro: true, expert: true },
    { name: "Prévisions IA", free: false, pro: "12 mois", expert: "24 mois" },
    { name: "Scénarios what-if", free: false, pro: "3", expert: "Illimité" },
    { name: "Objectifs financiers", free: false, pro: true, expert: true },
  ],
  "Rapports & Exports": [
    { name: "Tableau de bord", free: "Basic", pro: "Avancé", expert: "Personnalisable" },
    { name: "Graphiques temps réel", free: false, pro: true, expert: true },
    { name: "Export CSV", free: true, pro: true, expert: true },
    { name: "Export FEC comptable", free: false, pro: true, expert: true },
    { name: "Rapports PDF", free: false, pro: true, expert: true },
    { name: "API REST", free: false, pro: false, expert: true },
  ],
  "Collaboration": [
    { name: "Multi-entreprises", free: false, pro: false, expert: true },
    { name: "Rôles & permissions", free: false, pro: false, expert: true },
    { name: "Tableaux partagés", free: false, pro: false, expert: true },
    { name: "Commentaires", free: false, pro: false, expert: true },
    { name: "Audit trail", free: false, pro: false, expert: true },
  ],
  "Support & Sécurité": [
    { name: "Support email", free: "48h", pro: "24h", expert: "4h" },
    { name: "Chat en direct", free: false, pro: true, expert: true },
    { name: "Onboarding dédié", free: false, pro: false, expert: true },
    { name: "SSO (SAML/OAuth)", free: false, pro: false, expert: true },
    { name: "Chiffrement AES-256", free: true, pro: true, expert: true },
    { name: "Hébergement France", free: true, pro: true, expert: true },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// FAQ ÉTENDUE
// ═══════════════════════════════════════════════════════════════════════════

const faqs = [
  {
    category: "Tarifs & Facturation",
    questions: [
      {
        question: "Puis-je changer de plan à tout moment ?",
        answer: "Oui, vous pouvez upgrader ou downgrader votre plan à tout moment depuis votre compte. Les changements prennent effet immédiatement et sont proratisés au jour près.",
      },
      {
        question: "Y a-t-il des frais cachés ?",
        answer: "Absolument pas. Le prix affiché est le prix final, TTC. Pas de frais d'installation, pas de frais de setup, pas de frais de résiliation.",
      },
      {
        question: "Proposez-vous des remises annuelles ?",
        answer: "Oui ! En payant à l'année, vous économisez 2 mois (soit -17%). Le plan Pro passe à 190€/an au lieu de 228€.",
      },
      {
        question: "Comment fonctionne l'essai gratuit ?",
        answer: "L'essai de 14 jours donne accès à toutes les fonctionnalités du plan choisi, sans carte bancaire requise. À la fin, vous choisissez de continuer ou de passer au Freemium.",
      },
    ],
  },
  {
    category: "Fonctionnalités",
    questions: [
      {
        question: "Les prévisions IA sont-elles fiables ?",
        answer: "Notre algorithme analyse vos données historiques, la saisonnalité de votre activité et les tendances sectorielles. Précision moyenne constatée : 92% sur 3 mois, 85% sur 12 mois.",
      },
      {
        question: "Puis-je connecter plusieurs banques ?",
        answer: "Oui, avec les plans Pro et Expert. Nous supportons plus de 350 banques françaises via notre partenaire agréé ACPR. La synchronisation est automatique et sécurisée.",
      },
      {
        question: "L'export FEC est-il compatible avec mon comptable ?",
        answer: "Notre export FEC respecte le format officiel de la DGFiP. Il est compatible avec tous les logiciels comptables (Sage, Ciel, EBP, Pennylane, etc.).",
      },
    ],
  },
  {
    category: "Sécurité & Données",
    questions: [
      {
        question: "Où sont hébergées mes données ?",
        answer: "Toutes vos données sont hébergées en France, dans des datacenters certifiés ISO 27001, SOC 2 et HDS. Nous n'utilisons jamais vos données à des fins commerciales.",
      },
      {
        question: "Puis-je exporter et supprimer mes données ?",
        answer: "Oui, conformément au RGPD, vous pouvez exporter l'intégralité de vos données à tout moment et demander leur suppression définitive.",
      },
      {
        question: "Quelyos a-t-il accès à mes comptes bancaires ?",
        answer: "Non. La connexion bancaire se fait via un agrégateur certifié (DSP2). Nous n'avons accès qu'en lecture seule aux transactions, jamais à vos identifiants bancaires.",
      },
    ],
  },
  {
    category: "Support & Accompagnement",
    questions: [
      {
        question: "Quel support avec le plan Freemium ?",
        answer: "Le plan Freemium inclut l'accès à notre centre d'aide complet, notre communauté Discord et le support email avec réponse sous 48h ouvrées.",
      },
      {
        question: "Comment fonctionne l'onboarding Expert ?",
        answer: "Un spécialiste Quelyos vous accompagne pendant 1h pour configurer votre environnement : import de données, paramétrage budgets, formation équipe. Inclus dans le plan Expert.",
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

  // Calculs
  const timeSaved = hoursPerMonth * 0.7; // 70% de temps gagné
  const timeSavings = timeSaved * hourlyRate * 12;
  const invoiceSavings = missedInvoices * avgInvoiceAmount * 12 * 0.8; // 80% récupérées
  const totalSavings = timeSavings + invoiceSavings;
  const proCost = 19 * 12;
  const roi = ((totalSavings - proCost) / proCost * 100).toFixed(0);

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
          <Calculator className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Calculateur de ROI</h3>
          <p className="text-sm text-slate-400">Estimez vos économies annuelles</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Heures/mois sur la gestion financière
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="2"
                max="40"
                value={hoursPerMonth}
                onChange={(e) => setHoursPerMonth(Number(e.target.value))}
                className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-white/10 accent-indigo-500"
              />
              <span className="w-12 text-right text-sm font-medium text-white">{hoursPerMonth}h</span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Votre taux horaire (€)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="20"
                max="150"
                step="5"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-white/10 accent-indigo-500"
              />
              <span className="w-12 text-right text-sm font-medium text-white">{hourlyRate}€</span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Factures impayées/oubliées par mois
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="10"
                value={missedInvoices}
                onChange={(e) => setMissedInvoices(Number(e.target.value))}
                className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-white/10 accent-indigo-500"
              />
              <span className="w-12 text-right text-sm font-medium text-white">{missedInvoices}</span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Montant moyen d&apos;une facture (€)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="100"
                max="5000"
                step="100"
                value={avgInvoiceAmount}
                onChange={(e) => setAvgInvoiceAmount(Number(e.target.value))}
                className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-white/10 accent-indigo-500"
              />
              <span className="w-16 text-right text-sm font-medium text-white">{avgInvoiceAmount}€</span>
            </div>
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
              <span className="font-medium text-white">{(timeSaved * 12).toFixed(0)}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-slate-400">
                <Euro size={14} />
                Valeur temps gagné
              </span>
              <span className="font-medium text-white">{timeSavings.toLocaleString('fr-FR')}€</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-slate-400">
                <TrendingUp size={14} />
                Factures récupérées
              </span>
              <span className="font-medium text-white">{invoiceSavings.toLocaleString('fr-FR')}€</span>
            </div>

            <div className="my-3 border-t border-white/10" />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">Coût Quelyos Pro/an</span>
              <span className="font-medium text-slate-400">-{proCost}€</span>
            </div>

            <div className="rounded-lg bg-emerald-500/10 p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-400">Économie nette/an</span>
                <span className="text-2xl font-bold text-emerald-400">
                  +{(totalSavings - proCost).toLocaleString('fr-FR')}€
                </span>
              </div>
              <p className="mt-1 text-right text-xs text-emerald-400/70">
                ROI : {roi}%
              </p>
            </div>
          </div>

          <Link
            href="/finance/register?plan=pro"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-400"
          >
            Essayer Pro gratuitement
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANT FAQ ACCORDÉON
// ═══════════════════════════════════════════════════════════════════════════

function FAQAccordion() {
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
                  className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
                >
                  <button
                    onClick={() => toggleItem(itemId)}
                    className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-white/[0.02]"
                  >
                    <span className="font-medium text-white">{faq.question}</span>
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
                          <p className="text-sm leading-relaxed text-slate-400">{faq.answer}</p>
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

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [showComparison, setShowComparison] = useState(false);

  const getPrice = (basePrice: string) => {
    if (basePrice === "0" || basePrice === "Sur mesure") return basePrice;
    const price = parseInt(basePrice);
    if (billingPeriod === "yearly") {
      return Math.round(price * 10 / 12).toString(); // 2 mois gratuits
    }
    return basePrice;
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden pb-12 pt-16">
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="pointer-events-none absolute -right-40 top-40 h-[400px] w-[400px] rounded-full bg-violet-500/15 blur-[100px]" />

        <Container className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
              <Sparkles size={14} />
              14 jours d&apos;essai gratuit • Sans carte bancaire
            </span>
            
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Des tarifs adaptés
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                à chaque TPE
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Commencez gratuitement, évoluez selon vos besoins. 
              Pas de frais cachés, pas d&apos;engagement, résiliation en 1 clic.
            </p>

            {/* Billing toggle */}
            <div className="mt-8 flex items-center justify-center gap-3">
              <span className={`text-sm ${billingPeriod === "monthly" ? "text-white" : "text-slate-500"}`}>
                Mensuel
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
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
              <span className={`text-sm ${billingPeriod === "yearly" ? "text-white" : "text-slate-500"}`}>
                Annuel
              </span>
              {billingPeriod === "yearly" && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  -17%
                </span>
              )}
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Pricing Cards */}
      <section className="relative pb-16">
        <Container>
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              const colorClasses = {
                emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
                indigo: { bg: "bg-indigo-500/10", text: "text-indigo-400" },
                violet: { bg: "bg-violet-500/10", text: "text-violet-400" },
              };
              const colors = colorClasses[plan.color as keyof typeof colorClasses];
              
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative flex flex-col rounded-2xl border p-6 ${
                    plan.highlight
                      ? "border-indigo-500/50 bg-gradient-to-b from-indigo-500/10 to-transparent shadow-xl shadow-indigo-500/10 lg:scale-105"
                      : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-6">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-lg ${
                        plan.highlight 
                          ? "bg-indigo-500 shadow-indigo-500/25" 
                          : "bg-violet-500 shadow-violet-500/25"
                      }`}>
                        <Sparkles size={12} />
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg}`}>
                      <Icon className={`h-5 w-5 ${colors.text}`} />
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">
                        {getPrice(plan.price)}€
                      </span>
                      {plan.originalPrice && billingPeriod === "monthly" && (
                        <span className="text-lg text-slate-500 line-through">{plan.originalPrice}€</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {plan.period}
                      {billingPeriod === "yearly" && plan.price !== "0" && (
                        <span className="text-emerald-400"> (facturé annuellement)</span>
                      )}
                    </p>
                  </div>

                  <Link
                    href={plan.ctaHref}
                    className={`mb-6 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                      plan.highlight
                        ? "bg-white text-slate-900 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/10"
                        : "bg-white/5 text-white ring-1 ring-white/10 hover:bg-white/10"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight size={14} />
                  </Link>

                  <ul className="flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                        <span className="text-sm text-slate-400">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>

          {/* Voir comparatif */}
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="inline-flex items-center gap-2 text-sm text-indigo-400 transition-colors hover:text-indigo-300"
            >
              {showComparison ? "Masquer" : "Voir"} le comparatif détaillé
              <ChevronDown size={16} className={`transition-transform ${showComparison ? "rotate-180" : ""}`} />
            </button>
          </div>
        </Container>
      </section>

      {/* Comparatif détaillé */}
      <AnimatePresence>
        {showComparison && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-y border-white/5 bg-white/[0.01]"
          >
            <Container className="py-16">
              <h2 className="mb-8 text-center text-2xl font-bold text-white">
                Comparatif complet des fonctionnalités
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-4 text-left text-sm font-medium text-slate-400">Fonctionnalité</th>
                      <th className="py-4 text-center text-sm font-medium text-emerald-400">Freemium</th>
                      <th className="py-4 text-center text-sm font-medium text-indigo-400">Pro</th>
                      <th className="py-4 text-center text-sm font-medium text-violet-400">Expert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(featureComparison).map(([category, features]) => (
                      <>
                        <tr key={category}>
                          <td colSpan={4} className="pb-2 pt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {category}
                          </td>
                        </tr>
                        {features.map((feature, idx) => (
                          <tr key={`${category}-${idx}`} className="border-b border-white/5">
                            <td className="py-3 text-sm text-slate-300">{feature.name}</td>
                            {(["free", "pro", "expert"] as const).map((plan) => {
                              const value = feature[plan];
                              return (
                                <td key={plan} className="py-3 text-center">
                                  {value === true ? (
                                    <Check size={16} className="mx-auto text-emerald-400" />
                                  ) : value === false ? (
                                    <X size={16} className="mx-auto text-slate-600" />
                                  ) : (
                                    <span className="text-sm text-white">{value}</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </Container>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Trust badges */}
      <section className="border-y border-white/5 bg-white/[0.01] py-12">
        <Container>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Check className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
              <p className="text-sm font-medium text-white">14 jours d&apos;essai</p>
              <p className="text-xs text-slate-500">Sans carte bancaire</p>
            </div>
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10">
                  <Zap className="h-6 w-6 text-indigo-400" />
                </div>
              </div>
              <p className="text-sm font-medium text-white">Setup en 5 minutes</p>
              <p className="text-xs text-slate-500">Import automatique</p>
            </div>
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
                  <Building2 className="h-6 w-6 text-violet-400" />
                </div>
              </div>
              <p className="text-sm font-medium text-white">+500 TPE</p>
              <p className="text-xs text-slate-500">Nous font confiance</p>
            </div>
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                  <Shield className="h-6 w-6 text-amber-400" />
                </div>
              </div>
              <p className="text-sm font-medium text-white">100% Français</p>
              <p className="text-xs text-slate-500">Données hébergées en France</p>
            </div>
          </div>
        </Container>
      </section>

      {/* ROI Calculator */}
      <section className="py-16">
        <Container narrow>
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Calculez votre retour sur investissement
            </h2>
            <p className="mt-3 text-slate-400">
              Découvrez combien vous pouvez économiser avec Quelyos Pro
            </p>
          </div>
          <ROICalculator />
        </Container>
      </section>

      {/* FAQ */}
      <section className="border-t border-white/5 py-16">
        <Container narrow>
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Questions fréquentes
            </h2>
            <p className="mt-3 text-slate-400">
              Tout ce que vous devez savoir sur nos offres
            </p>
          </div>
          <FAQAccordion />
        </Container>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 py-24">
        <Container narrow className="text-center">
          <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-indigo-500/10 to-transparent p-8 sm:p-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Prêt à reprendre le contrôle ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
              Rejoignez des centaines de TPE françaises qui gèrent leurs finances 
              avec Quelyos. Essai gratuit, sans engagement.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/finance/register?plan=pro"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-sm font-semibold text-slate-900 shadow-lg shadow-white/10 transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Sparkles size={16} />
                Essayer Pro gratuitement
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg px-6 py-4 text-sm font-medium text-slate-300 ring-1 ring-white/10 transition-colors hover:bg-white/5"
              >
                Parler à un expert
              </Link>
            </div>
            <p className="mt-6 text-sm text-slate-500">
              ✓ 14 jours gratuits &nbsp;&nbsp; ✓ Sans carte bancaire &nbsp;&nbsp; ✓ Résiliation en 1 clic
            </p>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}