import { Metadata } from 'next';
import Link from 'next/link';
import { getSolutionData } from '@/app/lib/solutions-data';
import PainPointsGrid from '@/app/components/solutions/PainPointsGrid';
import { FeaturesGrid } from '@/app/components/solutions/SolutionFeatureCard';
import { TestimonialsGrid } from '@/app/components/solutions/TestimonialCard';
import PackagePricing from '@/app/components/solutions/PackagePricing';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

const SECTOR_ID = 'services';

export const metadata: Metadata = {
  title: 'Quelyos Pro - Solution pour agences et services B2B',
  description: 'Concentrez-vous sur vos clients, pas sur l\'administratif. CRM, facturation, trésorerie : pilotage métier simplifié.',
  keywords: ['solution services B2B', 'gestion agence', 'CRM services', 'facturation services', 'trésorerie B2B', 'gestion projets'],
  openGraph: {
    title: 'Quelyos Pro - Solution pour agences et services B2B',
    description: 'Concentrez-vous sur vos clients, pas sur l\'administratif. CRM, facturation, trésorerie : pilotage métier simplifié.',
    url: 'https://quelyos.com/solutions/services',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Quelyos Pro - Solution services B2B complète' }],
  },
  alternates: { canonical: 'https://quelyos.com/solutions/services' },
};

export default function ServicesSolutionPage() {
  const solution = getSolutionData(SECTOR_ID);
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
              {[{ label: 'Clients', value: solution.stats.clients }, { label: 'Temps gagné', value: solution.stats.timeSaved }, { label: 'Précision IA', value: solution.stats.precision }, { label: 'ROI moyen', value: solution.stats.mainMetric }].map((stat, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/50">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stat.value}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-10 flex gap-4 justify-center">
              <Link href="/contact?utm_source=solution&utm_package=services" className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500">Demander une démonstration</Link>
              <Link href="/tarifs" className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white">Voir les tarifs</Link>
            </div>
          </div>
        </div>
      </section>
      <PainPointsGrid painPoints={solution.painPoints} title="Les défis des agences et services B2B" className="bg-slate-50 dark:bg-slate-900/50" />
      <FeaturesGrid features={solution.features} title={`Tout ce qu'il faut pour ${solution.verb}`} />
      <TestimonialsGrid testimonials={solution.testimonials} title="Ce que disent les professionnels" className="bg-slate-50 dark:bg-slate-900/50" />
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto mt-16 max-w-2xl"><PackagePricing packageName={solution.name} sectorName={solution.sectorName} basePrice={solution.pricing.basePrice} features={solution.pricing.features} highlighted /></div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
