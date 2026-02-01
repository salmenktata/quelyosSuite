"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Header from "@/app/components/Header";
import Container from "@/app/components/Container";
import {
  ArrowRight,
  FileText,
  Download,
  Calendar,
  BarChart3,
  Table,
  Send,
} from "lucide-react";

import config from "@/app/lib/config";
const features = [
  {
    icon: BarChart3,
    title: "Rapports visuels",
    description: "Graphiques et tableaux clairs et professionnels.",
  },
  {
    icon: Download,
    title: "Multi-formats",
    description: "Exportez en PDF, Excel, CSV ou directement vers votre comptable.",
  },
  {
    icon: Calendar,
    title: "Périodes flexibles",
    description: "Générez des rapports sur la période de votre choix.",
  },
  {
    icon: Table,
    title: "Personnalisables",
    description: "Choisissez les données à inclure dans vos rapports.",
  },
  {
    icon: Send,
    title: "Envoi automatique",
    description: "Programmez l'envoi mensuel à votre expert-comptable.",
  },
  {
    icon: FileText,
    title: "Conformité comptable",
    description: "Formats compatibles avec les normes comptables standards.",
  },
];

const reports = [
  { name: "Bilan mensuel", date: "Janvier 2026", status: "ready" },
  { name: "Compte de résultat", date: "T4 2025", status: "ready" },
  { name: "Détail TVA", date: "Décembre 2025", status: "ready" },
  { name: "Prévisionnel", date: "2026", status: "generating" },
];

export default function ReportsFeaturePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <section className="relative overflow-hidden pb-20 pt-16">
        <div className="pointer-events-none absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-blue-500/15 blur-[120px]" />
        
        <Container className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
              <FileText size={16} />
              Rapports & Exports
            </div>
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Rapports professionnels
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                en un clic
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Générez des rapports comptables et financiers prêts à partager 
              avec votre expert-comptable ou vos associés.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href={config.finance.register}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:-translate-y-0.5"
              >
                Générer un rapport
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>

          {/* Reports Demo */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-16"
          >
            <div className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-white/10 bg-slate-900/80 shadow-2xl">
              <div className="border-b border-white/5 p-4">
                <h3 className="font-semibold text-white">Rapports disponibles</h3>
              </div>
              <div className="divide-y divide-white/5">
                {reports.map((report) => (
                  <div key={report.name} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-blue-400" />
                      <div>
                        <p className="font-medium text-white">{report.name}</p>
                        <p className="text-xs text-slate-500">{report.date}</p>
                      </div>
                    </div>
                    {report.status === "ready" ? (
                      <button className="flex items-center gap-1 rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400">
                        <Download size={14} />
                        Télécharger
                      </button>
                    ) : (
                      <span className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400">
                        En cours...
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      <section className="border-t border-white/5 py-24">
        <Container>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <feature.icon size={20} />
                </div>
                <h3 className="font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-white/5 py-24">
        <Container narrow className="text-center">
          <h2 className="text-3xl font-bold text-white">Simplifiez votre comptabilité</h2>
          <div className="mt-8">
            <Link
              href={config.finance.register}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-slate-900"
            >
              Commencer gratuitement
              <ArrowRight size={16} />
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}