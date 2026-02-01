"use client";

import { useEffect } from "react";
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

export default function AboutPage() {
  // Force dark mode on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  }, []);

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
      color: "emerald"
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "Nous intégrons les dernières technologies (IA, automatisation) pour vous offrir une expérience financière inédite.",
      color: "indigo"
    },
    {
      icon: Heart,
      title: "Proximité",
      description: "Une équipe à votre écoute, qui comprend vos enjeux et vous accompagne dans votre croissance.",
      color: "rose"
    },
    {
      icon: Target,
      title: "Excellence",
      description: "Nous visons l'excellence dans chaque fonctionnalité, chaque interaction, chaque ligne de code.",
      color: "amber"
    },
  ];

  const team = [
    {
      name: "Marie Leblanc",
      role: "CEO & Co-fondatrice",
      bio: "15 ans d'expérience en finance d'entreprise et transformation digitale. Ex-DAF chez TechCorp.",
      linkedin: "#",
      twitter: "#"
    },
    {
      name: "Thomas Durand",
      role: "CTO & Co-fondateur",
      bio: "Expert en architecture logicielle et systèmes distribués. Ex-Lead Engineer chez FinTech Pro.",
      linkedin: "#",
      twitter: "#"
    },
    {
      name: "Sophie Martin",
      role: "COO",
      bio: "Spécialiste en opérations et scaling. A accompagné 3 scale-ups de la série A à la série C.",
      linkedin: "#",
      twitter: "#"
    },
    {
      name: "Alexandre Chen",
      role: "Head of Product",
      bio: "10 ans d'expérience produit en SaaS B2B. Passionné par l'UX et les workflows intelligents.",
      linkedin: "#",
      twitter: "#"
    },
    {
      name: "Camille Petit",
      role: "Head of Customer Success",
      bio: "Dédiée à la réussite de nos clients. Ex-responsable grands comptes chez SaaS Leader.",
      linkedin: "#",
      twitter: "#"
    },
    {
      name: "Julien Moreau",
      role: "Head of Engineering",
      bio: "Architecte technique senior. Expertise en systèmes distribués et haute disponibilité.",
      linkedin: "#",
      twitter: "#"
    },
  ];

  const milestones = [
    { year: "2022", event: "Création de Quelyos", description: "Naissance de l'idée et premiers développements" },
    { year: "2023", event: "Lancement public", description: "Ouverture de la plateforme aux premiers clients" },
    { year: "2023", event: "1000 clients", description: "Franchissement du cap symbolique" },
    { year: "2024", event: "Levée de fonds", description: "Série A de 5M€ pour accélérer la croissance" },
    { year: "2025", event: "Expansion internationale", description: "Ouverture vers la nouveaux marchés" },
  ];

  const investors = [
    { name: "Venture Capital Partners", type: "Lead Investor" },
    { name: "Tech Growth Fund", type: "Series A" },
    { name: "Investisseurs privés", type: "Innovation" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950" suppressHydrationWarning>
      <Header />
      
      {/* Hero */}
      <section className="relative z-10 py-24 lg:py-32">
        <Container className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-sm text-indigo-300 mb-8">
            <Rocket className="h-4 w-4" />
            <span>Une équipe passionnée, une ambition mondiale</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-8">
            Nous réinventons la{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              finance d&apos;entreprise
            </span>
          </h1>
          
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-12">
            Quelyos est né d&apos;une conviction : chaque entreprise, quelle que soit sa taille, mérite 
            des outils financiers puissants, intuitifs et accessibles. Nous construisons la plateforme 
            qui simplifie la gestion de trésorerie et libère le potentiel des entrepreneurs.
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
              <span>Découvrir l&apos;équipe</span>
            </Link>
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
                  Démocratiser l&apos;excellence financière
                </h2>
                <p className="text-slate-300 text-lg">
                  Nous croyons que la gestion financière ne devrait pas être réservée aux grandes 
                  entreprises avec des équipes dédiées. Notre mission est de donner à chaque entrepreneur, 
                  chaque PME, les outils pour piloter ses finances avec la même précision qu&apos;un DAF expérimenté.
                </p>
              </div>
              
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/20 text-xs font-medium text-violet-300 mb-4">
                  <Star className="h-3.5 w-3.5" />
                  Notre vision
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  L&apos;avenir de la finance d&apos;entreprise
                </h2>
                <p className="text-slate-300 text-lg">
                  D&apos;ici 2030, nous voulons être la plateforme de référence sur de nouveaux marchés 
                  pour la gestion de trésorerie des PME. Une plateforme où l&apos;IA anticipe vos besoins, 
                  automatise les tâches répétitives et vous permet de vous concentrer sur ce qui compte : 
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
                      <div className="font-medium">Marchés principaux</div>
                      <div className="text-xs text-slate-400">Phase 1 • 2025-2026</div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 ml-auto" />
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50">
                    <span className="text-2xl">🌍</span>
                    <div>
                      <div className="font-medium">Nouveaux marchés</div>
                      <div className="text-xs text-slate-400">Phase 2 • Q3 2026</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50">
                    <span className="text-2xl">🌏</span>
                    <div>
                      <div className="font-medium">Expansion régionale</div>
                      <div className="text-xs text-slate-400">Phase 3 • 2027</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50">
                    <span className="text-2xl">🌎</span>
                    <div>
                      <div className="font-medium">Marchés internationaux</div>
                      <div className="text-xs text-slate-400">Phase 4 • 2027-2028</div>
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
                <div className={`h-12 w-12 rounded-xl bg-${value.color}-500/20 flex items-center justify-center mb-4`}>
                  <value.icon className={`h-6 w-6 text-${value.color}-400`} />
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
            <h2 className="text-3xl lg:text-4xl font-bold">Les étapes clés de notre parcours</h2>
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
                  <div className="hidden lg:flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-slate-950" />
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
              Notre équipe
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Les visages derrière Quelyos</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Une équipe passionnée de finance, de technologie et d&apos;entrepreneuriat, 
              déterminée à transformer la gestion financière des entreprises.
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
                Notre équipe est à votre disposition.
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
                    <div className="text-sm text-slate-400">Email</div>
                    <span className="text-white">contact@quelyos.com</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-slate-800/50">
              <h3 className="text-xl font-semibold mb-6">Prêt à transformer votre gestion financière ?</h3>
              <p className="text-slate-300 mb-6">
                Rejoignez les 2 500+ entreprises qui font déjà confiance à Quelyos pour optimiser 
                leur trésorerie et gagner en sérénité.
              </p>
              <Link 
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all group w-full justify-center"
              >
                <span>Commencer gratuitement</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-xs text-slate-500 text-center mt-4">
                Aucune carte bancaire requise • Essai gratuit 14 jours
              </p>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}
