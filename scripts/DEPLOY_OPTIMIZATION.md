# ⚡ Optimisation Déploiement VPS - Guide Complet

## 🎯 Objectif
Réduire le temps de déploiement pour permettre **plusieurs déploiements par jour** (3-5+) avec des cycles rapides.

## 📊 Performances

| Mode | Temps | Use Case | Options |
|------|-------|----------|---------|
| **FAST** ⚡ | **~2-3 min** | Déploiements multiples/jour | `./deploy-vps.sh` (défaut) |
| **SAFE** 🛡️ | ~6-8 min | Déploiements critiques | `./deploy-vps.sh --safe` |
| **Single App** 🎯 | **~1-2 min** | Hotfix ciblé | `./deploy-vps.sh --app=dashboard` |

### Gain de Performance

**Avant optimisation** : ~6-8 min
**Après optimisation** : ~2-3 min
**Gain** : **~60-70% plus rapide**

## 🚀 Modes de Déploiement

### Mode FAST (Défaut) ⚡

**Usage** :
```bash
./scripts/deploy-vps.sh              # Mode fast par défaut
./scripts/deploy-vps.sh --fast       # Explicite
```

**Caractéristiques** :
- ✅ Build incrémental (cache Docker layers)
- ✅ Build parallèle des 4 apps
- ✅ Skip backup PostgreSQL
- ✅ Sleeps réduits (10s + 5s = 15s)
- ✅ Rsync checksum intelligent
- ✅ Deploy uniquement si changements détectés

**Temps moyen** : **2-3 minutes**

**Quand utiliser** :
- Développement actif
- Déploiements multiples par jour (3-5+)
- Corrections mineures / hotfix
- Tests en production

---

### Mode SAFE (Sécurisé) 🛡️

**Usage** :
```bash
./scripts/deploy-vps.sh --safe
```

**Caractéristiques** :
- ✅ Build from scratch (`--no-cache`)
- ✅ Backup PostgreSQL automatique
- ✅ Sleeps longs (30s + 15s = 45s)
- ✅ Rsync verbose complet
- ✅ Vérifications étendues

**Temps moyen** : **6-8 minutes**

**Quand utiliser** :
- Déploiements majeurs (nouvelles features)
- Changements structurels (DB, backend)
- Avant maintenance planifiée
- Fin de sprint / release candidate

---

### Mode Single App 🎯

**Usage** :
```bash
./scripts/deploy-vps.sh --app=dashboard    # Dashboard uniquement
./scripts/deploy-vps.sh --app=ecommerce    # E-commerce uniquement
./scripts/deploy-vps.sh --app=vitrine      # Site vitrine uniquement
./scripts/deploy-vps.sh --app=superadmin   # Super admin uniquement
```

**Caractéristiques** :
- ✅ Build + deploy 1 seule app
- ✅ Mode fast automatique
- ✅ Skip les autres services
- ✅ Temps divisé par 3-4

**Temps moyen** : **1-2 minutes**

**Quand utiliser** :
- Hotfix urgent sur une app
- Corrections CSS/UI
- Tests A/B
- Debug production ciblé

---

## 🔧 Options Avancées

### Combinaisons Utiles

```bash
# Fast deploy d'une seule app (ULTRA RAPIDE - ~1 min)
./scripts/deploy-vps.sh --app=dashboard

# Safe deploy d'une app critique
./scripts/deploy-vps.sh --app=ecommerce --safe

# Deploy avec backup forcé (mais cache Docker)
./scripts/deploy-vps.sh --with-backup

# Deploy sans cache (mais sans backup)
./scripts/deploy-vps.sh --no-cache

# Skip upgrade backend Odoo
./scripts/deploy-vps.sh --skip-odoo

# Simulation (dry-run)
./scripts/deploy-vps.sh --dry-run
```

### Tableau des Options

| Option | Description | Mode Affecté |
|--------|-------------|--------------|
| `--fast` | Mode rapide (défaut) | Tous |
| `--safe` | Mode sécurisé | Tous |
| `--app=NAME` | Deploy 1 app | Fast |
| `--with-backup` | Forcer backup | Fast → +backup |
| `--skip-backup` | Skip backup | Safe → Fast |
| `--no-cache` | Build from scratch | Fast → +no-cache |
| `--skip-odoo` | Skip upgrade backend | Tous |
| `--dry-run` | Simulation | Tous |

---

## 📈 Optimisations Techniques

### 1. Build Incrémental (Docker Cache)

**Avant** :
```bash
docker compose build --no-cache  # 4-5 min
```

**Après** :
```bash
docker compose build              # 1-2 min (cache layers)
```

**Gain** : ~3 minutes (~60%)

**Comment** :
- Docker réutilise les layers inchangés
- Seules les étapes modifiées sont rebuild
- `package.json` identique → skip `pnpm install`
- Code source changé → rebuild uniquement l'app

---

### 2. Build Parallèle

**Avant** :
```bash
docker compose build  # Séquentiel: vitrine → ecommerce → dashboard → superadmin
```

**Après** :
```bash
docker compose build --parallel  # 4 apps en parallèle
```

**Gain** : ~2 minutes (~40%)

**Comment** :
- 4 builds simultanés (CPU multi-core)
- Utilise ressources VPS optimalement
- Réduit temps total de moitié

---

### 3. Skip Backup par Défaut

**Avant** :
```bash
pg_dump | gzip > backup.sql.gz  # 30-60s
```

**Après** :
```bash
# Skip backup en mode fast (déploiements multiples/jour)
# Backup quotidien via cron à la place
```

**Gain** : ~45 secondes

**Alternative** :
```bash
# Cron quotidien (1x/jour à 3h du matin)
0 3 * * * /home/deploy/scripts/backup-db.sh
```

---

### 4. Sleeps Intelligents

**Avant** :
```bash
sleep 30  # Attente backend Odoo
sleep 15  # Attente démarrage conteneurs
# Total: 45s
```

**Après (Fast Mode)** :
```bash
sleep 10  # Backend (suffisant pour restart)
sleep 5   # Conteneurs (démarrent plus vite)
# Total: 15s
```

**Gain** : ~30 secondes

**Justification** :
- Les conteneurs Next.js démarrent en 2-3s (standalone)
- Odoo restart sans migration = 5-8s
- Health checks avec retry automatique

---

### 5. Rsync Checksum

**Avant** :
```bash
rsync -avz  # Compare timestamp uniquement
```

**Après (Fast Mode)** :
```bash
rsync -azq --checksum  # Compare hash MD5, quiet
```

**Gain** : ~10-20 secondes

**Avantage** :
- Skip fichiers identiques même si timestamp différent
- Transfert uniquement si contenu changé
- Moins verbeux (quiet)

---

## 🎯 Workflows Recommandés

### Développement Quotidien (3-5 deploys/jour)

```bash
# Matin: Deploy complet safe (1x)
./scripts/deploy-vps.sh --safe

# Journée: Deploys rapides (3-4x)
./scripts/deploy-vps.sh                    # Full fast
./scripts/deploy-vps.sh --app=dashboard    # Ciblé si hotfix
./scripts/deploy-vps.sh --app=ecommerce    # Ciblé si hotfix
```

### Hotfix Urgent (< 2 min)

```bash
# Fix bug sur Dashboard
git commit -m "fix(dashboard): correction bug critique"
git push
./scripts/deploy-vps.sh --app=dashboard --skip-odoo

# Deploy ciblé + skip backend = ~1 min
```

### Release Majeure (safe)

```bash
# Fin de sprint / nouvelle feature majeure
git tag v1.2.0
git push --tags
./scripts/deploy-vps.sh --safe

# Full rebuild + backup + vérifications = ~6-8 min
```

### Changement Backend Odoo

```bash
# Modification modèle Odoo
git commit -m "feat(backend): nouveau champ Product.x_featured"
git push

# Deploy avec upgrade backend
./scripts/deploy-vps.sh  # Auto-détecte changes backend

# Si skip volontaire:
./scripts/deploy-vps.sh --skip-odoo
```

---

## 📊 Métriques & Monitoring

### Temps de Déploiement Cibles

| Opération | Temps Cible | Acceptable | Alerte |
|-----------|-------------|------------|--------|
| Fast (all) | 2-3 min | < 4 min | > 5 min |
| Fast (single) | 1-2 min | < 3 min | > 4 min |
| Safe (all) | 6-8 min | < 10 min | > 12 min |

### Commandes Utiles

```bash
# Timer déploiement
time ./scripts/deploy-vps.sh

# Logs déploiement
./scripts/deploy-vps.sh 2>&1 | tee logs/deploy-$(date +%Y%m%d_%H%M%S).log

# Stats Docker build
ssh quelyos-vps "docker system df"

# Nettoyage cache (si builds lents)
ssh quelyos-vps "docker builder prune -af"
```

---

## ⚠️ Limitations & Précautions

### Mode Fast

**Ne PAS utiliser si** :
- Changements DB schema (migrations PostgreSQL)
- Changements modèles Odoo critiques
- Première installation
- Après longue période sans deploy (> 1 semaine)

**Dans ces cas** → Utiliser `--safe`

### Cache Docker

**Problème** : Cache corrompu ou obsolète
**Solution** :
```bash
# Forcer rebuild complet (1x)
./scripts/deploy-vps.sh --no-cache

# ou
ssh quelyos-vps "docker builder prune -af"
./scripts/deploy-vps.sh
```

### Backup PostgreSQL

**Attention** : Mode fast skip backup par défaut

**Solution** :
```bash
# Cron backup quotidien (recommandé)
0 3 * * * /home/deploy/scripts/backup-db.sh

# Ou forcer backup si critique
./scripts/deploy-vps.sh --with-backup
```

---

## 🎉 Résumé

### Mode Fast (Défaut) ⚡
- **Temps** : 2-3 min (all) / 1-2 min (single app)
- **Usage** : Déploiements multiples/jour
- **Commande** : `./scripts/deploy-vps.sh`

### Mode Safe 🛡️
- **Temps** : 6-8 min
- **Usage** : Déploiements critiques/releases
- **Commande** : `./scripts/deploy-vps.sh --safe`

### Gain Global
- **Avant** : 6-8 min par deploy
- **Après** : 2-3 min par deploy
- **Amélioration** : **60-70% plus rapide**
- **Capacité** : 3-5+ deploys/jour sans friction

---

## 📚 Ressources

- **Script** : `scripts/deploy-vps.sh`
- **Docker Compose** : `deploy/vps/docker-compose.yml`
- **Monitoring** : `scripts/monitoring/health-check.sh`
- **Backup** : `scripts/monitoring/docker-monitor.sh`

**Documentation complète** : `DEPLOYMENT_COMPLETE.md`
