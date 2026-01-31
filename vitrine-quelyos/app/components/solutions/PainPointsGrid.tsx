/**
 * Composant d'affichage des pain points métier
 * Affiche les problèmes courants et leurs solutions
 */

import type { PainPoint } from '@/app/lib/solutions-data';

interface PainPointsGridProps {
  painPoints: PainPoint[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function PainPointsGrid({
  painPoints,
  title = "Les défis de votre métier",
  subtitle = "Des problématiques que nous comprenons et auxquelles nous apportons des réponses concrètes",
  className = ""
}: PainPointsGridProps) {
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

        {/* Grid pain points */}
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 xl:grid-cols-3">
          {painPoints.map((painPoint, index) => (
            <div
              key={index}
              className="group relative rounded-2xl border border-slate-200/60 bg-white p-8 transition-all hover:border-emerald-500/20 hover:shadow-lg dark:border-slate-700/50 dark:bg-slate-900/50 dark:hover:border-emerald-500/30"
            >
              {/* Problème */}
              <div className="mb-4">
                <div className="mb-2 flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
                    <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <h3 className="flex-1 text-base font-semibold leading-tight text-slate-900 dark:text-white">
                    {painPoint.problem}
                  </h3>
                </div>
              </div>

              {/* Solution */}
              <div className="flex items-start gap-3 rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950/20">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="flex-1 text-sm leading-relaxed text-emerald-900 dark:text-emerald-100">
                  {painPoint.solution}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
