# Plan de Test - Phase 2 : Packaging Produit

## Objectif
Valider les 5 livrables de la Phase 2 avant déploiement production.

---

## Test 1 : Build de l'Image Docker All-in-One

### Prérequis
- Docker installé et démarré
- 10 GB d'espace disque disponible
- Connexion internet pour téléchargement des dépendances

### Commandes de test

```bash
cd /Users/salmenktata/Projets/GitHub/QuelyosERP

# Build de l'image
docker build -t quelyos-erp:test -f Dockerfile.allinone .

# Vérifier la taille de l'image
docker images quelyos-erp:test

# Inspecter les layers
docker history quelyos-erp:test
```

### Critères de succès
- ✅ Build se termine sans erreur
- ✅ Taille image < 3 GB
- ✅ Image contient tous les services (PostgreSQL, Odoo, Node.js, Nginx)

### Résultat attendu
```
REPOSITORY      TAG       SIZE
quelyos-erp     test      ~2.5GB
```

---

## Test 2 : Lancement Conteneur avec Script Install

### Commandes de test

```bash
# Option A : Test local du script
cd packaging
chmod +x install.sh
./install.sh

# Option B : Test simulation curl (sans build automatique)
# Modifier install.sh temporairement pour skip le pull/build Docker
```

### Scénario de test
1. Lancer `./install.sh`
2. Répondre aux prompts :
   - Port : `8080`
   - Email admin : `test@quelyos.local`
   - Password : `TestPassword123!`
   - Domain : `localhost`
3. Confirmer installation

### Critères de succès
- ✅ Détection OS correcte (macOS dans votre cas)
- ✅ Vérification Docker OK
- ✅ Configuration interactive fonctionne
- ✅ Conteneur démarré avec nom `quelyos-erp`
- ✅ Healthcheck réussit (60 retry max)
- ✅ Affichage banner ASCII + infos connexion

### Vérifications post-installation

```bash
# Vérifier conteneur running
docker ps | grep quelyos-erp

# Vérifier logs
docker logs quelyos-erp

# Vérifier santé
curl http://localhost:8080/health

# Vérifier volumes
docker inspect quelyos-erp | grep -A 10 Mounts
```

---

## Test 3 : Wizard de Configuration

### Accès wizard

```bash
# Ouvrir dans navigateur
open http://localhost:8080/wizard
```

### Scénario de test
1. **Step 1 - Welcome** : Vérifier affichage logo, texte, bouton "Commencer"
2. **Step 2 - Company Info** :
   - Nom entreprise : "Quelyos Test"
   - Email contact : "contact@test.com"
   - Téléphone : "0123456789"
3. **Step 3 - Admin Account** :
   - Admin name : "Admin Test"
   - Email : "admin@test.com"
   - Password : "Admin123!" (vérifier validation force)
   - Confirm password : "Admin123!" (vérifier match)
4. **Step 4 - SMTP** : Skip (optionnel)
5. **Step 5 - Summary** : Vérifier toutes les données saisies
6. **Step 6 - Loading** : Voir barre de progression (20 étapes simulées)
7. **Step 7 - Success** : Vérifier liens vers boutique et backoffice

### Critères de succès
- ✅ Navigation entre étapes fluide
- ✅ Validation formulaires fonctionne (email regex, password strength, match)
- ✅ Persistence localStorage (rafraîchir page, données conservées)
- ✅ Design moderne responsive (tester mobile avec DevTools)
- ✅ Animations smooth (fadeIn, slideUp)
- ✅ Dark mode compatible
- ✅ Zero erreurs console navigateur

### Vérifications techniques

```bash
# Vérifier fichiers wizard servis par Nginx
docker exec quelyos-erp ls -la /var/www/wizard/

# Tester route Nginx
curl -I http://localhost:8080/wizard/
```

---

## Test 4 : Branding et Mentions Légales

### Page légale frontend

```bash
# Accéder page /legal
open http://localhost:3000/legal
```

### Checklist validation branding

#### ✅ UI Visible - Aucune mention "Odoo"
- [ ] Frontend navbar : Vérifier "Quelyos" uniquement
- [ ] Frontend footer : Vérifier copyright "© 2026 Quelyos"
- [ ] Backoffice sidebar : Vérifier logo/titre "Quelyos ERP"
- [ ] Wizard : Vérifier titre "Quelyos ERP - Configuration"
- [ ] Install.sh banner : Vérifier ASCII art "Quelyos ERP"

#### ✅ Page /legal - Attribution LGPL v3.0
- [ ] Section "Quelyos ERP" : Version, date, licence propriétaire
- [ ] Section "Backend Odoo" : Attribution claire avec lien GitHub Odoo
- [ ] Section "LGPL-3.0" : Explication complète licence
- [ ] Section "Technologies" : Liste complète (Next.js, React, Odoo, PostgreSQL, etc.)
- [ ] Section "Contact" : Email legal@quelyos.com
- [ ] Disclaimer : "Quelyos ERP n'est pas affilié, approuvé ou sponsorisé par Odoo S.A."

#### ✅ Code Technique - Noms variables préservés
- [ ] Variables backend : `odoo`, `odoo_bin`, etc. conservés
- [ ] Paths Docker : `/opt/odoo/` préservé
- [ ] Modules Odoo : `quelyos_api` hérite modèles Odoo standards

### Commandes de vérification

```bash
# Rechercher mentions "Odoo" dans UI
cd frontend/src
grep -r "Odoo" --exclude-dir=node_modules --exclude="legal/*"
# Devrait retourner 0 résultat (sauf app/legal/page.tsx)

cd backoffice/src
grep -r "Odoo" --exclude-dir=node_modules
# Devrait retourner 0 résultat

# Vérifier page légale existe
curl http://localhost:3000/legal | grep "Odoo S.A."
# Devrait retourner attribution
```

---

## Test 5 : Documentation Utilisateur

### Vérifications fichiers

```bash
cd packaging/docs

# Vérifier taille fichiers
wc -l INSTALLATION.txt GUIDE_UTILISATEUR.txt GUIDE_ADMINISTRATEUR.txt

# Devrait afficher :
# ~700 INSTALLATION.txt
# ~1000 GUIDE_UTILISATEUR.txt
# ~1200 GUIDE_ADMINISTRATEUR.txt
```

### Validation contenu

#### INSTALLATION.txt
- [ ] 7 sections présentes (Prérequis, One-click, Manuel, Config, Vérif, Troubleshooting, MAJ)
- [ ] Commandes copy-paste fonctionnelles
- [ ] Troubleshooting couvre 7 problèmes courants
- [ ] Format plain text lisible

#### GUIDE_UTILISATEUR.txt
- [ ] 9 sections pour end-users (Accès, Navigation, Catalogue, Produit, Panier, Checkout, Compte, Wishlist, Suivi)
- [ ] FAQ 10 questions minimum
- [ ] Captures d'écran conceptuelles décrites
- [ ] Langage accessible non-technique

#### GUIDE_ADMINISTRATEUR.txt
- [ ] 12 sections backoffice (Dashboard, Produits, Catégories, Commandes, Clients, Stock, Coupons, Livraison, Analytics, Factures, Paramètres, Best Practices)
- [ ] Commandes techniques documentées
- [ ] Sécurité et bonnes pratiques incluses
- [ ] Screenshots concepts décrits

---

## Test 6 : Déploiement End-to-End Complet

### Scénario utilisateur réel

```bash
# 1. Installation one-click
curl -fsSL https://get.quelyos.com | bash
# (simuler avec ./packaging/install.sh en local)

# 2. Accéder wizard
# http://localhost/wizard
# Configurer entreprise + admin

# 3. Accéder boutique e-commerce
# http://localhost/

# 4. Accéder backoffice admin
# http://localhost/admin
# Login : admin / admin

# 5. Créer un produit de test
# Backoffice > Produits > Nouveau Produit

# 6. Voir produit sur boutique
# Frontend > Catalogue > Produit créé visible

# 7. Ajouter au panier et commander
# Panier > Checkout > Valider commande

# 8. Vérifier commande en backoffice
# Backoffice > Commandes > Commande visible
```

### Critères de succès E2E
- ✅ Installation complète < 5 minutes
- ✅ Wizard configuration sans erreur
- ✅ Frontend e-commerce accessible
- ✅ Backoffice admin accessible
- ✅ CRUD produit fonctionnel
- ✅ Workflow commande complet (panier → checkout → confirmation)
- ✅ Sync Odoo ↔ Frontend parfaite
- ✅ Aucune mention "Odoo" visible (sauf /legal)

---

## Test 7 : Healthcheck et Monitoring

### Endpoints santé

```bash
# Healthcheck principal
curl http://localhost/health
# Devrait retourner : OK ou JSON {status: "healthy"}

# Vérifier tous les services Supervisord
docker exec quelyos-erp supervisorctl status

# Devrait afficher :
# postgresql   RUNNING
# odoo         RUNNING
# frontend     RUNNING
# nginx        RUNNING
```

### Logs monitoring

```bash
# Logs PostgreSQL
docker exec quelyos-erp tail -f /var/log/postgresql/postgresql-14-main.log

# Logs Odoo
docker exec quelyos-erp tail -f /var/log/odoo/odoo.log

# Logs Nginx
docker exec quelyos-erp tail -f /var/log/nginx/access.log
docker exec quelyos-erp tail -f /var/log/nginx/error.log

# Logs Supervisord
docker exec quelyos-erp tail -f /var/log/supervisor/supervisord.log
```

---

## Test 8 : Persistance Données

### Test backup et restauration

```bash
# 1. Créer données test
# (via interface : produits, catégories, commandes)

# 2. Arrêter conteneur
docker stop quelyos-erp

# 3. Vérifier volume existe
docker volume ls | grep quelyos
# OU si bind mount :
ls -la ~/.quelyos/

# 4. Redémarrer conteneur
docker start quelyos-erp

# 5. Vérifier données conservées
# Accéder backoffice → Produits → Vérifier produits toujours présents
```

### Critères de succès
- ✅ Données PostgreSQL persistées dans volume
- ✅ Données Odoo filestore persistées
- ✅ Restart conteneur sans perte de données

---

## Test 9 : Performance et Taille

### Métriques cibles

```bash
# Taille image Docker
docker images quelyos-erp
# Cible : < 3 GB

# RAM utilisée
docker stats quelyos-erp --no-stream
# Cible : < 2 GB RAM

# Temps démarrage conteneur
time docker start quelyos-erp
# Cible : < 30 secondes

# Temps réponse healthcheck
time curl http://localhost/health
# Cible : < 1 seconde
```

---

## Test 10 : Sécurité

### Checklist sécurité

```bash
# 1. Vérifier password DB aléatoire
docker inspect quelyos-erp | grep QUELYOS_DB_PASSWORD
# Devrait être random 32 chars base64

# 2. Vérifier ports exposés
docker port quelyos-erp
# Devrait exposer UNIQUEMENT 80/tcp (et 443 si HTTPS)

# 3. Vérifier user non-root
docker exec quelyos-erp whoami
# Devrait retourner odoo ou postgres (pas root)

# 4. Vérifier secrets non loggés
docker logs quelyos-erp | grep password
# Devrait être vide (aucun password en clair)

# 5. Scanner vulnérabilités image
docker scan quelyos-erp:test
# OU
trivy image quelyos-erp:test
```

---

## Checklist Finale de Validation

### Phase 2 - Production Ready ✅

- [ ] **Image Docker**
  - [ ] Build sans erreur
  - [ ] Taille < 3 GB
  - [ ] Multi-stage optimisé
  - [ ] Tous services présents

- [ ] **Installation One-Click**
  - [ ] Script install.sh fonctionnel
  - [ ] Détection OS correcte
  - [ ] Installation Docker automatique (Linux)
  - [ ] Configuration interactive
  - [ ] Healthcheck OK
  - [ ] Alias shell créés

- [ ] **Wizard Configuration**
  - [ ] 7 étapes complètes
  - [ ] Validation formulaires
  - [ ] Design moderne responsive
  - [ ] Persistence localStorage
  - [ ] Zero erreurs console

- [ ] **Branding Complet**
  - [ ] Aucune mention "Odoo" visible (sauf /legal)
  - [ ] Page /legal conforme LGPL v3.0
  - [ ] Attribution Odoo Community présente
  - [ ] Disclaimer affiliation
  - [ ] Checklist 8 points validée

- [ ] **Documentation**
  - [ ] INSTALLATION.txt complet (700+ lignes)
  - [ ] GUIDE_UTILISATEUR.txt complet (1000+ lignes)
  - [ ] GUIDE_ADMINISTRATEUR.txt complet (1200+ lignes)
  - [ ] Format plain text accessible
  - [ ] Commandes copy-paste testées

- [ ] **E2E Workflow**
  - [ ] Installation complète < 5 min
  - [ ] Frontend accessible
  - [ ] Backoffice accessible
  - [ ] CRUD produit OK
  - [ ] Workflow commande OK
  - [ ] Sync Odoo ↔ Frontend OK

- [ ] **Performance**
  - [ ] Image < 3 GB
  - [ ] RAM < 2 GB
  - [ ] Démarrage < 30s
  - [ ] Healthcheck < 1s

- [ ] **Sécurité**
  - [ ] Password DB random
  - [ ] Ports minimaux exposés
  - [ ] User non-root
  - [ ] Secrets non loggés
  - [ ] Scan vulnérabilités OK

---

## Commandes Rapides de Test

```bash
# Test complet en une commande
cd /Users/salmenktata/Projets/GitHub/QuelyosERP/packaging

# Build + Run
docker build -t quelyos-erp:test -f ../Dockerfile.allinone .. && \
docker run -d \
  --name quelyos-test \
  -p 8080:80 \
  -v quelyos-test-data:/var/lib/quelyos \
  -e QUELYOS_ADMIN_EMAIL=test@quelyos.local \
  -e QUELYOS_ADMIN_PASSWORD=TestPass123 \
  quelyos-erp:test

# Attendre healthcheck
echo "Waiting for services..."
sleep 60

# Test endpoints
curl -I http://localhost:8080/health
curl -I http://localhost:8080/wizard/
curl -I http://localhost:8080/

# Cleanup
docker stop quelyos-test
docker rm quelyos-test
docker volume rm quelyos-test-data
```

---

## Rapport de Test (Template)

```markdown
# Rapport de Test - Phase 2 : Packaging Produit
Date : YYYY-MM-DD
Testeur : [Nom]
Environment : [OS, Docker version]

## Tests Réussis ✅
- [ ] Test 1 : Build image (temps: Xmin, taille: XGB)
- [ ] Test 2 : Script install
- [ ] Test 3 : Wizard config
- [ ] Test 4 : Branding
- [ ] Test 5 : Documentation
- [ ] Test 6 : E2E workflow
- [ ] Test 7 : Healthcheck
- [ ] Test 8 : Persistance
- [ ] Test 9 : Performance
- [ ] Test 10 : Sécurité

## Tests Échoués ❌
- Aucun

## Bugs Identifiés
- Aucun

## Recommandations
- [Liste recommandations]

## Conclusion
Phase 2 : Production Ready ✅ / Non Ready ❌
```

---

## Prochaines Étapes

Si tous les tests passent :
1. Tag l'image Docker : `docker tag quelyos-erp:test quelyos-erp:1.0.0`
2. Push vers registry : `docker push ghcr.io/quelyos/quelyos-erp:1.0.0`
3. Publier script install.sh : `https://get.quelyos.com`
4. Passer à Phase 3 : Conformité Légale (déjà complétée selon LOGME.md)
5. Commencer Phase 4 : Modèle Commercial SaaS
