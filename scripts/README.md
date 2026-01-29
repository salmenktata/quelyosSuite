# Scripts de Gestion Quelyos ERP

## Vue d'ensemble

Ce répertoire contient les scripts de gestion centralisée des services Quelyos ERP.

## Scripts Disponibles

### `dev-start.sh` - Démarrage des services

Démarre les services Quelyos ERP avec gestion intelligente des ports et des dépendances.

**Usage** :

```bash
# Démarrer tous les services
./scripts/dev-start.sh all

# Démarrer un service spécifique
./scripts/dev-start.sh backend
./scripts/dev-start.sh backoffice
./scripts/dev-start.sh vitrine
./scripts/dev-start.sh ecommerce
```

**Fonctionnalités** :

- ✅ Vérification des ports avant démarrage (évite les conflits)
- ✅ Attente de disponibilité de chaque service
- ✅ Logs centralisés dans `/tmp/quelyos-*.log`
- ✅ PIDs sauvegardés dans `/tmp/quelyos-*.pid`
- ✅ Messages colorés pour meilleure visibilité
- ✅ Démarrage séquentiel respectant les dépendances

**Ordre de démarrage** :
1. Backend Odoo (nécessaire pour les frontends)
2. Backoffice, Site Vitrine, E-commerce (en parallèle)

### `dev-stop.sh` - Arrêt des services

Arrête proprement les services Quelyos ERP.

**Usage** :

```bash
# Arrêter tous les services
./scripts/dev-stop.sh all

# Arrêter un service spécifique
./scripts/dev-stop.sh backend
./scripts/dev-stop.sh backoffice
./scripts/dev-stop.sh vitrine
./scripts/dev-stop.sh ecommerce
```

**Fonctionnalités** :

- ✅ Arrêt propre par PID (si disponible)
- ✅ Arrêt forcé par port (fallback)
- ✅ Nettoyage des fichiers de logs
- ✅ Nettoyage des fichiers PID
- ✅ Arrêt des conteneurs Docker (backend)

## Configuration des Ports

Les ports sont définis dans `.env.ports` à la racine du projet :

```bash
BACKEND_PORT=8069
BACKOFFICE_PORT=5175
VITRINE_PORT=3000       # Site vitrine
ECOMMERCE_PORT=3001     # Boutique e-commerce
```

## Logs

Les logs des services sont disponibles dans `/tmp/` :

```bash
# Consulter les logs en temps réel
tail -f /tmp/quelyos-backoffice.log
tail -f /tmp/quelyos-vitrine.log
tail -f /tmp/quelyos-ecommerce.log

# Logs Backend
cd odoo-backend && docker-compose logs -f
```

## Debugging

### Vérifier l'état des services

```bash
# Ports actifs
lsof -i:3000,3001,5175,8069

# Conteneurs Docker
docker ps --filter "name=quelyos"

# Processus Node.js
ps aux | grep -E "next|vite" | grep -v grep
```

### Service ne démarre pas

1. **Vérifier le port** : `lsof -i:PORT`
2. **Consulter les logs** : `tail -50 /tmp/quelyos-SERVICE.log`
3. **Vérifier les dépendances** : `cd SERVICE && pnpm install`
4. **Arrêter complètement** : `./scripts/dev-stop.sh all`

### Port déjà utilisé

```bash
# Trouver et tuer le processus
lsof -ti:3000 | xargs kill -9

# Ou utiliser le script
./scripts/dev-stop.sh all
```

## Intégration avec Claude Code

Ces scripts sont utilisés par les commandes Claude Code :

- `/restart-all` - Utilise `dev-stop.sh all` puis `dev-start.sh all`
- `/restart-odoo` - Utilise `dev-stop.sh backend` puis `dev-start.sh backend`
- `/restart-backoffice` - Utilise `dev-stop.sh backoffice` puis `dev-start.sh backoffice`

## Exemples d'Usage

### Workflow de développement typique

```bash
# Matin : démarrer tout
./scripts/dev-start.sh all

# Travailler...

# Redémarrer le backend après modif Odoo
./scripts/dev-stop.sh backend
./scripts/dev-start.sh backend

# Soir : tout arrêter
./scripts/dev-stop.sh all
```

### Développement backend uniquement

```bash
# Démarrer uniquement Odoo
./scripts/dev-start.sh backend

# Travailler sur l'API...

# Arrêter
./scripts/dev-stop.sh backend
```

### Développement frontend uniquement

```bash
# Démarrer backend + un frontend
./scripts/dev-start.sh backend
./scripts/dev-start.sh vitrine  # ou ecommerce ou backoffice

# Arrêter le frontend
./scripts/dev-stop.sh vitrine
```

## Avantages vs Démarrage Manuel

| Aspect | Manuel | Script |
|--------|--------|--------|
| Temps de setup | 3-5 min | 30-60 sec |
| Risque d'erreur | Élevé | Faible |
| Gestion des ports | Manuelle | Automatique |
| Logs | Dispersés | Centralisés |
| Nettoyage | Manuel | Automatique |
| Vérification santé | Manuelle | Automatique |

## Contribution

Pour ajouter un nouveau service :

1. Ajouter le port dans `.env.ports`
2. Créer les fonctions `start_SERVICE` et `stop_SERVICE`
3. Ajouter le case dans le switch principal
4. Mettre à jour cette documentation

---

**Dernière mise à jour** : 2026-01-26
