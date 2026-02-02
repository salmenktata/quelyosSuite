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
  ArrowRight, Sparkles, Wrench, Users, Clock, Brain,
  TrendingUp, FileText, Package, Wallet, HardHat, Check
} from 'lucide-react';

const SECTOR_ID = 'btp';

export const metadata: Metadata = {
  title: 'Quelyos Build - Solution pour artisans et BTP',
  description: 'Du devis au chantier, tout sous contrôle. Devis, interventions, matériaux : solution artisans.',
  keywords: ['solution BTP', 'gestion chantiers', 'logiciel artisan', 'devis BTP', 'stock matériel', 'trésorerie BTP', 'planning chantiers'],
  openGraph: {
    title: 'Quelyos Build - Solution pour artisans et BTP',
    description: 'Du devis au chantier, tout sous contrôle. Devis, interventions, matériaux : solution artisans.',
    url: 'https://quelyos.com/solutions/btp',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Quelyos Build - Solution BTP complète' }],
  },
  alternates: { canonical: 'https://quelyos.com/solutions/btp' },
};

const modules = [
  { icon: FileText, label: 'Devis', color: 'text-indigo-400' },
  { icon: HardHat, label: 'Chantiers', color: 'text-amber-400' },
  { icon: Package, label: 'Stock', color: 'text-emerald-400' },
  { icon: Wallet, label: 'Finance', color: 'text-pink-400' },
  { icon: Users, label: 'RH', color: 'text-violet-400' },
];

const processSteps = [
  { title: 'Devis en 2 clics', description: 'Bibliothèque de prestations, calcul automatique des marges, envoi par email avec signature électronique.', icon: '📝' },
  { title: 'Planification chantier', description: 'Planning visuel des équipes, affectation matériel, suivi des heures en temps réel sur le terrain.', icon: '📅' },
  { title: 'Suivi matériaux', description: 'Stock décrémenté automatiquement par chantier. Alertes réapprovisionnement et suivi des coûts matière.', icon: '🧱' },
  { title: 'Facturation & trésorerie', description: 'Facture générée depuis le devis validé. Suivi des paiements, relances et trésorerie prévisionnelle.', icon: '💰' },
];

export default async function BtpSolutionPage() {
  const solution = await getSolutionDataDynamic(SECTOR_ID);
  if (!solution) return <div>Solution non trouvée</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950">
      <Header />

      <section className="relative overflow-hidden py-24 sm:py-36">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-20 h-[500px] w-[500px] animate-pulse rounded-full bg-amber-500/8 blur-3xl" />
          <div className="absolute right-10 top-40 h-[400px] w-[400px] animate-pulse rounded-full bg-indigo-500/8 blur-3xl [animation-delay:1s]" />
          <div className="absolute left-1/3 bottom-10 h-[350px] w-[350px] animate-pulse rounded-full bg-emerald-500/6 blur-3xl [animation-delay:2s]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 backdrop-blur-sm">
              <Wrench className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-300">Solution BTP Complète</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              <span className="text-white">Maîtrisez vos </span>
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">chantiers</span>
              <span className="text-white"> de A à Z</span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-300 sm:text-xl">{solution.valueProp}</p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-2"><Users className="h-4 w-4 text-amber-400" />180+ artisans</span>
              <span className="flex items-center gap-2"><Brain className="h-4 w-4 text-violet-400" />IA intégrée</span>
              <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-emerald-400" />Opérationnel en 1h</span>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { value: solution.stats.clients, label: 'Clients', icon: Users, color: 'text-amber-400' },
                { value: solution.stats.timeSaved, label: 'Temps gagné', icon: Clock, color: 'text-emerald-400' },
                { value: solution.stats.precision, label: 'Précision IA', icon: Brain, color: 'text-violet-400' },
                { value: solution.stats.mainMetric, label: 'ROI moyen', icon: TrendingUp, color: 'text-indigo-400' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <stat.icon className={`mx-auto h-5 w-5 ${stat.color}`} />
                  <div className="mt-2 text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={`/contact?utm_source=solution&utm_package=${SECTOR_ID}`} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:shadow-amber-500/40">
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

      <PainPointsGrid painPoints={solution.painPoints} title={`Les défis du BTP et de l'artisanat`} subtitle="Des problématiques que nous comprenons et auxquelles nous apportons des réponses concrètes" className="bg-slate-950/50" />

      <FeaturesGrid features={solution.features} title={`Tout ce qu'il faut pour ${solution.verb}`} subtitle="Les outils essentiels des artisans et professionnels du BTP" />

      <ProcessMetier steps={processSteps} title="Comment ça fonctionne au quotidien" subtitle="Du devis à la facturation, un flux entièrement automatisé" className="bg-slate-950/50" />

      <TestimonialsGrid testimonials={solution.testimonials} title={`Ce que disent les ${solution.sectorName.toLowerCase()}`} subtitle="Découvrez comment ils ont transformé leur activité" className="bg-slate-950/30" />

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
          <div className="mx-auto max-w-3xl rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-950/50 to-orange-950/50 p-12 text-center backdrop-blur-sm sm:p-16">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
              <Sparkles className="h-7 w-7 text-amber-400" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Prêt à transformer vos chantiers ?</h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">Rejoignez {solution.stats.clients} artisans et professionnels du BTP qui nous font confiance.</p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={`/contact?utm_source=solution-cta&utm_package=${SECTOR_ID}`} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:shadow-amber-500/40">
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
