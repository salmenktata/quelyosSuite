import { Metadata } from 'next';
import Link from 'next/link';
import { getAllSolutionsDynamic } from '@/app/lib/solutions-data';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

export const metadata: Metadata = {
  title: 'Solutions métier Quelyos - Par secteur d\'activité',
  description: 'Découvrez nos 12 solutions complètes par métier : restauration, commerce, e-commerce, services, santé, BTP, hôtellerie, associations, industrie, immobilier, formation, logistique.',
};

export default async function SolutionsIndexPage() {
  const solutions = await getAllSolutionsDynamic();

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
              Des solutions métier qui s&apos;adaptent à votre activité
            </h1>
            <p className="mt-6 text-xl leading-8 text-slate-600 dark:text-slate-400">
              Chaque solution est pensée pour votre secteur. Pas de modules à choisir, des packages clés en main.
            </p>
          </div>
        </div>
      </section>

      {/* Grid solutions */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Choisissez votre solution métier
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-400">
              Solutions complètes et clés en main pour 12 secteurs d&apos;activité
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {solutions.map((solution) => (
              <Link
                key={solution.id}
                href={`/solutions/${solution.id}`}
                className="group relative rounded-2xl border border-slate-200/60 bg-white p-8 transition-all hover:border-indigo-500/20 hover:shadow-lg dark:border-slate-700/50 dark:bg-slate-900/50 dark:hover:border-indigo-500/30"
              >
                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {solution.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {solution.sectorName}
                  </p>
                </div>

                {/* Value prop */}
                <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {solution.subheadline}
                </p>

                {/* Prix */}
                <div className="mb-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {solution.pricing.basePrice}€
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">/mois</span>
                </div>

                {/* Prix annuel */}
                {solution.pricing.annualPrice && solution.pricing.annualPrice < solution.pricing.basePrice && (
                  <p className="mb-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    ou {solution.pricing.annualPrice}€/mois en annuel
                  </p>
                )}

                {/* Économies */}
                {solution.pricing.savings != null && solution.pricing.savings > 0 && (
                  <div className="mb-4">
                    <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      -{solution.pricing.savings}% vs modules séparés
                    </span>
                  </div>
                )}

                {/* Modules inclus */}
                <div className="mb-6 text-xs text-slate-500 dark:text-slate-500">
                  {solution.modulesIncluded.join(' • ')}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 group-hover:text-indigo-500 dark:text-indigo-400">
                  En savoir plus
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Vous ne trouvez pas votre secteur ?
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400">
              Notre suite modulaire s&apos;adapte à tous les métiers. Composez votre solution sur mesure.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/tarifs"
                className="inline-block rounded-lg bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Configurer ma suite
              </Link>
              <Link
                href="/contact"
                className="inline-block rounded-lg border border-slate-300 bg-white px-8 py-4 text-base font-semibold text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
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
