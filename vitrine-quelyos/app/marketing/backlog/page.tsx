"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  MessageSquare,
  BarChart3,
  Megaphone,
  ImageIcon,
  Wand2,
  Users,
  Target,
  TrendingUp,
  Code,
} from "lucide-react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import Container from "../../components/Container";
import VoteButton from "@/app/components/VoteButton";

// Types
type Priority = "P0" | "P1" | "P2" | "P3";
type Status = "done" | "in-progress" | "planned" | "backlog";

interface BacklogItem {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  epic: string;
  sprint?: string;
  effort?: string;
}

// Données du Backlog Produit Marketing
const backlogItems: BacklogItem[] = [
  // Epic 1: Onboarding
  {
    id: "MKT-001",
    title: "Inscription & Authentification",
    description:
      "Email/password + OAuth Google/Facebook avec vérification email",
    priority: "P0",
    status: "done",
    epic: "Onboarding",
    sprint: "Sprint 1",
    effort: "5 pts",
  },
  {
    id: "MKT-002",
    title: "Sélection secteur d'activité",
    description: "Restaurant, Commerce, Artisan, Beauté/Bien-être, Autres",
    priority: "P0",
    status: "done",
    epic: "Onboarding",
    sprint: "Sprint 1",
    effort: "3 pts",
  },
  {
    id: "MKT-003",
    title: "Configuration style éditorial",
    description:
      "Ton (professionnel/décontracté/humoristique), préférences emojis/hashtags",
    priority: "P0",
    status: "done",
    epic: "Onboarding",
    sprint: "Sprint 1",
    effort: "3 pts",
  },
  {
    id: "MKT-004",
    title: "Définition objectifs marketing",
    description: "Notoriété, Engagement, Trafic, Conversions, Fidélisation",
    priority: "P0",
    status: "done",
    epic: "Onboarding",
    sprint: "Sprint 1",
    effort: "2 pts",
  },

  // Epic 2: Connexion Réseaux Sociaux
  {
    id: "MKT-010",
    title: "Connexion Instagram Business",
    description: "OAuth Meta avec permissions posts, stories, insights",
    priority: "P0",
    status: "in-progress",
    epic: "Réseaux Sociaux",
    sprint: "Sprint 2",
    effort: "8 pts",
  },
  {
    id: "MKT-011",
    title: "Connexion Facebook Page",
    description:
      "OAuth Meta avec permissions publications, commentaires, messages",
    priority: "P0",
    status: "in-progress",
    epic: "Réseaux Sociaux",
    sprint: "Sprint 2",
    effort: "5 pts",
  },
  {
    id: "MKT-012",
    title: "Multi-comptes sociaux",
    description: "Gérer plusieurs comptes Instagram/Facebook par entreprise",
    priority: "P1",
    status: "planned",
    epic: "Réseaux Sociaux",
    sprint: "Sprint 3",
    effort: "5 pts",
  },
  {
    id: "MKT-013",
    title: "Connexion Google Business Profile",
    description: "API Google My Business pour posts et avis",
    priority: "P2",
    status: "backlog",
    epic: "Réseaux Sociaux",
    effort: "8 pts",
  },
  {
    id: "MKT-014",
    title: "Connexion TikTok Business",
    description: "API TikTok pour publications vidéos",
    priority: "P3",
    status: "backlog",
    epic: "Réseaux Sociaux",
    effort: "13 pts",
  },

  // Epic 3: Création de Contenu IA
  {
    id: "MKT-020",
    title: "Génération texte IA (GPT-4)",
    description:
      "Suggestions de posts adaptées au secteur et au style de l'utilisateur",
    priority: "P0",
    status: "done",
    epic: "Contenu IA",
    sprint: "Sprint 2",
    effort: "8 pts",
  },
  {
    id: "MKT-021",
    title: "Suggestions de hashtags",
    description: "Hashtags pertinents par secteur avec analyse de tendances",
    priority: "P0",
    status: "done",
    epic: "Contenu IA",
    sprint: "Sprint 2",
    effort: "3 pts",
  },
  {
    id: "MKT-022",
    title: "Variantes de posts",
    description: "Générer 3 versions d'un même post (ton différent)",
    priority: "P1",
    status: "in-progress",
    epic: "Contenu IA",
    sprint: "Sprint 3",
    effort: "5 pts",
  },
  {
    id: "MKT-023",
    title: "Suggestions d'images stock",
    description: "Intégration Unsplash/Pexels pour images libres de droits",
    priority: "P1",
    status: "planned",
    epic: "Contenu IA",
    sprint: "Sprint 4",
    effort: "5 pts",
  },
  {
    id: "MKT-024",
    title: "Génération d'images IA",
    description: "Créer des visuels via DALL-E ou Midjourney API",
    priority: "P2",
    status: "backlog",
    epic: "Contenu IA",
    effort: "13 pts",
  },

  // Epic 4: Calendrier & Planification
  {
    id: "MKT-030",
    title: "Vue calendrier mensuel",
    description: "Visualiser tous les posts planifiés sur un mois",
    priority: "P0",
    status: "in-progress",
    epic: "Calendrier",
    sprint: "Sprint 3",
    effort: "5 pts",
  },
  {
    id: "MKT-031",
    title: "Planification de posts",
    description: "Programmer date et heure de publication",
    priority: "P0",
    status: "done",
    epic: "Calendrier",
    sprint: "Sprint 2",
    effort: "5 pts",
  },
  {
    id: "MKT-032",
    title: "Publication automatique",
    description: "Worker qui publie les posts à l'heure programmée",
    priority: "P0",
    status: "in-progress",
    epic: "Calendrier",
    sprint: "Sprint 3",
    effort: "8 pts",
  },
  {
    id: "MKT-033",
    title: "Suggestions horaires optimaux",
    description:
      "IA suggère les meilleurs moments pour poster selon l'audience",
    priority: "P1",
    status: "planned",
    epic: "Calendrier",
    sprint: "Sprint 4",
    effort: "5 pts",
  },

  // Epic 5: Gestion des Posts
  {
    id: "MKT-040",
    title: "CRUD Posts",
    description: "Créer, lire, modifier, supprimer des posts",
    priority: "P0",
    status: "done",
    epic: "Posts",
    sprint: "Sprint 1",
    effort: "5 pts",
  },
  {
    id: "MKT-041",
    title: "Preview multi-plateforme",
    description: "Prévisualiser le rendu sur Instagram, Facebook, etc.",
    priority: "P1",
    status: "planned",
    epic: "Posts",
    sprint: "Sprint 4",
    effort: "5 pts",
  },
  {
    id: "MKT-042",
    title: "Brouillons auto-sauvegardés",
    description: "Sauvegarde automatique toutes les 30 secondes",
    priority: "P1",
    status: "planned",
    epic: "Posts",
    sprint: "Sprint 4",
    effort: "3 pts",
  },

  // Epic 6: Inbox Unifié
  {
    id: "MKT-050",
    title: "Agrégation commentaires",
    description:
      "Voir tous les commentaires Instagram/Facebook en un seul endroit",
    priority: "P0",
    status: "done",
    epic: "Inbox",
    sprint: "Sprint 3",
    effort: "8 pts",
  },
  {
    id: "MKT-051",
    title: "Agrégation DMs",
    description: "Messages privés Instagram/Facebook dans l'inbox",
    priority: "P0",
    status: "in-progress",
    epic: "Inbox",
    sprint: "Sprint 3",
    effort: "8 pts",
  },
  {
    id: "MKT-052",
    title: "Réponses rapides IA",
    description: "Suggestions de réponses générées par GPT-4",
    priority: "P0",
    status: "done",
    epic: "Inbox",
    sprint: "Sprint 3",
    effort: "5 pts",
  },
  {
    id: "MKT-053",
    title: "Marquage lu/non-lu",
    description: "Gérer le statut des messages",
    priority: "P0",
    status: "done",
    epic: "Inbox",
    sprint: "Sprint 3",
    effort: "2 pts",
  },

  // Epic 7: Analytics
  {
    id: "MKT-060",
    title: "Dashboard KPIs",
    description: "Vue d'ensemble: posts, reach, engagement, followers",
    priority: "P0",
    status: "done",
    epic: "Analytics",
    sprint: "Sprint 3",
    effort: "5 pts",
  },
  {
    id: "MKT-061",
    title: "Stats par post",
    description: "Likes, commentaires, partages, impressions par post",
    priority: "P0",
    status: "done",
    epic: "Analytics",
    sprint: "Sprint 3",
    effort: "3 pts",
  },
  {
    id: "MKT-062",
    title: "Évolution temporelle",
    description: "Graphiques d'évolution sur 7j, 30j, 90j",
    priority: "P1",
    status: "planned",
    epic: "Analytics",
    sprint: "Sprint 4",
    effort: "5 pts",
  },
  {
    id: "MKT-063",
    title: "Comparaison périodes",
    description: "Comparer les performances entre deux périodes",
    priority: "P1",
    status: "planned",
    epic: "Analytics",
    sprint: "Sprint 5",
    effort: "5 pts",
  },
];

// Epics avec icônes
const epics = [
  { name: "Onboarding", icon: Users, color: "text-blue-400" },
  { name: "Réseaux Sociaux", icon: Megaphone, color: "text-pink-400" },
  { name: "Contenu IA", icon: Wand2, color: "text-purple-400" },
  { name: "Calendrier", icon: Calendar, color: "text-green-400" },
  { name: "Posts", icon: ImageIcon, color: "text-yellow-400" },
  { name: "Inbox", icon: MessageSquare, color: "text-cyan-400" },
  { name: "Analytics", icon: BarChart3, color: "text-orange-400" },
];

// Helpers
const statusConfig = {
  done: {
    label: "Terminé",
    icon: CheckCircle2,
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/20",
  },
  "in-progress": {
    label: "En cours",
    icon: Clock,
    color: "text-amber-400 bg-amber-400/10 border-amber-500/20",
  },
  planned: {
    label: "Planifié",
    icon: Target,
    color: "text-blue-400 bg-blue-400/10 border-blue-500/20",
  },
  backlog: {
    label: "Backlog",
    icon: AlertCircle,
    color: "text-slate-400 bg-slate-400/10 border-slate-500/20",
  },
};

const priorityConfig = {
  P0: { label: "Critique", color: "bg-red-500" },
  P1: { label: "Haute", color: "bg-orange-500" },
  P2: { label: "Moyenne", color: "bg-yellow-500" },
  P3: { label: "Basse", color: "bg-slate-500" },
};

export default function MarketingBacklogPage() {
  const stats = {
    total: backlogItems.length,
    done: backlogItems.filter((i) => i.status === "done").length,
    inProgress: backlogItems.filter((i) => i.status === "in-progress").length,
    planned: backlogItems.filter((i) => i.status === "planned").length,
  };

  const progress = Math.round((stats.done / stats.total) * 100);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Page Header */}
        <div className="border-b border-white/10 bg-slate-900/50">
          <Container className="py-16">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/marketing"
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Retour Marketing
                </Link>
                <div className="h-6 w-px bg-slate-700" />
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Image
                      src="/logos/icon-marketing.svg"
                      alt=""
                      width={32}
                      height={32}
                      className="rounded-lg"
                    />
                    Backlog Produit Marketing
                  </h1>
                  <p className="text-slate-400 mt-1">
                    Roadmap fonctionnelle MVP — 35 user stories
                  </p>
                </div>
              </div>
              <Link
                href="/marketing/backlog-technique"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
              >
                <Code className="h-4 w-4" />
                Backlog Technique →
              </Link>
            </div>
        </Container>
        </div>

        <Container className="py-8">
          {/* Progress (style aligné Finance) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-orange-900/20 to-amber-900/20 border border-orange-500/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Progression globale
                </h2>
                <p className="text-slate-400">
                  {stats.done} fonctionnalités livrées sur {stats.total}{" "}
                  planifiées
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-orange-400">
                  {progress}%
                </p>
                <p className="text-sm text-slate-400">Avancement</p>
              </div>
            </div>
            <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
              />
            </div>
          </motion.div>

          {/* Epics */}
          {epics.map((epic, epicIndex) => {
            const epicItems = backlogItems.filter(
              (item) => item.epic === epic.name
            );
            if (epicItems.length === 0) return null;

            const epicDone = epicItems.filter(
              (i) => i.status === "done"
            ).length;
            const epicProgress = Math.round(
              (epicDone / epicItems.length) * 100
            );

            return (
              <motion.div
                key={epic.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: epicIndex * 0.1 }}
                className="mb-8"
              >
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-3">
                      <epic.icon className={`h-5 w-5 ${epic.color}`} />
                      {epic.name}
                      <span className="text-sm font-normal text-slate-400">
                        ({epicDone} items)
                      </span>
                    </h2>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                          style={{ width: `${epicProgress}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-400">
                        {epicProgress}%
                      </span>
                    </div>
                  </div>
                  <ul className="grid md:grid-cols-2 gap-2">
                    {epicItems.map((item) => {
                      const isDone = item.status === "done";
                      return (
                        <li
                          key={item.id}
                          className="flex items-start justify-between gap-2 text-sm text-slate-300"
                        >
                          <div className="flex items-start gap-2 flex-1">
                            <CheckCircle2
                              className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isDone ? "text-emerald-400" : "text-slate-600"}`}
                            />
                            <span>{item.title}</span>
                          </div>
                          {!isDone && (
                            <VoteButton
                              itemId={`marketing-backlog-${item.id}`}
                              category="marketing-backlog"
                            />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </motion.div>
            );
          })}

          {/* Légende + CTA aligné Finance */}
          <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="font-semibold text-white mb-4">Légende</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-400 mb-2">Priorités</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <span
                      key={key}
                      className={`px-2 py-1 rounded text-xs font-medium ${config.color} text-white`}
                    >
                      {key}: {config.label}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">Statuts</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <span
                      key={key}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${config.color}`}
                    >
                      <config.icon className="h-3 w-3" />
                      {config.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-slate-400 mb-4">
                Consultez la roadmap Marketing détaillée
              </p>
              <Link
                href="/marketing/roadmap"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 font-medium hover:bg-orange-500/20 transition-colors"
              >
                <TrendingUp className="h-5 w-5" />
                Voir la roadmap 2026 →
              </Link>
            </div>
          </div>
        </Container>
      </div>
      <Footer />
    </>
  );
}
