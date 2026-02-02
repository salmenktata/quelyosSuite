import { Metadata } from 'next';
import Link from 'next/link';
import { getSolutionDataDynamic } from '@/app/lib/solutions-data';
import PainPointsGrid from '@/app/components/solutions/PainPointsGrid';
import { FeaturesGrid } from '@/app/components/solutions/SolutionFeatureCard';
import { TestimonialsGrid } from '@/app/components/solutions/TestimonialCard';
import PackagePricing from '@/app/components/solutions/PackagePricing';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

const SECTOR_ID = 'associations';

export const metadata: Metadata = {
  title: 'Quelyos Club - Solution pour associations',
  description: 'Animez votre communauté sans vous noyer dans l\'admin. Adhérents, cotisations, événements : solution associative.',
  keywords: ['solution association', 'gestion association', 'logiciel association', 'membres association', 'cotisations', 'comptabilité association'],
  openGraph: {
    title: 'Quelyos Club - Solution pour associations',
    description: 'Animez votre communauté sans vous noyer dans l\'admin. Adhérents, cotisations, événements : solution associative.',
    url: 'https://quelyos.com/solutions/associations',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Quelyos Club - Solution associations complète' }],
  },
  alternates: { canonical: 'https://quelyos.com/solutions/associations' },
};

export default async function AssociationsSolutionPage() {
  const solution = await getSolutionDataDynamic(SECTOR_ID);
  if (!solution) return <div>Solution non trouvée</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header />
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white sm:text-6xl">{solution.headline}</h1>
            <p className="mt-6 text-xl text-slate-600 dark:text-slate-400">{solution.valueProp}</p>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[{ label: 'Clients', value: solution.stats.clients }, { label: 'Temps gagné', value: solution.stats.timeSaved }, { label: 'Précision', value: solution.stats.precision }, { label: 'ROI', value: solution.stats.mainMetric }].map((stat, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/50">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stat.value}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-10"><Link href="/contact?utm_source=solution&utm_package=associations" className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500">Demander une démonstration</Link></div>
          </div>
        </div>
      </section>
      <PainPointsGrid painPoints={solution.painPoints} className="bg-slate-50 dark:bg-slate-900/50" />
      <FeaturesGrid features={solution.features} title={`Tout ce qu'il faut pour ${solution.verb}`} />
      <TestimonialsGrid testimonials={solution.testimonials} className="bg-slate-50 dark:bg-slate-900/50" />
      <section className="py-20"><div className="mx-auto max-w-7xl px-6 lg:px-8"><div className="mx-auto mt-16 max-w-2xl"><PackagePricing packageName={solution.name} sectorName={solution.sectorName} basePrice={solution.pricing.basePrice} annualPrice={solution.pricing.annualPrice} savings={solution.pricing.savings} features={solution.pricing.features} highlighted /></div></div></section>
      <Footer />
    </div>
  );
}
