import { Metadata } from 'next';
import Link from 'next/link';
import { getAllSolutionsDynamic, type SolutionData } from '@/app/lib/solutions-data';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import {
  UtensilsCrossed,
  ShoppingBag,
  Globe,
  Briefcase,
  Heart,
  HardHat,
  Hotel,
  HandHeart,
  Factory,
  Building2,
  GraduationCap,
  Truck,
  ArrowRight,
  Sparkles,
  Users,
  Layers,
  ChevronRight,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import SolutionsFilter from './SolutionsFilter';

export const metadata: Metadata = {
  title: 'Solutions métier Quelyos - Par secteur d\'activité',
  description: 'Découvrez nos 12 solutions complètes par métier : restauration, commerce, e-commerce, services, santé, BTP, hôtellerie, associations, industrie, immobilier, formation, logistique.',
};

// ── Mapping secteur → icône + couleur + catégorie ──

interface SectorConfig {
  icon: LucideIcon;
  color: string;
  gradient: string;
  bgLight: string;
  textLight: string;
  borderLight: string;
  pillBg: string;
  pillText: string;
  category: string;
}

const sectorConfig: Record<string, SectorConfig> = {
  restaurant: {
    icon: UtensilsCrossed,
    color: 'orange',
    gradient: 'from-orange-500 to-amber-500',
    bgLight: 'bg-orange-500/10',
    textLight: 'text-orange-400',
    borderLight: 'border-orange-500/30',
    pillBg: 'bg-orange-500/10',
    pillText: 'text-orange-300',
    category: 'Commerce',
  },
  commerce: {
    icon: ShoppingBag,
    color: 'indigo',
    gradient: 'from-indigo-500 to-blue-500',
    bgLight: 'bg-indigo-500/10',
    textLight: 'text-indigo-400',
    borderLight: 'border-indigo-500/30',
    pillBg: 'bg-indigo-500/10',
    pillText: 'text-indigo-300',
    category: 'Commerce',
  },
  ecommerce: {
    icon: Globe,
    color: 'violet',
    gradient: 'from-violet-500 to-purple-500',
    bgLight: 'bg-violet-500/10',
    textLight: 'text-violet-400',
    borderLight: 'border-violet-500/30',
    pillBg: 'bg-violet-500/10',
    pillText: 'text-violet-300',
    category: 'Commerce',
  },
  services: {
    icon: Briefcase,
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    bgLight: 'bg-blue-500/10',
    textLight: 'text-blue-400',
    borderLight: 'border-blue-500/30',
    pillBg: 'bg-blue-500/10',
    pillText: 'text-blue-300',
    category: 'Services',
  },
  sante: {
    icon: Heart,
    color: 'rose',
    gradient: 'from-rose-500 to-pink-500',
    bgLight: 'bg-rose-500/10',
    textLight: 'text-rose-400',
    borderLight: 'border-rose-500/30',
    pillBg: 'bg-rose-500/10',
    pillText: 'text-rose-300',
    category: 'Services',
  },
  btp: {
    icon: HardHat,
    color: 'amber',
    gradient: 'from-amber-500 to-yellow-500',
    bgLight: 'bg-amber-500/10',
    textLight: 'text-amber-400',
    borderLight: 'border-amber-500/30',
    pillBg: 'bg-amber-500/10',
    pillText: 'text-amber-300',
    category: 'Industrie',
  },
  hotellerie: {
    icon: Hotel,
    color: 'teal',
    gradient: 'from-teal-500 to-emerald-500',
    bgLight: 'bg-teal-500/10',
    textLight: 'text-teal-400',
    borderLight: 'border-teal-500/30',
    pillBg: 'bg-teal-500/10',
    pillText: 'text-teal-300',
    category: 'Services',
  },
  associations: {
    icon: HandHeart,
    color: 'emerald',
    gradient: 'from-emerald-500 to-green-500',
    bgLight: 'bg-emerald-500/10',
    textLight: 'text-emerald-400',
    borderLight: 'border-emerald-500/30',
    pillBg: 'bg-emerald-500/10',
    pillText: 'text-emerald-300',
    category: 'Social',
  },
  industrie: {
    icon: Factory,
    color: 'slate',
    gradient: 'from-slate-400 to-zinc-500',
    bgLight: 'bg-slate-500/10',
    textLight: 'text-slate-400',
    borderLight: 'border-slate-500/30',
    pillBg: 'bg-slate-500/10',
    pillText: 'text-slate-300',
    category: 'Industrie',
  },
  immobilier: {
    icon: Building2,
    color: 'cyan',
    gradient: 'from-cyan-500 to-sky-500',
    bgLight: 'bg-cyan-500/10',
    textLight: 'text-cyan-400',
    borderLight: 'border-cyan-500/30',
    pillBg: 'bg-cyan-500/10',
    pillText: 'text-cyan-300',
    category: 'Services',
  },
  education: {
    icon: GraduationCap,
    color: 'purple',
    gradient: 'from-purple-500 to-fuchsia-500',
    bgLight: 'bg-purple-500/10',
    textLight: 'text-purple-400',
    borderLight: 'border-purple-500/30',
    pillBg: 'bg-purple-500/10',
    pillText: 'text-purple-300',
    category: 'Social',
  },
  logistique: {
    icon: Truck,
    color: 'yellow',
    gradient: 'from-yellow-500 to-orange-500',
    bgLight: 'bg-yellow-500/10',
    textLight: 'text-yellow-400',
    borderLight: 'border-yellow-500/30',
    pillBg: 'bg-yellow-500/10',
    pillText: 'text-yellow-300',
    category: 'Industrie',
  },
};

const categories = ['Tous', 'Commerce', 'Services', 'Industrie', 'Social'] as const;

function getSectorCategory(solutionId: string): string {
  return sectorConfig[solutionId]?.category ?? 'Tous';
}

// ── Composant carte solution ──

function SolutionCard({ solution }: { solution: SolutionData }) {
  const config = sectorConfig[solution.id] ?? sectorConfig.services;
  const Icon = config.icon;

  return (
    <Link
      href={`/solutions/${solution.id}`}
      data-category={getSectorCategory(solution.id)}
      className="group solution-card relative flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08] hover:scale-[1.02] dark:border-white/10 dark:bg-slate-900/50 dark:hover:border-white/20 dark:hover:bg-slate-900/70
        lg:border-slate-200/60 lg:bg-white lg:hover:border-slate-300 lg:hover:bg-white lg:dark:border-white/10 lg:dark:bg-slate-900/50 lg:dark:hover:border-white/20 lg:dark:hover:bg-slate-900/70"
    >
      {/* Glow effect on hover */}
      <div className={`absolute -inset-px rounded-2xl bg-gradient-to-r ${config.gradient} opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-10`} />

      <div className="relative flex flex-col flex-1">
        {/* Header: icône + nom + secteur */}
        <div className="mb-4 flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${config.bgLight}`}>
            <Icon className={`h-6 w-6 ${config.textLight}`} />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {solution.name}
            </h3>
            <span className={`inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.pillBg} ${config.pillText}`}>
              {solution.sectorName}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="mb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">
          {solution.subheadline}
        </p>

        {/* Prix */}
        <div className="mb-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {solution.pricing.basePrice}€
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-500">/mois</span>
        </div>

        {solution.pricing.annualPrice && solution.pricing.annualPrice < solution.pricing.basePrice && (
          <div className="mb-1 flex items-center gap-2">
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
              {solution.pricing.annualPrice}€/mois en annuel
            </p>
            {solution.pricing.savings != null && solution.pricing.savings > 0 && (
              <span className="inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                -{solution.pricing.savings}%
              </span>
            )}
          </div>
        )}

        {/* Modules pills */}
        <div className="mt-auto pt-4 flex flex-wrap gap-1.5">
          {solution.modulesIncluded.map((mod) => (
            <span
              key={mod}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-white/5 dark:text-slate-400"
            >
              {mod}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
          En savoir plus
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

// ── Page principale ──

export default async function SolutionsIndexPage() {
  const solutions = await getAllSolutionsDynamic();

  const solutionsWithCategory = solutions.map((s) => ({
    ...s,
    _category: getSectorCategory(s.id),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/80 to-slate-950">
      <Header />

      {/* ── Hero section ── */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-32 sm:pb-24">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[100px]" />
          <div className="absolute right-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-violet-500/8 blur-[100px]" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-purple-500/5 blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-medium text-indigo-300">12 solutions métier</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              <span className="text-white">Des solutions pensées</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                pour votre métier
              </span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-400 sm:text-xl">
              Pas de modules à choisir, pas de configuration complexe. Chaque solution est un package clé en main adapté à votre secteur.
            </p>

            {/* Métriques inline */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-400" />
                <span>5 à 9 modules par solution</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-400" />
                <span>200+ entreprises équipées</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-pink-400" />
                <span>Déploiement en 24h</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#solutions"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-indigo-500/40 hover:brightness-110"
              >
                Explorer les solutions
                <ChevronRight className="h-4 w-4" />
              </a>
              <Link
                href="/tarifs"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
              >
                Voir les tarifs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Grille solutions avec filtre ── */}
      <section id="solutions" className="relative py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Choisissez votre solution
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-400">
              Solutions complètes et clés en main pour 12 secteurs d&apos;activité
            </p>
          </div>

          {/* Filtre catégories + Grille */}
          <SolutionsFilter categories={categories as unknown as string[]}>
            {solutionsWithCategory.map((solution) => (
              <div key={solution.id} data-category={solution._category}>
                <SolutionCard solution={solution} />
              </div>
            ))}
          </SolutionsFilter>
        </div>
      </section>

      {/* ── Section stats ── */}
      <section className="relative border-y border-white/5 py-16">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/50 via-purple-950/30 to-indigo-950/50" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: '12', label: 'Solutions métier' },
              { value: '200+', label: 'Clients actifs' },
              { value: '9', label: 'Modules max/solution' },
              { value: '24h', label: 'Mise en service' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent sm:text-4xl">
                  {stat.value}
                </div>
                <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="relative py-20 sm:py-28">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full bg-indigo-500/8 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-sm sm:p-14">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Vous ne trouvez pas votre secteur ?
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-400">
              Notre suite modulaire s&apos;adapte à tous les métiers. Composez votre solution sur mesure.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/tarifs"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-indigo-500/40 hover:brightness-110"
              >
                Configurer ma suite
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
              >
                Nous contacter
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
