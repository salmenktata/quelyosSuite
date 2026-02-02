"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  UtensilsCrossed,
  ShoppingBag,
  Globe,
  Briefcase,
  Heart,
  Hammer,
  Building2,
  Users,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Wallet,
  Store,
  Monitor,
  Boxes,
  Megaphone,
  UserCircle,
  Factory,
  Home,
  GraduationCap,
  Truck,
  Wrench,
  UsersRound,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Container from "@/app/components/Container";

interface ModuleRecommande {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  href: string;
}

interface SecteurData {
  id: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  bgGradient: string;
  features: string[];
  useCases: string[];
  modulesRecommandes: ModuleRecommande[];
}

const secteursData: Record<string, SecteurData> = {
  restauration: {
    id: "restauration",
    name: "Restauration",
    tagline: "Restaurants, cafés, traiteurs",
    description: "La solution complète pour gérer votre établissement de restauration.",
    longDescription: "De la prise de commande à la gestion des stocks d'ingrédients, Quelyos Suite accompagne les restaurateurs dans leur quotidien. Optimisez votre service, fidélisez vos clients et pilotez votre rentabilité.",
    icon: UtensilsCrossed,
    color: "orange",
    gradient: "from-orange-500 to-amber-500",
    bgGradient: "from-orange-500/10 to-amber-500/5",
    features: [
      "Prise de commande sur tablette",
      "Gestion des stocks d'ingrédients en temps réel",
      "Réservations en ligne avec confirmation SMS",
      "Programme de fidélité client",
      "Écran cuisine intégré",
      "Gestion des tables et plans de salle",
      "Menu digital avec QR code",
      "Analyse des ventes par plat",
    ],
    useCases: [
      "Restaurant traditionnel avec service à table",
      "Fast-food et restauration rapide",
      "Traiteur et événementiel",
      "Café et salon de thé",
      "Dark kitchen et livraison",
    ],
    modulesRecommandes: [
      { id: "pos", name: "Point de Vente", description: "Caisse tactile et commandes", icon: Monitor, color: "text-teal-400", href: "/pos" },
      { id: "stock", name: "Stock", description: "Gestion des ingrédients", icon: Boxes, color: "text-orange-400", href: "/stock" },
      { id: "crm", name: "CRM", description: "Fidélité et réservations", icon: UserCircle, color: "text-violet-400", href: "/crm" },
    ],
  },
  retail: {
    id: "retail",
    name: "Retail",
    tagline: "Boutiques, commerces de détail",
    description: "Gérez votre commerce physique avec efficacité.",
    longDescription: "Quelyos Suite équipe les commerçants avec une caisse moderne, une gestion de stock performante et des outils d'analyse pour booster vos ventes. Multi-magasins, promotions, fidélité : tout est inclus.",
    icon: ShoppingBag,
    color: "pink",
    gradient: "from-pink-500 to-rose-500",
    bgGradient: "from-pink-500/10 to-rose-500/5",
    features: [
      "Caisse tactile intuitive",
      "Gestion multi-magasins centralisée",
      "Promotions et remises automatiques",
      "Inventaire et réassort automatique",
      "Étiquettes et codes-barres",
      "Carte de fidélité digitale",
      "Rapports de ventes détaillés",
      "Click & Collect intégré",
    ],
    useCases: [
      "Boutique de vêtements et accessoires",
      "Épicerie fine et alimentation",
      "Librairie et papeterie",
      "Magasin de décoration",
      "Concept store multi-produits",
    ],
    modulesRecommandes: [
      { id: "pos", name: "Point de Vente", description: "Caisse et encaissement", icon: Monitor, color: "text-teal-400", href: "/pos" },
      { id: "stock", name: "Stock", description: "Inventaire multi-sites", icon: Boxes, color: "text-orange-400", href: "/stock" },
      { id: "marketing", name: "Marketing", description: "Promotions et fidélité", icon: Megaphone, color: "text-pink-400", href: "/marketing" },
    ],
  },
  ecommerce: {
    id: "ecommerce",
    name: "E-commerce",
    tagline: "Vente en ligne, marketplaces",
    description: "Lancez et développez votre boutique en ligne.",
    longDescription: "Créez une expérience d'achat en ligne exceptionnelle avec Quelyos Suite. Catalogue produits, paiements sécurisés, gestion des commandes et expéditions : tout ce qu'il faut pour vendre sur internet.",
    icon: Globe,
    color: "indigo",
    gradient: "from-indigo-500 to-violet-500",
    bgGradient: "from-indigo-500/10 to-violet-500/5",
    features: [
      "Boutique en ligne personnalisable",
      "Catalogue produits illimité",
      "Paiements multi-devises sécurisés",
      "Gestion des commandes centralisée",
      "Suivi des expéditions automatisé",
      "Avis clients et notes",
      "SEO et marketing intégrés",
      "Synchronisation stock temps réel",
    ],
    useCases: [
      "Pure player e-commerce",
      "Commerce physique + vente en ligne",
      "Artisan vendant ses créations",
      "Grossiste B2B en ligne",
      "Marketplace de niche",
    ],
    modulesRecommandes: [
      { id: "store", name: "Boutique", description: "E-commerce complet", icon: Store, color: "text-indigo-400", href: "/ecommerce" },
      { id: "stock", name: "Stock", description: "Gestion des inventaires", icon: Boxes, color: "text-orange-400", href: "/stock" },
      { id: "marketing", name: "Marketing", description: "Campagnes et newsletters", icon: Megaphone, color: "text-pink-400", href: "/marketing" },
    ],
  },
  services: {
    id: "services",
    name: "Services",
    tagline: "Consulting, agences, freelances",
    description: "Pilotez vos projets et facturez vos prestations.",
    longDescription: "Conçu pour les prestataires de services, Quelyos Suite vous aide à gérer vos projets, suivre le temps passé, créer des devis professionnels et facturer vos clients efficacement.",
    icon: Briefcase,
    color: "blue",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/10 to-cyan-500/5",
    features: [
      "Gestion de projets et tâches",
      "Suivi du temps par projet/client",
      "Devis personnalisés",
      "Facturation automatique",
      "CRM et suivi client",
      "Rapports de rentabilité",
      "Portail client dédié",
      "Signature électronique",
    ],
    useCases: [
      "Cabinet de conseil",
      "Agence web et marketing",
      "Freelance et indépendant",
      "Bureau d'études",
      "Formateur et coach",
    ],
    modulesRecommandes: [
      { id: "crm", name: "CRM", description: "Gestion clients et projets", icon: UserCircle, color: "text-violet-400", href: "/crm" },
      { id: "finance", name: "Finance", description: "Facturation et trésorerie", icon: Wallet, color: "text-emerald-400", href: "/finance" },
      { id: "marketing", name: "Marketing", description: "Prospection et fidélisation", icon: Megaphone, color: "text-pink-400", href: "/marketing" },
    ],
  },
  sante: {
    id: "sante",
    name: "Santé & Bien-être",
    tagline: "Cliniques, salons, coachs",
    description: "Gérez vos rendez-vous et accompagnez vos patients.",
    longDescription: "Quelyos Suite simplifie la gestion des cabinets et centres de bien-être. Prise de RDV en ligne, dossiers patients, facturation des actes et rappels automatiques pour une pratique sereine.",
    icon: Heart,
    color: "red",
    gradient: "from-red-500 to-pink-500",
    bgGradient: "from-red-500/10 to-pink-500/5",
    features: [
      "Agenda en ligne avec créneaux",
      "Dossiers patients/clients sécurisés",
      "Rappels SMS et email automatiques",
      "Facturation des actes et séances",
      "Historique des consultations",
      "Gestion des praticiens",
      "Statistiques de fréquentation",
      "Conformité RGPD renforcée",
    ],
    useCases: [
      "Cabinet médical ou paramédical",
      "Salon de coiffure et esthétique",
      "Centre de bien-être et spa",
      "Coach sportif ou nutritionnel",
      "Thérapeute et praticien alternatif",
    ],
    modulesRecommandes: [
      { id: "crm", name: "CRM", description: "Dossiers et historique", icon: UserCircle, color: "text-violet-400", href: "/crm" },
      { id: "finance", name: "Finance", description: "Facturation des actes", icon: Wallet, color: "text-emerald-400", href: "/finance" },
      { id: "marketing", name: "Marketing", description: "Rappels et fidélisation", icon: Megaphone, color: "text-pink-400", href: "/marketing" },
    ],
  },
  btp: {
    id: "btp",
    name: "BTP & Artisanat",
    tagline: "Construction, artisans",
    description: "Gérez vos chantiers et vos interventions terrain.",
    longDescription: "Quelyos Suite accompagne les professionnels du bâtiment et de l'artisanat. Devis détaillés, suivi de chantier, gestion des matériaux et facturation : gagnez en productivité sur le terrain.",
    icon: Hammer,
    color: "amber",
    gradient: "from-amber-500 to-yellow-500",
    bgGradient: "from-amber-500/10 to-yellow-500/5",
    features: [
      "Devis chantiers détaillés",
      "Planning des interventions",
      "Suivi d'avancement chantier",
      "Gestion des matériaux et fournisseurs",
      "Fiches intervention mobile",
      "Photos et rapports terrain",
      "Facturation progressive",
      "Gestion des sous-traitants",
    ],
    useCases: [
      "Entreprise de construction",
      "Artisan du bâtiment (plombier, électricien...)",
      "Paysagiste et jardinier",
      "Menuisier et ébéniste",
      "Entreprise de rénovation",
    ],
    modulesRecommandes: [
      { id: "crm", name: "CRM", description: "Devis et suivi clients", icon: UserCircle, color: "text-violet-400", href: "/crm" },
      { id: "stock", name: "Stock", description: "Gestion des matériaux", icon: Boxes, color: "text-orange-400", href: "/stock" },
      { id: "finance", name: "Finance", description: "Facturation et trésorerie", icon: Wallet, color: "text-emerald-400", href: "/finance" },
    ],
  },
  hotellerie: {
    id: "hotellerie",
    name: "Hôtellerie",
    tagline: "Hôtels, gîtes, locations",
    description: "Gérez vos réservations et optimisez votre remplissage.",
    longDescription: "Quelyos Suite centralise la gestion de vos hébergements. Planning des chambres, réservations directes et OTAs, check-in/out digitalisé et facturation automatique pour une expérience client premium.",
    icon: Building2,
    color: "cyan",
    gradient: "from-cyan-500 to-teal-500",
    bgGradient: "from-cyan-500/10 to-teal-500/5",
    features: [
      "Planning des chambres visuel",
      "Réservations en ligne directes",
      "Channel manager (Booking, Airbnb...)",
      "Check-in/out digital",
      "Facturation automatique",
      "Gestion du ménage",
      "Tarification dynamique",
      "Statistiques d'occupation",
    ],
    useCases: [
      "Hôtel indépendant",
      "Gîte et chambre d'hôtes",
      "Location saisonnière",
      "Résidence de tourisme",
      "Camping et glamping",
    ],
    modulesRecommandes: [
      { id: "crm", name: "CRM", description: "Réservations et clients", icon: UserCircle, color: "text-violet-400", href: "/crm" },
      { id: "finance", name: "Finance", description: "Facturation et revenus", icon: Wallet, color: "text-emerald-400", href: "/finance" },
      { id: "marketing", name: "Marketing", description: "Promotions et fidélité", icon: Megaphone, color: "text-pink-400", href: "/marketing" },
    ],
  },
  associations: {
    id: "associations",
    name: "Associations",
    tagline: "ONG, clubs, fondations",
    description: "Gérez vos adhérents et animez votre communauté.",
    longDescription: "Quelyos Suite simplifie la vie associative. Fichier adhérents, gestion des cotisations, organisation d'événements et communication : concentrez-vous sur votre mission, pas sur l'administratif.",
    icon: Users,
    color: "green",
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-500/10 to-emerald-500/5",
    features: [
      "Fichier adhérents complet",
      "Gestion des cotisations",
      "Reçus fiscaux automatiques",
      "Organisation d'événements",
      "Emails et newsletters groupés",
      "Suivi des bénévoles",
      "Comptabilité associative",
      "Portail membre",
    ],
    useCases: [
      "Association loi 1901",
      "Club sportif ou culturel",
      "ONG et fondation",
      "Syndicat et fédération",
      "Comité d'entreprise",
    ],
    modulesRecommandes: [
      { id: "crm", name: "CRM", description: "Gestion des adhérents", icon: UserCircle, color: "text-violet-400", href: "/crm" },
      { id: "finance", name: "Finance", description: "Cotisations et comptabilité", icon: Wallet, color: "text-emerald-400", href: "/finance" },
      { id: "marketing", name: "Marketing", description: "Communication et événements", icon: Megaphone, color: "text-pink-400", href: "/marketing" },
    ],
  },
  industrie: {
    id: "industrie",
    name: "Industrie",
    tagline: "PME industrielles, ateliers, usines",
    description: "Optimisez votre production et anticipez les pannes.",
    longDescription: "Quelyos Suite accompagne les PME industrielles avec une GMAO complète, un suivi des pièces détachées, un pilotage financier précis et une gestion des équipes techniques optimisée.",
    icon: Factory,
    color: "slate",
    gradient: "from-slate-500 to-gray-500",
    bgGradient: "from-slate-500/10 to-gray-500/5",
    features: [
      "Gestion des équipements et machines",
      "Maintenance préventive planifiée",
      "Stock pièces détachées avec alertes",
      "Ordres de travail et interventions",
      "Planning techniciens et habilitations",
      "Conformité ISO et traçabilité",
      "Analyse des coûts par équipement",
      "Tableaux de bord production",
    ],
    useCases: [
      "PME industrielle et atelier",
      "Usine de production",
      "Sous-traitant industriel",
      "Atelier de fabrication",
      "Site de maintenance industrielle",
    ],
    modulesRecommandes: [
      { id: "gmao", name: "GMAO", description: "Maintenance et équipements", icon: Wrench, color: "text-slate-400", href: "/gmao" },
      { id: "stock", name: "Stock", description: "Pièces détachées", icon: Boxes, color: "text-orange-400", href: "/stock" },
      { id: "finance", name: "Finance", description: "Pilotage financier", icon: Wallet, color: "text-emerald-400", href: "/finance" },
    ],
  },
  immobilier: {
    id: "immobilier",
    name: "Immobilier",
    tagline: "Agences, syndics, gestionnaires",
    description: "Gérez vos mandats et votre patrimoine immobilier.",
    longDescription: "Quelyos Suite simplifie la gestion immobilière : pipeline de mandats, comptabilité locative automatisée, relances impayés et relation client pour agences, syndics et gestionnaires de biens.",
    icon: Home,
    color: "violet",
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-500/10 to-purple-500/5",
    features: [
      "Pipeline de mandats visuel",
      "Comptabilité locative automatisée",
      "Relances impayés intelligentes",
      "Matching biens/prospects automatique",
      "Agenda et gestion des visites",
      "Diffusion multi-portails",
      "Portail propriétaires dédié",
      "Statistiques et rendement locatif",
    ],
    useCases: [
      "Agence immobilière",
      "Syndic de copropriété",
      "Gestionnaire de biens",
      "Administrateur de biens",
      "Promoteur immobilier",
    ],
    modulesRecommandes: [
      { id: "crm", name: "CRM", description: "Mandats et prospects", icon: UserCircle, color: "text-violet-400", href: "/crm" },
      { id: "finance", name: "Finance", description: "Comptabilité locative", icon: Wallet, color: "text-emerald-400", href: "/finance" },
      { id: "marketing", name: "Marketing", description: "Diffusion et communication", icon: Megaphone, color: "text-pink-400", href: "/marketing" },
    ],
  },
  education: {
    id: "education",
    name: "Formation & Éducation",
    tagline: "Centres, écoles, organismes",
    description: "Gérez vos formations et votre conformité Qualiopi.",
    longDescription: "Quelyos Suite accompagne les organismes de formation avec des inscriptions en ligne, un suivi Qualiopi automatisé, une facturation OPCO/CPF intégrée et un planning formateurs optimisé.",
    icon: GraduationCap,
    color: "blue",
    gradient: "from-blue-500 to-sky-500",
    bgGradient: "from-blue-500/10 to-sky-500/5",
    features: [
      "Inscriptions en ligne automatisées",
      "Conformité Qualiopi intégrée",
      "Facturation OPCO/CPF automatique",
      "Planning formateurs et salles",
      "Émargement digital",
      "Suivi parcours stagiaires",
      "Catalogue formations en ligne",
      "Enquêtes de satisfaction",
    ],
    useCases: [
      "Centre de formation professionnelle",
      "École privée",
      "Organisme certifié Qualiopi",
      "Centre de formation continue",
      "École de langue",
    ],
    modulesRecommandes: [
      { id: "crm", name: "CRM", description: "Inscriptions et stagiaires", icon: UserCircle, color: "text-violet-400", href: "/crm" },
      { id: "finance", name: "Finance", description: "Facturation OPCO/CPF", icon: Wallet, color: "text-emerald-400", href: "/finance" },
      { id: "hr", name: "RH", description: "Planning formateurs", icon: UsersRound, color: "text-cyan-400", href: "/hr" },
    ],
  },
  logistique: {
    id: "logistique",
    name: "Logistique & Transport",
    tagline: "Transporteurs, entreposeurs",
    description: "Optimisez vos flux et maîtrisez vos coûts.",
    longDescription: "Quelyos Suite optimise la gestion logistique : entrepôts, maintenance de flotte, analyse des coûts et relation client pour transporteurs, logisticiens et entreposeurs.",
    icon: Truck,
    color: "teal",
    gradient: "from-teal-500 to-emerald-500",
    bgGradient: "from-teal-500/10 to-emerald-500/5",
    features: [
      "WMS : gestion entrepôts et picking",
      "Maintenance préventive de flotte",
      "Analyse des coûts par trajet/client",
      "Optimisation des tournées",
      "Conformité réglementaire automatique",
      "Suivi contrats et SLA clients",
      "Gestion des chauffeurs",
      "KPIs transport temps réel",
    ],
    useCases: [
      "Entreprise de transport",
      "Logisticien et entreposeur",
      "Coursier et livraison",
      "Déménageur",
      "Groupiste et affréteur",
    ],
    modulesRecommandes: [
      { id: "stock", name: "Stock", description: "Gestion entrepôts", icon: Boxes, color: "text-orange-400", href: "/stock" },
      { id: "gmao", name: "GMAO", description: "Maintenance flotte", icon: Wrench, color: "text-slate-400", href: "/gmao" },
      { id: "finance", name: "Finance", description: "Coûts et trésorerie", icon: Wallet, color: "text-emerald-400", href: "/finance" },
    ],
  },
};

const colorClasses: Record<string, { text: string; border: string; bg: string; bgLight: string }> = {
  orange: { text: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500", bgLight: "bg-orange-500/10" },
  pink: { text: "text-pink-400", border: "border-pink-500/30", bg: "bg-pink-500", bgLight: "bg-pink-500/10" },
  indigo: { text: "text-indigo-400", border: "border-indigo-500/30", bg: "bg-indigo-500", bgLight: "bg-indigo-500/10" },
  blue: { text: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500", bgLight: "bg-blue-500/10" },
  red: { text: "text-red-400", border: "border-red-500/30", bg: "bg-red-500", bgLight: "bg-red-500/10" },
  amber: { text: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500", bgLight: "bg-amber-500/10" },
  cyan: { text: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500", bgLight: "bg-cyan-500/10" },
  green: { text: "text-green-400", border: "border-green-500/30", bg: "bg-green-500", bgLight: "bg-green-500/10" },
  slate: { text: "text-slate-400", border: "border-slate-500/30", bg: "bg-slate-500", bgLight: "bg-slate-500/10" },
  violet: { text: "text-violet-400", border: "border-violet-500/30", bg: "bg-violet-500", bgLight: "bg-violet-500/10" },
  teal: { text: "text-teal-400", border: "border-teal-500/30", bg: "bg-teal-500", bgLight: "bg-teal-500/10" },
};

export default function SecteurPage() {
  const params = useParams();
  const slug = params.slug as string;
  const secteur = secteursData[slug];

  if (!secteur) {
    return (
      <LazyMotion features={domAnimation}>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
          <Header />
          <Container className="py-20">
            <div className="text-center">
              <h1 className="mb-4 text-3xl font-bold text-white">Secteur non trouvé</h1>
              <p className="mb-8 text-slate-400">Ce secteur n&apos;existe pas ou n&apos;est plus disponible.</p>
              <Link
                href="/secteurs"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 font-medium text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Voir tous les secteurs
              </Link>
            </div>
          </Container>
          <Footer />
        </div>
      </LazyMotion>
    );
  }

  const colors = colorClasses[secteur.color];
  const Icon = secteur.icon;

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
        <Header />

        {/* Hero */}
        <section className="relative py-20 sm:py-28">
          <div className="absolute inset-0 overflow-hidden">
            <div className={`absolute left-1/4 top-0 h-96 w-96 rounded-full ${colors.bgLight} blur-3xl`} />
            <div className="absolute right-1/4 bottom-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
          </div>

          <Container className="relative">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link
                href="/secteurs"
                className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Tous les secteurs
              </Link>

              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-16">
                <div className="flex-1">
                  <div className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${secteur.gradient}`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="mb-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                    {secteur.name}
                  </h1>
                  <p className={`mb-4 text-lg ${colors.text}`}>{secteur.tagline}</p>
                  <p className="mb-8 max-w-2xl text-lg text-slate-400">{secteur.longDescription}</p>
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <Link
                      href="/register"
                      className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 font-medium text-white transition-all hover:from-indigo-600 hover:to-purple-700"
                    >
                      <Sparkles className="h-4 w-4" />
                      Essai gratuit
                    </Link>
                    <Link
                      href="/contact"
                      className={`flex items-center justify-center gap-2 rounded-lg border ${colors.border} ${colors.bgLight} px-6 py-3 font-medium ${colors.text} transition-all hover:bg-white/10`}
                    >
                      Demander une démo
                    </Link>
                  </div>
                </div>
              </div>
            </m.div>
          </Container>
        </section>

        {/* Fonctionnalités */}
        <section className="py-16">
          <Container>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h2 className="mb-8 text-2xl font-bold text-white sm:text-3xl">
                Fonctionnalités clés pour {secteur.name.toLowerCase()}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {secteur.features.map((feature, index) => (
                  <m.div
                    key={feature}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                    className={`flex items-start gap-3 rounded-xl border ${colors.border} bg-white/5 p-4`}
                  >
                    <CheckCircle className={`mt-0.5 h-5 w-5 flex-shrink-0 ${colors.text}`} />
                    <span className="text-sm text-slate-300">{feature}</span>
                  </m.div>
                ))}
              </div>
            </m.div>
          </Container>
        </section>

        {/* Cas d'usage */}
        <section className="py-16">
          <Container>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`rounded-2xl border ${colors.border} bg-gradient-to-br ${secteur.bgGradient} p-8`}
            >
              <h2 className="mb-6 text-xl font-bold text-white">Idéal pour</h2>
              <div className="flex flex-wrap gap-3">
                {secteur.useCases.map((useCase) => (
                  <span
                    key={useCase}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300"
                  >
                    {useCase}
                  </span>
                ))}
              </div>
            </m.div>
          </Container>
        </section>

        {/* Modules recommandés */}
        <section className="py-16">
          <Container>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="mb-8 text-2xl font-bold text-white">Modules recommandés</h2>
              <div className="grid gap-6 sm:grid-cols-3">
                {secteur.modulesRecommandes.map((module) => (
                  <Link
                    key={module.id}
                    href={module.href}
                    className="group flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="rounded-lg bg-white/10 p-3">
                      <module.icon className={`h-6 w-6 ${module.color}`} />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-white">{module.name}</h3>
                      <p className="text-sm text-slate-400">{module.description}</p>
                    </div>
                    <ArrowRight className="ml-auto h-5 w-5 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                  </Link>
                ))}
              </div>
            </m.div>
          </Container>
        </section>

        {/* CTA */}
        <section className="py-16">
          <Container>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-8 text-center sm:p-12"
            >
              <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
                Prêt à transformer votre {secteur.name.toLowerCase()} ?
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-slate-400">
                Démarrez votre essai gratuit et découvrez comment Quelyos Suite
                peut simplifier la gestion de votre activité.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/register"
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 font-medium text-white transition-all hover:from-indigo-600 hover:to-purple-700"
                >
                  <Sparkles className="h-4 w-4" />
                  Commencer gratuitement
                </Link>
                <Link
                  href="/tarifs"
                  className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-medium text-white transition-all hover:bg-white/10"
                >
                  Voir les tarifs
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </m.div>
          </Container>
        </section>

        <Footer />
      </div>
    </LazyMotion>
  );
}
