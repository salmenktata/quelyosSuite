"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageSquare, MapPin, Clock, Send, CheckCircle } from "lucide-react";
import { logger } from "../lib/logger";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Container from "../components/Container";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In production, send to API
    logger.debug('Form submitted', {
      fields: Object.keys(formData) // Log uniquement les noms de champs, pas les valeurs
    });

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      <Header />

      {/* Hero */}
      <section className="relative py-20">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-white sm:text-5xl">Contactez-nous</h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
              Une question ? Un projet ? Nous sommes là pour vous accompagner.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Contact Info + Form */}
      <section className="relative py-12">
        <Container>
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-1"
            >
              <h2 className="mb-6 text-2xl font-bold text-white">Informations</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-indigo-500/20 p-3">
                    <Mail className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Email</h3>
                    <a href="mailto:contact@quelyos.com" className="text-slate-400 hover:text-white">
                      contact@quelyos.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-indigo-500/20 p-3">
                    <MessageSquare className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Support</h3>
                    <p className="text-slate-400">Réponse sous 24h ouvrées</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-indigo-500/20 p-3">
                    <MapPin className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Localisation</h3>
                    <p className="text-slate-400">Disponible / Nouveaux marchés</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-indigo-500/20 p-3">
                    <Clock className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Disponibilité</h3>
                    <p className="text-slate-400">Lun-Ven, 9h-18h (CET)</p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="mt-8">
                <h3 className="mb-4 font-medium text-white">Suivez-nous</h3>
                <div className="flex gap-4">
                  <a
                    href="https://linkedin.com/in/salmenktata"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-white/10 bg-slate-900/50 p-3 text-slate-400 transition-all hover:border-indigo-500/50 hover:text-white"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <a
                    href="https://github.com/salmenktata"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-white/10 bg-slate-900/50 p-3 text-slate-400 transition-all hover:border-indigo-500/50 hover:text-white"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-2"
            >
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-8 backdrop-blur-sm">
                {isSubmitted ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                      <CheckCircle className="h-8 w-8 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Message envoyé !</h3>
                    <p className="mt-2 text-slate-400">
                      Nous vous répondrons dans les plus brefs délais.
                    </p>
                    <button
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({ name: "", email: "", company: "", subject: "", message: "" });
                      }}
                      className="mt-6 text-indigo-400 hover:text-indigo-300"
                    >
                      Envoyer un autre message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-300">
                          Nom complet *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Jean Dupont"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="jean@entreprise.com"
                        />
                      </div>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="company" className="mb-2 block text-sm font-medium text-slate-300">
                          Entreprise
                        </label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Ma TPE"
                        />
                      </div>
                      <div>
                        <label htmlFor="subject" className="mb-2 block text-sm font-medium text-slate-300">
                          Sujet *
                        </label>
                        <select
                          id="subject"
                          name="subject"
                          required
                          value={formData.subject}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">Sélectionnez un sujet</option>
                          <option value="demo">Demande de démo</option>
                          <option value="finance">Question sur Finance</option>
                          <option value="marketing">Question sur Marketing</option>
                          <option value="tarifs">Question sur les tarifs</option>
                          <option value="partenariat">Proposition de partenariat</option>
                          <option value="autre">Autre</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="message" className="mb-2 block text-sm font-medium text-slate-300">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Décrivez votre demande..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 font-medium text-white transition-all hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          Envoyer le message
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* FAQ Quick */}
      <section className="relative py-20">
        <Container veryNarrow>
          <h2 className="mb-8 text-center text-2xl font-bold text-white">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              {
                q: "Quel est le délai de réponse ?",
                a: "Nous répondons généralement sous 24h ouvrées. Les demandes de démo sont traitées en priorité.",
              },
              {
                q: "Proposez-vous des démos personnalisées ?",
                a: "Oui ! Nous proposons des démos de 30 minutes adaptées à votre secteur d'activité et vos besoins spécifiques.",
              },
              {
                q: "Comment puis-je obtenir de l'aide technique ?",
                a: "Le support technique est accessible directement depuis l'application. Les clients Pro et Expert bénéficient d'un support prioritaire.",
              },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-white/10 bg-slate-900/50 p-6"
              >
                <h3 className="font-semibold text-white">{faq.q}</h3>
                <p className="mt-2 text-sm text-slate-400">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}
