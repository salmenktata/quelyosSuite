"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/app/components/Header";
import Container from "@/app/components/Container";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
} from "lucide-react";

const contactMethods = [
  {
    icon: Mail,
    title: "Email",
    description: "Notre équipe répond sous 24h",
    value: "contact@quelyos.fr",
    href: "mailto:contact@quelyos.fr",
  },
  {
    icon: Phone,
    title: "Téléphone",
    description: "Lun-Ven 9h-18h",
    value: "01 23 45 67 89",
    href: "tel:+33123456789",
  },
  {
    icon: MessageSquare,
    title: "Chat",
    description: "Assistance en direct",
    value: "Ouvrir le chat",
    href: "#",
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <section className="relative overflow-hidden pb-20 pt-16">
        <div className="pointer-events-none absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/15 blur-[120px]" />
        
        <Container className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Contactez-nous
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Une question ? Un projet ? Notre équipe est là pour vous accompagner.
            </p>
          </motion.div>

          {/* Contact methods */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-16"
          >
            <div className="mx-auto max-w-4xl">
              <div className="grid gap-4 sm:grid-cols-3">
                {contactMethods.map((method) => (
                  <a
                    key={method.title}
                    href={method.href}
                    className="rounded-xl border border-white/10 bg-slate-900/80 p-6 text-center transition-colors hover:border-indigo-500/30"
                  >
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
                      <method.icon size={24} />
                    </div>
                    <p className="font-semibold text-white">{method.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{method.description}</p>
                    <p className="mt-2 text-sm text-indigo-400">{method.value}</p>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Contact form */}
      <section className="border-t border-white/5 py-24">
        <Container veryNarrow>
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-12 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="text-emerald-400" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white">Message envoyé !</h2>
              <p className="mt-2 text-slate-400">
                Nous vous répondrons dans les plus brefs délais.
              </p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onSubmit={handleSubmit}
              className="rounded-xl border border-white/10 bg-slate-900/80 p-8"
            >
              <h2 className="mb-6 text-xl font-bold text-white">
                Envoyez-nous un message
              </h2>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    placeholder="Jean Dupont"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    placeholder="jean@entreprise.fr"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Entreprise
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    placeholder="Votre entreprise"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Sujet *
                  </label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="demo">Demande de démo</option>
                    <option value="support">Support technique</option>
                    <option value="sales">Question commerciale</option>
                    <option value="partnership">Partenariat</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Message *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="Décrivez votre demande..."
                />
              </div>

              <button
                type="submit"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-slate-900 transition-all hover:-translate-y-0.5"
              >
                <Send size={16} />
                Envoyer
              </button>
            </motion.form>
          )}
        </Container>
      </section>

      {/* Location */}
      <section className="border-t border-white/5 py-24">
        <Container narrow className="text-center">
          <MapPin className="mx-auto mb-4 text-indigo-400" size={32} />
          <h2 className="text-2xl font-bold text-white">Nos bureaux</h2>
          <p className="mt-4 text-slate-400">
            12 Rue de la Finance<br />
            75008 Paris, France
          </p>
          <p className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Clock size={14} />
            Lun-Ven 9h-18h
          </p>
        </Container>
      </section>
    </div>
  );
}
