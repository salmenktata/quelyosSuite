# Architecture Quelyos ERP

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────┐
│         SITE VITRINE (vitrine-quelyos)                   │
│         Next.js 14 - Port 3000                           │
│         Marketing, Finance Login, Superadmin             │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│         BOUTIQUE E-COMMERCE (vitrine-client)             │
│         Next.js 16 - Port 3001                           │
│         Catalogue, Panier, Commandes                     │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│         BACKOFFICE (dashboard-client)                    │
│         React 19 + Vite - Port 5175                      │
│         Gestion produits, commandes, finances            │
└─────────────────────┬───────────────────────────────────┘
                      │ API REST
┌─────────────────────┴───────────────────────────────────┐
│         BACKEND (odoo-backend)                           │
│         Odoo 19 Community - Port 8069                    │
│         Modèles, ORM, PostgreSQL, Redis                  │
└─────────────────────────────────────────────────────────┘
```

## Services et Ports

| Service | Répertoire | Port | URL | Description |
|---------|-----------|------|-----|-------------|
| **Site Vitrine** | `vitrine-quelyos/` | 3000 | http://localhost:3000 | Site marketing principal (Next.js 14) |
| **E-commerce** | `vitrine-client/` | 3001 | http://localhost:3001 | Boutique en ligne (Next.js 16) |
| **Backoffice** | `dashboard-client/` | 5175 | http://localhost:5175 | Interface admin (React + Vite) |
| **Backend API** | `odoo-backend/` | 8069 | http://localhost:8069/api/* | API REST Odoo |
| **Interface Odoo** | `odoo-backend/` | 8069 | http://localhost:8069 | Interface native Odoo (admin/admin) |
| **PostgreSQL** | Docker | 5432 | localhost:5432 | Base de données principale |
| **Redis** | Docker | 6379 | localhost:6379 | Cache et sessions |

## Démarrage des Services

### Méthode 1 : Script global (recommandé)

```bash
# Démarrer tous les services
./scripts/dev-start.sh all

# Démarrer individuellement
./scripts/dev-start.sh backend
./scripts/dev-start.sh backoffice
./scripts/dev-start.sh vitrine
./scripts/dev-start.sh ecommerce

# Arrêter tous les services
./scripts/dev-stop.sh all
```

### Méthode 2 : Commande Claude Code

```bash
/restart-all     # Relancer tous les services
/restart-odoo    # Relancer uniquement Odoo
/restart-backoffice  # Relancer uniquement le backoffice
```

### Méthode 3 : Manuel

```bash
# Backend
cd odoo-backend && docker-compose up -d

# Backoffice
cd dashboard-client && npm run dev

# Site Vitrine
cd vitrine-quelyos && npm run dev

# E-commerce
cd vitrine-client && npm run dev
```

## Dépendances entre Services

```
Backend (8069) ─┐
                ├─→ Backoffice (5175)
                ├─→ Site Vitrine (3000)
                └─→ E-commerce (3001)
```

- **Le backend doit démarrer en premier** (les frontends en dépendent)
- Les frontends peuvent démarrer en parallèle une fois le backend prêt
- Temps de démarrage : Backend (~30s), Frontends (~5-10s chacun)

## Structure des Répertoires

```
quelyosSuite/
├── odoo-backend/           # Backend Odoo 19
│   ├── addons/
│   │   └── quelyos_api/    # Module API REST custom
│   └── docker-compose.yml
├── dashboard-client/       # Backoffice React
│   └── src/
├── vitrine-quelyos/        # Site vitrine Next.js 14
│   └── app/
│       ├── marketing/      # Pages marketing
│       ├── finance/        # Login finance
│       └── superadmin/     # Admin système
├── vitrine-client/         # E-commerce Next.js 16
│   └── app/
├── scripts/                # Scripts de gestion
│   ├── dev-start.sh
│   └── dev-stop.sh
└── .env.ports              # Configuration des ports
```

## Logs et Debugging

### Vérifier les services actifs

```bash
# Vérifier tous les ports
lsof -i:3000,3001,5175,8069

# Vérifier les conteneurs Docker
docker ps --filter "name=quelyos"

# Vérifier les processus Node.js
ps aux | grep -E "next|vite" | grep -v grep
```

### Consulter les logs

```bash
# Logs Backend
docker-compose logs -f

# Logs Backoffice
tail -f /tmp/quelyos-backoffice.log

# Logs Site Vitrine
tail -f /tmp/quelyos-vitrine.log

# Logs E-commerce
tail -f /tmp/quelyos-ecommerce.log
```

## Résolution de Problèmes

### Port déjà utilisé

```bash
# Trouver le processus utilisant le port
lsof -ti:3000

# Arrêter le processus
lsof -ti:3000 | xargs kill -9

# Ou utiliser le script
./scripts/dev-stop.sh all
```

### Service ne démarre pas

1. Vérifier que les dépendances sont installées : `npm install`
2. Vérifier que Docker est démarré (pour le backend)
3. Consulter les logs d'erreur
4. Vérifier la configuration des ports dans `.env.ports`

### Conflit de ports après git pull

```bash
# Arrêter tous les services
./scripts/dev-stop.sh all

# Vérifier les changements dans package.json
git diff HEAD~1 */package.json

# Redémarrer
./scripts/dev-start.sh all
```

## Configuration Production

Voir `nginx/` et `docs/deployment/` pour la configuration de production avec reverse proxy.

---

**Dernière mise à jour** : 2026-01-26
