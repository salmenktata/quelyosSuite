import { Metadata } from 'next';
import Link from 'next/link';
import { getSolutionDataDynamic } from '@/app/lib/solutions-data';
import PainPointsGrid from '@/app/components/solutions/PainPointsGrid';
import { FeaturesGrid } from '@/app/components/solutions/SolutionFeatureCard';
import { TestimonialsGrid } from '@/app/components/solutions/TestimonialCard';
import PackagePricing from '@/app/components/solutions/PackagePricing';
import ProcessMetier from '@/app/components/solutions/ProcessMetier';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import {
  ArrowRight, Sparkles, Globe, Users, Clock, Brain,
  TrendingUp, ShoppingCart, Package, Wallet, Megaphone, Heart, Check
} from 'lucide-react';

const SECTOR_ID = 'ecommerce';

export const metadata: Metadata = {
  title: 'Quelyos Store - Solution complète e-commerce',
  description: 'Vendez en ligne professionnellement. Boutique, gestion stock, marketing : l\'écosystème complet pour réussir.',
  keywords: ['solution e-commerce', 'boutique en ligne', 'site e-commerce', 'gestion e-commerce', 'stock e-commerce', 'marketing e-commerce', 'vente en ligne'],
  openGraph: {
    title: 'Quelyos Store - Solution complète e-commerce',
    description: 'Vendez en ligne professionnellement. Boutique, gestion stock, marketing : l\'écosystème complet pour réussir.',
    url: 'https://quelyos.com/solutions/ecommerce',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Quelyos Store - Solution e-commerce complète' }],
  },
  alternates: { canonical: 'https://quelyos.com/solutions/ecommerce' },
};

const modules = [
  { icon: Globe, label: 'Boutique', color: 'text-cyan-400' },
  { icon: Package, label: 'Stock', color: 'text-emerald-400' },
  { icon: Megaphone, label: 'Marketing', color: 'text-pink-400' },
  { icon: Heart, label: 'CRM', color: 'text-violet-400' },
  { icon: Wallet, label: 'Finance', color: 'text-amber-400' },
];

const processSteps = [
  { title: 'Catalogue en ligne', description: 'Import produits, photos, variantes, SEO automatique. Votre boutique est en ligne en quelques clics.', icon: '🛍️' },
  { title: 'Commande & paiement', description: 'Panier optimisé, paiement sécurisé multi-devises, confirmation automatique et suivi commande.', icon: '💳' },
  { title: 'Expédition automatique', description: 'Bon de livraison généré, stock décrémenté, tracking envoyé au client. Tout est automatisé.', icon: '📦' },
  { title: 'Fidélisation & croissance', description: 'Paniers abandonnés, avis clients, campagnes email ciblées. Maximisez la valeur de chaque client.', icon: '🚀' },
];

export default async function EcommerceSolutionPage() {
  const solution = await getSolutionDataDynamic(SECTOR_ID);
  if (!solution) return <div>Solution non trouvée</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950">
      <Header />

      <section className="relative overflow-hidden py-24 sm:py-36">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-20 h-[500px] w-[500px] animate-pulse rounded-full bg-cyan-500/8 blur-3xl" />
          <div className="absolute right-10 top-40 h-[400px] w-[400px] animate-pulse rounded-full bg-violet-500/8 blur-3xl [animation-delay:1s]" />
          <div className="absolute left-1/3 bottom-10 h-[350px] w-[350px] animate-pulse rounded-full bg-emerald-500/6 blur-3xl [animation-delay:2s]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 backdrop-blur-sm">
              <ShoppingCart className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-300">Solution E-commerce Complète</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              <span className="text-white">Boostez votre </span>
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">e-commerce</span>
              <span className="text-white"> sans limites</span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-300 sm:text-xl">{solution.valueProp}</p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-2"><Users className="h-4 w-4 text-cyan-400" />300+ e-commerçants</span>
              <span className="flex items-center gap-2"><Brain className="h-4 w-4 text-violet-400" />IA intégrée</span>
              <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-emerald-400" />Opérationnel en 1h</span>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { value: solution.stats.clients, label: 'Clients', icon: Users, color: 'text-cyan-400' },
                { value: solution.stats.timeSaved, label: 'Temps gagné', icon: Clock, color: 'text-emerald-400' },
                { value: solution.stats.precision, label: 'Précision IA', icon: Brain, color: 'text-violet-400' },
                { value: solution.stats.mainMetric, label: 'ROI moyen', icon: TrendingUp, color: 'text-amber-400' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <stat.icon className={`mx-auto h-5 w-5 ${stat.color}`} />
                  <div className="mt-2 text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={`/contact?utm_source=solution&utm_package=${SECTOR_ID}`} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40">
                Demander une démonstration <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/tarifs" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10">Voir les tarifs</Link>
            </div>

            <p className="mt-6 text-sm text-slate-400">Essai gratuit 30 jours • Sans engagement • Support dédié</p>
          </div>
        </div>
      </section>

      <section className="relative py-8">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm">
            <p className="mb-4 text-center text-sm font-medium uppercase tracking-wider text-slate-400">Modules inclus</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {modules.map((mod) => (
                <div key={mod.label} className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                  <mod.icon className={`h-5 w-5 flex-shrink-0 ${mod.color}`} />
                  <span className="text-sm font-medium text-white">{mod.label}</span>
                  <Check className="ml-auto h-4 w-4 flex-shrink-0 text-emerald-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PainPointsGrid painPoints={solution.painPoints} title={`Les défis de l'e-commerce`} subtitle="Des problématiques que nous comprenons et auxquelles nous apportons des réponses concrètes" className="bg-slate-950/50" />
      <FeaturesGrid features={solution.features} title={`Tout ce qu'il faut pour ${solution.verb}`} subtitle="Les outils essentiels des e-commerçants qui réussissent" />
      <ProcessMetier steps={processSteps} title="Comment ça fonctionne au quotidien" subtitle="Du catalogue à la fidélisation, un flux e-commerce automatisé" className="bg-slate-950/50" />
      <TestimonialsGrid testimonials={solution.testimonials} title="Ce que disent les e-commerçants" subtitle="Découvrez comment ils ont transformé leur boutique en ligne" className="bg-slate-950/30" />

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Tarif {solution.name}</h2>
            <p className="mt-4 text-lg leading-8 text-slate-400">Une solution complète à prix juste. Sans surprise.</p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl">
            <PackagePricing packageName={solution.name} sectorName={solution.sectorName} basePrice={solution.pricing.basePrice} annualPrice={solution.pricing.annualPrice} savings={solution.pricing.savings} features={solution.pricing.features} highlighted />
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/50 to-blue-950/50 p-12 text-center backdrop-blur-sm sm:p-16">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10">
              <Sparkles className="h-7 w-7 text-cyan-400" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Prêt à booster vos ventes en ligne ?</h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">Rejoignez {solution.stats.clients} e-commerçants qui nous font confiance.</p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={`/contact?utm_source=solution-cta&utm_package=${SECTOR_ID}`} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40">
                Demander une démonstration <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/tarifs" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10">Voir les tarifs</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
