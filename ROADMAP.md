# 🗺️ Roadmap Migration : 7 SaaS → Dashboard Unifié avec Éditions

**Durée totale** : 11 semaines  
**Objectif** : Migrer 7 SaaS indépendants vers une seule codebase avec système d'éditions  
**Date démarrage** : 2026-01-31

---

## 📊 Vue d'Ensemble

```
Phase 0: Préparation (S1)         ✅ TERMINÉE (100%)
├─ Phase 1: Finance (S2)          🔄 EN COURS (4/14 tâches)
├─ Phase 2: Team (S3)             ⏸️
├─ Phase 3: Sales (S4)            ⏸️
├─ Phase 4: Store (S5-6)          ⏸️
├─ Phase 5: Copilote (S7)         ⏸️
├─ Phase 6: Retail (S8-9)         ⏸️
├─ Phase 7: Support (S10)         ⏸️
└─ Phase 8: Consolidation (S11)   ⏸️
```

---

## ✅ Phase 0 : Préparation (Semaine 1) - TERMINÉE

**Objectif** : Mettre en place le système d'éditions

### **Livrables** ✅
- [x] `src/config/editions.ts` - 8 éditions définies
- [x] `src/lib/editionDetector.ts` - Détection build-time + runtime
- [x] `src/hooks/useBranding.ts` - Branding dynamique
- [x] `src/hooks/usePermissions.ts` - Double filtrage (édition + permissions)
- [x] `vite.config.ts` - Builds multi-éditions + tree-shaking
- [x] `package.json` - 21 scripts (dev:*, build:*, test:e2e:*)
- [x] `Dockerfile` - Multi-stage avec ARG EDITION
- [x] `docker-compose.yml` - 7 services parallèles
- [x] `.github/workflows/build-editions.yml` - CI/CD matrix
- [x] 24 tests unitaires (100% passent)
- [x] Tests E2E (Playwright)
- [x] Documentation complète

### **Métriques**
- ✅ 17 fichiers créés/modifiés
- ✅ 24/24 tests unitaires passent
- ✅ 8 éditions définies

**Statut** : ✅ **100% complète**

---

## 🔄 Phase 1 : Finance (Semaine 2) - EN COURS

**Objectif** : Valider système éditions avec SaaS le plus simple (0 page spécifique)

### **Tâches**
- [x] 1. Corriger bugs build (TransactionFormPage.tsx, useMarketingCampaigns.ts)
- [x] 2. Test dev Finance (`pnpm run dev:finance` port 3010)
- [x] 3. Analyser bundle size (568 KB, cible < 500 KB)
- [x] 4. Tests branding automatisés (e2e/branding-finance.spec.ts)
- [ ] 5. Login Finance User → vérifier accès limité
- [ ] 6. Login super-admin → vérifier accès limité (malgré super-admin)
- [ ] 7. Tests E2E complets (`pnpm run test:e2e:finance`)
- [ ] 8. Build Docker Finance
- [ ] 9. Déploiement staging (port 3010, parallèle apps/finance-os)
- [ ] 10. Tests users pilotes (5+ users)
- [ ] 11. Monitoring 48h (erreurs, perf)
- [ ] 12. Comparaison apps/finance-os vs dashboard-client
- [ ] 13. Switchover trafic → nouvelle version
- [ ] 14. Archivage apps/finance-os (sans suppression)

### **Critères de Succès**
- [x] Build réussit sans erreur
- [ ] Bundle size < 500 KB
- [ ] 0 module non-finance visible dans UI
- [ ] Branding Finance appliqué partout (vert #059669)
- [ ] Navigation /store bloquée (redirect /home)
- [ ] Tests E2E passent
- [ ] 0 régression fonctionnelle vs apps/finance-os

**Statut** : 🔄 **4/14 tâches complétées** (28%)

---

## ⏸️ Phase 2 : Team (Semaine 3)

**Objectif** : Valider avec SaaS simple (module hr pur, 10 hooks)

### **Tâches**
- [ ] 1. Audit pages team-os vs dashboard-client (vérifier identiques)
- [ ] 2. Build édition team (`pnpm run build:team`)
- [ ] 3. Tests régression (25+ pages hr)
- [ ] 4. Vérifier branding (cyan #0891B2, "Quelyos Team")
- [ ] 5. Build Docker team
- [ ] 6. Déploiement parallèle (port 3015)
- [ ] 7. Tests users pilotes (5+)
- [ ] 8. Switchover trafic
- [ ] 9. Monitoring 48h
- [ ] 10. Archivage apps/team-os

### **Complexité**
- **Difficulté** : Faible (module unique, 0 page spécifique)
- **Hooks métier** : 10
- **Pages spécifiques** : 0

**Statut** : ⏸️ **Pas démarrée**

---

## ⏸️ Phase 3 : Sales (Semaine 4)

**Objectif** : Valider multi-modules (crm + marketing)

### **Tâches**
- [ ] 1. Audit pages marketing spécifiques (si non présentes dashboard-client)
- [ ] 2. Migration pages manquantes → dashboard-client/src/pages/marketing/
- [ ] 3. Build édition sales (`pnpm run build:sales`)
- [ ] 4. Tests régression (35+ pages crm + marketing)
- [ ] 5. Vérifier branding (bleu #2563EB, "Quelyos Sales")
- [ ] 6. Vérifier switch modules (crm ↔ marketing)
- [ ] 7. Build Docker sales
- [ ] 8. Déploiement parallèle (port 3013)
- [ ] 9. Tests users pilotes
- [ ] 10. Switchover trafic
- [ ] 11. Archivage apps/sales-os

### **Particularités**
- **Modules** : crm + marketing (2 modules)
- **Switch modules** : Feature testée pour la première fois

**Statut** : ⏸️ **Pas démarrée**

---

## ⏸️ Phase 4 : Store (Semaines 5-6)

**Objectif** : Migrer SaaS complexe avec pages spécifiques

### **Complexité**
- **Difficulté** : Moyenne-Élevée
- **Hooks métier** : 40+
- **Pages spécifiques** : 10+ (theme builder, live shopping, etc.)

### **Tâches**
- [ ] 1. Migration hooks `apps/store-os/src/hooks/` → `dashboard-client/src/hooks/store/`
- [ ] 2. Migration pages spécifiques :
  - [ ] `themes/builder.tsx` → `dashboard-client/src/pages/store/themes/`
  - [ ] `live-events.tsx` → `dashboard-client/src/pages/store/`
  - [ ] `flash-sales.tsx`
  - [ ] `loyalty.tsx`
  - [ ] Autres pages store spécifiques
- [ ] 3. Mise à jour routes (App.tsx) + menus (config/modules.ts)
- [ ] 4. Tests exhaustifs (60+ pages store)
- [ ] 5. Vérifier branding (violet #7C3AED, "Quelyos Store")
- [ ] 6. Vérifier switch modules (store ↔ marketing)
- [ ] 7. Build Docker store
- [ ] 8. Déploiement parallèle (port 3011)
- [ ] 9. Tests users pilotes (10+ users, important pour e-commerce)
- [ ] 10. Monitoring 1 semaine (trafic e-commerce critique)
- [ ] 11. Switchover progressif (10% → 50% → 100%)
- [ ] 12. Archivage apps/store-os

### **Pages Spécifiques à Migrer**
```
apps/store-os/src/pages/
├── themes/
│   ├── builder.tsx          → Migration obligatoire
│   └── marketplace.tsx      → Migration obligatoire
├── live-events.tsx          → Migration obligatoire
├── flash-sales.tsx          → Migration obligatoire
├── loyalty.tsx              → Migration obligatoire
├── reviews.tsx              → Vérifier si existe dans dashboard-client
├── testimonials.tsx         → Vérifier si existe
└── blog.tsx                 → Vérifier si existe
```

**Statut** : ⏸️ **Pas démarrée**

---

## ⏸️ Phase 5 : Copilote (Semaine 7)

**Objectif** : Migrer GMAO + multi-modules (stock + hr)

### **Tâches**
- [ ] 1. Migration hooks GMAO (maintenance, équipements)
- [ ] 2. Migration pages GMAO spécifiques
- [ ] 3. Tests fonctionnels GMAO (workflows maintenance)
- [ ] 4. Vérifier branding (orange #EA580C, "Quelyos Copilote")
- [ ] 5. Vérifier switch modules (stock ↔ hr)
- [ ] 6. Build Docker copilote
- [ ] 7. Déploiement parallèle (port 3012)
- [ ] 8. Tests users pilotes
- [ ] 9. Switchover trafic
- [ ] 10. Archivage apps/copilote-ops

### **Particularités**
- **Modules** : stock + hr + GMAO
- **Complexité GMAO** : Workflows maintenance spécifiques

**Statut** : ⏸️ **Pas démarrée**

---

## ⏸️ Phase 6 : Retail (Semaines 8-9)

**Objectif** : Migrer SaaS le plus complexe (6 variantes POS)

### **Complexité**
- **Difficulté** : Très Élevée
- **Modules** : pos + store + stock (3 modules)
- **Variantes POS** : 6 (Terminal, Rush, Kiosk, Mobile, KDS, Customer Display)

### **Tâches**
- [ ] 1. Migration hooks POS (voice ordering, sync offline)
- [ ] 2. Migration 6 variantes POS → `dashboard-client/src/pages/pos/`
  - [ ] `terminal.tsx`
  - [ ] `rush.tsx` (service rapide)
  - [ ] `kiosk.tsx` (borne autonome)
  - [ ] `mobile.tsx` (tablette serveur)
  - [ ] `kds.tsx` (kitchen display)
  - [ ] `customer-display.tsx` (affichage client)
- [ ] 3. Tests intensifs (points de vente critiques)
- [ ] 4. Tests cross-browser (Safari iOS, Chrome Android)
- [ ] 5. Tests offline (sync mode déconnecté)
- [ ] 6. Vérifier branding (rouge #DC2626, "Quelyos Retail")
- [ ] 7. Vérifier switch modules (pos ↔ store ↔ stock)
- [ ] 8. Build Docker retail
- [ ] 9. Staging 1 semaine (magasin pilote)
- [ ] 10. Rollout progressif (10% → 50% → 100% magasins)
- [ ] 11. Monitoring continu (POS = mission-critical)
- [ ] 12. Archivage apps/retail-os

### **Tests Critiques**
- [ ] POS Terminal : workflow complet commande
- [ ] POS Rush : performance service rapide
- [ ] POS Kiosk : autonomie client
- [ ] POS Mobile : synchronisation temps-réel
- [ ] KDS : affichage cuisine
- [ ] Customer Display : affichage client

**Statut** : ⏸️ **Pas démarrée**

---

## ⏸️ Phase 7 : Support (Semaine 10)

**Objectif** : Migrer ticketing avancé + WebSocket temps-réel

### **Tâches**
- [ ] 1. Migration hooks support (ticketing, SLA, escalation)
- [ ] 2. Migration pages ticketing avancées
- [ ] 3. Tests WebSocket temps-réel (chat, notifications)
- [ ] 4. Vérifier branding (violet foncé #9333EA, "Quelyos Support")
- [ ] 5. Vérifier switch modules (support ↔ crm)
- [ ] 6. Build Docker support
- [ ] 7. Déploiement parallèle (port 3016)
- [ ] 8. Tests users pilotes (équipe support)
- [ ] 9. Tests charge (WebSocket multiples)
- [ ] 10. Switchover trafic
- [ ] 11. Archivage apps/support-os

### **Particularités**
- **Modules** : support + crm
- **WebSocket** : Temps-réel critique (chat, notifications)

**Statut** : ⏸️ **Pas démarrée**

---

## ⏸️ Phase 8 : Consolidation (Semaine 11)

**Objectif** : Finaliser migration, optimiser, documenter

### **Tâches**
- [ ] 1. Suppression définitive `apps/*` (après validation complète)
- [ ] 2. Mise à jour CI/CD (7 builds unifiés)
- [ ] 3. Optimisation bundle size finale (< cibles)
- [ ] 4. Audit sécurité multi-éditions
- [ ] 5. Documentation finale :
  - [ ] Guide admin (gestion éditions)
  - [ ] Guide dev (ajouter module/édition)
  - [ ] Architecture decision records (ADR)
  - [ ] Runbook ops (déploiement, rollback)
- [ ] 6. Formation équipe dev (nouvelle architecture)
- [ ] 7. Formation équipe ops (déploiement éditions)
- [ ] 8. Présentation résultats (métriques avant/après)

### **Documentation à Créer**
- [ ] `docs/EDITIONS_ADMIN_GUIDE.md` - Guide administration éditions
- [ ] `docs/EDITIONS_DEV_GUIDE.md` - Guide développement
- [ ] `docs/ADR/001-edition-system.md` - Architecture decision
- [ ] `docs/RUNBOOK.md` - Procédures ops
- [ ] `docs/MIGRATION_RETRO.md` - Rétrospective migration

**Statut** : ⏸️ **Pas démarrée**

---

## 📊 Métriques Cibles

### **Performance**

| Édition | Bundle Size Cible | Build Time Cible |
|---------|-------------------|------------------|
| Finance | < 500 KB | < 8s |
| Store | < 700 KB | < 10s |
| Copilote | < 600 KB | < 9s |
| Sales | < 550 KB | < 8s |
| Retail | < 900 KB | < 12s |
| Team | < 450 KB | < 7s |
| Support | < 550 KB | < 8s |

### **Qualité**

| Métrique | Cible |
|----------|-------|
| Tests unitaires | 100% passent |
| Tests E2E | 95%+ passent |
| Coverage | > 70% |
| 0 régression | vs apps/* |

### **Opérations**

| Métrique | Avant (apps/*) | Après (éditions) |
|----------|----------------|------------------|
| Codebases | 7 | 1 |
| Duplication code | Élevée | 0% |
| Temps fix bug cross-SaaS | 7 PRs | 1 PR |
| CI/CD builds | 7 séquentiels | 7 parallèles |
| Temps onboarding dev | ~2 semaines | ~3 jours |

---

## 🎯 Critères de Succès Globaux

### **Technique**
- [x] Système éditions fonctionnel (8 éditions)
- [ ] 7 SaaS migrés avec 0 régression
- [ ] Bundle sizes < cibles
- [ ] CI/CD matrix opérationnel
- [ ] Docker multi-éditions fonctionnel

### **Business**
- [ ] 0 interruption service (déploiement parallèle)
- [ ] Différenciation commerciale préservée (7 "SaaS" distincts)
- [ ] Réduction coûts maintenance (-80% attendu)
- [ ] Accélération développement features (+200% attendu)

### **Équipe**
- [ ] Formation dev complétée
- [ ] Formation ops complétée
- [ ] Documentation complète
- [ ] Adoption 100% nouvelle architecture

---

## 🚧 Risques & Mitigations

### **Risque 1 : Régression Fonctionnelle**
**Probabilité** : Moyenne  
**Impact** : Élevé  
**Mitigation** :
- Tests E2E exhaustifs par édition
- Déploiement parallèle (cohabitation apps/* + éditions)
- Rollback rapide (blue-green deployment)
- Monitoring 48h post-switchover

### **Risque 2 : Performance (Bundle Size)**
**Probabilité** : Moyenne  
**Impact** : Moyen  
**Mitigation** :
- Tree-shaking optimisé (routes conditionnelles)
- Lazy loading pages secondaires
- Bundle analyzer à chaque build
- Cibles définies par édition

### **Risque 3 : Branding Fuite**
**Probabilité** : Faible  
**Impact** : Élevé (commercial)  
**Mitigation** :
- Hook useBranding centralisé
- Tests visuels automatisés (Percy/Chromatic)
- Vérification manuelle systématique
- Isolation CSS variables

### **Risque 4 : Adoption Équipe**
**Probabilité** : Faible  
**Impact** : Moyen  
**Mitigation** :
- Formation progressive (1 SaaS à la fois)
- Documentation exhaustive
- Support dev dédié pendant migration
- Retours d'expérience réguliers

---

## 📅 Timeline Détaillée

```
Semaine 1  : Phase 0 - Préparation                    ✅ TERMINÉE
Semaine 2  : Phase 1 - Finance                        🔄 EN COURS (28%)
Semaine 3  : Phase 2 - Team                           ⏸️
Semaine 4  : Phase 3 - Sales                          ⏸️
Semaine 5  : Phase 4 - Store (début)                  ⏸️
Semaine 6  : Phase 4 - Store (fin)                    ⏸️
Semaine 7  : Phase 5 - Copilote                       ⏸️
Semaine 8  : Phase 6 - Retail (début)                 ⏸️
Semaine 9  : Phase 6 - Retail (fin)                   ⏸️
Semaine 10 : Phase 7 - Support                        ⏸️
Semaine 11 : Phase 8 - Consolidation                  ⏸️
```

**Date fin estimée** : 2026-04-16 (11 semaines)

---

## 🔄 Workflow Type (par SaaS)

### **Préparation**
1. Audit pages `apps/[saas]-os` vs `dashboard-client`
2. Liste hooks spécifiques à migrer
3. Liste composants spécifiques à migrer
4. Identifier conflits nommage

### **Développement**
5. Migration hooks → `dashboard-client/src/hooks/[module]/`
6. Migration pages → `dashboard-client/src/pages/[module]/`
7. Mise à jour routes (`App.tsx`)
8. Mise à jour menus (`config/modules.ts`)
9. Résolution imports (`@quelyos/*`)
10. Vérifier branding dynamique (couleur, logo)

### **Tests**
11. Build réussit (`VITE_EDITION=[saas] pnpm build`)
12. Bundle size < target
13. Tests unitaires passent
14. Tests E2E passent (toutes pages)
15. Tests visuels (snapshots branding)
16. Tests cross-browser (si mobile/POS)
17. Tests performance (Lighthouse > 90)

### **Déploiement**
18. Build Docker édition
19. Déploiement staging
20. Tests utilisateurs (5+ pilotes)
21. Feedback + bugs fixés
22. Déploiement production (parallèle apps/*)
23. Monitoring 48h (erreurs, perf)
24. Switchover trafic → nouvelle version
25. Archivage `apps/[saas]-os`

### **Post-Migration**
26. Documentation édition
27. Update README instructions dev
28. Formation équipe

---

## 📚 Documentation

### **Créée**
- [x] `README-EDITIONS.md` - Guide démarrage rapide
- [x] `.claude/PHASE0_COMPLETE.md` - Phase 0 détaillée
- [x] `.claude/PHASE1_PROGRESS.md` - Phase 1 état
- [x] `.claude/BUNDLE_OPTIMIZATION.md` - Optimisation bundle
- [x] `ROADMAP.md` - Ce fichier

### **À Créer**
- [ ] `docs/EDITIONS_ADMIN_GUIDE.md` - Administration
- [ ] `docs/EDITIONS_DEV_GUIDE.md` - Développement
- [ ] `docs/ADR/001-edition-system.md` - Decision record
- [ ] `docs/RUNBOOK.md` - Procédures ops
- [ ] `docs/MIGRATION_RETRO.md` - Rétrospective

---

## 🎉 Bénéfices Attendus

### **Avant Migration**
- ❌ 7 codebases séparées (`apps/*`)
- ❌ Duplication massive (Login.tsx × 7, auth.ts × 7)
- ❌ Maintenance complexe (1 bug = 7 PRs)
- ❌ Onboarding dev long (~2 semaines)
- ❌ Features nouvelles lentes (répéter 7 fois)

### **Après Migration**
- ✅ 1 codebase unifiée (`dashboard-client`)
- ✅ 0 duplication (Login.tsx unique)
- ✅ Maintenance simple (1 bug = 1 PR)
- ✅ Onboarding dev rapide (~3 jours)
- ✅ Features nouvelles rapides (auto-disponibles 7 SaaS)
- ✅ Différenciation commerciale préservée (branding distinct)

### **KPIs**
- ✅ **Réduction 85%** lignes code dupliquées
- ✅ **Temps fix bug cross-SaaS : -80%**
- ✅ **Bundle size éditions : -30%** vs build unique
- ✅ **Temps onboarding dev : -60%**
- ✅ **Vélocité features : +200%**

---

**Dernière mise à jour** : 2026-01-31  
**Statut global** : 🔄 **Phase 0 terminée, Phase 1 en cours**  
**Prochaine milestone** : Finaliser Phase 1 Finance (10 tâches restantes)
