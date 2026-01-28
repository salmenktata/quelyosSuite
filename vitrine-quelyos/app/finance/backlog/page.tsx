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
  Globe,
  TrendingUp,
} from "lucide-react";
import { logger } from "@/lib/logger";

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
  market?: "france" | "tunisie" | "maghreb" | "golf" | "global";
};

const defaultStories: Story[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // FONCTIONNEL - LIVRÉES (37) 🇫🇷 — Mise à jour 10 déc. 2025
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "F1",
    title:
      "Authentification complète : login, register, forgot password, reset password, refresh tokens, démo user",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F2",
    title:
      "Dashboard pilotage KPIs temps réel : solde global, revenus/dépenses mois, évolution %, graphiques",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F3",
    title:
      "Gestion comptes bancaires CRUD : types (banque/cash/crypto), devises, balance, institution, portfolios",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F4",
    title:
      "Gestion catégories CRUD : types revenus/dépenses, couleurs hex, icônes, sous-catégories",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F5",
    title:
      "Gestion transactions CRUD : montants HT/TTC, TVA, description, dates, statut, recurring",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F6",
    title:
      "Gestion budgets : création, suivi mensuel, alertes dépassement, progress bars",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F7",
    title:
      "Gestion portefeuilles : CRUD, regroupement comptes multiples, balance agrégée",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F8",
    title:
      "Paramètres company : devise défaut, langue FR/EN, timezone, TVA rates, logo",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F9",
    title:
      "Utilisateur démo auto-créé : demo@quelyos.test / changeme, role ADMIN, Demo Company",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F10",
    title:
      "Reporting avancé : 3 modes (Réel/Prévisionnel/Combiné), filtres 7/30/60/90j, drill-down",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F11",
    title:
      "Prévisions trésorerie : horizons 30/60/90j, balance projetée, impact futur, daily breakdown",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F12",
    title:
      "Import fichiers CSV/Excel : upload, preview colonnes, mapping automatique, bulk insert",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F13",
    title:
      "Gestion utilisateurs admin : CRUD users, assignation rôles ADMIN/MANAGER/USER/VIEWER",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F14",
    title:
      "Landing page B2C : hero section, features, pricing, CTA, navigation responsive",
    status: "done",
    priority: "none",
    market: "france",
  },
  {
    id: "F15",
    title:
      "Notifications in-app : toast messages, badge compteurs, historique localStorage, panel dropdown",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F16",
    title:
      "Onboarding guidé 5 étapes : welcome, create account/category/budget, setup preferences",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F17",
    title:
      "UX transactions : filtres multi-critères, édition inline, bulk actions, tri colonnes",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F18",
    title:
      "Charts interactifs Recharts : Area/Bar/Line/Pie, tooltips custom, animations, page démo",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F19",
    title:
      "🚀 Scénarios manuels : ajustement ±10/20/30% sur prévisions, visualisation côte-à-côte, sauvegarde nommée",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F20",
    title:
      "🚀 Template Agence Web 🇫🇷 : catégories (Salaires 60%, Freelances 20%, Marketing 10%, Hébergement 10%), KPIs runway/CAC",
    status: "done",
    priority: "none",
    market: "france",
  },
  {
    id: "F21",
    title:
      "🚀 Landing page TPE 🇫🇷 : messaging 'Dormez tranquille : trésorerie pilotée 90j', hero CEO agence, CTA simulateur",
    status: "done",
    priority: "none",
    market: "france",
  },
  {
    id: "F22",
    title:
      "🚀 UX Glassmorphism : backdrop-blur cards dashboard, gradients subtils indigo/purple, shadows depth",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F23",
    title:
      "🚀 Dark mode intelligent : toggle header, persistence localStorage, respect prefers-color-scheme OS",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F24",
    title:
      "📊 Page Stratégie Produit 2026 : vision, personas, roadmap Q1-Q4, pricing multi-régions, KPIs cibles",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F72",
    title:
      "📊 Sous-navigation rapports (ReportingNav) : menu horizontal 8 rapports, icônes lucide-react, state actif, scroll fluide",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F73",
    title:
      "📊 Rapport par portefeuille : vue consolidée balance+comptes par portfolio, drill-down expansible, KPIs agrégés",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F74",
    title:
      "📊 Groupement comptes par portefeuille : sections visuelles avec headers icône Briefcase, 'Comptes non assignés' séparés",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F75",
    title:
      "🎨 Dashboard redesign complet : Hero KPIs (trésorerie + évolution), Alertes (2) + Actions (3), Timeline 90j, Quick Actions (5), Insights AI (3), Activité récente (5 transactions)",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F76",
    title:
      "🔧 Réorganisation Paramètres : 3 groupes thématiques (Config base/Données métier/Préférences), sous-menu sidebar 7 liens, suppression redondance Comptes",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F77",
    title:
      "📊 Menu Rapports sidebar : 8 sous-liens directs (Hub, Vue ensemble, Catégorie, Flux, Compte, Portefeuille, Rentabilité, Cashflow) avec bordure indigo",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F78",
    title:
      "🌐 Charts déplacés vers site vitrine : /features/charts avec CTA conversion, intégré menu Features, SiteHeader public",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F79",
    title:
      "🎯 Landing page section Nouveautés : 3 cards (Portefeuille/Flux/Navigation), lien backlog, badges décembre 2025",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F80",
    title:
      "🔄 Amélioration UX sous-menus : bordure gauche indigo-500, text-xs, spacing réduit, font-semibold actif",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F81",
    title:
      "🧪 Tests Dashboard complets : 8 pages testées (home, accounts, expenses, budgets, forecast, reporting, settings, incomes), 237 tests passent",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F82",
    title:
      "🛠️ CI/CD GitHub Actions : 4 workflows (test, deploy-api, deploy-frontend, migrate-db), 6 secrets, tests PostgreSQL intégrés",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F83",
    title:
      "📊 Backlog Produit & Technique : pages dédiées avec filtres marché/catégorie, stats temps réel, localStorage sync",
    status: "done",
    priority: "none",
    market: "global",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎯 PRIORISATION PME/TPE 2026 — IMPACT CASH & VALEUR BUSINESS
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // MÉTHODOLOGIE DE PRIORISATION
  // Axe 1 : Impact cash immédiat (haut → bas)
  // Axe 2 : Valeur perçue TPE vs PME
  // Axe 3 : Effort/Impact ratio (Quick Wins → Scale)
  //
  // TOP 6 PRIORITÉS PAR VALEUR BUSINESS :
  //
  // 1️⃣ ENCAISSEMENT CLIENT — Valeur TPE/PME: ⭐⭐⭐⭐⭐ TRÈS ÉLEVÉ
  //    Impact: Amélioration directe du cash, réduction DSO (Days Sales Outstanding)
  //    Features: Factures + relances auto J+7/J+15 + liens paiement Stripe
  //    Effort: M (3-6 sem) | Dépendance: PSP Stripe
  //    → Story F90 (Q2)
  //
  // 2️⃣ RAPPROCHEMENT BANCAIRE — Valeur TPE/PME: ⭐⭐⭐⭐⭐ TRÈS ÉLEVÉ
  //    Impact: Gain de temps 80%, fiabilité données comptables, audit trail
  //    Features: Matching auto + règles no-code + justificatifs attachés
  //    Effort: M/L (4-8 sem) | MVP possible via CSV
  //    → Story F91 (Q2)
  //
  // 3️⃣ ALERTES TRÉSORERIE + SCÉNARIOS — Valeur TPE/PME: ⭐⭐⭐⭐⭐ TRÈS ÉLEVÉ
  //    Impact: Prévention ruptures cash, anticipation crises, décisions éclairées
  //    Features: Seuils personnalisés + prévisions négatives 30/60/90j + what-if
  //    Effort: S/M (2-4 sem) | S'appuie sur prévisions existantes
  //    → Stories F93 (Q1) + F35 (Q2)
  //
  // 4️⃣ EXPORTS COMPTA + CONNECTEURS — Valeur TPE: ⭐⭐⭐ MOYEN | PME: ⭐⭐⭐⭐ ÉLEVÉ
  //    Impact: Fluidifie clôture comptable, réduit interventions expert-comptable
  //    Features: FEC France + exports Excel + API Pennylane/Indy
  //    Effort: M/L (4-10 sem) | Dépendance: APIs tierces
  //    → Stories F40 (Q2) + F94 nouveau
  //
  // 5️⃣ ÉCHÉANCIER FOURNISSEURS — Valeur TPE/PME: ⭐⭐⭐ MOYEN
  //    Impact: Meilleur pilotage sorties, optimisation cash, négociations délais
  //    Features: Planification paiements + priorisation + scénarios décalage
  //    Effort: S/M (2-4 sem)
  //    → Story F92 (Q1)
  //
  // 6️⃣ APPROBATIONS + AUDIT TRAIL — Valeur TPE: ⭐⭐ FAIBLE/MOYEN | PME: ⭐⭐⭐⭐ ÉLEVÉ
  //    Impact: Gouvernance, conformité, traçabilité des décisions
  //    Features: Workflows validation + droits granulaires + logs immutables
  //    Effort: M (3-5 sem)
  //    → Story F95 nouveau
  //
  // ROADMAP EXÉCUTION (M0–M4) :
  // M0–M1: Encaissement rapide (F90) + Alertes cash (F93)
  // M1–M2: Rapprochement bancaire (F91) + règles catégorisation
  // M2–M3: Scénarios what-if avancés (F35) + notifications Slack/email
  // M3–M4: Exports compta (F40, F94) + Workflows approbation (F95)
  // ═══════════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════════
  // FONCTIONNEL - Q1 2026 QUICK WINS 🚀 (8 semaines restantes) — FRANCE
  // Objectif : Différenciation immédiate, valeur perçue forte, effort modéré
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "F25",
    title:
      "🚀 Template Cabinet Conseil 🇫🇷 : catégories (Salaires 70%, Déplacements 15%, Formation 10%, Outils 5%), KPIs taux intercontrats/marge mission",
    status: "done",
    priority: "none",
    market: "france",
  },
  {
    id: "F26",
    title:
      "🚀 Template Bureau Études 🇫🇷 : catégories (Salaires 50%, R&D 30%, Matériel 15%, Logiciels 5%), KPIs coût projet/rentabilité contrat",
    status: "done",
    priority: "none",
    market: "france",
  },
  {
    id: "F27",
    title:
      "🚀 Social proof secteur : témoignages Thomas CEO agence web, Sophie DAF cabinet conseil, logos clients premium",
    status: "todo",
    priority: "q1-quick-win",
    effort: "3j",
    impact: "medium",
    market: "france",
  },
  {
    id: "F28",
    title:
      "🚀 Micro-animations Framer Motion : transitions pages, hover cards, loading skeletons, success feedback",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F29",
    title:
      "🚀 Onboarding sectoriel : sélection secteur étape 1, pré-remplissage template adapté, time-to-value < 5min",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F30",
    title:
      "🚀 SEO optimisé TPE : meta tags 'prévisions trésorerie TPE', structured data, sitemap, robots.txt",
    status: "done",
    priority: "none",
    market: "france",
  },
  {
    id: "F31",
    title:
      "🚀 Page Pricing détaillée : comparatif Freemium/Pro/Expert, FAQ, calculateur ROI, CTA essai gratuit",
    status: "done",
    priority: "none",
    market: "france",
  },
  {
    id: "F32",
    title:
      "🚀 Page Contact/Support : formulaire, FAQ enrichie, liens Discord/email, chatbot placeholder",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F84",
    title:
      "🚀 Parcours démo vidéo : vidéo 2min YouTube embed, highlights features clés, CTA 'Essayer maintenant'",
    status: "todo",
    priority: "q1-quick-win",
    effort: "2j",
    impact: "high",
    market: "france",
  },
  {
    id: "F85",
    title:
      "🚀 Guide utilisateur intégré : GuideTour interactif (4 tours), HelpButton flottant avec FAQ, raccourci ?, tooltips contextuels, Zustand persist",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F86",
    title:
      "🚀 Export transactions CSV/PDF : bouton export dashboard, filtré par période/compte, branding",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F87",
    title:
      "🚀 Widget solde temps réel : badge header avec solde actuel, variation 24h, click → dashboard",
    status: "todo",
    priority: "q1-quick-win",
    effort: "1j",
    impact: "medium",
    market: "global",
  },
  {
    id: "F92",
    title:
      "🚀 💰 [PRIORITÉ #5 PME/TPE] Échéancier fournisseurs : planification paiements, priorisation par date/impact cash, scénarios décalage 7/15/30j, optimisation trésorerie",
    status: "todo",
    priority: "q1-quick-win",
    effort: "2-4 sem",
    impact: "medium",
    market: "global",
  },
  {
    id: "F93",
    title:
      "🚀 💰 [PRIORITÉ #3 PME/TPE] Alertes trésorerie + scénarios what-if : seuils personnalisés, prévisions négatives 30/60/90j, simulations impact décisions, notifications email/Slack",
    status: "todo",
    priority: "q1-quick-win",
    effort: "2-4 sem",
    impact: "high",
    market: "global",
  },
  {
    id: "F88",
    title:
      "🔒 Page Sécurité : changement mot de passe, 2FA TOTP (Google Authenticator), gestion sessions actives",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F89",
    title:
      "📅 Périodes budget configurables : hebdomadaire/mensuel/trimestriel/annuel/personnalisé, date début/fin",
    status: "done",
    priority: "none",
    market: "global",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FONCTIONNEL - Q2 2026 PREMIUM ⭐ (32 semaines total) — FRANCE
  // Objectif : Killer features différenciantes, justification pricing Pro/Expert
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "F33",
    title:
      "⭐ ML Forecasting Prophet.js : prévisions 7/30/90/180j, entraînement historique 12 mois, détection saisonnalité, MAE < 10%",
    status: "todo",
    priority: "q2-premium",
    effort: "6 sem",
    impact: "high",
    market: "global",
  },
  {
    id: "F34",
    title:
      "⭐ Intégration Bridge API 🇫🇷🇪🇺 : connexion 350+ banques FR/EU, sync quotidien auto, catégorisation ML suggestions",
    status: "todo",
    priority: "q2-premium",
    effort: "10 sem",
    impact: "high",
    market: "france",
  },
  {
    id: "F35",
    title:
      "⭐ Simulateur scénarios avancé : impact embauche CDI (salaire + charges), perte client (CA récurrent), retard paiement 60j",
    status: "todo",
    priority: "q2-premium",
    effort: "4 sem",
    impact: "high",
    market: "global",
  },
  {
    id: "F36",
    title:
      "⭐ Suggestions actions intelligentes : 'Relancer Client ACME facture #1234', 'Décaler embauche 2 mois', 'Négocier étalement charges'",
    status: "todo",
    priority: "q2-premium",
    effort: "3 sem",
    impact: "high",
    market: "global",
  },
  {
    id: "F37",
    title:
      "⭐ Alertes intelligentes ML : détection anomalies dépenses (outliers), seuils dynamiques, tendances négatives 3 mois",
    status: "todo",
    priority: "q2-premium",
    effort: "4 sem",
    impact: "high",
    market: "global",
  },
  {
    id: "F38",
    title:
      "⭐ Réconciliation bancaire ML : matching description + montant ±2% + date ±3j, apprentissage utilisateur",
    status: "todo",
    priority: "q2-premium",
    effort: "3 sem",
    impact: "medium",
    market: "france",
  },
  {
    id: "F39",
    title:
      "⭐ Dashboard prévisions amélioré : graphique interactif 180j, zone de confiance ML, indicateur risque trésorerie",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F40",
    title:
      "⭐ 💰 [PRIORITÉ #4 PME/TPE] Export comptable FEC/Excel : formats conformes France, préparation clôture expert-comptable, rapports mensuels auto, réduction interventions",
    status: "todo",
    priority: "q2-premium",
    effort: "3-5 sem",
    impact: "medium",
    market: "france",
  },
  {
    id: "F41",
    title:
      "⭐ Stripe Billing intégration : paiements récurrents, gestion abonnements Pro/Expert, factures automatiques",
    status: "todo",
    priority: "q2-premium",
    effort: "4 sem",
    impact: "high",
    market: "global",
  },
  {
    id: "F90",
    title:
      "⭐ 💰 [PRIORITÉ #1 PME/TPE] Encaissement client : factures simples, relances auto J+7/J+15/J+30, liens paiement Stripe, suivi retards & promesses, impact DSO direct",
    status: "todo",
    priority: "q2-premium",
    effort: "3-6 sem",
    impact: "high",
    market: "global",
  },
  {
    id: "F91",
    title:
      "⭐ 💰 [PRIORITÉ #2 PME/TPE] Rapprochement bancaire : matching auto description+montant±2%+date±3j, règles catégorisation no-code, justificatifs PDF attachés, gain temps 80%",
    status: "todo",
    priority: "q2-premium",
    effort: "4-8 sem",
    impact: "high",
    market: "global",
  },
  {
    id: "F94",
    title:
      "⭐ 💰 [PRIORITÉ #4 PME/TPE] Connecteurs comptables : API Pennylane/Indy FR, sync bi-directionnelle transactions, export FEC auto, validation expert-comptable intégrée",
    status: "todo",
    priority: "q2-premium",
    effort: "6-10 sem",
    impact: "medium",
    market: "france",
  },
  {
    id: "F95",
    title:
      "⭐ 💰 [PRIORITÉ #6 PME/TPE] Workflows approbation + Audit trail : validation dépenses multi-niveaux, droits granulaires par rôle, logs immutables, conformité PME",
    status: "todo",
    priority: "q2-premium",
    effort: "3-5 sem",
    impact: "medium",
    market: "global",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FONCTIONNEL - Q3 2026 EXPANSION TUNISIE 🇹🇳
  // Objectif : Lancement marché Tunisie, adaptation locale
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "F42",
    title:
      "🇹🇳 Interface bilingue FR/AR : sélecteur langue, traductions complètes, formatage nombres locaux",
    status: "todo",
    priority: "q3-scale",
    effort: "4 sem",
    impact: "high",
    market: "tunisie",
  },
  {
    id: "F43",
    title:
      "🇹🇳 Templates TPE Tunisie : Startup Tech TN (Karim persona), SSII TN, Commerce TN avec catégories CNSS/charges locales",
    status: "todo",
    priority: "q3-scale",
    effort: "2 sem",
    impact: "high",
    market: "tunisie",
  },
  {
    id: "F44",
    title:
      "🇹🇳 Landing page Tunisie : messaging adapté, pricing TND (49/149 TND), témoignages locaux, partenaires incubateurs",
    status: "todo",
    priority: "q3-scale",
    effort: "1 sem",
    impact: "high",
    market: "tunisie",
  },
  {
    id: "F45",
    title:
      "🇹🇳 Onboarding Tunisie : sélection pays → templates locaux, TVA TN auto-configurée (7/13/19%)",
    status: "todo",
    priority: "q3-scale",
    effort: "1 sem",
    impact: "high",
    market: "tunisie",
  },
  {
    id: "F46",
    title:
      "🇹🇳 Partenariats Tunisie : intégration Flat6Labs, Startup Tunisia, CJD Tunisie pour acquisition",
    status: "todo",
    priority: "q3-scale",
    effort: "2 sem",
    impact: "high",
    market: "tunisie",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FONCTIONNEL - Q3+ 2026 SCALE 📅 (après Product-Market Fit France)
  // Objectif : Expansion marché, nouveaux segments, automatisation
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "F47",
    title:
      "📅 Mode multi-entreprises : switch company dropdown, dashboard consolidé, permissions experts-comptables",
    status: "todo",
    priority: "q3-scale",
    effort: "6 sem",
    impact: "high",
    market: "global",
  },
  {
    id: "F48",
    title:
      "📅 Templates +6 secteurs : Restaurant, E-commerce, SaaS, Freelance, Retail, BTP avec onboarding adapté",
    status: "todo",
    priority: "q3-scale",
    effort: "4 sem",
    impact: "medium",
    market: "france",
  },
  {
    id: "F49",
    title:
      "📅 IA assistant chatbot : recommendations budgets, détection dépenses inhabituelles, insights cash flow naturel",
    status: "todo",
    priority: "q3-scale",
    effort: "8 sem",
    impact: "medium",
    market: "global",
  },
  {
    id: "F50",
    title:
      "📅 Rapports comptables conformes : bilan simplifié, compte résultat, exports FEC, validation expert-comptable",
    status: "todo",
    priority: "q3-scale",
    effort: "4 sem",
    impact: "medium",
    market: "france",
  },
  {
    id: "F94",
    title:
      "📅 Connecteurs expert-comptable 🇫🇷 : Sage/Cegid/Pennylane, sync journaux, mapping plan comptable, exports prêts clôture",
    status: "todo",
    priority: "q3-scale",
    effort: "8 sem",
    impact: "high",
    market: "france",
  },
  {
    id: "F95",
    title:
      "📅 Workflows d'approbation dépenses : validation multi-niveaux, seuils par montant, piste d'audit finance",
    status: "todo",
    priority: "q3-scale",
    effort: "4 sem",
    impact: "medium",
    market: "global",
  },
  {
    id: "F51",
    title:
      "📅 Notifications push/email : budgets dépassés, rappels factures, résumés hebdo/mensuels, preferences opt-in",
    status: "todo",
    priority: "q3-scale",
    effort: "3 sem",
    impact: "medium",
    market: "global",
  },
  {
    id: "F52",
    title:
      "📅 Mobile PWA responsive : dashboard optimisé tactile, scan OCR factures, mode offline-first",
    status: "todo",
    priority: "q3-scale",
    effort: "6 sem",
    impact: "medium",
    market: "global",
  },
  {
    id: "F53",
    title:
      "📅 Analytics avancés : entonnoir conversion, cohortes utilisateurs, heatmaps usage, A/B testing",
    status: "todo",
    priority: "q3-scale",
    effort: "4 sem",
    impact: "medium",
    market: "global",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FONCTIONNEL - 2027 EXPANSION MAGHREB 🇩🇿🇲🇦
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "F54",
    title:
      "🇩🇿🇲🇦 Landing pages Maghreb : pricing local (DZD 2500 / MAD 150), témoignages Fatima (Casablanca), partenaires locaux",
    status: "todo",
    priority: "backlog",
    effort: "2 sem",
    impact: "high",
    market: "maghreb",
  },
  {
    id: "F55",
    title:
      "🇩🇿🇲🇦 Templates TPE Maghreb : Agence Com Casablanca (Fatima persona), Import-Export Alger, adapté charges locales",
    status: "todo",
    priority: "backlog",
    effort: "2 sem",
    impact: "medium",
    market: "maghreb",
  },
  {
    id: "F56",
    title:
      "🇩🇿🇲🇦 Intégrations bancaires Maghreb : exploration APIs BIAT, Attijari, CIH (partenariats directs)",
    status: "todo",
    priority: "backlog",
    effort: "8 sem",
    impact: "high",
    market: "maghreb",
  },
  {
    id: "F57",
    title:
      "🇩🇿🇲🇦 Paiements locaux : intégration Flouci (TN), PayGate (DZ), CMI (MA) pour abonnements régionaux",
    status: "todo",
    priority: "backlog",
    effort: "6 sem",
    impact: "high",
    market: "maghreb",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FONCTIONNEL - 2027-2028 EXPANSION GOLF 🇦🇪🇸🇦🇶🇦
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "F58",
    title:
      "🇦🇪🇸🇦🇶🇦 Interface EN/AR Golf : anglais business + arabe, format nombres 1,234.56, RTL complet",
    status: "todo",
    priority: "backlog",
    effort: "3 sem",
    impact: "high",
    market: "golf",
  },
  {
    id: "F59",
    title:
      "🇦🇪🇸🇦🇶🇦 Landing page Golf : messaging premium 'Enterprise Treasury', pricing Expert (AED 349), logos Dubai/Riyadh",
    status: "todo",
    priority: "backlog",
    effort: "2 sem",
    impact: "high",
    market: "golf",
  },
  {
    id: "F60",
    title:
      "🇦🇪🇸🇦🇶🇦 Templates PME Golf : Consulting Dubaï, Trading Saoudien, Tech Qatar avec charges locales",
    status: "todo",
    priority: "backlog",
    effort: "2 sem",
    impact: "medium",
    market: "golf",
  },
  {
    id: "F61",
    title:
      "🇦🇪🇸🇦🇶🇦 Intégrations bancaires Golf : Emirates NBD, Al Rajhi, QNB (partenariats premium)",
    status: "todo",
    priority: "backlog",
    effort: "12 sem",
    impact: "high",
    market: "golf",
  },
  {
    id: "F62",
    title:
      "🇦🇪🇸🇦🇶🇦 Conformité VAT UAE/KSA : TVA 5%/15%, facturation conforme ZATCA (Arabie), déclarations auto",
    status: "todo",
    priority: "backlog",
    effort: "4 sem",
    impact: "high",
    market: "golf",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FONCTIONNEL - Backlog général (post-PMF)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "F63",
    title:
      "📅 Partage sécurisé : liens read-only expiration 7/30/90j, password optionnel, tracking views analytics",
    status: "todo",
    priority: "backlog",
    effort: "2 sem",
    impact: "low",
    market: "global",
  },
  {
    id: "F64",
    title:
      "📅 Gestion équipe avancée : invitations email, rôles custom par resource, audit log actions utilisateurs",
    status: "todo",
    priority: "backlog",
    effort: "4 sem",
    impact: "medium",
    market: "global",
  },
  {
    id: "F65",
    title:
      "📅 API publique REST : documentation OpenAPI, rate limiting, clés API, webhooks sortants",
    status: "todo",
    priority: "backlog",
    effort: "6 sem",
    impact: "medium",
    market: "global",
  },
  {
    id: "F66",
    title:
      "📅 Intégrations tierces : Zapier, Make, n8n pour automatisation workflows clients",
    status: "todo",
    priority: "backlog",
    effort: "4 sem",
    impact: "low",
    market: "global",
  },
  {
    id: "F67",
    title:
      "📅 Marketplace templates : templates communautaires, système de notes/reviews, monétisation créateurs",
    status: "todo",
    priority: "backlog",
    effort: "8 sem",
    impact: "low",
    market: "global",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FONCTIONNEL - Enrichissements stratégie 2026 (ajoutés 9 déc. 2025)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "F68",
    title:
      "🚀 Analytics conversion : tracking funnel signup→activation→Pro, heatmaps pages clés, A/B tests landing",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F69",
    title:
      "🚀 Feedback NPS in-app : enquête satisfaction 30j/90j, score NPS > 40 cible, collecte témoignages auto",
    status: "done",
    priority: "none",
    market: "global",
  },
  {
    id: "F70",
    title:
      "🚀 Mode démo interactif : parcours guidé dashboard avec données fictives, CTA 'Créer mon compte' contextuel",
    status: "done",
    priority: "none",
    market: "france",
  },
  {
    id: "F71",
    title:
      "⭐ Comparateur concurrents : page 'Quelyos vs Pennylane/Agicap/Qonto', tableau features, arguments différenciants",
    status: "done",
    priority: "none",
    market: "france",
  },
];

const marketLabels: Record<
  string,
  { label: string; flag: string; color: string }
> = {
  global: { label: "Global", flag: "🌍", color: "slate" },
  france: { label: "France", flag: "🇫🇷", color: "blue" },
  tunisie: { label: "Tunisie", flag: "🇹🇳", color: "red" },
  maghreb: { label: "Maghreb", flag: "🇩🇿🇲🇦", color: "emerald" },
  golf: { label: "Golf", flag: "🇦🇪", color: "amber" },
};

const impactLabels = {
  high: { label: "HAUT", color: "emerald" },
  medium: { label: "MOYEN", color: "amber" },
  low: { label: "BAS", color: "slate" },
};

const statusLabels: Record<
  StoryStatus,
  { label: string; icon: string; bgColor: string; textColor: string }
> = {
  done: {
    label: "Livré",
    icon: "✅",
    bgColor: "bg-emerald-500/30",
    textColor: "text-emerald-300",
  },
  "in-progress": {
    label: "En cours",
    icon: "🔄",
    bgColor: "bg-amber-500/30",
    textColor: "text-amber-300",
  },
  todo: {
    label: "À faire",
    icon: "📋",
    bgColor: "bg-slate-500/30",
    textColor: "text-slate-300",
  },
};

export default function BacklogPage() {
  // Toujours initialiser avec defaultStories pour éviter erreur hydratation
  const [stories, setStories] = useState<Story[]>(() => {
    if (typeof window === "undefined") return defaultStories;
    const raw = window.localStorage.getItem("backlogFuncStoriesV1");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Story[];
        // Vérifier si les données stockées sont à jour (même nombre de stories)
        if (parsed.length === defaultStories.length) {
          return parsed;
        } else {
          // Reset si structure changée
          window.localStorage.removeItem("backlogFuncStoriesV1");
        }
      } catch (e) {
        logger.error("Cannot parse backlog func storage", e);
      }
    }
    return defaultStories;
  });
  const [filterMarket, setFilterMarket] = useState<string | null>(null);
  const mountedRef = useRef(false);

  // Marquer comme monté
  useEffect(() => {
    mountedRef.current = true;
  }, []);

  // Sauvegarder dans localStorage uniquement après montage
  useEffect(() => {
    if (!mountedRef.current) return;
    window.localStorage.setItem(
      "backlogFuncStoriesV1",
      JSON.stringify(stories)
    );
  }, [stories]);

  const countByStatus = (status: StoryStatus) =>
    stories.filter((s) => s.status === status).length;
  const countByPriority = (priority: StoryPriority) =>
    stories.filter((s) => s.priority === priority).length;
  const countByMarket = (market: string) =>
    stories.filter((s) => s.market === market).length;

  const filteredStories = filterMarket
    ? stories.filter((s) => s.market === filterMarket)
    : stories;

  const getDone = () => filteredStories.filter((s) => s.status === "done");
  const getByPriority = (priority: StoryPriority) =>
    filteredStories.filter((s) => s.priority === priority);

  // Composant pour afficher le badge de statut
  const StatusBadge = ({ status }: { status: StoryStatus }) => {
    const { label, icon, bgColor, textColor } = statusLabels[status];
    return (
      <span
        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${bgColor} ${textColor}`}
      >
        {icon} {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <Container className="space-y-8 py-12 pt-24">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200">
              Backlog Produit
            </p>
            <Link
              href="/backlog-technique"
              className="flex items-center gap-1.5 rounded-full bg-slate-500/20 px-3 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-500/30"
            >
              Backlog Technique →
            </Link>
            <Link
              href="/strategie"
              className="flex items-center gap-1.5 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-300 transition hover:bg-purple-500/30"
            >
              <Target className="h-3 w-3" />
              Stratégie 2026
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            Roadmap Produit 2026 — Expansion Internationale
            <span className="text-sm px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 font-medium">
              MVP 70% ✓
            </span>
          </h1>
          <p className="max-w-3xl text-base text-indigo-100/90 leading-relaxed">
            <strong className="text-emerald-300">
              {countByStatus("done")} features livrées
            </strong>{" "}
            (Dashboard KPIs, Comptes, Transactions, Budgets, Prévisions 30-180j,
            Rapports 8 types, Auth complète, Demo mode, Design system, Templates
            sectoriels).{" "}
            <strong className="text-white">
              {countByStatus("todo")} planifiées
            </strong>{" "}
            pour MVP 100% puis expansion: <span className="text-blue-300">🇫🇷 France</span> →{" "}
            <span className="text-red-300">🇹🇳 Tunisie</span> →{" "}
            <span className="text-emerald-300">🇩🇿🇲🇦 Maghreb</span> →{" "}
            <span className="text-amber-300">🇦🇪 Golf</span>
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
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-900/30 p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {countByPriority("q1-quick-win")}
                </p>
                <p className="text-xs text-emerald-200">Q1 Quick Wins</p>
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
                <p className="text-xs text-purple-200">Q2 Premium</p>
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
                <p className="text-xs text-blue-200">Q3+ Scale</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-900/30 p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {countByPriority("backlog")}
                </p>
                <p className="text-xs text-amber-200">2027-2028</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-900/30 p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {stories.length}
                </p>
                <p className="text-xs text-indigo-200">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Market Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterMarket(null)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              !filterMarket
                ? "bg-white text-slate-900"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Tous les marchés ({stories.length})
          </button>
          {Object.entries(marketLabels).map(([key, { label, flag }]) => (
            <button
              key={key}
              onClick={() => setFilterMarket(key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filterMarket === key
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {flag} {label} ({countByMarket(key)})
            </button>
          ))}
        </div>

        {/* Q1 2026 Quick Wins */}
        {getByPriority("q1-quick-win").length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                <Rocket className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  🚀 Q1 2026 — Quick Wins (10 semaines)
                </h2>
                <p className="text-sm text-emerald-200">
                  Valeur immédiate, différenciation rapide — Focus France 🇫🇷
                </p>
              </div>
              <span className="ml-auto rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-bold text-emerald-300">
                {getByPriority("q1-quick-win").length} features
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {getByPriority("q1-quick-win").map((story) => (
                <div
                  key={story.id}
                  className={`rounded-xl border p-4 shadow-lg ${
                    story.status === "done"
                      ? "border-emerald-400/50 bg-emerald-900/30"
                      : story.status === "in-progress"
                        ? "border-amber-400/50 bg-amber-900/20"
                        : "border-emerald-500/30 bg-emerald-900/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 rounded bg-emerald-500/30 px-2 py-0.5 text-xs font-bold text-emerald-200">
                        {story.id}
                      </span>
                      <span
                        className={`text-sm font-medium ${story.status === "done" ? "text-emerald-100" : "text-emerald-50"}`}
                      >
                        {story.title}
                      </span>
                    </div>
                    <StatusBadge status={story.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
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
                    {story.market && marketLabels[story.market] && (
                      <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-slate-300">
                        {marketLabels[story.market].flag}
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
                  ⭐ Q2 2026 — Premium (24 semaines)
                </h2>
                <p className="text-sm text-purple-200">
                  Killer features ML + Banking — Justification pricing
                  Pro/Expert
                </p>
              </div>
              <span className="ml-auto rounded-full bg-purple-500/20 px-3 py-1 text-sm font-bold text-purple-300">
                {getByPriority("q2-premium").length} features
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {getByPriority("q2-premium").map((story) => (
                <div
                  key={story.id}
                  className={`rounded-xl border p-4 shadow-lg ${
                    story.status === "done"
                      ? "border-emerald-400/50 bg-emerald-900/30"
                      : story.status === "in-progress"
                        ? "border-amber-400/50 bg-amber-900/20"
                        : "border-purple-500/30 bg-purple-900/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 rounded bg-purple-500/30 px-2 py-0.5 text-xs font-bold text-purple-200">
                        {story.id}
                      </span>
                      <span
                        className={`text-sm font-medium ${story.status === "done" ? "text-emerald-100" : "text-purple-50"}`}
                      >
                        {story.title}
                      </span>
                    </div>
                    <StatusBadge status={story.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
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
                    {story.market && marketLabels[story.market] && (
                      <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-slate-300">
                        {marketLabels[story.market].flag}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Q3+ 2026 Scale + Tunisie */}
        {getByPriority("q3-scale").length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  📅 Q3+ 2026 — Scale & Expansion Tunisie 🇹🇳
                </h2>
                <p className="text-sm text-blue-200">
                  Lancement marché tunisien + consolidation France
                </p>
              </div>
              <span className="ml-auto rounded-full bg-blue-500/20 px-3 py-1 text-sm font-bold text-blue-300">
                {getByPriority("q3-scale").length} features
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {getByPriority("q3-scale").map((story) => (
                <div
                  key={story.id}
                  className={`rounded-xl border p-4 shadow-lg ${
                    story.status === "done"
                      ? "border-emerald-400/50 bg-emerald-900/30"
                      : story.status === "in-progress"
                        ? "border-amber-400/50 bg-amber-900/20"
                        : "border-blue-500/30 bg-blue-900/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 rounded bg-blue-500/30 px-2 py-0.5 text-xs font-bold text-blue-200">
                        {story.id}
                      </span>
                      <span
                        className={`text-sm font-medium ${story.status === "done" ? "text-emerald-100" : "text-blue-50"}`}
                      >
                        {story.title}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <StatusBadge status={story.status} />
                    {story.effort && (
                      <span className="text-blue-300">⏱ {story.effort}</span>
                    )}
                    {story.market && marketLabels[story.market] && (
                      <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-slate-300">
                        {marketLabels[story.market].flag}{" "}
                        {marketLabels[story.market].label}
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                <Globe className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  🌍 2027-2028 — Expansion Maghreb & Golf
                </h2>
                <p className="text-sm text-amber-200">
                  Post Product-Market Fit — Algérie, Maroc, UAE, Arabie
                  Saoudite, Qatar
                </p>
              </div>
              <span className="ml-auto rounded-full bg-amber-500/20 px-3 py-1 text-sm font-bold text-amber-300">
                {getByPriority("backlog").length} features
              </span>
            </div>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {getByPriority("backlog").map((story) => (
                <div
                  key={story.id}
                  className={`rounded-lg border px-4 py-3 ${
                    story.status === "done"
                      ? "border-emerald-400/50 bg-emerald-900/30"
                      : story.status === "in-progress"
                        ? "border-amber-400/50 bg-amber-900/20"
                        : "border-amber-500/20 bg-amber-900/10"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300">
                      {story.id}
                    </span>
                    <span
                      className={`text-sm ${story.status === "done" ? "text-emerald-100" : "text-amber-100"}`}
                    >
                      {story.title}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StatusBadge status={story.status} />
                    {story.market && marketLabels[story.market] && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/30 px-2 py-0.5 text-xs text-slate-400">
                        {marketLabels[story.market].flag}{" "}
                        {marketLabels[story.market].label}
                      </span>
                    )}
                  </div>
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
                Base fonctionnelle solide en production
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
                <div className="mt-1.5">
                  <StatusBadge status="done" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-900/20 to-orange-900/20 p-6 text-center shadow-xl">
          <h3 className="mb-2 text-lg font-semibold text-white">
            Priorités Q1 2026 — Complétion MVP 100%
          </h3>
          <p className="mb-4 text-indigo-100/80">
            Focus sur les{" "}
            <strong className="text-amber-300">
              {countByPriority("q1-quick-win")} Quick Wins Q1
            </strong>{" "}
            pour finaliser MVP : Compléter 7 rapports (stubs → complets), enhancer
            module Budgets, export Excel/PDF, puis{" "}
            <strong className="text-emerald-300">
              {countByPriority("q2-premium")} features Premium Q2
            </strong>{" "}
            (Prophet.js ML, Bridge API bancaire, Stripe billing)
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/finance/backlog-technique"
              className="rounded-lg bg-slate-700 px-5 py-2.5 text-sm font-medium text-white shadow-lg transition hover:bg-slate-600"
            >
              Backlog Technique
            </Link>
            <Link
              href="/finance/roadmap"
              className="rounded-lg border border-emerald-500/50 bg-emerald-900/30 px-5 py-2.5 text-sm font-medium text-emerald-200 transition hover:bg-emerald-800/30"
            >
              Roadmap 2026
            </Link>
            <Link
              href="/finance/strategie"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg transition hover:bg-indigo-500"
            >
              Stratégie 2026
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
