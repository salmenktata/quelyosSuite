/**
 * Composant carte pricing pour package sectoriel
 * Design sobre et premium
 */

import Link from 'next/link';

interface PackagePricingProps {
  packageName: string;
  sectorName: string;
  basePrice: number;
  annualPrice?: number;
  savings?: number;
  features: string[];
  highlighted?: boolean;
  className?: string;
}

export default function PackagePricing({
  packageName,
  sectorName,
  basePrice,
  annualPrice,
  savings,
  features,
  highlighted = false,
  className = ""
}: PackagePricingProps) {
  return (
    <div
      className={`relative rounded-3xl p-8 shadow-lg transition-all ${
        highlighted
          ? 'border-2 border-indigo-500 bg-gradient-to-br from-indigo-50 to-violet-50 dark:border-indigo-500 dark:from-indigo-950/30 dark:to-violet-950/30'
          : 'border border-slate-200/60 bg-white dark:border-slate-700/50 dark:bg-slate-900/50'
      } ${className}`}
    >
      {highlighted && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            Populaire
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 text-center">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
          {packageName}
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Solution {sectorName}
        </p>
      </div>

      {/* Prix */}
      <div className="mb-8 text-center">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            {basePrice}€
          </span>
          <span className="text-lg font-medium text-slate-600 dark:text-slate-400">
            /mois
          </span>
        </div>
        {annualPrice && annualPrice < basePrice && (
          <p className="mt-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
            ou {annualPrice}€/mois en annuel
          </p>
        )}
        {savings != null && savings > 0 && (
          <span className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Économisez {savings}% vs modules séparés
          </span>
        )}
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">
          Hors taxes • Plan de base (9€/mois) inclus
        </p>
      </div>

      {/* Features */}
      <ul className="mb-8 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="space-y-3">
        <Link
          href="/contact?utm_source=pricing&utm_package=solution"
          className={`block w-full rounded-lg px-6 py-3 text-center text-sm font-semibold transition-all ${
            highlighted
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl'
              : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
          }`}
        >
          Demander une démonstration
        </Link>
        <p className="text-center text-xs text-slate-500 dark:text-slate-500">
          Essai gratuit 30 jours • Sans engagement
        </p>
      </div>
    </div>
  );
}

interface PackagePricingGridProps {
  packages: Array<{
    packageName: string;
    sectorName: string;
    basePrice: number;
    features: string[];
    highlighted?: boolean;
  }>;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function PackagePricingGrid({
  packages,
  title = "Tarifs transparents",
  subtitle = "Des solutions complètes à prix juste. Sans surprise.",
  className = ""
}: PackagePricingGridProps) {
  return (
    <section className={`py-20 ${className}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        {/* Grid packages */}
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {packages.map((pkg, index) => (
            <PackagePricing key={index} {...pkg} />
          ))}
        </div>

        {/* Garanties */}
        <div className="mx-auto mt-12 max-w-2xl text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Support dédié</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Données hébergées de manière sécurisée</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Conformité RGPD garantie</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
