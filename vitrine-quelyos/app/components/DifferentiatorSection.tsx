"use client";

import { Target } from "lucide-react";
import { Zap, Sparkles, TrendingUp, Shield, DollarSign } from "./Icons";
import Container from "./Container";

export default function DifferentiatorSection() {
  return (
    <section className="relative py-20">
      <Container>
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Une approche métier, pas technique
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Des solutions pensées pour votre activité, pas un ERP générique
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Target, title: "Solutions métier clés en main", desc: "Chaque solution est pensée pour votre secteur. Pas de fonctionnalités inutiles, que l'essentiel.", color: "text-indigo-400" },
            { icon: Zap, title: "Opérationnel en 1 heure", desc: "Import automatique, configuration guidée. Vous êtes productif dès le premier jour.", color: "text-purple-400" },
            { icon: Sparkles, title: "IA qui anticipe vos besoins", desc: "Prévisions trésorerie à 90%, suggestions de commandes, alertes proactives.", color: "text-emerald-400" },
            { icon: TrendingUp, title: "ROI mesurable", desc: "Nos clients gagnent en moyenne 10h/semaine et augmentent leur CA de 30%.", color: "text-blue-400" },
            { icon: Shield, title: "Sécurité & Conformité", desc: "Infrastructure sécurisée, support dédié, conformité RGPD garantie.", color: "text-cyan-400" },
            { icon: DollarSign, title: "Tarifs transparents", desc: "Un prix fixe par solution. Pas de surprise, pas de frais cachés.", color: "text-orange-400" },
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm"
            >
              <item.icon className={`mb-4 h-8 w-8 ${item.color}`} />
              <h3 className="mb-2 text-lg font-semibold text-white">{item.title}</h3>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
