"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Check, 
  X, 
  Minus,
  ArrowRight, 
  Sparkles,
  Building2,
  Users,
  Zap,
  Shield,
  Target,
  BarChart3,
  Wallet,
  TrendingUp,
  Clock,
  Euro,
  Globe,
  Award,
  Heart
} from "lucide-react";
import Header from "@/app/components/Header";

import config from "@/app/lib/config";
import Footer from "@/app/components/Footer";
import Container from "@/app/components/Container";
// ═══════════════════════════════════════════════════════════════════════════
// DONNÉES DES CONCURRENTS
// ═══════════════════════════════════════════════════════════════════════════

type FeatureValue = boolean | "partial" | string;

interface Competitor {
  id: string;
  name: string;
  logo: string;
  tagline: string;
  targetAudience: string;
  pricing: {
    starter: string;
    pro: string;
    note?: string;
  };
  pros: string[];
  cons: string[];
}

const competitors: Competitor[] = [
  {
    id: "pennylane",
    name: "Pennylane",
    logo: "P",
    tagline: "Comptabilité collaborative",
    targetAudience: "TPE/PME avec comptable",
    pricing: {
      starter: "14€/mois",
      pro: "49€/mois",
      note: "Comptable requis",
    },
    pros: [
      "Interface moderne",
      "Intégration comptable poussée",
      "Nombreuses intégrations",
    ],
    cons: [
      "Nécessite un comptable partenaire",
      "Complexe pour les freelances",
      "Prévisions limitées",
    ],
  },
  {
    id: "agicap",
    name: "Agicap",
    logo: "A",
    tagline: "Gestion de trésorerie PME/ETI",
    targetAudience: "PME 10+ employés",
    pricing: {
      starter: "Sur devis",
      pro: "200€+/mois",
      note: "Engagement annuel",
    },
    pros: [
      "Très puissant pour PME",
      "Connexions bancaires solides",
      "Multi-entités",
    ],
    cons: [
      "Prix élevé",
      "Trop complexe pour TPE",
      "Commercial obligatoire",
    ],
  },
  {
    id: "qonto",
    name: "Qonto",
    logo: "Q",
    tagline: "Néobanque pro",
    targetAudience: "TPE/Freelances",
    pricing: {
      starter: "9€/mois",
      pro: "29€/mois",
      note: "Compte bancaire inclus",
    },
    pros: [
      "Compte bancaire intégré",
      "Cartes professionnelles",
      "Simple d'utilisation",
    ],
    cons: [
      "Limité à un seul compte",
      "Peu de prévisions",
      "Pas de multi-banques",
    ],
  },
];

// Tableau comparatif détaillé
interface FeatureCategory {
  name: string;
  features: {
    name: string;
    quelyos: FeatureValue;
    pennylane: FeatureValue;
    agicap: FeatureValue;
    qonto: FeatureValue;
    highlight?: boolean;
  }[];
}

const featureComparison: FeatureCategory[] = [
  {
    name: "Prévisions & Intelligence",
    features: [
      { name: "Prévisions IA trésorerie", quelyos: true, pennylane: "partial", agicap: true, qonto: false, highlight: true },
      { name: "Horizon 180 jours", quelyos: true, pennylane: false, agicap: true, qonto: false, highlight: true },
      { name: "Scénarios what-if", quelyos: true, pennylane: false, agicap: true, qonto: false, highlight: true },
      { name: "Zone de confiance ML", quelyos: true, pennylane: false, agicap: "partial", qonto: false, highlight: true },
      { name: "Indicateur de risque", quelyos: true, pennylane: false, agicap: true, qonto: false },
      { name: "Alertes intelligentes", quelyos: true, pennylane: true, agicap: true, qonto: "partial" },
    ],
  },
  {
    name: "Gestion quotidienne",
    features: [
      { name: "Multi-comptes bancaires", quelyos: true, pennylane: true, agicap: true, qonto: false },
      { name: "Catégorisation auto", quelyos: true, pennylane: true, agicap: true, qonto: true },
      { name: "Budgets personnalisés", quelyos: true, pennylane: "partial", agicap: true, qonto: "partial" },
      { name: "Import CSV/OFX", quelyos: true, pennylane: true, agicap: true, qonto: false },
      { name: "Connexion bancaire auto", quelyos: true, pennylane: true, agicap: true, qonto: "partial" },
      { name: "Transactions récurrentes", quelyos: true, pennylane: true, agicap: true, qonto: true },
    ],
  },
  {
    name: "Collaboration",
    features: [
      { name: "Multi-utilisateurs", quelyos: true, pennylane: true, agicap: true, qonto: true },
      { name: "Rôles & permissions", quelyos: true, pennylane: true, agicap: true, qonto: true },
      { name: "Multi-entreprises", quelyos: true, pennylane: true, agicap: true, qonto: false },
      { name: "Partage tableaux de bord", quelyos: true, pennylane: "partial", agicap: true, qonto: false },
      { name: "Commentaires & notes", quelyos: true, pennylane: true, agicap: true, qonto: false },
    ],
  },
  {
    name: "Rapports & Exports",
    features: [
      { name: "Tableau de bord temps réel", quelyos: true, pennylane: true, agicap: true, qonto: true },
      { name: "Export FEC comptable", quelyos: true, pennylane: true, agicap: true, qonto: false },
      { name: "Rapports PDF automatisés", quelyos: true, pennylane: true, agicap: true, qonto: "partial" },
      { name: "API REST", quelyos: true, pennylane: true, agicap: true, qonto: true },
      { name: "Webhooks", quelyos: true, pennylane: true, agicap: true, qonto: true },
    ],
  },
  {
    name: "Tarification & Support",
    features: [
      { name: "Version gratuite", quelyos: true, pennylane: false, agicap: false, qonto: false, highlight: true },
      { name: "Essai gratuit 14j", quelyos: true, pennylane: true, agicap: false, qonto: true },
      { name: "Sans engagement", quelyos: true, pennylane: false, agicap: false, qonto: true, highlight: true },
      { name: "Support français", quelyos: true, pennylane: true, agicap: true, qonto: true },
      { name: "Onboarding inclus", quelyos: true, pennylane: "partial", agicap: true, qonto: false },
      { name: "Hébergement France", quelyos: true, pennylane: true, agicap: true, qonto: true },
    ],
  },
];

// Arguments différenciants Quelyos
const differentiators = [
  {
    icon: Target,
    title: "Conçu pour les TPE",
    description: "Interface simple pensée pour les indépendants et micro-entreprises, pas pour les grandes PME.",
    color: "indigo",
  },
  {
    icon: Zap,
    title: "Prévisions IA accessibles",
    description: "Technologie de prédiction ML dès le plan Freemium, pas réservée aux grands comptes.",
    color: "purple",
  },
  {
    icon: Euro,
    title: "Tarif transparent",
    description: "19€/mois tout inclus, sans engagement. Pas de devis, pas de commercial, pas de surprise.",
    color: "emerald",
  },
  {
    icon: Clock,
    title: "Setup en 5 minutes",
    description: "Import de données et configuration en quelques clics. Pas besoin de consultant ni de formation.",
    color: "amber",
  },
  {
    icon: Shield,
    title: "Indépendance bancaire",
    description: "Connectez toutes vos banques existantes. Pas besoin de changer de compte ou d'ouvrir un nouveau.",
    color: "cyan",
  },
  {
    icon: Heart,
    title: "Support humain français",
    description: "Une vraie équipe à Bordeaux, réponse sous 24h. Pas de chatbot, pas de call center offshore.",
    color: "rose",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANTS
// ═══════════════════════════════════════════════════════════════════════════

function FeatureIcon({ value }: { value: FeatureValue }) {
  if (value === true) {
    return <Check size={18} className="text-emerald-400" />;
  }
  if (value === false) {
    return <X size={18} className="text-slate-600" />;
  }
  if (value === "partial") {
    return <Minus size={18} className="text-amber-400" />;
  }
  return <span className="text-xs text-slate-400">{value}</span>;
}

function CompetitorCard({ competitor, isQuelyos = false }: { competitor: Competitor; isQuelyos?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`rounded-2xl border p-6 ${
        isQuelyos 
          ? "border-indigo-500/50 bg-gradient-to-b from-indigo-500/10 to-transparent" 
          : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold ${
          isQuelyos 
            ? "bg-gradient-to-br from-indigo-500 to-violet-500 text-white" 
            : "bg-white/10 text-slate-400"
        }`}>
          {competitor.logo}
        </div>
        <div>
          <h3 className="font-semibold text-white">{competitor.name}</h3>
          <p className="text-xs text-slate-400">{competitor.tagline}</p>
        </div>
        {isQuelyos && (
          <span className="ml-auto rounded-full bg-indigo-500 px-2 py-0.5 text-xs font-medium text-white">
            Recommandé
          </span>
        )}
      </div>
      
      <p className="mb-4 text-sm text-slate-500">
        <Users size={14} className="mr-1 inline" />
        {competitor.targetAudience}
      </p>
      
      <div className="mb-4 rounded-lg bg-white/5 p-3">
        <p className="text-xs text-slate-500">À partir de</p>
        <p className="text-xl font-bold text-white">{competitor.pricing.starter}</p>
        {competitor.pricing.note && (
          <p className="text-xs text-slate-500">{competitor.pricing.note}</p>
        )}
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="mb-2 text-xs font-medium text-emerald-400">Points forts</p>
          <ul className="space-y-1">
            {competitor.pros.map((pro, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                {pro}
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <p className="mb-2 text-xs font-medium text-rose-400">Limitations</p>
          <ul className="space-y-1">
            {competitor.cons.map((con, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                <X size={14} className="mt-0.5 shrink-0 text-rose-400" />
                {con}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════

export default function ComparePage() {
  const quelyosData: Competitor = {
    id: "quelyos",
    name: "Quelyos",
    logo: "Q",
    tagline: "Prévisions trésorerie TPE",
    targetAudience: "Indépendants, TPE, Freelances",
    pricing: {
      starter: "Gratuit",
      pro: "19€/mois",
      note: "Sans engagement",
    },
    pros: [
      "Prévisions IA incluses",
      "Version gratuite généreuse",
      "Setup en 5 minutes",
    ],
    cons: [
      "Jeune sur le marché",
      "Moins d'intégrations comptables",
      "Pas de compte bancaire intégré",
    ],
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden pb-16 pt-16">
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="pointer-events-none absolute -right-40 top-40 h-[400px] w-[400px] rounded-full bg-violet-500/15 blur-[100px]" />

        <Container className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-400">
              <Award size={14} />
              Comparatif objectif
            </span>
            
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Quelyos vs la concurrence
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Comparez les solutions de gestion de trésorerie pour TPE. 
              Nous jouons la transparence : voici nos forces et nos limites.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Quick comparison cards */}
      <section className="pb-16">
        <Container>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <CompetitorCard competitor={quelyosData} isQuelyos />
            {competitors.map((c) => (
              <CompetitorCard key={c.id} competitor={c} />
            ))}
          </div>
        </Container>
      </section>

      {/* Differentiators */}
      <section className="border-y border-white/5 bg-white/[0.01] py-16">
        <Container>
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Pourquoi choisir Quelyos ?
            </h2>
            <p className="mt-3 text-slate-400">
              Ce qui nous différencie des autres solutions
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {differentiators.map((diff, index) => {
              const Icon = diff.icon;
              const colorClasses: Record<string, { bg: string; text: string }> = {
                indigo: { bg: "bg-indigo-500/10", text: "text-indigo-400" },
                purple: { bg: "bg-purple-500/10", text: "text-purple-400" },
                emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
                amber: { bg: "bg-amber-500/10", text: "text-amber-400" },
                cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400" },
                rose: { bg: "bg-rose-500/10", text: "text-rose-400" },
              };
              const colors = colorClasses[diff.color] || colorClasses.indigo;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
                >
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg}`}>
                    <Icon className={`h-6 w-6 ${colors.text}`} />
                  </div>
                  <h3 className="mb-2 font-semibold text-white">{diff.title}</h3>
                  <p className="text-sm text-slate-400">{diff.description}</p>
                </motion.div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Detailed comparison table */}
      <section className="py-16">
        <Container>
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Comparatif détaillé des fonctionnalités
            </h2>
            <p className="mt-3 text-slate-400">
              Feature par feature, en toute transparence
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-4 text-left text-sm font-medium text-slate-400">Fonctionnalité</th>
                  <th className="py-4 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white">
                        Q
                      </div>
                      <span className="text-sm font-medium text-indigo-400">Quelyos</span>
                    </div>
                  </th>
                  <th className="py-4 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-slate-400">
                        P
                      </div>
                      <span className="text-sm font-medium text-slate-400">Pennylane</span>
                    </div>
                  </th>
                  <th className="py-4 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-slate-400">
                        A
                      </div>
                      <span className="text-sm font-medium text-slate-400">Agicap</span>
                    </div>
                  </th>
                  <th className="py-4 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-slate-400">
                        Q
                      </div>
                      <span className="text-sm font-medium text-slate-400">Qonto</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {featureComparison.map((category) => (
                  <>
                    <tr key={category.name}>
                      <td colSpan={5} className="pb-2 pt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {category.name}
                      </td>
                    </tr>
                    {category.features.map((feature, idx) => (
                      <tr
                        key={`${category.name}-${idx}`}
                        className={`border-b border-white/5 ${feature.highlight ? "bg-indigo-500/5" : ""}`}
                      >
                        <td className="py-3 text-sm text-slate-300">
                          {feature.name}
                          {feature.highlight && (
                            <Sparkles size={12} className="ml-1.5 inline text-indigo-400" />
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex justify-center">
                            <FeatureIcon value={feature.quelyos} />
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex justify-center">
                            <FeatureIcon value={feature.pennylane} />
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex justify-center">
                            <FeatureIcon value={feature.agicap} />
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex justify-center">
                            <FeatureIcon value={feature.qonto} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Légende */}
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Check size={16} className="text-emerald-400" />
              <span className="text-slate-400">Inclus</span>
            </div>
            <div className="flex items-center gap-2">
              <Minus size={16} className="text-amber-400" />
              <span className="text-slate-400">Partiel / Limité</span>
            </div>
            <div className="flex items-center gap-2">
              <X size={16} className="text-slate-600" />
              <span className="text-slate-400">Non disponible</span>
            </div>
          </div>
        </Container>
      </section>

      {/* Use case recommendations */}
      <section className="border-t border-white/5 py-16">
        <Container narrow>
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Quelle solution pour vous ?
            </h2>
            <p className="mt-3 text-slate-400">
              Notre recommandation honnête selon votre profil
            </p>
          </div>
          
          <div className="space-y-4">
            {[
              {
                profile: "Freelance / Auto-entrepreneur",
                recommendation: "Quelyos",
                why: "Gratuit pour démarrer, prévisions IA incluses, setup rapide sans prise de tête.",
                icon: Users,
              },
              {
                profile: "TPE (1-5 employés)",
                recommendation: "Quelyos",
                why: "Le meilleur rapport qualité/prix avec des prévisions avancées à 19€/mois.",
                icon: Building2,
              },
              {
                profile: "PME avec comptable dédié",
                recommendation: "Pennylane ou Quelyos",
                why: "Pennylane si collaboration comptable critique, Quelyos si priorité aux prévisions.",
                icon: BarChart3,
              },
              {
                profile: "PME 20+ employés, multi-entités",
                recommendation: "Agicap",
                why: "Quelyos est conçu pour les TPE. Pour les grandes structures, Agicap est plus adapté.",
                icon: Globe,
              },
              {
                profile: "Besoin d'un compte bancaire pro",
                recommendation: "Qonto + Quelyos",
                why: "Qonto pour le compte bancaire, Quelyos pour les prévisions — ils sont complémentaires.",
                icon: Wallet,
              },
            ].map((item, index) => {
              const Icon = item.icon;
              const isQuelyos = item.recommendation.includes("Quelyos");
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-start gap-4 rounded-xl border p-5 ${
                    isQuelyos 
                      ? "border-indigo-500/30 bg-indigo-500/5" 
                      : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    isQuelyos ? "bg-indigo-500/20" : "bg-white/10"
                  }`}>
                    <Icon size={20} className={isQuelyos ? "text-indigo-400" : "text-slate-400"} />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-white">{item.profile}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        isQuelyos 
                          ? "bg-indigo-500/20 text-indigo-300" 
                          : "bg-white/10 text-slate-400"
                      }`}>
                        → {item.recommendation}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{item.why}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-24">
        <Container narrow className="text-center">
          <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-indigo-500/10 to-transparent p-8 sm:p-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Prêt à essayer ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
              Testez Quelyos gratuitement et comparez par vous-même. 
              Pas de carte bancaire, pas d&apos;engagement.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={config.finance.register}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-sm font-semibold text-slate-900 shadow-lg shadow-white/10 transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Sparkles size={16} />
                Créer un compte gratuit
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/finance/pricing"
                className="inline-flex items-center gap-2 rounded-lg px-6 py-4 text-sm font-medium text-slate-300 ring-1 ring-white/10 transition-colors hover:bg-white/5"
              >
                Voir les tarifs
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}