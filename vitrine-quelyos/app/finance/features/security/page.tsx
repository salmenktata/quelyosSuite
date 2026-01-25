"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Header from "@/app/components/Header";
import Container from "@/app/components/Container";
import {
  ArrowRight,
  Shield,
  Lock,
  Server,
  Key,
  Eye,
  CheckCircle2,
  FileCheck,
} from "lucide-react";

const features = [
  {
    icon: Lock,
    title: "Chiffrement AES-256",
    description: "Vos données sont chiffrées au repos et en transit.",
  },
  {
    icon: Server,
    title: "Hébergement France",
    description: "Serveurs localisés en France, conformes RGPD.",
  },
  {
    icon: Key,
    title: "Authentification 2FA",
    description: "Double authentification pour sécuriser votre compte.",
  },
  {
    icon: Eye,
    title: "Audit logs",
    description: "Traçabilité complète de toutes les actions.",
  },
  {
    icon: FileCheck,
    title: "Certifications",
    description: "ISO 27001, SOC 2 Type II en cours.",
  },
  {
    icon: Shield,
    title: "Tests de pénétration",
    description: "Audits de sécurité réguliers par des experts.",
  },
];

const certifications = [
  { name: "RGPD", status: "Conforme" },
  { name: "ISO 27001", status: "En cours" },
  { name: "SOC 2", status: "En cours" },
  { name: "HDS", status: "Planifié" },
];

export default function SecurityFeaturePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <section className="relative overflow-hidden pb-20 pt-16">
        <div className="pointer-events-none absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-emerald-500/15 blur-[120px]" />
        
        <Container className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
              <Shield size={16} />
              Sécurité
            </div>
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Vos données
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                notre priorité
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Nous appliquons les standards de sécurité les plus stricts 
              pour protéger vos données financières sensibles.
            </p>
          </motion.div>

          {/* Security badges */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-16"
          >
            <div className="mx-auto max-w-3xl">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {certifications.map((cert) => (
                  <div
                    key={cert.name}
                    className="rounded-xl border border-white/10 bg-slate-900/80 p-4 text-center"
                  >
                    <div className="mb-2 flex justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                        <CheckCircle2 className="text-emerald-400" size={24} />
                      </div>
                    </div>
                    <p className="font-semibold text-white">{cert.name}</p>
                    <p className="text-xs text-emerald-400">{cert.status}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      <section className="border-t border-white/5 py-24">
        <Container>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white">Protection multicouche</h2>
            <p className="mt-4 text-slate-400">
              Chaque aspect de votre sécurité est couvert.
            </p>
          </div>
          
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
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
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
          <h2 className="text-3xl font-bold text-white">Une question sur la sécurité ?</h2>
          <p className="mt-4 text-slate-400">
            Notre équipe est disponible pour répondre à toutes vos questions.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/finance/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-slate-900"
            >
              Contacter l&apos;équipe
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/finance/docs"
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-slate-300 ring-1 ring-white/10"
            >
              Documentation
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
