"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  HelpCircle,
  ChevronDown,
  Search,
  ExternalLink,
  MessageCircle,
  Headphones,
  BookOpen,
  ArrowRight,
  X,
  Sparkles,
  Zap,
  Shield,
  CreditCard,
  Settings,
  Users,
  FileText,
  BarChart3,
} from "lucide-react";

// Discord SVG Icon
const DiscordIcon = ({ size = 24 }: { size?: number }) => (
  <svg
    className={`h-${size === 24 ? 6 : 5} w-${size === 24 ? 6 : 5}`}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

type ContactMethod = {
  icon: React.ComponentType<React.ComponentPropsWithoutRef<"svg">>;
  title: string;
  description: string;
  value: string;
  href: string;
  color: string;
  external?: boolean;
};

// Contact methods
const contactMethods: ContactMethod[] = [
  {
    icon: Mail,
    title: "Email Support",
    description: "Réponse sous 24h ouvrées",
    value: "support@quelyos.com",
    href: "mailto:support@quelyos.com",
    color: "indigo",
  },
  {
    icon: DiscordIcon,
    title: "Communauté Discord",
    description: "Échangez avec d'autres utilisateurs",
    value: "Rejoindre le serveur",
    href: "https://discord.gg/quelyos",
    color: "violet",
    external: true,
  },
  {
    icon: Headphones,
    title: "Support Premium",
    description: "Assistance prioritaire Pro/Expert",
    value: "Contacter",
    href: "#premium-support",
    color: "amber",
  },
];

// Quick links
const quickLinks = [
  {
    icon: BookOpen,
    title: "Documentation",
    description: "Guides et tutoriels complets",
    href: "/docs",
  },
  {
    icon: BarChart3,
    title: "Status des services",
    description: "Disponibilité en temps réel",
    href: "https://status.quelyos.com",
    external: true,
  },
  {
    icon: FileText,
    title: "Notes de version",
    description: "Dernières mises à jour",
    href: "/docs/changelog",
  },
];

// FAQ Categories
const faqCategories = [
  { id: "getting-started", label: "Démarrage", icon: Zap },
  { id: "account", label: "Compte", icon: Settings },
  { id: "billing", label: "Facturation", icon: CreditCard },
  { id: "features", label: "Fonctionnalités", icon: Sparkles },
  { id: "security", label: "Sécurité", icon: Shield },
  { id: "team", label: "Équipe", icon: Users },
];

// FAQ Data enrichie
const faqs = [
  // Démarrage
  {
    category: "getting-started",
    question: "Comment créer un compte Quelyos ?",
    answer:
      "Cliquez sur 'Commencer gratuitement' en haut de la page. Renseignez votre email, créez un mot de passe sécurisé, et confirmez votre email. Vous serez guidé étape par étape pour configurer votre première entreprise et vos comptes bancaires.",
  },
  {
    category: "getting-started",
    question: "Combien de temps faut-il pour configurer Quelyos ?",
    answer:
      "La configuration initiale prend environ 5-10 minutes. Créez votre compte (2 min), ajoutez vos comptes bancaires (3 min), et configurez vos premières catégories (5 min). Notre assistant d'onboarding vous guide à chaque étape.",
  },
  {
    category: "getting-started",
    question: "Puis-je tester Quelyos avant de m'engager ?",
    answer:
      "Absolument ! Nous proposons un compte de démonstration avec des données fictives pour explorer toutes les fonctionnalités. De plus, le plan Freemium est gratuit à vie pour les fonctionnalités de base.",
  },
  {
    category: "getting-started",
    question: "Quelyos est-il adapté aux auto-entrepreneurs ?",
    answer:
      "Oui ! Quelyos est conçu pour tous les types d'entreprises françaises : auto-entrepreneurs, TPE, PME. Nos templates métiers (agence web, consultant, bureau d'études) s'adaptent à votre activité.",
  },
  // Compte
  {
    category: "account",
    question: "Comment modifier mes informations personnelles ?",
    answer:
      "Connectez-vous à votre dashboard, cliquez sur votre profil en haut à droite, puis 'Paramètres'. Vous pouvez modifier votre nom, email, mot de passe et préférences de notification.",
  },
  {
    category: "account",
    question: "Comment réinitialiser mon mot de passe ?",
    answer:
      "Sur la page de connexion, cliquez sur 'Mot de passe oublié ?'. Entrez votre email et vous recevrez un lien de réinitialisation valide 24h. Si vous ne recevez pas l'email, vérifiez vos spams.",
  },
  {
    category: "account",
    question: "Puis-je avoir plusieurs entreprises sur un compte ?",
    answer:
      "Oui, les plans Pro et Expert permettent de gérer plusieurs entreprises depuis un seul compte. Chaque entreprise dispose de ses propres comptes, catégories et budgets distincts.",
  },
  // Facturation
  {
    category: "billing",
    question: "Quels moyens de paiement acceptez-vous ?",
    answer:
      "Nous acceptons les cartes bancaires (Visa, Mastercard, American Express) et les prélèvements SEPA pour les entreprises. La facturation est mensuelle ou annuelle (2 mois offerts).",
  },
  {
    category: "billing",
    question: "Comment changer de plan ?",
    answer:
      "Dans Paramètres > Abonnement, cliquez sur 'Changer de plan'. L'upgrade est immédiat, le downgrade prend effet à la fin de la période de facturation. Le montant est calculé au prorata.",
  },
  {
    category: "billing",
    question: "Puis-je annuler mon abonnement ?",
    answer:
      "Oui, vous pouvez annuler à tout moment depuis les paramètres. Vous conservez l'accès aux fonctionnalités payantes jusqu'à la fin de la période facturée. Aucune donnée n'est supprimée.",
  },
  {
    category: "billing",
    question: "Proposez-vous des remises pour les associations ?",
    answer:
      "Oui ! Nous offrons -50% aux associations, ONG et startups éligibles (moins de 2 ans). Contactez-nous avec un justificatif pour bénéficier de l'offre.",
  },
  // Fonctionnalités
  {
    category: "features",
    question: "Comment fonctionne l'import de transactions ?",
    answer:
      "Vous pouvez importer vos transactions via fichier CSV/Excel. Glissez-déposez votre fichier, mappez les colonnes (date, montant, description), et validez. L'import détecte automatiquement le format.",
  },
  {
    category: "features",
    question: "Comment créer un budget mensuel ?",
    answer:
      "Dans le menu Budget, cliquez sur 'Nouveau budget'. Choisissez une catégorie, définissez le montant limite et la période. Vous recevrez des alertes à 80% et 100% de consommation.",
  },
  {
    category: "features",
    question: "Les prévisions IA sont-elles fiables ?",
    answer:
      "Notre algorithme analyse votre historique (minimum 3 mois recommandé) pour prédire vos flux futurs. La précision moyenne est de 85-90% sur 30 jours. Plus vous utilisez Quelyos, plus les prévisions s'affinent.",
  },
  {
    category: "features",
    question: "Puis-je exporter mes données ?",
    answer:
      "Oui, vous pouvez exporter vos transactions, rapports et factures au format CSV, Excel ou PDF. Les exports sont compatibles avec les logiciels comptables français (format FEC disponible en Pro).",
  },
  // Sécurité
  {
    category: "security",
    question: "Mes données bancaires sont-elles sécurisées ?",
    answer:
      "Absolument. Nous utilisons un chiffrement AES-256 de bout en bout. Nous ne stockons JAMAIS vos identifiants bancaires. La synchronisation utilise des protocoles DSP2 certifiés.",
  },
  {
    category: "security",
    question: "Où sont hébergées mes données ?",
    answer:
      "Toutes vos données sont hébergées en France, sur des serveurs certifiés ISO 27001. Nous sommes 100% conformes au RGPD avec droit d'accès, de rectification et de suppression.",
  },
  {
    category: "security",
    question: "Quelyos a-t-il accès à mon argent ?",
    answer:
      "Non. Quelyos est en lecture seule. Nous consultons vos transactions pour les afficher et analyser, mais nous n'avons aucune capacité d'effectuer des virements ou paiements.",
  },
  // Équipe
  {
    category: "team",
    question: "Comment inviter des collaborateurs ?",
    answer:
      "Dans Paramètres > Équipe, entrez l'email du collaborateur et choisissez son rôle (Admin, Manager, Utilisateur, Lecteur). Il recevra une invitation par email pour créer son compte.",
  },
  {
    category: "team",
    question: "Quels sont les différents rôles disponibles ?",
    answer:
      "Admin : accès complet. Manager : gestion des transactions et budgets. Utilisateur : consultation et saisie. Lecteur : consultation uniquement. Chaque rôle peut être personnalisé par ressource.",
  },
  {
    category: "team",
    question: "Combien d'utilisateurs puis-je ajouter ?",
    answer:
      "Freemium : 1 utilisateur. Pro : 5 utilisateurs. Expert : utilisateurs illimités. Des packs d'utilisateurs supplémentaires sont disponibles pour le plan Pro.",
  },
];

// Chatbot messages
const chatbotResponses = [
  "Bonjour ! Je suis l'assistant Quelyos. Comment puis-je vous aider ?",
  "Vous pouvez me poser des questions sur les fonctionnalités, la facturation ou le support technique.",
  "Pour une assistance personnalisée, n'hésitez pas à utiliser le formulaire de contact ou rejoindre notre Discord !",
];

export default function SupportPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    priority: "normal",
    message: "",
  });
  const [activeCategory, setActiveCategory] = useState("getting-started");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{ type: "bot" | "user"; text: string }>
  >([{ type: "bot", text: chatbotResponses[0] }]);
  const [chatInput, setChatInput] = useState("");

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = faq.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && (searchQuery === "" ? true : matchesSearch);
  });

  const allFilteredFaqs = faqs.filter((faq) => {
    return (
      searchQuery !== "" &&
      (faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Intégrer avec l'API pour envoyer le message
    setFormSubmitted(true);
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;

    setChatMessages((prev) => [...prev, { type: "user", text: chatInput }]);
    setChatInput("");

    // Simulate bot response
    setTimeout(() => {
      const randomResponse =
        chatbotResponses[Math.floor(Math.random() * chatbotResponses.length)];
      setChatMessages((prev) => [
        ...prev,
        { type: "bot", text: randomResponse },
      ]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden pb-12 pt-16">
        <div className="pointer-events-none absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/15 blur-[120px]" />
        <div className="pointer-events-none absolute -left-40 bottom-0 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-[100px]" />

        <Container className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300">
              <Headphones size={16} />
              Centre d&apos;aide Quelyos
            </div>
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Comment pouvons-nous
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                vous aider ?
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Support technique, questions commerciales ou simple curiosité —
              notre équipe est là pour vous accompagner.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Contact Methods */}
      <section className="pb-16">
        <Container>
          <div className="grid gap-4 md:grid-cols-3">
            {contactMethods.map((method, index) => (
              <motion.a
                key={method.title}
                href={method.href}
                target={method.external ? "_blank" : undefined}
                rel={method.external ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group rounded-2xl border border-white/10 bg-slate-900/50 p-6 transition-all hover:border-indigo-500/30 hover:bg-slate-900/80"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 transition-transform group-hover:scale-110">
                  <method.icon size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {method.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {method.description}
                </p>
                <div className="mt-3 flex items-center gap-1 text-sm font-medium text-indigo-400">
                  {method.value}
                  {method.external && <ExternalLink size={14} />}
                </div>
              </motion.a>
            ))}
          </div>
        </Container>
      </section>

      {/* Quick Links */}
      <section className="border-t border-white/5 py-12">
        <Container>
          <h2 className="mb-6 text-center text-xl font-semibold text-white">
            Ressources rapides
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {quickLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-slate-900/30 p-4 transition-colors hover:border-indigo-500/30"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-indigo-400">
                  <link.icon size={20} />
                </div>
                <div>
                  <p className="font-medium text-white">{link.title}</p>
                  <p className="text-sm text-slate-500">{link.description}</p>
                </div>
                <ArrowRight className="ml-auto text-slate-600" size={16} />
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-white/5 py-20">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <HelpCircle className="mx-auto mb-4 text-indigo-400" size={40} />
            <h2 className="text-3xl font-bold text-white">
              Questions fréquentes
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              Trouvez rapidement les réponses aux questions les plus courantes.
            </p>
          </motion.div>

          {/* Search */}
          <div className="mx-auto mt-8 max-w-lg">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une question..."
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {faqCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSearchQuery("");
                  setOpenFaq(0);
                }}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? "bg-indigo-500 text-white"
                    : "border border-white/10 bg-white/5 text-slate-400 hover:border-indigo-500/30 hover:text-white"
                }`}
              >
                <cat.icon size={16} />
                {cat.label}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="mx-auto mt-10 max-w-3xl space-y-3">
            {(searchQuery ? allFilteredFaqs : filteredFaqs).map(
              (faq, index) => (
                <motion.div
                  key={`${faq.category}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border border-white/10 bg-slate-900/50 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex w-full items-center justify-between p-5 text-left"
                  >
                    <span className="font-medium text-white pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`shrink-0 text-slate-400 transition-transform ${
                        openFaq === index ? "rotate-180" : ""
                      }`}
                      size={20}
                    />
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-white/5 px-5 py-4 text-slate-400">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            )}

            {(searchQuery ? allFilteredFaqs : filteredFaqs).length === 0 && (
              <div className="rounded-xl border border-white/10 bg-slate-900/30 p-8 text-center">
                <HelpCircle className="mx-auto mb-3 text-slate-600" size={40} />
                <p className="text-slate-400">Aucune question trouvée.</p>
                <p className="mt-2 text-sm text-slate-500">
                  Essayez une autre recherche ou contactez-nous directement.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/finance/faq"
              className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
            >
              Voir toutes les questions
              <ArrowRight size={16} />
            </Link>
          </div>
        </Container>
      </section>

      {/* Contact Form Section */}
      <section className="border-t border-white/5 py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-white">
                Envoyez-nous un message
              </h2>
              <p className="mt-2 text-slate-400">
                Notre équipe vous répondra sous 24h ouvrées.
              </p>

              {formSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-8 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center"
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                    <CheckCircle2 className="text-emerald-400" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Message envoyé !
                  </h3>
                  <p className="mt-2 text-slate-400">
                    Nous avons bien reçu votre demande. Un membre de notre
                    équipe vous contactera rapidement.
                  </p>
                  <button
                    onClick={() => {
                      setFormSubmitted(false);
                      setFormData({
                        name: "",
                        email: "",
                        company: "",
                        subject: "",
                        priority: "normal",
                        message: "",
                      });
                    }}
                    className="mt-4 text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    Envoyer un autre message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
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
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                        placeholder="jean@entreprise.fr"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Entreprise
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) =>
                          setFormData({ ...formData, company: e.target.value })
                        }
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
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="">Sélectionner...</option>
                        <option value="technical">Support technique</option>
                        <option value="billing">Facturation</option>
                        <option value="demo">Demande de démo</option>
                        <option value="sales">Question commerciale</option>
                        <option value="partnership">Partenariat</option>
                        <option value="feedback">Suggestion / Feedback</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Priorité
                    </label>
                    <div className="flex gap-3">
                      {[
                        { value: "low", label: "Basse", color: "slate" },
                        { value: "normal", label: "Normale", color: "indigo" },
                        { value: "high", label: "Haute", color: "amber" },
                        { value: "urgent", label: "Urgente", color: "rose" },
                      ].map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, priority: p.value })
                          }
                          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                            formData.priority === p.value
                              ? `border-${p.color}-500/50 bg-${p.color}-500/10 text-${p.color}-400`
                              : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      placeholder="Décrivez votre demande en détail..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-6 py-3 font-semibold text-white transition-all hover:bg-indigo-400"
                  >
                    <Send size={16} />
                    Envoyer le message
                  </button>
                </form>
              )}
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
                <h3 className="mb-4 font-semibold text-white">
                  Temps de réponse moyen
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-white/5 p-4">
                    <p className="text-2xl font-bold text-indigo-400">
                      &lt; 4h
                    </p>
                    <p className="text-sm text-slate-400">Support Premium</p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-4">
                    <p className="text-2xl font-bold text-white">24h</p>
                    <p className="text-sm text-slate-400">Support Standard</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
                <h3 className="mb-4 font-semibold text-white">
                  Horaires du support
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lundi - Vendredi</span>
                    <span className="text-white">9h - 18h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Samedi</span>
                    <span className="text-white">10h - 16h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dimanche</span>
                    <span className="text-slate-500">Fermé</span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  * Fuseau horaire : Europe/Paris (CET)
                </p>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                    <Sparkles className="text-amber-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      Support Premium
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Les clients Pro et Expert bénéficient d&apos;un support
                      prioritaire avec temps de réponse garanti.
                    </p>
                    <Link
                      href="/finance/pricing"
                      className="mt-3 inline-flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300"
                    >
                      Découvrir nos offres
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
                <h3 className="mb-4 font-semibold text-white">
                  Nous retrouver
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="text-indigo-400" size={18} />
                    <span className="text-slate-400">
                      12 Rue de la Finance, 75008 Paris
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="text-indigo-400" size={18} />
                    <a
                      href="mailto:contact@quelyos.com"
                      className="text-slate-400 hover:text-white"
                    >
                      contact@quelyos.com
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="text-indigo-400" size={18} />
                    <a
                      href="tel:+33123456789"
                      className="text-slate-400 hover:text-white"
                    >
                      01 23 45 67 89
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Chatbot Placeholder */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-80 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl sm:w-96"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-indigo-500 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <MessageSquare size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Assistant Quelyos
                  </p>
                  <p className="text-xs text-indigo-200">En ligne</p>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="h-64 space-y-3 overflow-y-auto p-4">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      msg.type === "user"
                        ? "bg-indigo-500 text-white"
                        : "bg-white/10 text-slate-300"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-white/10 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleChatSend()}
                  placeholder="Écrivez votre message..."
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={handleChatSend}
                  className="rounded-lg bg-indigo-500 px-3 py-2 text-white hover:bg-indigo-400"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-slate-500">
                Assistant automatique • Réponses non personnalisées
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chatbot Toggle Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setChatOpen(!chatOpen)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all ${
          chatOpen
            ? "bg-slate-700 text-white"
            : "bg-indigo-500 text-white hover:bg-indigo-400"
        }`}
      >
        <AnimatePresence mode="wait">
          {chatOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Footer CTA */}
      <section className="border-t border-white/5 py-16">
        <Container narrow className="text-center">
          <h2 className="text-2xl font-bold text-white">
            Vous n&apos;avez pas trouvé votre réponse ?
          </h2>
          <p className="mt-2 text-slate-400">
            Notre équipe est disponible pour répondre à toutes vos questions.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="mailto:support@quelyos.com"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-slate-900 transition-all hover:-translate-y-0.5"
            >
              <Mail size={16} />
              Nous contacter par email
            </Link>
            <a
              href="https://discord.gg/quelyos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10"
            >
              <DiscordIcon />
              Rejoindre le Discord
            </a>
          </div>
        </Container>
      </section>
    </div>
  );
}
