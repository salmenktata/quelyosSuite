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
  ChevronDown,
  Store,
  Crown,
  Rocket,
  Headphones,
  Shield,
  Clock,
  HelpCircle,
} from "lucide-react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import Container from "@/app/components/Container";

// ═══════════════════════════════════════════════════════════════════════════
// PLANS SAAS E-COMMERCE
// ═══════════════════════════════════════════════════════════════════════════

const plans = [
  {
    id: "starter",
    name: "Starter",
    description: "Pour lancer votre boutique",
    price: "29",
    period: "par mois",
    highlight: false,
    cta: "Commencer l'essai gratuit",
    ctaHref: "/ecommerce/signup?plan=starter",
    icon: Store,
    color: "emerald",
    features: [
      "2 utilisateurs",
      "500 produits",
      "100 commandes/mois",
      "5 GB stockage",
      "Domaine *.quelyos.shop",
      "Thème personnalisable",
      "Support email (72h)",
      "Paiement Stripe/PayPal",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Pour les boutiques actives",
    price: "79",
    period: "par mois",
    highlight: true,
    badge: "Le + populaire",
    cta: "Essai gratuit 14 jours",
    ctaHref: "/ecommerce/signup?plan=pro",
    icon: Rocket,
    color: "indigo",
    features: [
      "5 utilisateurs",
      "2 000 produits",
      "500 commandes/mois",
      "20 GB stockage",
      "Domaine personnalisé",
      "Thème + CSS custom",
      "Support email (24h)",
      "Multi-devises (EUR, USD...)",
      "Analytics avancés",
      "API complète",
    ],
  },
  {
    id: "business",
    name: "Business",
    description: "Pour les marques en croissance",
    price: "199",
    period: "par mois",
    highlight: false,
    badge: "Multi-boutique",
    cta: "Essai gratuit 14 jours",
    ctaHref: "/ecommerce/signup?plan=business",
    icon: Crown,
    color: "violet",
    features: [
      "15 utilisateurs",
      "10 000 produits",
      "2 000 commandes/mois",
      "100 GB stockage",
      "3 boutiques incluses",
      "Domaines illimités",
      "Support chat (8h)",
      "Backup horaire",
      "White-label partiel",
      "Webhooks & intégrations",
      "SLA 99.9%",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Infrastructure sur-mesure",
    price: "Sur devis",
    period: "",
    highlight: false,
    badge: "Instance dédiée",
    cta: "Contacter les ventes",
    ctaHref: "/contact?subject=enterprise",
    icon: Building2,
    color: "amber",
    features: [
      "Utilisateurs illimités",
      "Produits illimités",
      "Commandes illimitées",
      "Stockage illimité",
      "Boutiques illimitées",
      "Instance dédiée isolée",
      "Support dédié (2h)",
      "Backup temps réel",
      "White-label complet",
      "SSO (SAML/OAuth)",
      "SLA 99.99%",
      "Onboarding personnalisé",
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// TABLEAU COMPARATIF
// ═══════════════════════════════════════════════════════════════════════════

type FeatureValue = string | boolean;

interface FeatureRow {
  name: string;
  starter: FeatureValue;
  pro: FeatureValue;
  business: FeatureValue;
  enterprise: FeatureValue;
}

const featureComparison: Record<string, FeatureRow[]> = {
  "Limites": [
    { name: "Utilisateurs", starter: "2", pro: "5", business: "15", enterprise: "Illimité" },
    { name: "Produits", starter: "500", pro: "2 000", business: "10 000", enterprise: "Illimité" },
    { name: "Commandes/mois", starter: "100", pro: "500", business: "2 000", enterprise: "Illimité" },
    { name: "Stockage", starter: "5 GB", pro: "20 GB", business: "100 GB", enterprise: "Illimité" },
    { name: "Boutiques", starter: "1", pro: "1", business: "3", enterprise: "Illimité" },
  ],
  "Boutique & Catalogue": [
    { name: "Thème personnalisable", starter: true, pro: true, business: true, enterprise: true },
    { name: "CSS/JS custom", starter: false, pro: true, business: true, enterprise: true },
    { name: "Domaine personnalisé", starter: false, pro: true, business: true, enterprise: true },
    { name: "Multi-langues", starter: false, pro: true, business: true, enterprise: true },
    { name: "Multi-devises", starter: false, pro: true, business: true, enterprise: true },
    { name: "Variantes produits", starter: true, pro: true, business: true, enterprise: true },
    { name: "Collections", starter: "5", pro: "Illimité", business: "Illimité", enterprise: "Illimité" },
  ],
  "Ventes & Paiements": [
    { name: "Stripe", starter: true, pro: true, business: true, enterprise: true },
    { name: "PayPal", starter: true, pro: true, business: true, enterprise: true },
    { name: "Flouci", starter: true, pro: true, business: true, enterprise: true },
    { name: "Konnect", starter: true, pro: true, business: true, enterprise: true },
    { name: "Paiement à la livraison", starter: true, pro: true, business: true, enterprise: true },
    { name: "Codes promo", starter: false, pro: true, business: true, enterprise: true },
    { name: "Abandon de panier", starter: false, pro: true, business: true, enterprise: true },
  ],
  "Stock & Livraison": [
    { name: "Gestion stock", starter: true, pro: true, business: true, enterprise: true },
    { name: "Alertes rupture", starter: true, pro: true, business: true, enterprise: true },
    { name: "Multi-entrepôts", starter: false, pro: false, business: true, enterprise: true },
    { name: "Zones de livraison", starter: "3", pro: "Illimité", business: "Illimité", enterprise: "Illimité" },
    { name: "Transporteurs custom", starter: false, pro: true, business: true, enterprise: true },
  ],
  "Marketing & Analytics": [
    { name: "Analytics basiques", starter: true, pro: true, business: true, enterprise: true },
    { name: "Analytics avancés", starter: false, pro: true, business: true, enterprise: true },
    { name: "SEO optimisé", starter: true, pro: true, business: true, enterprise: true },
    { name: "Newsletter", starter: false, pro: true, business: true, enterprise: true },
    { name: "Programme fidélité", starter: false, pro: false, business: true, enterprise: true },
    { name: "Avis clients", starter: true, pro: true, business: true, enterprise: true },
  ],
  "Support & Sécurité": [
    { name: "Support email", starter: "72h", pro: "24h", business: "8h", enterprise: "2h dédié" },
    { name: "Chat en direct", starter: false, pro: false, business: true, enterprise: true },
    { name: "Onboarding", starter: "Docs", pro: "Vidéo", business: "Call 1h", enterprise: "Dédié" },
    { name: "SLA uptime", starter: "99%", pro: "99.5%", business: "99.9%", enterprise: "99.99%" },
    { name: "Backup", starter: "Quotidien", pro: "Quotidien", business: "Horaire", enterprise: "Temps réel" },
    { name: "SSL inclus", starter: true, pro: true, business: true, enterprise: true },
    { name: "RGPD compliant", starter: true, pro: true, business: true, enterprise: true },
  ],
  "API & Intégrations": [
    { name: "API REST", starter: "Limitée", pro: "Complète", business: "Complète", enterprise: "Complète" },
    { name: "Webhooks", starter: false, pro: false, business: true, enterprise: true },
    { name: "Zapier", starter: false, pro: true, business: true, enterprise: true },
    { name: "SSO", starter: false, pro: false, business: false, enterprise: true },
    { name: "White-label", starter: false, pro: false, business: "Partiel", enterprise: "Complet" },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// ADD-ONS
// ═══════════════════════════════════════════════════════════════════════════

const addons = [
  { name: "Utilisateur supplémentaire", price: "+9", period: "/mois", desc: "Au-delà du quota de votre plan" },
  { name: "Boutique supplémentaire", price: "+29", period: "/mois", desc: "Multi-marque sur même compte" },
  { name: "Stockage 50 GB", price: "+19", period: "/mois", desc: "Extension espace fichiers" },
  { name: "POS (Caisse)", price: "+49", period: "/mois", desc: "Point de vente physique" },
  { name: "Analytics Pro", price: "+29", period: "/mois", desc: "BI, rapports personnalisés" },
  { name: "API Priority", price: "+39", period: "/mois", desc: "Rate limits x10" },
  { name: "Migration assistée", price: "499", period: " (one-time)", desc: "Import depuis Shopify, WooCommerce..." },
];

// ═══════════════════════════════════════════════════════════════════════════
// FAQ
// ═══════════════════════════════════════════════════════════════════════════

const faqs = [
  {
    question: "Puis-je tester gratuitement ?",
    answer: "Oui ! Tous les plans payants incluent un essai gratuit de 14 jours, sans carte bancaire. Vous avez accès à toutes les fonctionnalités pour évaluer la solution.",
  },
  {
    question: "Puis-je changer de plan à tout moment ?",
    answer: "Absolument. Vous pouvez upgrader ou downgrader à tout moment. Le changement est immédiat et proratisé au jour près. Aucun frais de changement.",
  },
  {
    question: "Qu'est-ce qui compte comme une \"commande\" ?",
    answer: "Une commande = une transaction validée (payée ou confirmée). Les commandes annulées, les paniers abandonnés et les brouillons ne sont pas comptés.",
  },
  {
    question: "Puis-je utiliser mon propre nom de domaine ?",
    answer: "Oui, à partir du plan Pro. Vous configurez votre domaine (ex: shop.votresite.com) et nous gérons le SSL automatiquement.",
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer: "Absolument. Infrastructure sécurisée (RGPD), chiffrement AES-256, backups automatiques, et accès restreint par rôles. Nous ne revendons jamais vos données.",
  },
  {
    question: "Comment fonctionne le plan Enterprise ?",
    answer: "Le plan Enterprise offre une instance dédiée (serveur isolé), un support prioritaire avec un interlocuteur dédié, et des configurations sur-mesure. Contactez-nous pour un devis personnalisé.",
  },
  {
    question: "Proposez-vous des remises annuelles ?",
    answer: "Oui ! En payant à l'année, vous économisez 2 mois (-17%). Starter: 290€/an, Pro: 790€/an, Business: 1990€/an.",
  },
  {
    question: "Puis-je migrer depuis Shopify/WooCommerce ?",
    answer: "Oui, notre add-on \"Migration assistée\" (499€) inclut l'import de vos produits, clients, commandes historiques et redirections SEO. Migration typique: 3-5 jours.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANTS
// ═══════════════════════════════════════════════════════════════════════════

function PlanCard({ plan, isYearly }: { plan: typeof plans[0]; isYearly: boolean }) {
  const yearlyPrice = plan.price !== "Sur devis" ? Math.round(parseInt(plan.price) * 10) : null;
  const displayPrice = isYearly && yearlyPrice ? yearlyPrice : plan.price;
  const displayPeriod = isYearly && yearlyPrice ? "par an" : plan.period;

  const colorClasses: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    emerald: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      icon: "bg-emerald-500/20 text-emerald-400",
    },
    indigo: {
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/30",
      text: "text-indigo-400",
      icon: "bg-indigo-500/20 text-indigo-400",
    },
    violet: {
      bg: "bg-violet-500/10",
      border: "border-violet-500/30",
      text: "text-violet-400",
      icon: "bg-violet-500/20 text-violet-400",
    },
    amber: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-400",
      icon: "bg-amber-500/20 text-amber-400",
    },
  };

  const colors = colorClasses[plan.color] || colorClasses.emerald;
  const Icon = plan.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative flex flex-col p-6 rounded-2xl border ${
        plan.highlight
          ? `${colors.bg} ${colors.border}`
          : "bg-gray-900/50 border-white/10"
      }`}
    >
      {plan.badge && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium ${
          plan.highlight ? "bg-indigo-500 text-white" : "bg-gray-700 text-gray-300"
        }`}>
          {plan.badge}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-white">{plan.name}</h3>
          <p className="text-sm text-gray-400">{plan.description}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          {plan.price !== "Sur devis" ? (
            <>
              <span className="text-4xl font-bold text-white">{displayPrice}€</span>
              <span className="text-gray-400">{displayPeriod}</span>
            </>
          ) : (
            <span className="text-2xl font-bold text-white">{plan.price}</span>
          )}
        </div>
        {isYearly && yearlyPrice && (
          <p className="text-sm text-emerald-400 mt-1">
            Économisez {parseInt(plan.price) * 2}€/an
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-6 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colors.text}`} />
            <span className="text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={plan.ctaHref}
        className={`w-full py-3 px-4 rounded-lg font-medium text-center transition-all ${
          plan.highlight
            ? "bg-indigo-600 hover:bg-indigo-500 text-white"
            : "bg-white/10 hover:bg-white/20 text-white"
        }`}
      >
        {plan.cta}
        <ArrowRight className="inline-block w-4 h-4 ml-2" />
      </Link>
    </motion.div>
  );
}

function ComparisonTable() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>("Limites");

  return (
    <div className="space-y-4">
      {Object.entries(featureComparison).map(([category, features]) => (
        <div key={category} className="border border-white/10 rounded-xl overflow-hidden">
          <button
            onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
            className="w-full flex items-center justify-between p-4 bg-gray-900/50 hover:bg-gray-900/70 transition-colors"
          >
            <span className="font-medium text-white">{category}</span>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedCategory === category ? "rotate-180" : ""
              }`}
            />
          </button>
          <AnimatePresence>
            {expandedCategory === category && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-4 text-gray-400 font-medium">Fonctionnalité</th>
                        <th className="text-center p-4 text-emerald-400 font-medium">Starter</th>
                        <th className="text-center p-4 text-indigo-400 font-medium">Pro</th>
                        <th className="text-center p-4 text-violet-400 font-medium">Business</th>
                        <th className="text-center p-4 text-amber-400 font-medium">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody>
                      {features.map((row, idx) => (
                        <tr key={row.name} className={idx % 2 === 0 ? "bg-gray-900/30" : ""}>
                          <td className="p-4 text-gray-300">{row.name}</td>
                          {["starter", "pro", "business", "enterprise"].map((planId) => {
                            const value = row[planId as keyof FeatureRow];
                            return (
                              <td key={planId} className="text-center p-4">
                                {typeof value === "boolean" ? (
                                  value ? (
                                    <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                                  ) : (
                                    <X className="w-5 h-5 text-gray-600 mx-auto" />
                                  )
                                ) : (
                                  <span className="text-gray-300">{value}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="border border-white/10 rounded-xl overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between p-4 bg-gray-900/30 hover:bg-gray-900/50 transition-colors text-left"
          >
            <span className="font-medium text-white pr-4">{faq.question}</span>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                openIndex === index ? "rotate-180" : ""
              }`}
            />
          </button>
          <AnimatePresence>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="p-4 text-gray-400 border-t border-white/5">
                  {faq.answer}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════

export default function EcommercePricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <Container className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span>14 jours d&apos;essai gratuit</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Lancez votre boutique en ligne{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-500 text-transparent bg-clip-text">
              en quelques minutes
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-8"
          >
            Solution e-commerce complète avec gestion de stock, paiements, et backoffice.
            Sans commission sur vos ventes.
          </motion.p>

          {/* Toggle mensuel/annuel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-3 p-1 rounded-lg bg-gray-900/50 border border-white/10"
          >
            <button
              onClick={() => setIsYearly(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                !isYearly ? "bg-white text-gray-900" : "text-gray-400 hover:text-white"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                isYearly ? "bg-white text-gray-900" : "text-gray-400 hover:text-white"
              }`}
            >
              Annuel
              <span className="ml-2 text-xs text-emerald-500 font-semibold">-17%</span>
            </button>
          </motion.div>
        </Container>
      </section>

      {/* Plans */}
      <section className="py-12 px-4">
        <Container>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <PlanCard plan={plan} isYearly={isYearly} />
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Garanties */}
      <section className="py-12 px-4 border-y border-white/5">
        <Container>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Clock, text: "14 jours d'essai gratuit" },
              { icon: Shield, text: "Infrastructure sécurisée, RGPD" },
              { icon: Headphones, text: "Support réactif inclus" },
              { icon: Zap, text: "0% commission sur vos ventes" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-indigo-400" />
                </div>
                <span className="text-gray-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Tableau comparatif */}
      <section className="py-20 px-4">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Comparez les plans en détail
            </h2>
            <p className="text-gray-400">
              Toutes les fonctionnalités, plan par plan
            </p>
          </div>
          <ComparisonTable />
        </Container>
      </section>

      {/* Add-ons */}
      <section className="py-20 px-4 bg-gray-900/30">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Besoin de plus ?
            </h2>
            <p className="text-gray-400">
              Ajoutez des options à tout moment
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {addons.map((addon) => (
              <div
                key={addon.name}
                className="p-4 rounded-xl bg-gray-900/50 border border-white/10"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <span className="font-medium text-white">{addon.name}</span>
                  <span className="text-indigo-400 font-semibold">
                    {addon.price}€{addon.period}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{addon.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <Container>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-gray-400 text-sm mb-4">
              <HelpCircle className="w-4 h-4" />
              <span>Questions fréquentes</span>
            </div>
            <h2 className="text-3xl font-bold text-white">
              Des questions ?
            </h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <FAQSection />
          </div>
        </Container>
      </section>

      {/* CTA final */}
      <section className="py-20 px-4">
        <Container>
          <div className="max-w-3xl mx-auto text-center p-8 md:p-12 rounded-3xl bg-gradient-to-br from-indigo-900/50 to-violet-900/50 border border-indigo-500/20">
            <h2 className="text-3xl font-bold text-white mb-4">
              Prêt à lancer votre boutique ?
            </h2>
            <p className="text-gray-300 mb-8">
              Créez votre compte en 2 minutes. Essai gratuit 14 jours, sans CB.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/ecommerce/signup"
                className="px-8 py-3 rounded-lg bg-white text-gray-900 font-semibold hover:bg-gray-100 transition-colors"
              >
                Commencer gratuitement
                <ArrowRight className="inline-block w-4 h-4 ml-2" />
              </Link>
              <Link
                href="/contact?subject=demo"
                className="px-8 py-3 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors"
              >
                Demander une démo
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}
