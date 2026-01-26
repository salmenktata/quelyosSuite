# Commande /deploy - Checklist Déploiement Production

## Description

Prépare et valide le déploiement du système tri-couche (Backend Odoo ↔ Backoffice React ↔ Frontend Next.js) en production ou staging, avec checklist stricte garantissant 0 régression et 100% de parité fonctionnelle.

## Usage

```bash
/deploy staging            # Prépare déploiement staging (checklist allégée)
/deploy production         # Prépare déploiement production (checklist stricte)
/deploy                    # Alias pour production
```

## Workflow

### 1. Détection Environnement

**Staging :**
- Checklist allégée (tests core uniquement)
- Permet vulnérabilités P1 (à corriger avant production)
- Build optimisé mais avec sourcemaps

**Production :**
- Checklist STRICTE (100% validations)
- AUCUNE vulnérabilité P0 ou P1 tolérée
- 0 tests échoués, 0 gaps parité P0/P1
- Build optimisé sans sourcemaps

### 2. Phase 1 - Pré-Validation (Blocage Immédiat)

**Vérifications instantanées (< 30s) :**

#### 2.1. Git Status

```bash
git status --porcelain
```

**Vérifier :**
- [ ] Branche courante === `main` ou `production` (pas de deploy depuis `feature/*`)
- [ ] Aucun fichier non commité (working directory clean)
- [ ] Aucun fichier staged non committé
- [ ] Dernier commit !== "WIP" ou "tmp" (message commit descriptif)

**Si violations :**
```
🚨 BLOCAGE PRÉ-VALIDATION

Problèmes détectés :
- Branche courante : feature/new-cart (attendu: main)
- 5 fichiers modifiés non commités
- Dernier commit : "WIP cart fixes"

Actions requises :
1. git checkout main
2. git commit -m "feat: cart improvements"
3. Relancer /deploy production
```

#### 2.2. Variables Environnement

**Vérifier fichiers .env existent :**
```bash
ls -la odoo-odoo-backend/.env.production
ls -la frontend/.env.production
ls -la backoffice/.env.production
```

**Vérifier variables critiques définies :**

**Backend (.env.production) :**
- [ ] `DB_HOST` (non localhost)
- [ ] `DB_NAME`
- [ ] `DB_USER`
- [ ] `DB_PASSWORD`
- [ ] `ODOO_MASTER_PASSWORD`

**Frontend (.env.production) :**
- [ ] `NEXT_PUBLIC_API_URL` (non localhost)
- [ ] `NEXT_PUBLIC_SITE_URL`

**Backoffice (.env.production) :**
- [ ] `VITE_API_URL` (non localhost)

**Violations P0 :**
- Variable non définie
- Variable pointe vers `localhost` en production
- Secret hardcodé dans code au lieu de .env

#### 2.3. Dépendances à Jour

```bash
# Frontend
cd frontend && npm outdated

# Backoffice
cd backoffice && npm outdated

# Backend
cd odoo-backend && pip list --outdated
```

**Si dépendances critiques outdated (security patches) :**
- Alerter utilisateur
- Proposer `npm update` ou `pip install --upgrade`

### 3. Phase 2 - Tests (Validation Qualité)

**Exécuter suite complète de tests (via `/test`) :**

```bash
/test
```

**Attendre résultats et vérifier :**

**Production (STRICT) :**
- [ ] **100%** des tests backend passent (0 échoués)
- [ ] **100%** des tests frontend passent (0 échoués)
- [ ] **100%** des tests backoffice passent (0 échoués)
- [ ] **100%** des tests parité passent (0 échoués)
- [ ] Coverage backend ≥ **75%**

**Staging (ALLÉGÉ) :**
- [ ] **≥ 95%** des tests passent (max 5% échecs P2 tolérés)
- [ ] **100%** des tests parité passent (0 échoués)
- [ ] **0** tests P0 échoués

**Si violations production :**
```
🚨 BLOCAGE PHASE TESTS

Résultats :
- Backend : 60/62 tests passent (2 échoués)
- Frontend : 25/28 tests passent (3 échoués)
- Parité : 18/20 tests passent (2 échoués P0)

Tests échoués P0 :
1. test_create_product_creates_in_odoo_db
2. test_cart_sync_with_sale_order

Actions requises :
1. Corriger les 2 tests parité échoués (BLOQUANT)
2. Corriger les 5 tests fonctionnels échoués
3. Relancer /test pour validation
4. Relancer /deploy production
```

### 4. Phase 3 - Audit Sécurité

**Exécuter audit sécurité (via `/security`) :**

```bash
/security
```

**Attendre résultats et vérifier :**

**Production (STRICT) :**
- [ ] **0** vulnérabilités P0 (CRITIQUE)
- [ ] **0** vulnérabilités P1 (IMPORTANTE)
- [ ] Score sécurité ≥ **B (85/100)**
- [ ] Aucune dépendance CVE CRITICAL ou HIGH

**Staging (ALLÉGÉ) :**
- [ ] **0** vulnérabilités P0 (CRITIQUE)
- [ ] Score sécurité ≥ **C (70/100)**

**Si violations production :**
```
🚨 BLOCAGE PHASE SÉCURITÉ

Score sécurité : D (68/100)

Vulnérabilités P0 détectées (4) :
1. SQL Injection dans recherche produits
2. Endpoint admin accessible sans auth
3. CORS trop permissif (*)
4. Secrets loggés dans console

Vulnérabilités P1 détectées (7) :
[...]

Actions requises :
1. Corriger les 4 vulnérabilités P0 (BLOQUANT)
2. Corriger les 7 vulnérabilités P1 (BLOQUANT production)
3. Relancer /security pour validation
4. Relancer /deploy production
```

### 5. Phase 4 - Audit Parité Fonctionnelle

**Exécuter audit parité (via `/parity`) :**

```bash
/parity
```

**Attendre résultats et vérifier :**

**Production (STRICT) :**
- [ ] **0** gaps P0 (BLOQUANT) non documentés
- [ ] **0** gaps P1 (IMPORTANT) non documentés
- [ ] **100%** des fonctionnalités Odoo core implémentées

**Staging (ALLÉGÉ) :**
- [ ] **0** gaps P0 (BLOQUANT) non documentés

**Si violations production :**
```
🚨 BLOCAGE PHASE PARITÉ

Gaps fonctionnels détectés :

P0 - BLOQUANT (2) :
1. Images multiples produit - Non implémenté
2. Variantes produit (édition) - Partiellement implémenté

P1 - IMPORTANT (5) :
[...]

Actions requises :
1. Implémenter fonctionnalité "Images multiples" (P0)
2. Compléter fonctionnalité "Variantes édition" (P0)
3. Documenter gaps P1 dans README.md si report volontaire
4. Relancer /parity pour validation
5. Relancer /deploy production
```

### 6. Phase 5 - Audit Cohérence Tri-Couche

**Exécuter audit cohérence (via `/coherence`) :**

```bash
/coherence
```

**Attendre résultats et vérifier :**

**Production (STRICT) :**
- [ ] **0** incohérences P0 (endpoints orphelins critiques, appels inexistants)
- [ ] **0** incohérences P1 (types TS, CRUD incomplet)
- [ ] **100%** des endpoints backend utilisés OU documentés comme intentionnels

**Staging (ALLÉGÉ) :**
- [ ] **0** incohérences P0

**Si violations production :**
```
🚨 BLOCAGE PHASE COHÉRENCE

Incohérences tri-couche détectées :

P0 - BLOQUANT (3) :
1. Endpoint orphelin : POST /api/ecommerce/products/delete (jamais appelé)
2. Appel inexistant : Frontend appelle GET /api/products/featured (404)
3. Type TS incohérent : Product.stock (number) vs API (string)

Actions requises :
1. Supprimer endpoint orphelin OU documenter raison
2. Créer endpoint /api/products/featured manquant
3. Corriger types TypeScript Product.stock
4. Relancer /coherence pour validation
5. Relancer /deploy production
```

### 7. Phase 6 - Backup Base de Données

**CRITIQUE : Backup DB Odoo avant déploiement**

```bash
cd odoo-backend
docker-compose exec -T db pg_dump -U odoo -d quelyos | gzip > backups/quelyos_$(date +%Y%m%d_%H%M%S).sql.gz
```

**Vérifier :**
- [ ] Fichier backup créé dans `odoo-odoo-backend/backups/`
- [ ] Taille backup > 0 (non vide)
- [ ] Backup compressé (.gz)

**Conserver :**
- Dernier backup avant chaque déploiement production
- Backups N-1, N-2, N-3 (3 derniers déploiements)
- Supprimer backups > 30 jours (sauf backups mensuels)

**Si échec backup :**
```
🚨 BLOCAGE PHASE BACKUP

Impossible de créer backup base de données.

Erreur : pg_dump: connection to database failed

Actions requises :
1. Vérifier conteneur DB démarré : docker-compose ps
2. Vérifier connexion DB : docker-compose exec db psql -U odoo -d quelyos -c "SELECT 1"
3. Relancer backup manuellement
4. Relancer /deploy production
```

### 8. Phase 7 - Build Production

**Build des applications avec optimisations :**

#### 8.1. Backend (Odoo)

**Vérifier modules à upgrader :**
```bash
cd odoo-backend
grep -r "version.*:" addons/quelyos_api/__manifest__.py
```

**Si version incrémentée depuis dernier déploiement :**
```bash
./upgrade.sh quelyos_api
```

**Vérifier santé Odoo :**
```bash
curl -f http://localhost:8069/web/health || echo "Odoo unhealthy"
```

#### 8.2. Frontend (Next.js)

```bash
cd frontend
npm run build
```

**Vérifier :**
- [ ] Build réussit sans erreurs TypeScript
- [ ] Aucune erreur ESLint bloquante
- [ ] Taille bundle raisonnable (< 1MB initial)
- [ ] `.next/` généré

**Analyser bundle (optionnel) :**
```bash
ANALYZE=true npm run build
```

**Violations P1 :**
- Build échoue avec erreurs TS ou ESLint
- Bundle > 2MB (performance dégradée)

#### 8.3. Backoffice (React + Vite)

```bash
cd backoffice
npm run build
```

**Vérifier :**
- [ ] Build réussit sans erreurs TypeScript
- [ ] `dist/` généré
- [ ] Assets optimisés (minification, compression)

**Si violations :**
```
🚨 BLOCAGE PHASE BUILD

Frontend build échoué :

Error: Type 'string | undefined' is not assignable to type 'string'
  at src/components/ProductCard.tsx:45

Actions requises :
1. Corriger erreurs TypeScript
2. Relancer npm run build
3. Relancer /deploy production
```

### 9. Phase 8 - Migrations Base de Données

**Vérifier migrations Odoo pendantes :**

```bash
cd odoo-backend
docker-compose exec odoo odoo shell -d quelyos << EOF
modules = env['ir.module.module'].search([('state', '=', 'to upgrade')])
print(modules.mapped('name'))
EOF
```

**Si modules à upgrader :**
- Lister modules concernés
- Demander confirmation utilisateur
- Exécuter upgrades
- Vérifier succès (aucune erreur dans logs)

**Migrations custom (si applicable) :**
- Lister scripts migration dans `odoo-odoo-backend/migrations/`
- Exécuter dans l'ordre (par date/version)
- Vérifier succès de chaque migration

### 10. Phase 9 - Smoke Tests Post-Build

**Tests rapides sur build production :**

#### Frontend
```bash
cd frontend
npm run start &  # Démarrer serveur production
sleep 10

# Test homepage charge
curl -f http://localhost:3000 || echo "Homepage failed"

# Test API calls fonctionnent
curl -f http://localhost:3000/api/products || echo "API route failed"

kill %1  # Arrêter serveur
```

#### Backoffice
```bash
cd backoffice
npm run preview &  # Démarrer serveur production (Vite preview)
sleep 5

curl -f http://localhost:4173 || echo "Backoffice failed"

kill %1
```

**Vérifier :**
- [ ] Pages chargent sans erreur 500
- [ ] Assets statiques servis (CSS, JS, images)
- [ ] API routes répondent (Next.js API routes)

### 11. Phase 10 - Documentation Déploiement

**Générer changelog :**

```bash
# Depuis dernier tag version
git log $(git describe --tags --abbrev=0)..HEAD --oneline --pretty=format:"- %s"
```

**Mettre à jour LOGME.md :**
```markdown
- 2026-01-25 : Déploiement production v1.2.0 - Ajout multi-images produits + fixes sécurité (4 P0)
```

**Créer tag version :**
```bash
git tag -a v1.2.0 -m "Release v1.2.0 - Multi-images + security fixes"
git push origin v1.2.0
```

### 12. Phase 11 - Plan de Rollback

**Documenter plan de rollback AVANT déploiement :**

```markdown
## Plan de Rollback v1.2.0

### Si problème détecté en production

#### 1. Rollback Frontend
```bash
cd frontend
git checkout v1.1.0  # Version précédente stable
npm install
npm run build
# Redéployer sur serveur production
```

#### 2. Rollback Backoffice
```bash
cd backoffice
git checkout v1.1.0
npm install
npm run build
# Redéployer
```

#### 3. Rollback Backend (Odoo)
```bash
cd odoo-backend

# Restaurer backup DB
gunzip < backups/quelyos_20260124_150000.sql.gz | \
  docker-compose exec -T db psql -U odoo -d quelyos

# Downgrade module si nécessaire
docker-compose exec odoo odoo -d quelyos -u quelyos_api --stop-after-init

# Redémarrer
docker-compose restart odoo
```

#### 4. Vérification Post-Rollback
- [ ] Site accessible
- [ ] Aucune erreur 500
- [ ] Tests parité passent
- [ ] Fonctionnalités critiques OK (connexion, commande, paiement)

### Temps estimé rollback : 15 minutes
```

### 13. Génération Rapport Déploiement

**Format Markdown :**

```markdown
# 🚀 Rapport de Déploiement Production - v1.2.0

**Date** : 2026-01-25 14:30:00
**Environnement** : Production
**Version** : v1.2.0
**Déployé par** : Claude Code (validé par Utilisateur)

---

## ✅ Checklist Validation (12/12)

### Phase 1 - Pré-Validation
- [x] Git status clean (branche main, aucun fichier non commité)
- [x] Variables environnement définies (.env.production)
- [x] Dépendances à jour (aucune CVE CRITICAL/HIGH)

### Phase 2 - Tests
- [x] Tests backend : 62/62 passent (100%)
- [x] Tests frontend : 28/28 passent (100%)
- [x] Tests backoffice : 27/27 passent (100%)
- [x] Tests parité : 20/20 passent (100%)
- [x] Coverage backend : 78% (≥ 75% ✅)

### Phase 3 - Sécurité
- [x] Audit sécurité : Score B (87/100)
- [x] Vulnérabilités P0 : 0
- [x] Vulnérabilités P1 : 0
- [x] Dépendances CVE : 0 CRITICAL, 0 HIGH

### Phase 4 - Parité Fonctionnelle
- [x] Gaps P0 : 0
- [x] Gaps P1 : 0 (tous documentés)
- [x] Parité Odoo : 100% fonctionnalités core

### Phase 5 - Cohérence Tri-Couche
- [x] Incohérences P0 : 0
- [x] Incohérences P1 : 0
- [x] Endpoints orphelins : 0 (ou documentés)

### Phase 6 - Backup
- [x] Backup DB créé : `backups/quelyos_20260125_143000.sql.gz` (45 MB)

### Phase 7 - Build
- [x] Backend (Odoo) : Module v19.0.1.0.5 upgraé
- [x] Frontend (Next.js) : Build réussi (bundle 850 KB)
- [x] Backoffice (Vite) : Build réussi (dist 1.2 MB)

### Phase 8 - Migrations
- [x] Modules Odoo upgraded : quelyos_api
- [x] Migrations custom : 0 (aucune migration pendante)

### Phase 9 - Smoke Tests
- [x] Frontend homepage : OK (200)
- [x] Frontend API routes : OK (200)
- [x] Backoffice : OK (200)

### Phase 10 - Documentation
- [x] LOGME.md mis à jour
- [x] Tag version créé : v1.2.0
- [x] Changelog généré

### Phase 11 - Plan Rollback
- [x] Plan rollback documenté (15 min estimé)

---

## 📊 Métriques Clés

- **Tests totaux** : 137 (100% succès)
- **Score sécurité** : B (87/100) - +19 pts vs v1.1.0
- **Parité Odoo** : 100% (0 gaps P0/P1)
- **Cohérence tri-couche** : 100% (0 incohérences P0/P1)
- **Coverage backend** : 78%
- **Bundle size frontend** : 850 KB (-150 KB vs v1.1.0 ✅)

---

## 🎯 Changements Déployés

### ✨ Nouvelles Fonctionnalités
- Ajout support multi-images produits (5 images max)
- Variantes produits : édition complète dans backoffice
- Dark mode backoffice (toggle dans header)

### 🐛 Corrections
- Fix calcul stock avec variantes (affichage correct catalogue)
- Fix CORS trop permissif (restreint aux domaines autorisés)
- Fix SQL injection potentielle dans recherche produits

### ⚡ Performance
- Optimisation bundle frontend (-150 KB via tree-shaking)
- Lazy loading images catalogue (améliore LCP)

### 🔒 Sécurité
- 4 vulnérabilités P0 corrigées (SQL injection, auth, CORS, logs)
- 7 vulnérabilités P1 corrigées
- Migration logger custom (0 console.log en production)

---

## 🚀 Instructions Déploiement Serveur

### 1. Backend (Odoo)
```bash
ssh user@prod-server
cd /var/www/quelyos/backend
git pull origin main
docker-compose down
docker-compose up -d
./upgrade.sh quelyos_api
docker-compose restart odoo
```

### 2. Frontend (Next.js)
```bash
ssh user@prod-server
cd /var/www/quelyos/frontend
git pull origin main
npm install --production
npm run build
pm2 restart quelyos-frontend
```

### 3. Backoffice (React)
```bash
ssh user@prod-server
cd /var/www/quelyos/backoffice
git pull origin main
npm install --production
npm run build
# Copier dist/ vers serveur web (nginx)
cp -r dist/* /var/www/html/admin/
```

### 4. Vérification Post-Déploiement
```bash
# Vérifier services démarrés
systemctl status odoo
pm2 status quelyos-frontend
systemctl status nginx

# Smoke tests
curl -f https://quelyos.com
curl -f https://admin.quelyos.com
curl -f https://quelyos.com/api/health
```

---

## 🔄 Plan de Rollback

**Si problème critique détecté :**

1. Restaurer backup DB : `gunzip < backups/quelyos_20260125_143000.sql.gz | psql...`
2. Rollback code : `git checkout v1.1.0`
3. Rebuild + redéployer
4. Temps estimé : **15 minutes**

**Détails complets** : Voir section "Phase 11 - Plan de Rollback"

---

## ✅ STATUT : VALIDÉ POUR PRODUCTION

**Aucun bloquant détecté. Déploiement autorisé.**

---

## 📝 Notes

- Backup DB sauvegardé dans `odoo-odoo-backend/backups/` (conserver 3 versions)
- Aucune migration DB breaking (compatibilité arrière OK)
- Monitoring post-déploiement recommandé (24h)
- Next release prévue : v1.3.0 (2026-02-08)
```

### 14. Confirmation Utilisateur Finale

**Après toutes validations, demander confirmation explicite :**

```
✅ VALIDATION COMPLÈTE - Prêt pour Production

Toutes les phases de validation ont réussi :
✅ 137 tests passent (100%)
✅ 0 vulnérabilités P0/P1
✅ 0 gaps parité P0/P1
✅ 0 incohérences P0/P1
✅ Backup DB créé
✅ Builds réussis
✅ Plan rollback documenté

Souhaitez-vous procéder au déploiement production ?

Options :
1. Oui, déployer maintenant (Recommandé)
2. Générer rapport uniquement (pas de déploiement)
3. Annuler
```

**Attendre confirmation avant d'afficher instructions déploiement serveur.**

## Métriques de Succès

**Cette commande est un succès si :**

1. ✅ Toutes phases validation passées (12/12 checklist items)
2. ✅ Rapport déploiement généré avec instructions serveur
3. ✅ Plan rollback documenté et prêt
4. ✅ Backup DB créé et vérifié
5. ✅ Aucun bloquant P0 détecté
6. ✅ Tag version créé, LOGME.md mis à jour

## Notes Importantes

- **Production :** Checklist STRICTE, 0 tolérance erreurs P0/P1
- **Staging :** Checklist ALLÉGÉE, focus sur parité et sécurité P0
- **Toujours** créer backup DB avant déploiement
- **Toujours** documenter plan rollback
- **Toujours** créer tag version après validation

## Exemples d'Utilisation

```bash
# Déploiement production (checklist stricte)
/deploy production

# Déploiement staging (checklist allégée, test rapide)
/deploy staging

# Validation pré-déploiement (sans déployer)
/deploy production  # Puis choisir "Générer rapport uniquement"
```
