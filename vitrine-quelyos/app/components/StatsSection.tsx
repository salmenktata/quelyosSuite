"use client";

import { Layers, Sparkles, RefreshCw, MapPin } from "./Icons";
import Container from "./Container";

export default function StatsSection() {
  return (
    <section className="relative border-y border-white/10 bg-slate-900/50 py-16">
      <Container>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {[
            { label: "Solutions intégrées", value: "8", icon: Layers },
            { label: "Fonctionnalités", value: "+250", icon: Sparkles },
            { label: "Prévisions IA", value: "90j", icon: RefreshCw },
            { label: "Hébergement", value: "Sécurisé", icon: MapPin },
          ].map((stat, i) => (
            <div
              key={i}
              className="text-center"
            >
              <stat.icon className="mx-auto mb-3 h-8 w-8 text-indigo-400" />
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
