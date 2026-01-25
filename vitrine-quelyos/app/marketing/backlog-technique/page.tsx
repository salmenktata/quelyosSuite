"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Server,
  Database,
  Shield,
  GitBranch,
  Cloud,
  TestTube,
  Cpu,
} from "lucide-react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import Container from "../../components/Container";

// Types
type Priority = "P0" | "P1" | "P2" | "P3";
type Status = "done" | "in-progress" | "planned" | "backlog";
type Category = "api" | "infra" | "db" | "security" | "devops" | "testing";

interface BacklogItem {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  category: Category;
  sprint?: string;
  effort?: string;
}

// Données du Backlog Technique Marketing
const backlogItems: BacklogItem[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // LIVRÉES (11 déc 2025)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "T-001",
    title: "API Express Server",
    description:
      "server.js, health endpoint, CORS, helmet, rate-limiting 100req/15m",
    priority: "P0",
    status: "done",
    category: "api",
    effort: "3 pts",
  },
  {
    id: "T-002",
    title: "Auth JWT",
    description:
      "bcrypt hash, jsonwebtoken sign/verify, middleware authenticateToken",
    priority: "P0",
    status: "done",
    category: "security",
    effort: "5 pts",
  },
  {
    id: "T-003",
    title: "Prisma ORM PostgreSQL",
    description:
      "schema.prisma 9 models (User, Company, Post, SocialAccount, Analytics...)",
    priority: "P0",
    status: "done",
    category: "db",
    effort: "5 pts",
  },
  {
    id: "T-004",
    title: "Routes Auth",
    description:
      "POST /register, /login, GET /me, POST /logout avec validation express-validator",
    priority: "P0",
    status: "done",
    category: "api",
    effort: "3 pts",
  },
  {
    id: "T-005",
    title: "Routes Social OAuth",
    description:
      "GET /connect/facebook, /callback/facebook, /accounts, DELETE /accounts/:id",
    priority: "P0",
    status: "done",
    category: "api",
    effort: "8 pts",
  },
  {
    id: "T-006",
    title: "Routes Content IA",
    description:
      "POST /generate/calendar, /generate/post, /generate/hashtags avec OpenAI GPT-4",
    priority: "P0",
    status: "done",
    category: "api",
    effort: "8 pts",
  },
  {
    id: "T-007",
    title: "Logger Winston",
    description: "Fichiers error.log + combined.log, rotation 5MB × 5 files",
    priority: "P1",
    status: "done",
    category: "devops",
    effort: "2 pts",
  },
  {
    id: "T-008",
    title: "PostgreSQL Docker",
    description: "Base quelyos_marketing, migrations Prisma init appliquées",
    priority: "P0",
    status: "done",
    category: "db",
    effort: "2 pts",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MVP - P0 (Janvier 2026)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "T-020",
    title: "Routes Posts CRUD",
    description:
      "POST/GET/PUT/DELETE /posts, /:id/schedule, /:id/publish, /calendar/view",
    priority: "P0",
    status: "done",
    category: "api",
    sprint: "Sprint 2",
    effort: "5 pts",
  },
  {
    id: "T-021",
    title: "Publication Meta API",
    description:
      "Création posts Facebook/Instagram via Graph API, retry logic, status tracking",
    priority: "P0",
    status: "in-progress",
    category: "api",
    sprint: "Sprint 3",
    effort: "8 pts",
  },
  {
    id: "T-022",
    title: "Scheduler Posts (Cron)",
    description:
      "node-cron vérification 5min, publication auto posts scheduledAt <= now",
    priority: "P0",
    status: "planned",
    category: "api",
    sprint: "Sprint 3",
    effort: "5 pts",
  },
  {
    id: "T-023",
    title: "Routes Inbox",
    description:
      "GET /inbox, /comments, /messages, POST /:id/reply, /:id/ai-reply, PUT /:id/read",
    priority: "P0",
    status: "done",
    category: "api",
    sprint: "Sprint 3",
    effort: "5 pts",
  },
  {
    id: "T-024",
    title: "Webhooks Meta",
    description:
      "POST /webhooks/meta, verification token, ingestion comments/messages temps réel",
    priority: "P0",
    status: "planned",
    category: "api",
    sprint: "Sprint 3",
    effort: "5 pts",
  },
  {
    id: "T-025",
    title: "Récupération Analytics Meta",
    description:
      "GET insights posts/pages → PostAnalytics (impressions, reach, likes, clicks)",
    priority: "P0",
    status: "in-progress",
    category: "api",
    sprint: "Sprint 3",
    effort: "5 pts",
  },
  {
    id: "T-026",
    title: "Routes Analytics",
    description:
      "GET /dashboard, /posts, /engagement, /reach, /clicks, /compare",
    priority: "P0",
    status: "done",
    category: "api",
    sprint: "Sprint 3",
    effort: "5 pts",
  },
  {
    id: "T-027",
    title: "Routes Onboarding",
    description:
      "GET /status, PUT /profile, /sector, /style, /goals, POST /company, /skip",
    priority: "P0",
    status: "done",
    category: "api",
    sprint: "Sprint 2",
    effort: "3 pts",
  },
  {
    id: "T-028",
    title: "Tests Jest + Supertest",
    description:
      "auth, social, content, posts, inbox, analytics (coverage > 70%)",
    priority: "P0",
    status: "planned",
    category: "testing",
    sprint: "Sprint 4",
    effort: "8 pts",
  },
  {
    id: "T-029",
    title: "CI/CD GitHub Actions",
    description:
      "ci-validate.yml (lint, test), deploy-api.yml, deploy-landing.yml",
    priority: "P0",
    status: "in-progress",
    category: "devops",
    sprint: "Sprint 3",
    effort: "5 pts",
  },
  {
    id: "T-030",
    title: "Dockerfile API",
    description:
      "Multi-stage Node 20-alpine, non-root UID 1001, health check /health",
    priority: "P0",
    status: "planned",
    category: "infra",
    sprint: "Sprint 4",
    effort: "3 pts",
  },
  {
    id: "T-031",
    title: "Docker Compose Production",
    description: "Services api + postgres + redis (cache), networks, volumes",
    priority: "P0",
    status: "planned",
    category: "infra",
    sprint: "Sprint 4",
    effort: "3 pts",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // V1 - P1 (Février-Mars 2026)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "T-040",
    title: "Upload Images S3/Cloudinary",
    description: "multer middleware, resize sharp, compression, URL génération",
    priority: "P1",
    status: "backlog",
    category: "api",
    effort: "5 pts",
  },
  {
    id: "T-041",
    title: "Cache Redis",
    description:
      "Cache analytics 5min, tokens Meta refresh, rate limiting distributed",
    priority: "P1",
    status: "backlog",
    category: "infra",
    effort: "5 pts",
  },
  {
    id: "T-042",
    title: "Queue Jobs Bull",
    description:
      "Publication posts async, analytics fetch background, retry failed",
    priority: "P1",
    status: "backlog",
    category: "infra",
    effort: "5 pts",
  },
  {
    id: "T-043",
    title: "Monitoring Sentry",
    description: "Error tracking, performance monitoring, breadcrumbs",
    priority: "P1",
    status: "backlog",
    category: "devops",
    effort: "3 pts",
  },
  {
    id: "T-044",
    title: "Métriques Prometheus",
    description: "HTTP requests, DB queries, Meta API calls, endpoint /metrics",
    priority: "P1",
    status: "backlog",
    category: "devops",
    effort: "3 pts",
  },
  {
    id: "T-045",
    title: "Backup PostgreSQL Auto",
    description: "Script cron daily, stockage S3, rotation 30j, test restore",
    priority: "P1",
    status: "backlog",
    category: "devops",
    effort: "3 pts",
  },
  {
    id: "T-046",
    title: "Rate Limiting Avancé",
    description: "Par userId, par IP, par endpoint, Redis store distributed",
    priority: "P1",
    status: "backlog",
    category: "security",
    effort: "3 pts",
  },
  {
    id: "T-047",
    title: "Pagination API",
    description:
      "Cursor-based posts/inbox, limit/offset analytics, meta (total, hasMore)",
    priority: "P1",
    status: "backlog",
    category: "api",
    effort: "3 pts",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // V2 - P2 (Q2 2026)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "T-060",
    title: "Google Business Profile API",
    description:
      "OAuth, publication posts, récupération reviews, réponses avis",
    priority: "P2",
    status: "backlog",
    category: "api",
    effort: "8 pts",
  },
  {
    id: "T-061",
    title: "TikTok API",
    description:
      "Connexion OAuth, upload vidéos, analytics, suggestions hashtags",
    priority: "P2",
    status: "backlog",
    category: "api",
    effort: "8 pts",
  },
  {
    id: "T-062",
    title: "LinkedIn Pages API",
    description: "OAuth, publication posts B2B, analytics engagement",
    priority: "P2",
    status: "backlog",
    category: "api",
    effort: "5 pts",
  },
  {
    id: "T-063",
    title: "Webhooks Sortants",
    description:
      "Trigger events (post_published, comment_received) vers Zapier/Make",
    priority: "P2",
    status: "backlog",
    category: "api",
    effort: "5 pts",
  },
  {
    id: "T-064",
    title: "Export PDF Rapports",
    description: "Puppeteer génération, branding company, stockage S3",
    priority: "P2",
    status: "backlog",
    category: "api",
    effort: "5 pts",
  },
  {
    id: "T-065",
    title: "Audit Trail",
    description:
      "Log actions CRUD (userId, timestamp, before/after), retention 1 an",
    priority: "P2",
    status: "backlog",
    category: "security",
    effort: "5 pts",
  },
];

// Catégories avec icônes
const categories = [
  { name: "api", label: "API & Routes", icon: Server, color: "text-blue-400" },
  {
    name: "db",
    label: "Base de données",
    icon: Database,
    color: "text-green-400",
  },
  { name: "security", label: "Sécurité", icon: Shield, color: "text-red-400" },
  {
    name: "infra",
    label: "Infrastructure",
    icon: Cloud,
    color: "text-purple-400",
  },
  {
    name: "devops",
    label: "DevOps & CI/CD",
    icon: GitBranch,
    color: "text-orange-400",
  },
  { name: "testing", label: "Tests", icon: TestTube, color: "text-cyan-400" },
];

export default function MarketingBacklogTechniquePage() {
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
                    Backlog Technique Marketing
                  </h1>
                  <p className="text-slate-400 mt-1">
                    Architecture & Infrastructure — {stats.total} tâches
                    techniques
                  </p>
                </div>
              </div>
              <Link
                href="/marketing/backlog"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Backlog Produit →
              </Link>
            </div>
        </Container>
        </div>

        <Container className="py-8">
          {/* Progress (style aligné Finance) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Maturité technique
                </h2>
                <p className="text-slate-400">
                  Stack robuste, production-ready, scalable
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-purple-400">
                  {progress}%
                </p>
                <p className="text-sm text-slate-400">Complété</p>
              </div>
            </div>
            <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              />
            </div>
          </motion.div>

          {/* Categories */}
          {categories.map((cat, catIndex) => {
            const catItems = backlogItems.filter(
              (item) => item.category === cat.name
            );
            if (catItems.length === 0) return null;

            const catDone = catItems.filter((i) => i.status === "done").length;
            const catProgress = Math.round((catDone / catItems.length) * 100);

            return (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIndex * 0.1 }}
                className="mb-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                    <cat.icon className={`h-5 w-5 ${cat.color}`} />
                    {cat.label}
                    <span className="text-sm font-normal text-slate-400">
                      ({catDone}/{catItems.length})
                    </span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        style={{ width: `${catProgress}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-400">
                      {catProgress}%
                    </span>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-3">
                      <cat.icon className={`h-5 w-5 ${cat.color}`} />
                      {cat.label}
                      <span className="text-sm font-normal text-slate-400">
                        ({catItems.length} items)
                      </span>
                    </h2>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          style={{ width: `${catProgress}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-400">
                        {catProgress}%
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {catItems.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start gap-2 text-sm text-slate-300"
                      >
                        <CheckCircle2
                          className={`h-4 w-4 mt-0.5 flex-shrink-0 ${item.status === "done" ? "text-emerald-400" : "text-slate-600"}`}
                        />
                        <span className="font-mono text-xs">{item.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}

          {/* Stack Technique */}
          <div className="mt-12 p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-purple-400" />
              Stack Technique
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-400 mb-2">Backend</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Node.js 20",
                    "Express.js",
                    "Prisma ORM",
                    "PostgreSQL",
                    "Redis",
                  ].map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">Intégrations</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Meta Graph API",
                    "OpenAI GPT-4",
                    "Cloudinary",
                    "Stripe",
                  ].map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">DevOps</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Docker",
                    "GitHub Actions",
                    "Traefik",
                    "Let's Encrypt",
                    "Sentry",
                  ].map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 rounded bg-orange-500/10 text-orange-400 text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
      <Footer />
    </>
  );
}
