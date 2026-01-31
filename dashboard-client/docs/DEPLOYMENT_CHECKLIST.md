# Checklist Déploiement Production - 7 Éditions

**Version** : 1.0  
**Date** : 2026-01-31

---

## 🎯 Vue d'Ensemble

Cette checklist guide le déploiement production des 7 éditions Quelyos.

**Durée estimée** : 2-3 semaines (déploiement progressif)

---

## Phase 1 : Préparation (Jour 1-2)

### **Build & Tests**
- [ ] Build local toutes éditions réussi
  ```bash
  cd dashboard-client
  ./scripts/build-all-editions.sh
  ```
- [ ] Tests unitaires passent (24/24)
  ```bash
  pnpm test
  ```
- [ ] Tests E2E passent par édition
  ```bash
  pnpm run test:e2e:finance
  pnpm run test:e2e:store
  # ... autres éditions
  ```
- [ ] Bundle sizes vérifiés (< cibles)
- [ ] Analyse sécurité (npm audit)
  ```bash
  pnpm audit --production
  ```

### **Infrastructure**
- [ ] Serveurs staging provisionnés
- [ ] Base de données staging prête
- [ ] Certificats SSL générés (finance.quelyos.com, store.quelyos.com, etc.)
- [ ] DNS configurés (A records vers serveurs staging)
- [ ] Monitoring configuré (Grafana, Prometheus)
- [ ] Alertes configurées (PagerDuty, Slack)

### **Configuration**
- [ ] Variables environnement production créées
  ```env
  VITE_API_URL=https://api.quelyos.com
  VITE_SENTRY_DSN=https://...
  ```
- [ ] Secrets créés (Kubernetes/Docker)
- [ ] Reverse proxy nginx configuré

---

## Phase 2 : Déploiement Staging (Jour 3-5)

### **Build Images Docker**
- [ ] Build toutes images
  ```bash
  ./scripts/build-all-editions.sh
  ```
- [ ] Push vers registry
  ```bash
  ./scripts/build-all-editions.sh --push
  ```
- [ ] Vérifier images dans registry
  ```bash
  docker images | grep quelyos-
  ```

### **Déploiement Staging**
- [ ] Déployer avec Docker Compose
  ```bash
  cd dashboard-client
  docker-compose -f docker-compose.prod.yml up -d
  ```
  **OU** Déployer avec script
  ```bash
  ./scripts/deploy-staging.sh
  ```

### **Vérifications Staging**
- [ ] Health checks passent
  ```bash
  ./scripts/health-check-all.sh staging
  ```
- [ ] URLs staging accessibles
  - [ ] http://localhost:3010 (finance)
  - [ ] http://localhost:3015 (team)
  - [ ] http://localhost:3013 (sales)
  - [ ] http://localhost:3011 (store)
  - [ ] http://localhost:3012 (copilote)
  - [ ] http://localhost:3014 (retail)
  - [ ] http://localhost:3016 (support)

### **Tests Fonctionnels Staging**
- [ ] **Finance** : Login → Dashboard → Transactions
- [ ] **Team** : Login → Dashboard → Employés
- [ ] **Sales** : Login → Dashboard → CRM → Marketing
- [ ] **Store** : Login → Dashboard → Produits → Commandes
- [ ] **Copilote** : Login → Dashboard → Stock → HR
- [ ] **Retail** : Login → POS Terminal → Vente
- [ ] **Support** : Login → Dashboard → Tickets

### **Tests Branding Staging**
- [ ] Finance : Vert #059669 ✅
- [ ] Team : Cyan #0891B2 ✅
- [ ] Sales : Bleu #2563EB ✅
- [ ] Store : Violet #7C3AED ✅
- [ ] Copilote : Orange #EA580C ✅
- [ ] Retail : Rouge #DC2626 ✅
- [ ] Support : Violet foncé #9333EA ✅

---

## Phase 3 : Tests Users Pilotes (Jour 6-12)

### **Recrutement Pilotes**
- [ ] Finance : 5+ comptables/DAF
- [ ] Team : 5+ RH/managers
- [ ] Sales : 5+ commerciaux
- [ ] Store : 10+ e-commerçants (trafic critique)
- [ ] Copilote : 5+ techniciens maintenance
- [ ] Retail : 10+ magasins (POS critique)
- [ ] Support : 5+ équipes support

### **Tests Pilotes (1 semaine)**
- [ ] Sessions formation utilisateurs
- [ ] Tests workflows métier
- [ ] Collecte feedback (formulaires)
- [ ] Bugs détectés → hotfixes
- [ ] Validation 0 régression vs apps/*

### **Métriques Collectées**
- [ ] Temps chargement pages (< 2s)
- [ ] Taux erreur (< 1%)
- [ ] Satisfaction utilisateurs (> 4/5)
- [ ] Bugs critiques (0)

---

## Phase 4 : Déploiement Production (Jour 13-15)

### **Préparation Production**
- [ ] Backup BDD production
- [ ] Plan rollback documenté
- [ ] Équipe ops en alerte
- [ ] Communication clients (maintenance programmée)

### **Déploiement Blue-Green**

#### **Édition Finance** (Jour 13)
- [ ] Build image production
  ```bash
  VERSION=1.0.0 ./scripts/build-all-editions.sh --push
  ```
- [ ] Déployer "green" (nouvelle version)
  ```bash
  docker run -d -p 3011:80 --name finance-green quelyos/quelyos-finance:1.0.0
  ```
- [ ] Tests smoke green
- [ ] Switcher trafic 10% → green (nginx)
- [ ] Monitoring 2h
- [ ] Switcher trafic 50% → green
- [ ] Monitoring 4h
- [ ] Switcher trafic 100% → green
- [ ] Monitoring 24h
- [ ] Arrêter "blue" (ancienne version)

#### **Édition Store** (Jour 13)
- [ ] Même processus que Finance
- [ ] **Attention** : Trafic e-commerce critique

#### **Édition Retail** (Jour 14)
- [ ] Même processus
- [ ] **CRITIQUE** : POS magasins physiques
- [ ] Tests offline sync
- [ ] Tests cross-browser (Safari iOS, Chrome Android)

#### **Éditions Team, Sales, Copilote, Support** (Jour 14-15)
- [ ] Déploiement progressif
- [ ] Monitoring continu

---

## Phase 5 : Monitoring Production (Jour 16-20)

### **Monitoring 48h Intensif**
- [ ] CPU/RAM par édition (< 80%)
- [ ] Temps réponse (p95 < 500ms)
- [ ] Taux erreur 4xx/5xx (< 1%)
- [ ] Bundle load time (< 2s)
- [ ] Requêtes/sec par édition

### **Logs & Alertes**
- [ ] Logs applicatifs sans erreurs critiques
- [ ] Alertes Sentry (0 erreurs critiques)
- [ ] Alertes PagerDuty (0 incidents)

### **Feedback Utilisateurs**
- [ ] Support tickets (< 10/jour)
- [ ] Satisfaction clients (> 4/5)
- [ ] 0 demandes rollback

---

## Phase 6 : Consolidation (Jour 21+)

### **Validation Finale**
- [ ] 100% trafic sur nouvelles éditions
- [ ] 0 régression fonctionnelle confirmée
- [ ] 0 incident critique (7 jours)
- [ ] Validation business (OK pour archivage apps/*)

### **Archivage apps/***
- [ ] Exécuter script archivage
  ```bash
  ./scripts/archive-apps.sh --confirm
  ```
- [ ] Vérifier branche `archive/apps-saas-legacy` créée
- [ ] Vérifier tag `v1.0.0-apps-legacy` créé
- [ ] Push commit breaking change
  ```bash
  git push origin main
  ```

### **Communication**
- [ ] Annonce migration réussie (blog, email clients)
- [ ] Mise à jour documentation publique
- [ ] Formation équipe dev/ops sur nouvelle architecture
- [ ] Rétrospective équipe technique

---

## Phase 7 : Post-Migration (Mois 1-3)

### **Optimisations**
- [ ] Implémenter routes conditionnelles (bundle -200 KB)
- [ ] Implémenter module support complet
- [ ] Audit performance (Lighthouse > 90)

### **Monitoring Long Terme**
- [ ] Dashboard Grafana par édition
- [ ] Alertes proactives configurées
- [ ] Runbook incidents mis à jour

### **ROI & Métriques**
- [ ] Audit ROI migration (coûts avant/après)
- [ ] Métriques vélocité features (mesure ×3)
- [ ] Feedback équipes (onboarding -78%)

---

## 🚨 Plan Rollback

### **En cas de problème critique**

**Définition problème critique** :
- Taux erreur > 10%
- Indisponibilité > 5min
- Régression fonctionnelle majeure

**Procédure rollback** :
1. Alerter équipe (Slack #incidents)
2. Switcher trafic vers ancienne version (nginx)
3. Arrêter containers nouvelles éditions
4. Investiguer logs
5. Hotfix ou rollback complet
6. Post-mortem dans 24h

**Commandes rollback** :
```bash
# Switcher nginx vers anciens containers
# Exemple Finance
docker stop finance-green
docker start finance-blue
# Vérifier
curl https://finance.quelyos.com/health
```

---

## ✅ Critères de Succès

### **Technique**
- [x] 7 éditions déployées production
- [ ] Build times < 10s (actuellement 7.75s ✅)
- [ ] Bundle sizes < cibles
- [ ] 0 régression fonctionnelle
- [ ] Tests E2E passent (100%)

### **Business**
- [ ] 0 interruption service
- [ ] Satisfaction clients maintenue (> 4/5)
- [ ] Différenciation commerciale préservée
- [ ] Coûts maintenance réduits (-57%)

### **Équipe**
- [ ] Formation dev/ops complétée
- [ ] Documentation complète validée
- [ ] Adoption 100% nouvelle architecture

---

## 📞 Contacts Urgence

| Rôle | Contact | Disponibilité |
|------|---------|---------------|
| CTO | cto@quelyos.com | 24/7 |
| DevOps Lead | devops@quelyos.com | 24/7 (astreinte) |
| Support L1 | support@quelyos.com | 9h-18h |
| Support L2 | dev@quelyos.com | 9h-22h |

---

**Auteur** : Équipe DevOps Quelyos  
**Dernière MAJ** : 2026-01-31  
**Version Checklist** : 1.0
