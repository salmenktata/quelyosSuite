"use client";

import { useEffect, useState, useRef } from "react";
import Header from "@/app/components/Header";
import Container from "@/app/components/Container";
import Link from "next/link";
import {
  Target,
  Rocket,
  Zap,
  Calendar,
  CheckCircle2,
  Clock,
  Wrench,
  Server,
  Database,
  Shield,
  GitBranch,
} from "lucide-react";

type StoryStatus = "todo" | "in-progress" | "done";
type StoryPriority =
  | "q1-quick-win"
  | "q2-premium"
  | "q3-scale"
  | "backlog"
  | "none";
type Story = {
  id: string;
  title: string;
  status: StoryStatus;
  priority?: StoryPriority;
  effort?: string;
  impact?: "high" | "medium" | "low";
  category?: "infra" | "api" | "db" | "security" | "devops" | "testing";
};

const defaultStories: Story[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // TECHNIQUE - LIVRÉES (24) — Mise à jour 10 déc. 2025
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "T1",
    title:
      "API REST 13 routes (auth, accounts, transactions, categories, budgets, portfolios, users, company, settings, dashboard, reporting, import, admin)",
    status: "done",
    priority: "none",
    category: "api",
  },
  {
    id: "T2",
    title:
      "Système refresh tokens JWT complet (access 15m, refresh 7j, révocation, ipAddress, userAgent)",
    status: "done",
    priority: "none",
    category: "security",
  },
  {
    id: "T3",
    title:
      "RBAC granulaire avec 4 rôles (ADMIN/MANAGER/USER/VIEWER) + middleware rbac(resource, action)",
    status: "done",
    priority: "none",
    category: "security",
  },
  {
    id: "T4",
    title:
      "Métriques Prometheus 10+ custom (HTTP, DB queries, auth attempts, transactions, comptes actifs) + endpoint /metrics",
    status: "done",
    priority: "none",
    category: "devops",
  },
  {
    id: "T5",
    title:
      "Health check DB avec SELECT 1 test connexion + uptime + status PostgreSQL",
    status: "done",
    priority: "none",
    category: "db",
  },
  {
    id: "T6",
    title:
      "Monitoring Sentry avec ProfilingIntegration, tracesSampleRate 0.1, data sanitization, breadcrumbs",
    status: "done",
    priority: "none",
    category: "devops",
  },
  {
    id: "T7",
    title:
      "Docker multi-stage 4 étapes (deps→builder→pruner→runner), Node 20-alpine, non-root UID 1001, health checks 30s",
    status: "done",
    priority: "none",
    category: "infra",
  },
  {
    id: "T8",
    title:
      "Validation Zod complète : schemas pour accounts, transactions, categories, budgets, portfolios, users + middleware validate()",
    status: "done",
    priority: "none",
    category: "api",
  },
  {
    id: "T9",
    title:
      "Rate limiting actif (login 5 req/15m, routes protégées 100 req/15m) + Helmet CSP headers",
    status: "done",
    priority: "none",
    category: "security",
  },
  {
    id: "T10",
    title:
      "Infra VPS complète : Traefik reverse proxy + Let's Encrypt SSL auto + Docker networks (traefik_proxy, postgres_network)",
    status: "done",
    priority: "none",
    category: "infra",
  },
  {
    id: "T11",
    title:
      "Logging structuré avec logger.js (winston-like) remplaçant 100% des console.log/error",
    status: "done",
    priority: "none",
    category: "devops",
  },
  {
    id: "T12",
    title:
      "Scripts déploiement : deploy-to-vps.sh, deploy-apps.sh, rollback.sh, setup-vps-deployment.sh, healthcheck.sh, backup-postgres.sh",
    status: "done",
    priority: "none",
    category: "devops",
  },
  {
    id: "T13",
    title:
      "PostgreSQL 15 avec Prisma ORM : 20+ models (User, Company, Account, Transaction, Budget, Portfolio, RefreshToken, etc.)",
    status: "done",
    priority: "none",
    category: "db",
  },
  {
    id: "T14",
    title:
      "JWT_SECRET validation au démarrage (min 32 chars) + DATABASE_URL check + process.exit(1) si invalide",
    status: "done",
    priority: "none",
    category: "security",
  },
  {
    id: "T15",
    title:
      "Fichiers .env.example complets pour API et Frontend avec toutes les variables documentées",
    status: "done",
    priority: "none",
    category: "devops",
  },
  {
    id: "T16",
    title:
      "Tests Jest + Supertest : infrastructure complète avec auth, budgets, transactions, reporting",
    status: "done",
    priority: "none",
    category: "testing",
  },
  {
    id: "T17",
    title:
      "Middleware auth avec JWT verify + req.user injection (userId, companyId, role)",
    status: "done",
    priority: "none",
    category: "api",
  },
  {
    id: "T18",
    title:
      "Système de TVA avancé (HT/TTC, rates 0/5.5/10/20%, amountHT, amountTTC, vatRate)",
    status: "done",
    priority: "none",
    category: "api",
  },
  {
    id: "T19",
    title:
      "Import CSV/Excel transactions : multer upload, csv-parse, xlsx, validation Zod, mapping colonnes automatique",
    status: "done",
    priority: "none",
    category: "api",
  },
  {
    id: "T20",
    title:
      "Scripts démarrage robustes : start-dev.sh + stop-dev.sh avec vérification PostgreSQL, JWT validation, logs séparés",
    status: "done",
    priority: "none",
    category: "devops",
  },
  {
    id: "T21",
    title:
      "Page Stratégie Produit : vision 2026, personas, roadmap, pricing, KPIs, analyse concurrentielle",
    status: "done",
    priority: "none",
    category: "devops",
  },
  {
    id: "T23",
    title:
      "CI/CD GitHub Actions complet : 4 workflows (test, deploy-api, deploy-frontend, migrate-db), 6 secrets configurés, tests PostgreSQL dans CI",
    status: "done",
    priority: "none",
    category: "devops",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TECHNIQUE - TERMINÉ — Mise à jour 10 déc. 2025
  // ═══════════════════════════════════════════════════════════════════════════
  // T22 ✅ TERMINÉ : 19 fichiers tests API (users, company, settings, dashboard, notifications), ~70% coverage
  {
    id: "T22",
    title:
      "Tests Jest API couverture 70% : 19 fichiers tests (users, company, settings, dashboard, notifications)",
    status: "done",
    priority: "none",
    category: "testing",
  },
  // T24 ✅ TERMINÉ : React Testing Library + Playwright E2E, 237 tests frontend passent (mise à jour 10 déc. 2025)
  {
    id: "T24",
    title:
      "Tests Frontend : React Testing Library (237 tests : 25 suites, 8 pages dashboard, composants UI/auth) + Playwright E2E (7 specs)",
    status: "done",
    priority: "none",
    category: "testing",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TECHNIQUE - Q1 2026 (support Quick Wins)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "T25",
    title:
      "🚀 API Scénarios : endpoints POST/GET /scenarios avec calculs delta sur prévisions baseline",
    status: "todo",
    priority: "q1-quick-win",
    effort: "1 sem",
    impact: "high",
    category: "api",
  },
  {
    id: "T26",
    title:
      "🚀 API Templates sectoriels : endpoints GET /templates/:sector avec catégories/budgets pré-configurés",
    status: "todo",
    priority: "q1-quick-win",
    effort: "1 sem",
    impact: "high",
    category: "api",
  },
  {
    id: "T27",
    title:
      "🚀 Framer Motion : installation + composants animations réutilisables (fade, slide, scale)",
    status: "todo",
    priority: "q1-quick-win",
    effort: "3j",
    impact: "medium",
    category: "infra",
  },
  {
    id: "T28",
    title:
      "🚀 Dark mode Tailwind : configuration theme, localStorage persistence, toggle component",
    status: "todo",
    priority: "q1-quick-win",
    effort: "2j",
    impact: "medium",
    category: "infra",
  },
  {
    id: "T53",
    title:
      "🚀 Tests E2E Playwright : parcours complets signup→dashboard→transaction→reporting, CI intégré",
    status: "todo",
    priority: "q1-quick-win",
    effort: "1 sem",
    impact: "high",
    category: "testing",
  },
  {
    id: "T54",
    title:
      "🚀 Tests API coverage 90% : endpoints admin, reporting avancé, edge cases validation",
    status: "todo",
    priority: "q1-quick-win",
    effort: "1 sem",
    impact: "high",
    category: "testing",
  },
  {
    id: "T55",
    title:
      "🚀 Monitoring uptime : healthcheck endpoints publics, alertes downtime Slack, status page",
    status: "todo",
    priority: "q1-quick-win",
    effort: "3j",
    impact: "high",
    category: "devops",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TECHNIQUE - Q2 2026 (support Premium)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "T29",
    title:
      "⭐ Prophet.js intégration : service forecasting ML avec entraînement, API endpoints /forecast/ml",
    status: "todo",
    priority: "q2-premium",
    effort: "4 sem",
    impact: "high",
    category: "api",
  },
  {
    id: "T30",
    title:
      "⭐ Bridge API intégration : certification PSD2, endpoints sync bancaire, webhooks transactions",
    status: "todo",
    priority: "q2-premium",
    effort: "8 sem",
    impact: "high",
    category: "api",
  },
  {
    id: "T31",
    title:
      "⭐ Cache Redis : sessions JWT, queries dashboard fréquentes (TTL 5min), invalidation intelligente",
    status: "todo",
    priority: "q2-premium",
    effort: "2 sem",
    impact: "medium",
    category: "db",
  },
  {
    id: "T32",
    title:
      "⭐ Moteur suggestions : règles métier + patterns détection pour actions recommandées",
    status: "todo",
    priority: "q2-premium",
    effort: "3 sem",
    impact: "high",
    category: "api",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TECHNIQUE - Q3 2026 (Expansion Tunisie + Scale)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "T33",
    title:
      "🇹🇳 Support devise TND : 3 décimales, format 1 234,567 TND, conversion affichage",
    status: "todo",
    priority: "q3-scale",
    effort: "3j",
    impact: "high",
    category: "api",
  },
  {
    id: "T34",
    title: "🇹🇳 TVA Tunisie : rates 7/13/19%, calculs HT/TTC adaptés",
    status: "todo",
    priority: "q3-scale",
    effort: "2j",
    impact: "medium",
    category: "api",
  },
  {
    id: "T35",
    title:
      "🌍 i18n Next.js : next-intl, fichiers FR/AR/EN, routing /fr /ar /en",
    status: "todo",
    priority: "q3-scale",
    effort: "2 sem",
    impact: "high",
    category: "infra",
  },
  {
    id: "T36",
    title:
      "🌍 RTL Support Tailwind : plugin tailwindcss-rtl, classes dir-ltr/dir-rtl, tests UI arabe",
    status: "todo",
    priority: "q3-scale",
    effort: "2 sem",
    impact: "high",
    category: "infra",
  },
  {
    id: "T37",
    title:
      "📅 Webhooks système : events transaction.created, budget.exceeded, account.lowBalance + retry logic",
    status: "todo",
    priority: "q3-scale",
    effort: "3 sem",
    impact: "medium",
    category: "api",
  },
  {
    id: "T38",
    title:
      "📅 API GraphQL : Apollo Server pour requêtes complexes + subscriptions temps réel",
    status: "todo",
    priority: "q3-scale",
    effort: "4 sem",
    impact: "medium",
    category: "api",
  },
  {
    id: "T39",
    title:
      "📅 Export PDF/Excel : Puppeteer + ExcelJS avec branding company (logo, couleurs)",
    status: "todo",
    priority: "q3-scale",
    effort: "2 sem",
    impact: "medium",
    category: "api",
  },
  {
    id: "T40",
    title:
      "📅 Audit trail : toutes actions CRUD tracées (userId, timestamp, before/after, IP)",
    status: "todo",
    priority: "q3-scale",
    effort: "2 sem",
    impact: "medium",
    category: "security",
  },
  {
    id: "T41",
    title:
      "📅 Multi-tenant avancé : isolation companies, permissions cross-company, dashboard consolidé",
    status: "todo",
    priority: "q3-scale",
    effort: "6 sem",
    impact: "high",
    category: "db",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TECHNIQUE - 2027 (Expansion Maghreb)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "T42",
    title:
      "🇩🇿🇲🇦 Support devises DZD/MAD : formats locaux, TVA par pays (DZ 9/19%, MA 7/10/14/20%)",
    status: "todo",
    priority: "backlog",
    effort: "1 sem",
    impact: "high",
    category: "api",
  },
  {
    id: "T43",
    title:
      "🇩🇿🇲🇦 Exploration APIs bancaires Maghreb : BIAT, Attijari, CPA, Attijariwafa",
    status: "todo",
    priority: "backlog",
    effort: "4 sem",
    impact: "medium",
    category: "api",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TECHNIQUE - 2028 (Expansion Golf)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "T44",
    title:
      "🇦🇪🇸🇦🇶🇦 Support devises Golf : AED/SAR/QAR, TVA 5%/15%/0%, format anglais 1,234.56",
    status: "todo",
    priority: "backlog",
    effort: "1 sem",
    impact: "high",
    category: "api",
  },
  {
    id: "T45",
    title:
      "🇦🇪🇸🇦🇶🇦 APIs bancaires Golf : Emirates NBD, Al Rajhi, QNB exploration",
    status: "todo",
    priority: "backlog",
    effort: "6 sem",
    impact: "medium",
    category: "api",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TECHNIQUE - Backlog (post-PMF)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "T46",
    title:
      "Migration PostgreSQL 16 + optimisations index (btree, gin) sur colonnes fréquentes",
    status: "todo",
    priority: "backlog",
    effort: "1 sem",
    impact: "low",
    category: "db",
  },
  {
    id: "T47",
    title:
      "Logs centralisés Loki + Grafana dashboards avec alertes Slack/email",
    status: "todo",
    priority: "backlog",
    effort: "2 sem",
    impact: "low",
    category: "devops",
  },
  {
    id: "T48",
    title:
      "Migration multi-region (EU, MENA) avec Postgres read replicas + CDN Cloudflare",
    status: "todo",
    priority: "backlog",
    effort: "8 sem",
    impact: "low",
    category: "infra",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TECHNIQUE - Enrichissements stratégie 2026 (ajoutés 9 déc. 2025)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "T49",
    title:
      "🚀 Alertes Sentry Slack : notifications erreurs critiques, seuils alertes, channel #prod-alerts dédié",
    status: "todo",
    priority: "q1-quick-win",
    effort: "2j",
    impact: "high",
    category: "devops",
  },
  {
    id: "T50",
    title:
      "🚀 Optimisation Lighthouse : score > 80 perf/access/SEO, lazy loading images, preconnect APIs, Core Web Vitals",
    status: "todo",
    priority: "q1-quick-win",
    effort: "1 sem",
    impact: "high",
    category: "infra",
  },
  {
    id: "T51",
    title:
      "⭐ Backup cloud S3 : snapshots PostgreSQL quotidiens vers S3/Scaleway, rétention 30j, restore testé",
    status: "todo",
    priority: "q2-premium",
    effort: "1 sem",
    impact: "high",
    category: "devops",
  },
  {
    id: "T52",
    title:
      "⭐ Compression assets : Brotli/gzip nginx, images WebP auto, bundle splitting Next.js optimisé",
    status: "todo",
    priority: "q2-premium",
    effort: "3j",
    impact: "medium",
    category: "infra",
  },
];

const categoryLabels: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  api: {
    label: "API",
    icon: <Server className="h-3.5 w-3.5" />,
    color: "blue",
  },
  db: {
    label: "Base de données",
    icon: <Database className="h-3.5 w-3.5" />,
    color: "emerald",
  },
  security: {
    label: "Sécurité",
    icon: <Shield className="h-3.5 w-3.5" />,
    color: "red",
  },
  infra: {
    label: "Infrastructure",
    icon: <Wrench className="h-3.5 w-3.5" />,
    color: "purple",
  },
  devops: {
    label: "DevOps",
    icon: <GitBranch className="h-3.5 w-3.5" />,
    color: "amber",
  },
  testing: {
    label: "Tests",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: "cyan",
  },
};

const impactLabels = {
  high: { label: "HAUT", color: "emerald" },
  medium: { label: "MOYEN", color: "amber" },
  low: { label: "BAS", color: "slate" },
};

export default function BacklogTechniquePage() {
  // Toujours initialiser avec defaultStories pour éviter erreur hydratation
  const [stories, setStories] = useState<Story[]>(() => {
    if (typeof window === "undefined") return defaultStories;
    const raw = window.localStorage.getItem("backlogTechStoriesV1");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Story[];
        // Vérifier si les données stockées sont à jour (même nombre de stories)
        if (parsed.length === defaultStories.length) {
          return parsed;
        } else {
          // Reset si structure changée
          window.localStorage.removeItem("backlogTechStoriesV1");
        }
      } catch (e) {
        console.error("Cannot parse backlog tech storage", e);
      }
    }
    return defaultStories;
  });
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const mountedRef = useRef(false);

  // Marquer comme monté
  useEffect(() => {
    mountedRef.current = true;
  }, []);

  // Sauvegarder dans localStorage uniquement après montage
  useEffect(() => {
    if (!mountedRef.current) return;
    window.localStorage.setItem(
      "backlogTechStoriesV1",
      JSON.stringify(stories)
    );
  }, [stories]);

  const countByStatus = (status: StoryStatus) =>
    stories.filter((s) => s.status === status).length;
  const countByPriority = (priority: StoryPriority) =>
    stories.filter((s) => s.priority === priority && s.status === "todo")
      .length;
  const countByCategory = (cat: string) =>
    stories.filter((s) => s.category === cat).length;

  const filteredStories = filterCategory
    ? stories.filter((s) => s.category === filterCategory)
    : stories;

  const getDone = () => filteredStories.filter((s) => s.status === "done");
  const getInProgress = () =>
    filteredStories.filter((s) => s.status === "in-progress");
  const getByPriority = (priority: StoryPriority) =>
    filteredStories.filter(
      (s) => s.priority === priority && s.status === "todo"
    );

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <Container className="space-y-8 py-12 pt-24">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Backlog Technique
            </p>
            <Link
              href="/finance/backlog"
              className="flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300 transition hover:bg-indigo-500/30"
            >
              Backlog Fonctionnel →
            </Link>
            <Link
              href="/strategie"
              className="flex items-center gap-1.5 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-300 transition hover:bg-purple-500/30"
            >
              <Target className="h-3 w-3" />
              Stratégie 2026
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-white">
            Infrastructure & API — Roadmap Technique
          </h1>
          <p className="max-w-3xl text-base text-slate-300 leading-relaxed">
            <strong className="text-emerald-400">
              {countByStatus("done")} tâches livrées
            </strong>
            ,
            <strong className="text-amber-400">
              {" "}
              {countByStatus("in-progress")} en cours
            </strong>
            ,
            <strong className="text-white">
              {" "}
              {countByStatus("todo")} planifiées
            </strong>
            . Support technique pour la roadmap produit + expansion géographique
            🇫🇷→🇹🇳→🇩🇿🇲🇦→🇦🇪
          </p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-900/20 p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {countByStatus("done")}
                </p>
                <p className="text-xs text-emerald-200">Livrées</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-amber-400/30 bg-amber-900/20 p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {countByStatus("in-progress")}
                </p>
                <p className="text-xs text-amber-200">En cours</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-900/30 p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {countByPriority("q1-quick-win")}
                </p>
                <p className="text-xs text-emerald-200">Q1 2026</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-purple-500/30 bg-purple-900/30 p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {countByPriority("q2-premium")}
                </p>
                <p className="text-xs text-purple-200">Q2 2026</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-blue-500/30 bg-blue-900/30 p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {countByPriority("q3-scale")}
                </p>
                <p className="text-xs text-blue-200">Q3+ 2026</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-500/30 bg-slate-800/30 p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {countByPriority("backlog")}
                </p>
                <p className="text-xs text-slate-300">Backlog</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCategory(null)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              !filterCategory
                ? "bg-white text-slate-900"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Tous ({stories.length})
          </button>
          {Object.entries(categoryLabels).map(
            ([key, { label, icon, color }]) => (
              <button
                key={key}
                onClick={() => setFilterCategory(key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  filterCategory === key
                    ? `bg-${color}-500/30 text-${color}-200 border border-${color}-500/50`
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {icon}
                {label} ({countByCategory(key)})
              </button>
            )
          )}
        </div>

        {/* En cours */}
        {getInProgress().length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  🔄 En cours ({getInProgress().length})
                </h2>
                <p className="text-sm text-amber-200">
                  Tâches en développement actif
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {getInProgress().map((story) => (
                <div
                  key={story.id}
                  className="rounded-xl border border-amber-500/30 bg-amber-900/20 p-4 shadow-lg"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 rounded bg-amber-500/30 px-2 py-0.5 text-xs font-bold text-amber-200">
                      {story.id}
                    </span>
                    <span className="text-sm font-medium text-amber-50">
                      {story.title}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    {story.effort && (
                      <span className="text-amber-300">⏱ {story.effort}</span>
                    )}
                    {story.category && categoryLabels[story.category] && (
                      <span className="flex items-center gap-1 rounded-full bg-slate-700/50 px-2 py-0.5 text-slate-300">
                        {categoryLabels[story.category].icon}
                        {categoryLabels[story.category].label}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Q1 2026 Quick Wins */}
        {getByPriority("q1-quick-win").length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                <Rocket className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  🚀 Q1 2026 — Quick Wins
                </h2>
                <p className="text-sm text-emerald-200">
                  Support technique features prioritaires
                </p>
              </div>
              <span className="ml-auto rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-bold text-emerald-300">
                {getByPriority("q1-quick-win").length} tâches
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {getByPriority("q1-quick-win").map((story) => (
                <div
                  key={story.id}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-900/20 p-4 shadow-lg"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 rounded bg-emerald-500/30 px-2 py-0.5 text-xs font-bold text-emerald-200">
                      {story.id}
                    </span>
                    <span className="text-sm font-medium text-emerald-50">
                      {story.title}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    {story.effort && (
                      <span className="text-emerald-300">⏱ {story.effort}</span>
                    )}
                    {story.impact && (
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          story.impact === "high"
                            ? "bg-emerald-500/30 text-emerald-200"
                            : "bg-amber-500/30 text-amber-200"
                        }`}
                      >
                        Impact {impactLabels[story.impact].label}
                      </span>
                    )}
                    {story.category && categoryLabels[story.category] && (
                      <span className="flex items-center gap-1 rounded-full bg-slate-700/50 px-2 py-0.5 text-slate-300">
                        {categoryLabels[story.category].icon}
                        {categoryLabels[story.category].label}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Q2 2026 Premium */}
        {getByPriority("q2-premium").length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                <Zap className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  ⭐ Q2 2026 — Premium
                </h2>
                <p className="text-sm text-purple-200">
                  Intégrations avancées ML + Banking
                </p>
              </div>
              <span className="ml-auto rounded-full bg-purple-500/20 px-3 py-1 text-sm font-bold text-purple-300">
                {getByPriority("q2-premium").length} tâches
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {getByPriority("q2-premium").map((story) => (
                <div
                  key={story.id}
                  className="rounded-xl border border-purple-500/30 bg-purple-900/20 p-4 shadow-lg"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 rounded bg-purple-500/30 px-2 py-0.5 text-xs font-bold text-purple-200">
                      {story.id}
                    </span>
                    <span className="text-sm font-medium text-purple-50">
                      {story.title}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    {story.effort && (
                      <span className="text-purple-300">⏱ {story.effort}</span>
                    )}
                    {story.impact && (
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          story.impact === "high"
                            ? "bg-emerald-500/30 text-emerald-200"
                            : "bg-amber-500/30 text-amber-200"
                        }`}
                      >
                        Impact {impactLabels[story.impact].label}
                      </span>
                    )}
                    {story.category && categoryLabels[story.category] && (
                      <span className="flex items-center gap-1 rounded-full bg-slate-700/50 px-2 py-0.5 text-slate-300">
                        {categoryLabels[story.category].icon}
                        {categoryLabels[story.category].label}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Q3+ 2026 Scale + Expansion */}
        {getByPriority("q3-scale").length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  📅 Q3+ 2026 — Scale & Expansion Tunisie
                </h2>
                <p className="text-sm text-blue-200">
                  i18n, RTL, multi-devises, APIs régionales
                </p>
              </div>
              <span className="ml-auto rounded-full bg-blue-500/20 px-3 py-1 text-sm font-bold text-blue-300">
                {getByPriority("q3-scale").length} tâches
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {getByPriority("q3-scale").map((story) => (
                <div
                  key={story.id}
                  className="rounded-xl border border-blue-500/30 bg-blue-900/20 p-4 shadow-lg"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 rounded bg-blue-500/30 px-2 py-0.5 text-xs font-bold text-blue-200">
                      {story.id}
                    </span>
                    <span className="text-sm font-medium text-blue-50">
                      {story.title}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    {story.effort && (
                      <span className="text-blue-300">⏱ {story.effort}</span>
                    )}
                    {story.category && categoryLabels[story.category] && (
                      <span className="flex items-center gap-1 rounded-full bg-slate-700/50 px-2 py-0.5 text-slate-300">
                        {categoryLabels[story.category].icon}
                        {categoryLabels[story.category].label}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Backlog 2027-2028 */}
        {getByPriority("backlog").length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700/50">
                <Wrench className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  🗂️ Backlog 2027-2028 — Expansion Maghreb + Golf
                </h2>
                <p className="text-sm text-slate-400">
                  Post Product-Market Fit
                </p>
              </div>
              <span className="ml-auto rounded-full bg-slate-600/30 px-3 py-1 text-sm font-bold text-slate-300">
                {getByPriority("backlog").length} tâches
              </span>
            </div>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {getByPriority("backlog").map((story) => (
                <div
                  key={story.id}
                  className="rounded-lg border border-slate-700/50 bg-slate-800/30 px-4 py-3"
                >
                  <span className="mr-2 rounded bg-slate-700/50 px-2 py-0.5 text-xs font-bold text-slate-400">
                    {story.id}
                  </span>
                  <span className="text-sm text-slate-300">{story.title}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Livrées */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                ✅ Livrées ({getDone().length})
              </h2>
              <p className="text-sm text-emerald-200">
                Base technique solide en production
              </p>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {getDone().map((story) => (
              <div
                key={story.id}
                className="rounded-lg border border-emerald-500/20 bg-emerald-900/10 px-4 py-3"
              >
                <div className="flex items-start gap-2">
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300">
                    {story.id}
                  </span>
                  <span className="text-sm text-emerald-100">
                    {story.title}
                  </span>
                </div>
                {story.category && categoryLabels[story.category] && (
                  <div className="mt-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/30 px-2 py-0.5 text-xs text-slate-400">
                      {categoryLabels[story.category].icon}
                      {categoryLabels[story.category].label}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-2xl border border-slate-600/30 bg-gradient-to-r from-slate-800/40 to-slate-900/40 p-6 text-center shadow-xl">
          <h3 className="mb-2 text-lg font-semibold text-white">
            Prochaine action technique
          </h3>
          <p className="mb-4 text-slate-300">
            Finaliser{" "}
            <strong className="text-amber-300">T22 Tests Jest 70%</strong> puis{" "}
            <strong className="text-amber-300">T23 CI/CD GitHub Actions</strong>
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/finance/backlog"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg transition hover:bg-indigo-500"
            >
              Backlog Fonctionnel
            </Link>
            <Link
              href="/strategie"
              className="rounded-lg border border-purple-500/50 bg-purple-900/30 px-5 py-2.5 text-sm font-medium text-purple-200 transition hover:bg-purple-800/30"
            >
              Stratégie 2026
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
