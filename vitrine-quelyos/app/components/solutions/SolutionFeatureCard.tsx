/**
 * Composant carte feature avec bénéfice métier
 * Design sobre et premium
 */

import type { Feature } from '@/app/lib/solutions-data';

interface SolutionFeatureCardProps {
  feature: Feature;
  className?: string;
}

export default function SolutionFeatureCard({ feature, className = "" }: SolutionFeatureCardProps) {
  return (
    <div
      className={`group relative rounded-2xl border border-slate-200/60 bg-white p-8 transition-all hover:border-indigo-500/20 hover:shadow-lg dark:border-slate-700/50 dark:bg-slate-900/50 dark:hover:border-indigo-500/30 ${className}`}
    >
      {/* Icon */}
      <div className="mb-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 text-3xl transition-transform group-hover:scale-110 dark:from-indigo-950/40 dark:to-violet-950/40">
          {feature.icon}
        </div>
      </div>

      {/* Titre */}
      <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
        {feature.title}
      </h3>

      {/* Description */}
      <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {feature.description}
      </p>

      {/* Bénéfice métier (badge) */}
      <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:from-emerald-950/30 dark:to-teal-950/30 dark:text-emerald-400">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
        {feature.benefit}
      </div>
    </div>
  );
}

interface FeaturesGridProps {
  features: Feature[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export function FeaturesGrid({
  features,
  title = "Une solution complète pour votre métier",
  subtitle = "Tous les outils essentiels pour piloter efficacement votre activité",
  className = ""
}: FeaturesGridProps) {
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

        {/* Grid features */}
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => (
            <SolutionFeatureCard key={index} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
