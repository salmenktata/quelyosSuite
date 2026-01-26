# Quickstart Quelyos ERP

Guide de démarrage rapide pour développeurs.

## Installation en 2 minutes

```bash
# 1. Cloner et installer
git clone https://github.com/salmenktata/quelyosSuite.git
cd quelyosSuite
pnpm install  # ou npm install dans chaque dossier

# 2. Démarrer tous les services
./scripts/dev-start.sh all

# 3. Accéder aux interfaces
# http://localhost:3000 - Site vitrine
# http://localhost:3001 - E-commerce
# http://localhost:5175 - Backoffice
# http://localhost:8069 - Odoo (admin/admin)
```

## Services et Ports

| URL | Service | Description |
|-----|---------|-------------|
| http://localhost:3000 | Site Vitrine | Marketing, Finance, Superadmin |
| http://localhost:3001 | E-commerce | Boutique en ligne |
| http://localhost:5175 | Backoffice | Administration |
| http://localhost:8069 | API Odoo | Backend + Interface native |

## Commandes Essentielles

```bash
# Démarrer/Arrêter tout
./scripts/dev-start.sh all
./scripts/dev-stop.sh all

# Services individuels
./scripts/dev-start.sh backend
./scripts/dev-start.sh backoffice
./scripts/dev-start.sh vitrine
./scripts/dev-start.sh ecommerce

# Avec Claude Code
/restart-all           # Relancer tout
/restart-odoo          # Relancer Odoo uniquement
/restart-backoffice    # Relancer backoffice uniquement
```

## Logs

```bash
# Frontend/Backoffice
tail -f /tmp/quelyos-backoffice.log
tail -f /tmp/quelyos-vitrine.log
tail -f /tmp/quelyos-ecommerce.log

# Backend Odoo
cd odoo-backend && docker-compose logs -f
```

## Problèmes Courants

### Port déjà utilisé

```bash
./scripts/dev-stop.sh all
lsof -ti:3000 | xargs kill -9  # Forcer si nécessaire
./scripts/dev-start.sh all
```

### Service ne démarre pas

```bash
# Vérifier les logs
tail -50 /tmp/quelyos-SERVICE.log

# Réinstaller les dépendances
cd SERVICE && npm install

# Redémarrer proprement
./scripts/dev-stop.sh all
./scripts/dev-start.sh all
```

### Docker ne démarre pas

```bash
# Vérifier Docker
docker ps

# Redémarrer Docker Desktop (macOS)
# Puis relancer
./scripts/dev-start.sh backend
```

## Structure du Projet

```
quelyosSuite/
├── vitrine-quelyos/    # Site vitrine (3000)
├── vitrine-client/     # E-commerce (3001)
├── dashboard-client/   # Backoffice (5175)
├── odoo-backend/       # API Odoo (8069)
├── scripts/            # Scripts de gestion
│   ├── dev-start.sh
│   └── dev-stop.sh
└── .env.ports          # Configuration des ports
```

## Workflow de Développement

```bash
# 1. Matin : tout démarrer
./scripts/dev-start.sh all

# 2. Développer...

# 3. Modifier un modèle Odoo ? Redémarrer le backend
./scripts/dev-stop.sh backend
# Incrémenter version dans __manifest__.py
./scripts/dev-start.sh backend
/upgrade-odoo  # Via Claude Code

# 4. Soir : tout arrêter
./scripts/dev-stop.sh all
```

## Prochaines Étapes

1. **Lire la documentation complète** : [ARCHITECTURE.md](ARCHITECTURE.md)
2. **Comprendre les workflows Odoo** : [odoo-backend/DEVELOPMENT.md](odoo-backend/DEVELOPMENT.md)
3. **Explorer les conventions** : [.claude/reference/](./claude/reference/)
4. **Consulter l'API** : [.claude/API_CONVENTIONS.md](./.claude/API_CONVENTIONS.md)

## Support

- **Documentation** : Voir [README.md](README.md) et [ARCHITECTURE.md](ARCHITECTURE.md)
- **Commandes Claude** : Taper `/help` dans Claude Code
- **Scripts** : Voir [scripts/README.md](scripts/README.md)

---

🚀 **Prêt à développer !**
