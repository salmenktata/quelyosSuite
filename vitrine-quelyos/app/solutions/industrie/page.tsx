import { Metadata } from 'next';
import Link from 'next/link';
import { getSolutionDataDynamic } from '@/app/lib/solutions-data';
import PainPointsGrid from '@/app/components/solutions/PainPointsGrid';
import { FeaturesGrid } from '@/app/components/solutions/SolutionFeatureCard';
import { TestimonialsGrid } from '@/app/components/solutions/TestimonialCard';
import PackagePricing from '@/app/components/solutions/PackagePricing';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

const SECTOR_ID = 'industrie';

export const metadata: Metadata = {
  title: 'Quelyos Industrie - Solution GMAO et gestion industrielle',
  description: 'Optimisez votre production avec Quelyos Industrie. Maintenance préventive, stock pièces détachées, pilotage financier et gestion RH pour PME industrielles.',
  keywords: ['solution industrie', 'GMAO', 'maintenance préventive', 'gestion industrielle', 'ERP industrie', 'PME industrielle'],
  openGraph: {
    title: 'Quelyos Industrie - Solution GMAO et gestion industrielle',
    description: 'Optimisez votre production avec Quelyos Industrie. Maintenance préventive, stock pièces détachées, pilotage financier et gestion RH.',
    url: 'https://quelyos.com/solutions/industrie',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Quelyos Industrie' }],
  },
  alternates: { canonical: 'https://quelyos.com/solutions/industrie' },
};

export default async function IndustrieSolutionPage() {
  const solution = await getSolutionDataDynamic(SECTOR_ID);

  if (!solution) {
    return <div>Solution non trouvée</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0">
          <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
              {solution.headline}
            </h1>
            <p className="mt-6 text-xl leading-8 text-slate-600 dark:text-slate-400">
              {solution.valueProp}
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/50">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{solution.stats.clients}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Clients</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/50">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{solution.stats.timeSaved}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Temps gagné</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/50">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{solution.stats.precision}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Précision IA</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/50">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{solution.stats.mainMetric}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">ROI moyen</div>
              </div>
            </div>

            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href={`/contact?utm_source=solution&utm_package=${SECTOR_ID}`}
                className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Demander une démonstration
              </Link>
              <Link
                href="/tarifs"
                className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
              >
                Voir les tarifs
              </Link>
            </div>

            <p className="mt-6 text-sm text-slate-500 dark:text-slate-500">
              Essai gratuit 30 jours • Sans engagement • Support dédié
            </p>
          </div>
        </div>
      </section>

      <PainPointsGrid
        painPoints={solution.painPoints}
        title={`Les défis de l'industrie`}
        subtitle="Des problématiques que nous comprenons et auxquelles nous apportons des réponses concrètes"
        className="bg-slate-50 dark:bg-slate-900/50"
      />

      <FeaturesGrid
        features={solution.features}
        title={`Tout ce qu'il faut pour ${solution.verb}`}
        subtitle="Les outils essentiels des industriels qui réussissent"
      />

      <TestimonialsGrid
        testimonials={solution.testimonials}
        title={`Ce que disent les industriels`}
        subtitle="Découvrez comment ils ont transformé leur production"
        className="bg-slate-50 dark:bg-slate-900/50"
      />

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Tarif {solution.name}
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-400">
              Une solution complète à prix juste. Sans surprise.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl">
            <PackagePricing
              packageName={solution.name}
              sectorName={solution.sectorName}
              basePrice={solution.pricing.basePrice}
              annualPrice={solution.pricing.annualPrice}
              savings={solution.pricing.savings}
              features={solution.pricing.features}
              highlighted
            />
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              {`Prêt à transformer votre production ?`}
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400">
              Rejoignez {solution.stats.clients} industriels qui nous font confiance.
            </p>
            <div className="mt-10">
              <Link
                href={`/contact?utm_source=solution-cta&utm_package=${SECTOR_ID}`}
                className="inline-block rounded-lg bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Demander une démonstration
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
