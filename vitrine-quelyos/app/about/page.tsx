"use client";

import Link from "next/link";
import {
  ArrowRight,
  Target,
  Heart,
  Shield,
  Zap,
  Globe,
  Users,
  TrendingUp,
  Award,
  Building2,
  Linkedin,
  Twitter,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  Star,
  Rocket
} from "lucide-react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import Container from "@/app/components/Container";
import { Breadcrumbs } from "@/app/components/Breadcrumbs";

const stats = [
  { value: "2 500+", label: "Entreprises clientes", icon: Building2 },
  { value: "€45M+", label: "Transactions gérées", icon: TrendingUp },
  { value: "99.9%", label: "Disponibilité", icon: Shield },
  { value: "24/7", label: "Support client", icon: Clock },
];

const values = [
  {
    icon: Shield,
    title: "Sécurité",
    description: "La protection de vos données est notre priorité absolue. Chiffrement bancaire, conformité RGPD, infrastructure sécurisée.",
    bgClass: "bg-emerald-500/20",
    textClass: "text-emerald-400",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "Nous intégrons les dernières technologies (IA, automatisation) pour vous offrir une expérience de gestion inédite.",
    bgClass: "bg-indigo-500/20",
    textClass: "text-indigo-400",
  },
  {
    icon: Heart,
    title: "Proximité",
    description: "Une équipe à votre écoute, qui comprend vos enjeux et vous accompagne dans votre croissance.",
    bgClass: "bg-rose-500/20",
    textClass: "text-rose-400",
  },
  {
    icon: Target,
    title: "Excellence",
    description: "Nous visons l&apos;excellence dans chaque fonctionnalité, chaque interaction, chaque ligne de code.",
    bgClass: "bg-amber-500/20",
    textClass: "text-amber-400",
  },
];

const team = [
  {
    name: "Marie Leblanc",
    role: "CEO & Co-fondatrice",
    bio: "15 ans d\u2019exp\u00e9rience en finance d\u2019entreprise et transformation digitale. Ex-DAF chez TechCorp.",
    linkedin: "#",
    twitter: "#"
  },
  {
    name: "Thomas Durand",
    role: "CTO & Co-fondateur",
    bio: "Expert en architecture logicielle et syst\u00e8mes distribu\u00e9s. Ex-Lead Engineer chez FinTech Pro.",
    linkedin: "#",
    twitter: "#"
  },
  {
    name: "Sophie Martin",
    role: "COO",
    bio: "Sp\u00e9cialiste en op\u00e9rations et scaling. A accompagn\u00e9 3 scale-ups de la s\u00e9rie A \u00e0 la s\u00e9rie C.",
    linkedin: "#",
    twitter: "#"
  },
  {
    name: "Alexandre Chen",
    role: "Head of Product",
    bio: "10 ans d\u2019exp\u00e9rience produit en SaaS B2B. Passionn\u00e9 par l\u2019UX et les workflows intelligents.",
    linkedin: "#",
    twitter: "#"
  },
  {
    name: "Camille Petit",
    role: "Head of Customer Success",
    bio: "D\u00e9di\u00e9e \u00e0 la r\u00e9ussite de nos clients. Ex-responsable grands comptes chez SaaS Leader.",
    linkedin: "#",
    twitter: "#"
  },
  {
    name: "Julien Moreau",
    role: "Head of Engineering",
    bio: "Architecte technique senior. Expertise en syst\u00e8mes distribu\u00e9s et haute disponibilit\u00e9.",
    linkedin: "#",
    twitter: "#"
  },
];

const milestones = [
  { year: "2022", event: "Cr\u00e9ation de Quelyos", description: "Naissance de l\u2019id\u00e9e et premiers d\u00e9veloppements" },
  { year: "2023", event: "Lancement public", description: "Ouverture de la plateforme aux premiers clients" },
  { year: "2023", event: "1000 clients", description: "Franchissement du cap symbolique" },
  { year: "2024", event: "Lev\u00e9e de fonds", description: "S\u00e9rie A de 5M\u20AC pour acc\u00e9l\u00e9rer la croissance" },
  { year: "2025", event: "Expansion internationale", description: "Ouverture vers de nouveaux march\u00e9s" },
];

const investors = [
  { name: "Venture Capital Partners", type: "Lead Investor" },
  { name: "Tech Growth Fund", type: "Series A" },
  { name: "Investisseurs priv\u00e9s", type: "Innovation" },
];

const breadcrumbItems = [
  { name: "\u00C0 propos", url: "https://quelyos.com/about" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      <Header />

      {/* Hero */}
      <section className="relative z-10 py-24 lg:py-32">
        <Container>
          <Breadcrumbs items={breadcrumbItems} />

          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-sm text-indigo-300 mb-8">
              <Rocket className="h-4 w-4" />
              <span>Une \u00e9quipe passionn\u00e9e, une ambition mondiale</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-8">
              Nous r\u00e9inventons la{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                gestion d&apos;entreprise
              </span>
            </h1>

            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-12">
              Quelyos est n\u00e9 d&apos;une conviction : chaque entreprise, quelle que soit sa taille, m\u00e9rite
              des outils de gestion puissants, intuitifs et accessibles. Nous construisons la suite ERP compl\u00e8te
              qui simplifie la finance, le CRM, le stock, les RH et bien plus — pour lib\u00e9rer le potentiel des entrepreneurs.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all group"
              >
                <span>Rejoindre l&apos;aventure</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#team"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-700 text-white font-medium hover:bg-slate-800/50 transition-all"
              >
                <Users className="h-4 w-4" />
                <span>D\u00e9couvrir l&apos;\u00e9quipe</span>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-16 border-y border-slate-800/50">
        <Container>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-500/20 mb-4">
                  <stat.icon className="h-6 w-6 text-indigo-400" />
                </div>
                <div className="text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Mission & Vision */}
      <section className="relative z-10 py-24">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-xs font-medium text-emerald-300 mb-4">
                  <Target className="h-3.5 w-3.5" />
                  Notre mission
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  D\u00e9mocratiser l&apos;excellence op\u00e9rationnelle
                </h2>
                <p className="text-slate-300 text-lg">
                  Nous croyons que la gestion d&apos;entreprise ne devrait pas \u00eatre r\u00e9serv\u00e9e aux grandes
                  structures avec des \u00e9quipes d\u00e9di\u00e9es. Notre mission est de donner \u00e0 chaque entrepreneur,
                  chaque PME, les outils pour piloter ses finances, ses ventes, son stock et ses \u00e9quipes
                  avec la m\u00eame pr\u00e9cision qu&apos;un comit\u00e9 de direction exp\u00e9riment\u00e9.
                </p>
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/20 text-xs font-medium text-violet-300 mb-4">
                  <Star className="h-3.5 w-3.5" />
                  Notre vision
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  L&apos;avenir de la gestion d&apos;entreprise
                </h2>
                <p className="text-slate-300 text-lg">
                  D&apos;ici 2030, nous voulons \u00eatre la plateforme de r\u00e9f\u00e9rence sur de nouveaux march\u00e9s
                  pour la gestion compl\u00e8te des TPE/PME. Une plateforme o\u00f9 l&apos;IA anticipe vos besoins,
                  automatise les t\u00e2ches r\u00e9p\u00e9titives et vous permet de vous concentrer sur ce qui compte :
                  faire grandir votre entreprise.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-3xl blur-3xl" />
              <div className="relative p-8 rounded-3xl bg-slate-900/80 border border-slate-800/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Globe className="h-8 w-8 text-indigo-400" />
                  <h3 className="text-xl font-semibold">Expansion internationale</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50">
                    <span className="text-2xl">🌍</span>
                    <div>
                      <div className="font-medium">March\u00e9s principaux</div>
                      <div className="text-xs text-slate-400">Phase 1 &bull; 2025-2026</div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 ml-auto" />
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50">
                    <span className="text-2xl">🌍</span>
                    <div>
                      <div className="font-medium">Nouveaux march\u00e9s</div>
                      <div className="text-xs text-slate-400">Phase 2 &bull; Q3 2026</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50">
                    <span className="text-2xl">🌏</span>
                    <div>
                      <div className="font-medium">Expansion r\u00e9gionale</div>
                      <div className="text-xs text-slate-400">Phase 3 &bull; 2027</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50">
                    <span className="text-2xl">🌎</span>
                    <div>
                      <div className="font-medium">March\u00e9s internationaux</div>
                      <div className="text-xs text-slate-400">Phase 4 &bull; 2027-2028</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="relative z-10 py-24 bg-slate-900/50">
        <Container>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 text-xs font-medium text-indigo-300 mb-4">
              <Heart className="h-3.5 w-3.5" />
              Nos valeurs
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold">Ce qui nous guide au quotidien</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/50 hover:border-slate-700/50 transition-colors">
                <div className={`h-12 w-12 rounded-xl ${value.bgClass} flex items-center justify-center mb-4`}>
                  <value.icon className={`h-6 w-6 ${value.textClass}`} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-slate-400 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Timeline */}
      <section className="relative z-10 py-24">
        <Container>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/20 text-xs font-medium text-violet-300 mb-4">
              <Clock className="h-3.5 w-3.5" />
              Notre histoire
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold">Les \u00e9tapes cl\u00e9s de notre parcours</h2>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500 via-violet-500 to-transparent hidden lg:block" />

            <div className="space-y-8 lg:space-y-0">
              {milestones.map((milestone, i) => (
                <div key={i} className={`lg:flex items-center gap-8 ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                  <div className={`lg:w-1/2 ${i % 2 === 0 ? 'lg:text-right lg:pr-12' : 'lg:text-left lg:pl-12'}`}>
                    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/50 inline-block">
                      <div className="text-indigo-400 font-bold text-lg mb-1">{milestone.year}</div>
                      <h3 className="text-xl font-semibold mb-2">{milestone.event}</h3>
                      <p className="text-slate-400 text-sm">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="hidden lg:flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-slate-950 shrink-0" />
                  <div className="lg:w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Team */}
      <section id="team" className="relative z-10 py-24 bg-slate-900/50">
        <Container>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 text-xs font-medium text-indigo-300 mb-4">
              <Users className="h-3.5 w-3.5" />
              Notre \u00e9quipe
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Les visages derri\u00e8re Quelyos</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Une \u00e9quipe passionn\u00e9e de technologie et d&apos;entrepreneuriat,
              d\u00e9termin\u00e9e \u00e0 transformer la gestion des entreprises.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/50 hover:border-slate-700/50 transition-colors group">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-2xl font-bold mb-4">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                <p className="text-indigo-400 text-sm font-medium mb-3">{member.role}</p>
                <p className="text-slate-400 text-sm mb-4">{member.bio}</p>
                <div className="flex items-center gap-3">
                  <a href={member.linkedin} className="text-slate-500 hover:text-indigo-400 transition-colors">
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a href={member.twitter} className="text-slate-500 hover:text-indigo-400 transition-colors">
                    <Twitter className="h-5 w-5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-slate-400 mb-4">Envie de rejoindre l&apos;aventure ?</p>
            <a href="mailto:careers@quelyos.com" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium">
              <Mail className="h-4 w-4" />
              careers@quelyos.com
            </a>
          </div>
        </Container>
      </section>

      {/* Investors */}
      <section className="relative z-10 py-24">
        <Container>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-xs font-medium text-amber-300 mb-4">
              <Award className="h-3.5 w-3.5" />
              Ils nous font confiance
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Nos investisseurs</h2>
            <p className="text-slate-400">
              Soutenus par des partenaires de premier plan qui partagent notre vision.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8">
            {investors.map((investor, i) => (
              <div key={i} className="px-8 py-6 rounded-2xl bg-slate-900/80 border border-slate-800/50 text-center">
                <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-3">
                  <Building2 className="h-6 w-6 text-slate-500" />
                </div>
                <div className="font-semibold text-white">{investor.name}</div>
                <div className="text-xs text-slate-500">{investor.type}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Contact */}
      <section className="relative z-10 py-24 bg-slate-900/50">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Parlons de votre projet</h2>
              <p className="text-slate-300 text-lg mb-8">
                Vous avez des questions ? Vous souhaitez en savoir plus sur Quelyos ?
                Notre \u00e9quipe est \u00e0 votre disposition.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Email</div>
                    <a href="mailto:contact@quelyos.com" className="text-white hover:text-indigo-400">contact@quelyos.com</a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Si\u00e8ge social</div>
                    <span className="text-white">Paris, France</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-slate-800/50">
              <h3 className="text-xl font-semibold mb-6">Pr\u00eat \u00e0 transformer votre gestion ?</h3>
              <p className="text-slate-300 mb-6">
                Rejoignez les 2 500+ entreprises qui font d\u00e9j\u00e0 confiance \u00e0 Quelyos pour
                piloter leur activit\u00e9 et gagner en s\u00e9r\u00e9nit\u00e9.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all group w-full justify-center"
              >
                <span>Commencer gratuitement</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-xs text-slate-500 text-center mt-4">
                Aucune carte bancaire requise &bull; Essai gratuit 30 jours
              </p>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}
