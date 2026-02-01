"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "./Icons";
import Container from "./Container";

export default function CTASection() {
  return (
    <>
      {/* CTA milieu de page */}
      <section className="relative py-20">
        <Container>
          <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/50 to-violet-950/50 p-12 text-center backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Prêt à transformer votre activité ?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              Rejoignez les entrepreneurs qui ont choisi Quelyos pour piloter leur business.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/solutions"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-8 py-4 text-lg font-medium text-white transition-all hover:from-indigo-600 hover:to-indigo-700"
              >
                Découvrir les solutions
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-8 py-4 text-lg font-medium text-white transition-all hover:bg-white/10"
              >
                Nous contacter
              </Link>
            </div>
            <p className="mt-6 text-sm text-slate-400">
              Essai gratuit 30 jours • Sans carte bancaire • Support français
            </p>
          </div>
        </Container>
      </section>

      {/* CTA final */}
      <section className="relative py-20">
        <Container narrow>
          <div
            className="overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 to-purple-950/50 p-8 text-center backdrop-blur-sm sm:p-12"
          >
            <Sparkles className="mx-auto mb-6 h-12 w-12 text-indigo-400" />
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Simplifiez votre gestion dès aujourd&apos;hui
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
              30 jours d&apos;essai gratuit, sans engagement. Toutes les fonctionnalités incluses.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 font-medium text-white transition-all hover:from-indigo-600 hover:to-purple-700"
              >
                Essai gratuit 30 jours
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/tarifs"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-medium text-white transition-all hover:bg-white/10"
              >
                Voir les tarifs
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
