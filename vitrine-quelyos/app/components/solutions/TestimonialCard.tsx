/**
 * Composant carte témoignage client
 * Design sobre et premium
 */

import type { Testimonial } from '@/app/lib/solutions-data';

interface TestimonialCardProps {
  testimonial: Testimonial;
  className?: string;
}

export default function TestimonialCard({ testimonial, className = "" }: TestimonialCardProps) {
  return (
    <div
      className={`group relative rounded-2xl border border-slate-700/50 bg-slate-900/50 p-8 transition-all hover:border-indigo-500/30 hover:shadow-lg ${className}`}
    >
      {/* Citation */}
      <div className="mb-6">
        <svg className="mb-4 h-8 w-8 text-indigo-900/40" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
        <blockquote className="text-base leading-relaxed text-slate-300">
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>
      </div>

      {/* Auteur */}
      <div className="flex items-start justify-between gap-4 border-t border-slate-800 pt-6">
        <div className="flex-1">
          <div className="font-semibold text-white">
            {testimonial.author}
          </div>
          <div className="text-sm text-slate-400">
            {testimonial.role}
          </div>
          <div className="mt-1 text-sm text-slate-400">
            {testimonial.company}, {testimonial.location}
          </div>
        </div>

        {/* ROI metric badge */}
        <div className="flex-shrink-0">
          <div className="rounded-lg bg-gradient-to-br from-emerald-950/30 to-teal-950/30 px-3 py-2 text-center">
            <div className="text-xs font-medium text-emerald-400">
              ROI
            </div>
            <div className="mt-1 text-sm font-bold text-emerald-100">
              {testimonial.metric}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TestimonialsGridProps {
  testimonials: Testimonial[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export function TestimonialsGrid({
  testimonials,
  title = "Ce que disent nos clients",
  subtitle = "Découvrez comment ils ont transformé leur activité",
  className = ""
}: TestimonialsGridProps) {
  return (
    <section className={`py-20 ${className}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg leading-8 text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        {/* Grid testimonials */}
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 xl:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
