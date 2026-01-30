# Ports et URLs - Quelyos Suite

Documentation complète des ports, URLs et points d'accès de tous les services de la suite Quelyos.

## Vue d'ensemble

| Service | Port | URL Locale | Statut |
|---------|------|------------|---------|
| Backend Odoo | 8069 | http://localhost:8069 | ✅ Actif |
| Dashboard Client | 5175 | http://localhost:5175 | ✅ Actif |
| Super Admin Client | 9000 | http://localhost:9000 | ✅ Actif |
| Site Vitrine | 3000 | http://localhost:3000 | ✅ Actif |
| E-commerce | 3001 | http://localhost:3001 | ✅ Actif |
| PostgreSQL | 5432 | localhost:5432 | 🐘 Docker |
| Redis | 6379 | localhost:6379 | 🔴 Docker |

---

## 1. Backend Odoo (Port 8069)

### URLs principales

| Endpoint | URL | Description |
|----------|-----|-------------|
| Interface Odoo | http://localhost:8069 | Interface native Odoo (admin/admin) |
| API REST | http://localhost:8069/api/* | API REST Quelyos |
| Health Check | http://localhost:8069/web/health | Statut du serveur |
| Documentation API | http://localhost:8069/api/docs | Swagger/OpenAPI |

### Endpoints API critiques

**Authentification**
- `POST /api/auth/login` - Connexion utilisateur
- `POST /api/auth/logout` - Déconnexion
- `POST /api/auth/sso-redirect` - SSO redirect
- `POST /api/auth/passkey-redirect` - Passkey auth

**Tenants**
- `GET /api/tenants` - Liste tenants (super-admin)
- `POST /api/tenants` - Créer tenant (super-admin)
- `GET /api/tenants/{id}` - Détails tenant
- `PUT /api/tenants/{id}` - Modifier tenant

**Products**
- `GET /api/products` - Liste produits
- `POST /api/products` - Créer produit
- `GET /api/products/{id}` - Détails produit
- `PUT /api/products/{id}` - Modifier produit

**Orders**
- `GET /api/orders` - Liste commandes
- `POST /api/orders` - Créer commande
- `GET /api/orders/{id}` - Détails commande

### Configuration Docker

```yaml
services:
  odoo:
    ports:
      - "8069:8069"
  db:
    ports:
      - "5432:5432"
  redis:
    ports:
      - "6379:6379"
```

### Commandes utiles

```bash
# Démarrer backend
cd odoo-backend && docker-compose up -d

# Voir logs
docker-compose logs -f odoo

# Arrêter backend
docker-compose down

# Restart Odoo uniquement
docker-compose restart odoo
```

---

## 2. Dashboard Client (Port 5175)

### URL principale
**http://localhost:5175**

### Routes importantes

| Route | Description | Accès |
|-------|-------------|-------|
| `/login` | Page de connexion | Public |
| `/` | Dashboard principal | Auth |
| `/finance/*` | Module Finance | Auth |
| `/store/*` | Module Boutique | Auth |
| `/stock/*` | Module Stock | Auth |
| `/crm/*` | Module CRM | Auth |
| `/marketing/*` | Module Marketing | Auth |
| `/hr/*` | Module RH | Auth |

### Routes par module

**Finance** (`/finance/*`)
- `/finance/treasury` - Trésorerie
- `/finance/cashflow` - Flux de trésorerie
- `/finance/invoices` - Factures
- `/finance/budgets` - Budgets
- `/finance/forecasts` - Prévisions IA

**Store** (`/store/*`)
- `/store/products` - Produits
- `/store/categories` - Catégories
- `/store/orders` - Commandes
- `/store/customers` - Clients

**Stock** (`/stock/*`)
- `/stock/inventory` - Inventaire
- `/stock/movements` - Mouvements
- `/stock/warehouses` - Entrepôts

**CRM** (`/crm/*`)
- `/crm/pipeline` - Pipeline ventes
- `/crm/leads` - Leads
- `/crm/customers` - Clients

**Marketing** (`/marketing/*`)
- `/marketing/campaigns` - Campagnes
- `/marketing/emails` - Emails
- `/marketing/sms` - SMS
- `/marketing/contacts` - Contacts

**HR** (`/hr/*`)
- `/hr/employees` - Employés
- `/hr/leaves` - Congés
- `/hr/contracts` - Contrats

### Configuration

**Fichier** : `dashboard-client/vite.config.ts`

```typescript
server: {
  port: 5175,
  host: true,
  // ...
}
```

**Package.json** : `"dev": "vite --port 5175"`

### Commandes utiles

```bash
# Démarrer
cd dashboard-client && pnpm dev

# Arrêter
lsof -ti:5175 | xargs kill -9

# Voir logs
tail -f /tmp/quelyos-backoffice.log
```

---

## 3. Super Admin Client (Port 9000)

### URL principale
**http://localhost:9000**

### Routes importantes

| Route | Description | Accès |
|-------|-------------|-------|
| `/login` | Connexion super-admin | Public |
| `/` | Dashboard global | Super-admin |
| `/tenants` | Gestion tenants | Super-admin |
| `/plans` | Plans & Tarifs | Super-admin |
| `/billing` | Facturation | Super-admin |
| `/monitoring` | Monitoring système | Super-admin |
| `/security` | Sécurité globale | Super-admin |
| `/ai-config` | Configuration IA | Super-admin |
| `/backups` | Sauvegardes | Super-admin |

### Fonctionnalités

**Administration SaaS**
- Gestion multi-tenants
- Plans et abonnements
- Facturation Stripe
- Monitoring performances
- Audit logs
- Configuration IA (Groq/Claude/OpenAI)
- Backups et restaurations

### Configuration

**Fichier** : `super-admin-client/vite.config.ts`

```typescript
server: {
  port: 9000,
  host: true,
  // ...
}
```

**Package.json** : `"dev": "vite --port 9000"`

### Commandes utiles

```bash
# Démarrer
cd super-admin-client && pnpm dev

# Arrêter
lsof -ti:9000 | xargs kill -9
```

---

## 4. Site Vitrine (Port 3000)

### URL principale
**http://localhost:3000**

### Routes principales

| Route | Description | Accès |
|-------|-------------|-------|
| `/` | Page d'accueil | Public |
| `/pricing` | Tarifs | Public |
| `/features` | Fonctionnalités | Public |
| `/contact` | Contact | Public |
| `/blog` | Blog | Public |
| `/legal` | Mentions légales | Public |
| `/finance/login` | Login finance | Public |
| `/superadmin/login` | Login super-admin | Public |

### Technologies

- **Framework** : Next.js 14
- **Routing** : App Router
- **Déploiement** : Vercel

### Configuration

**Fichier** : `vitrine-quelyos/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Port géré par script `next dev -p 3000`
}
```

**Package.json** : `"dev": "next dev -p 3000"`

### Commandes utiles

```bash
# Démarrer
cd vitrine-quelyos && pnpm dev

# Arrêter
lsof -ti:3000 | xargs kill -9

# Voir logs
tail -f /tmp/quelyos-vitrine.log
```

---

## 5. E-commerce (Port 3001)

### URL principale
**http://localhost:3001**

### Routes principales

| Route | Description | Accès |
|-------|-------------|-------|
| `/` | Accueil boutique | Public |
| `/shop` | Catalogue produits | Public |
| `/shop/[slug]` | Détails produit | Public |
| `/cart` | Panier | Public |
| `/checkout` | Paiement | Public |
| `/account` | Compte client | Auth |
| `/orders` | Mes commandes | Auth |

### Fonctionnalités

- Catalogue produits avec filtres
- Variantes de produits
- Panier persistant
- Checkout multi-étapes
- Paiement Stripe
- Gestion compte client
- Historique commandes

### Technologies

- **Framework** : Next.js 16
- **Routing** : App Router
- **Paiement** : Stripe

### Configuration

**Fichier** : `vitrine-client/next.config.js`

**Package.json** : `"dev": "next dev -p 3001"`

### Commandes utiles

```bash
# Démarrer
cd vitrine-client && pnpm dev

# Arrêter
lsof -ti:3001 | xargs kill -9

# Voir logs
tail -f /tmp/quelyos-ecommerce.log
```

---

## 6. PostgreSQL (Port 5432)

### Connexion

```bash
# Via Docker
docker exec -it quelyos-db psql -U odoo -d quelyos

# Via client local
psql -h localhost -p 5432 -U odoo -d quelyos
```

### Configuration

**Utilisateur** : `odoo`
**Mot de passe** : `odoo` (dev)
**Base de données** : `quelyos`

### Commandes utiles

```bash
# Backup
docker exec quelyos-db pg_dump -U odoo quelyos > backup.sql

# Restore
docker exec -i quelyos-db psql -U odoo quelyos < backup.sql

# Liste bases
docker exec quelyos-db psql -U odoo -c '\l'
```

---

## 7. Redis (Port 6379)

### Connexion

```bash
# Via Docker
docker exec -it quelyos-redis redis-cli

# Via client local
redis-cli -h localhost -p 6379
```

### Usage

- **Sessions** : Stockage sessions utilisateur
- **Cache** : Cache API et données
- **Queues** : Jobs asynchrones

### Commandes utiles

```bash
# Vider cache
docker exec quelyos-redis redis-cli FLUSHALL

# Voir clés
docker exec quelyos-redis redis-cli KEYS "*"

# Stats
docker exec quelyos-redis redis-cli INFO
```

---

## Scripts de Gestion

### Démarrer tous les services

```bash
./scripts/dev-start.sh all
```

**Ordre de démarrage** :
1. Backend Odoo (8069)
2. Dashboard Client (5175)
3. Site Vitrine (3000)
4. E-commerce (3001)
5. Super Admin (9000)

### Arrêter tous les services

```bash
./scripts/dev-stop.sh all
```

### Démarrer un service individuel

```bash
./scripts/dev-start.sh backend      # Odoo
./scripts/dev-start.sh backoffice   # Dashboard
./scripts/dev-start.sh vitrine      # Site vitrine
./scripts/dev-start.sh ecommerce    # E-commerce
./scripts/dev-start.sh superadmin   # Super Admin
```

### Commandes Claude Code

```bash
/restart-all          # Relancer tous les services
/restart-odoo         # Relancer Odoo uniquement
/restart-backoffice   # Relancer Dashboard
/restart-vitrine      # Relancer Site vitrine
/restart-ecommerce    # Relancer E-commerce
```

---

## Vérifications Rapides

### Tous les ports actifs

```bash
lsof -i:3000,3001,5175,9000,8069,5432,6379 -P | grep LISTEN
```

**Sortie attendue** :
```
com.docke ... *:8069 (LISTEN)    # Odoo
node      ... *:5175 (LISTEN)    # Dashboard
node      ... *:9000 (LISTEN)    # Super Admin
node      ... *:3000 (LISTEN)    # Vitrine
node      ... *:3001 (LISTEN)    # E-commerce
com.docke ... *:5432 (LISTEN)    # PostgreSQL
com.docke ... *:6379 (LISTEN)    # Redis
```

### Health checks

```bash
# Backend
curl -s http://localhost:8069/web/health

# Dashboard
curl -s http://localhost:5175 | head -n 1

# Super Admin
curl -s http://localhost:9000 | head -n 1

# Vitrine
curl -s http://localhost:3000 | head -n 1

# E-commerce
curl -s http://localhost:3001 | head -n 1
```

---

## Résolution de Problèmes

### Port déjà utilisé

```bash
# Identifier processus
lsof -ti:PORT

# Arrêter processus
lsof -ti:PORT | xargs kill -9

# Redémarrer service
./scripts/dev-start.sh SERVICE
```

### Service ne démarre pas

1. Vérifier dépendances : `pnpm install`
2. Vérifier Docker (pour backend) : `docker ps`
3. Consulter logs : `tail -f /tmp/quelyos-*.log`
4. Vérifier ports disponibles : `lsof -i:PORT`

### Backend Odoo lent

```bash
# Vérifier logs
docker-compose logs -f odoo

# Restart Odoo
docker-compose restart odoo

# Rebuild si nécessaire
docker-compose down && docker-compose up -d --build
```

---

## URLs Production (À venir)

| Service | URL Production |
|---------|----------------|
| Backend API | https://api.quelyos.com |
| Dashboard | https://app.quelyos.com |
| Super Admin | https://admin.quelyos.com |
| Site Vitrine | https://quelyos.com |
| E-commerce | https://shop.quelyos.com |

---

**Dernière mise à jour** : 2026-01-30
