# Commande /vps - Gestion Serveur VPS Contabo

Vérifie, corrige, met à jour et prépare le serveur VPS Contabo pour le déploiement de Quelyos Suite en production.

## Usage

```bash
/vps check              # Vérification état serveur
/vps update             # Mise à jour système + composants
/vps prepare            # Préparation déploiement
/vps fix                # Correction problèmes détectés
/vps deploy             # Déploiement complet application
/vps status             # État services en production
```

## Quand utiliser ?

- **Avant déploiement** : Vérifier que le serveur est prêt
- **Après incident** : Diagnostiquer et corriger les problèmes
- **Maintenance régulière** : Mettre à jour système et dépendances
- **Nouveau VPS** : Configuration initiale complète
- **Audit sécurité** : Vérifier configuration serveur

## Instructions pour Claude

Quand l'utilisateur exécute `/vps [commande]`, effectue :

### 1. /vps check - Vérification État Serveur

**AVANT TOUT** : Demander les informations de connexion VPS si non disponibles :
- IP serveur
- User SSH (root ou autre)
- Port SSH (défaut: 22)
- Clé SSH ou mot de passe

#### Checklist Vérification (100 pts)

**Connectivité (10 pts)**
- [ ] Connexion SSH opérationnelle
- [ ] Latence réseau acceptable (<100ms)
- [ ] Bande passante suffisante

**Système (20 pts)**
- [ ] OS : Ubuntu 22.04+ ou Debian 12+
- [ ] RAM disponible : >2GB libre
- [ ] Disque disponible : >20GB libre
- [ ] Swap configuré
- [ ] Timezone correcte (Europe/Paris)

**Sécurité (25 pts)**
- [ ] Firewall UFW actif
- [ ] Ports ouverts : 22 (SSH), 80 (HTTP), 443 (HTTPS)
- [ ] Fail2ban installé et actif
- [ ] Root login SSH désactivé
- [ ] Clés SSH configurées (pas de password auth)
- [ ] Unattended-upgrades activé

**Docker (20 pts)**
- [ ] Docker installé (version 24.0+)
- [ ] Docker Compose V2 installé
- [ ] Docker service actif
- [ ] User ajouté au groupe docker
- [ ] Images obsolètes nettoyées

**Web Server (15 pts)**
- [ ] Nginx installé et actif
- [ ] Configuration SSL/TLS (Let's Encrypt)
- [ ] Certificats valides (>30 jours)
- [ ] Renouvellement automatique certbot
- [ ] Gzip compression activée

**Base de Données (10 pts)**
- [ ] PostgreSQL 15+ via Docker
- [ ] Backups automatiques configurés
- [ ] Redis cache opérationnel
- [ ] Connexions limitées (max_connections)

#### Commandes Vérification

```bash
# Connexion et infos système
ssh user@vps-ip "uname -a && free -h && df -h"

# Services Docker
ssh user@vps-ip "docker --version && docker compose version && systemctl status docker"

# Nginx et SSL
ssh user@vps-ip "nginx -v && certbot certificates"

# Firewall
ssh user@vps-ip "sudo ufw status verbose"

# Sécurité
ssh user@vps-ip "sudo fail2ban-client status"
```

**Output** : Rapport Markdown avec :
- Score global /100
- Statut de chaque composant (✅ / ⚠️ / ❌)
- Problèmes détectés avec criticité (P0/P1/P2)
- Recommandations de correction

---

### 2. /vps update - Mise à Jour Serveur

**Ordre d'exécution** :

#### 2.1 Système d'Exploitation
```bash
ssh user@vps-ip << 'EOF'
  sudo apt update
  sudo apt upgrade -y
  sudo apt autoremove -y
  sudo apt autoclean
EOF
```

#### 2.2 Docker & Docker Compose
```bash
# Vérifier dernière version Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose V2
sudo apt install docker-compose-plugin -y
```

#### 2.3 Certificats SSL
```bash
ssh user@vps-ip "sudo certbot renew --dry-run"
```

#### 2.4 Nettoyage Docker
```bash
ssh user@vps-ip << 'EOF'
  docker system prune -af --volumes
  docker image prune -af
EOF
```

**Sauvegardes** : Toujours créer snapshot VPS AVANT mise à jour majeure.

---

### 3. /vps prepare - Préparation Déploiement

#### 3.1 Structure Dossiers
```bash
ssh user@vps-ip << 'EOF'
  mkdir -p /opt/quelyos/{app,backups,logs,ssl,scripts}
  mkdir -p /opt/quelyos/app/{odoo-backend,vitrine-quelyos,vitrine-client,dashboard-client,super-admin-client}
  chown -R $USER:$USER /opt/quelyos
EOF
```

#### 3.2 Variables d'Environnement
**CRITIQUE** : Générer `.env` sécurisé sur le serveur (JAMAIS committer en clair)

```bash
# Template .env production
cat > /tmp/quelyos.env << 'ENVEOF'
# === PRODUCTION ENVIRONMENT ===
NODE_ENV=production
VITE_ENV=production

# === Backend API ===
BACKEND_URL=https://api.quelyos.com
VITE_BACKEND_URL=https://api.quelyos.com
NEXT_PUBLIC_BACKEND_URL=https://api.quelyos.com

# === Database PostgreSQL ===
POSTGRES_DB=quelyos_prod
POSTGRES_USER=odoo
POSTGRES_PASSWORD=$(openssl rand -base64 32)
PGDATA=/var/lib/postgresql/data/pgdata

# === Redis Cache ===
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=$(openssl rand -base64 32)

# === Odoo Backend ===
ODOO_VERSION=19.0
ODOO_DB_HOST=postgres
ODOO_DB_PORT=5432
ODOO_DB_USER=odoo
ODOO_DB_PASSWORD=$(openssl rand -base64 32)
ODOO_ADMIN_PASSWORD=$(openssl rand -base64 32)

# === Security Secrets ===
JWT_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 64)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# === Email SMTP ===
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@quelyos.com
SMTP_PASSWORD=

# === Monitoring ===
SENTRY_DSN=
LOG_LEVEL=info
ENVEOF

# Transférer sur VPS
scp /tmp/quelyos.env user@vps-ip:/opt/quelyos/.env
ssh user@vps-ip "chmod 600 /opt/quelyos/.env"
rm /tmp/quelyos.env
```

#### 3.3 Docker Compose Production
Créer `/opt/quelyos/docker-compose.prod.yml` :

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: quelyos-db-prod
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - quelyos-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: quelyos-redis-prod
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - quelyos-network

  odoo:
    image: odoo:19.0
    container_name: quelyos-odoo-prod
    restart: unless-stopped
    depends_on:
      - postgres
      - redis
    environment:
      HOST: postgres
      PORT: 5432
      USER: ${POSTGRES_USER}
      PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - ./app/odoo-backend/addons:/mnt/extra-addons
      - odoo_data:/var/lib/odoo
    networks:
      - quelyos-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8069/web/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  vitrine-quelyos:
    build:
      context: ./app/vitrine-quelyos
      dockerfile: Dockerfile
    container_name: quelyos-vitrine-prod
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_BACKEND_URL: ${BACKEND_URL}
    networks:
      - quelyos-network

  vitrine-client:
    build:
      context: ./app/vitrine-client
      dockerfile: Dockerfile
    container_name: quelyos-ecommerce-prod
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_BACKEND_URL: ${BACKEND_URL}
    networks:
      - quelyos-network

  dashboard-client:
    build:
      context: ./app/dashboard-client
      dockerfile: Dockerfile
    container_name: quelyos-dashboard-prod
    restart: unless-stopped
    environment:
      VITE_BACKEND_URL: ${BACKEND_URL}
    networks:
      - quelyos-network

  super-admin-client:
    build:
      context: ./app/super-admin-client
      dockerfile: Dockerfile
    container_name: quelyos-superadmin-prod
    restart: unless-stopped
    environment:
      VITE_BACKEND_URL: ${BACKEND_URL}
    networks:
      - quelyos-network

  nginx:
    image: nginx:alpine
    container_name: quelyos-nginx-prod
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - /var/log/nginx:/var/log/nginx
    depends_on:
      - odoo
      - vitrine-quelyos
      - vitrine-client
      - dashboard-client
      - super-admin-client
    networks:
      - quelyos-network

volumes:
  postgres_data:
  redis_data:
  odoo_data:

networks:
  quelyos-network:
    driver: bridge
```

#### 3.4 Configuration Nginx
Créer `/opt/quelyos/nginx.conf` avec reverse proxy pour tous les services.

#### 3.5 Certificats SSL Let's Encrypt
```bash
ssh user@vps-ip << 'EOF'
  sudo apt install certbot python3-certbot-nginx -y

  # Obtenir certificats (remplacer domaines réels)
  sudo certbot --nginx -d quelyos.com -d www.quelyos.com \
    -d api.quelyos.com -d app.quelyos.com \
    -d admin.quelyos.com --non-interactive --agree-tos \
    -m admin@quelyos.com

  # Auto-renouvellement
  sudo systemctl enable certbot.timer
  sudo systemctl start certbot.timer
EOF
```

---

### 4. /vps fix - Correction Problèmes

**Basé sur rapport `/vps check`**, applique corrections automatiques :

#### Problèmes Courants

**P0 - Critique (bloquer déploiement)**
- Docker non installé → Installer Docker + Compose
- Ports 443 fermés → Ouvrir via UFW
- Certificats SSL expirés → Renouveler certbot
- Disque plein (>90%) → Nettoyer logs + Docker

**P1 - Urgent (corriger rapidement)**
- RAM <500MB → Augmenter swap ou upgrade VPS
- Fail2ban inactif → Activer + configurer
- Backups manquants → Configurer cron backups

**P2 - Mineur (amélioration)**
- Swap non configuré → Créer swapfile
- Timezone incorrecte → Configurer UTC ou Europe/Paris
- Unattended-upgrades désactivé → Activer

#### Script Correction Auto
```bash
#!/bin/bash
# /opt/quelyos/scripts/auto-fix.sh

# Nettoyage disque
docker system prune -af
sudo journalctl --vacuum-time=7d

# Sécurité
sudo ufw --force enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Swap (si <2GB)
if [ $(free -m | grep Swap | awk '{print $2}') -lt 2048 ]; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# Renouveler SSL
sudo certbot renew --quiet

echo "✅ Corrections appliquées"
```

---

### 5. /vps deploy - Déploiement Production

**ATTENTION** : Déploiement en production = DOWNTIME possible.

#### 5.1 Pré-déploiement
- [ ] Backup base de données : `pg_dump quelyos_prod > backup.sql`
- [ ] Snapshot VPS (via panel Contabo)
- [ ] Vérifier `/vps check` = 100% vert
- [ ] Tests locaux passés : `/test`

#### 5.2 Build & Transfer
```bash
# Build local des images Docker
docker compose -f docker-compose.prod.yml build

# Tag et push vers registry (Docker Hub ou privé)
docker tag quelyos-vitrine:latest your-registry/quelyos-vitrine:latest
docker push your-registry/quelyos-vitrine:latest

# OU : Transférer code source sur VPS et build distant
rsync -avz --exclude 'node_modules' --exclude '.git' \
  ./ user@vps-ip:/opt/quelyos/app/
```

#### 5.3 Déploiement
```bash
ssh user@vps-ip << 'EOF'
  cd /opt/quelyos

  # Pull dernières images
  docker compose -f docker-compose.prod.yml pull

  # Arrêt services
  docker compose -f docker-compose.prod.yml down

  # Migration DB (si nécessaire)
  # docker exec quelyos-db-prod pg_restore ...

  # Redémarrage
  docker compose -f docker-compose.prod.yml up -d

  # Vérifier santé
  docker compose -f docker-compose.prod.yml ps
  docker compose -f docker-compose.prod.yml logs --tail=50
EOF
```

#### 5.4 Post-déploiement
- [ ] Healthcheck API : `curl https://api.quelyos.com/health`
- [ ] Tester frontends : ouvrir chaque domaine
- [ ] Vérifier logs : `docker compose logs -f`
- [ ] Monitoring actif (Sentry, Uptime Robot)

---

### 6. /vps status - État Services Production

Affiche statut temps réel :

```bash
ssh user@vps-ip << 'EOF'
  echo "=== Docker Containers ==="
  docker compose -f /opt/quelyos/docker-compose.prod.yml ps

  echo -e "\n=== System Resources ==="
  free -h
  df -h /

  echo -e "\n=== Nginx Status ==="
  systemctl status nginx --no-pager

  echo -e "\n=== SSL Certificates ==="
  sudo certbot certificates

  echo -e "\n=== Last 20 Logs ==="
  docker compose -f /opt/quelyos/docker-compose.prod.yml logs --tail=20
EOF
```

**Output** : Dashboard textuel avec émojis :
- ✅ Service actif et healthy
- ⚠️ Service actif mais warning
- ❌ Service down
- 📊 Métriques (RAM, CPU, disque)

---

## Sécurité & Bonnes Pratiques

### Secrets Management
**JAMAIS** :
- Committer `.env` avec passwords en clair
- Exposer secrets dans logs
- Utiliser mots de passe simples

**TOUJOURS** :
- Générer secrets aléatoires : `openssl rand -base64 32`
- Utiliser `.env` avec `chmod 600`
- Rotation régulière des passwords

### Backups Automatiques
Créer cron job backup PostgreSQL :
```bash
# /etc/cron.daily/quelyos-backup
docker exec quelyos-db-prod pg_dump -U odoo quelyos_prod | gzip > /opt/quelyos/backups/quelyos-$(date +%Y%m%d).sql.gz

# Garder 30 jours
find /opt/quelyos/backups/ -name "*.sql.gz" -mtime +30 -delete
```

### Monitoring Production
**À configurer** :
- Uptime Robot : Vérifier disponibilité HTTPS
- Sentry : Capturer erreurs applicatives
- Logs centralisés : Loki ou ELK stack
- Alertes email/Slack : Downtime, erreurs critiques

---

## Dépannage Rapide

### Serveur inaccessible (SSH timeout)
1. Vérifier IP VPS via panel Contabo
2. Vérifier firewall local bloque port 22
3. Tester ping : `ping vps-ip`
4. Accès console Contabo VNC

### Docker compose échoue
```bash
# Logs détaillés
docker compose -f docker-compose.prod.yml logs service-name

# Rebuild sans cache
docker compose -f docker-compose.prod.yml build --no-cache service-name

# Reset complet (ATTENTION : perte données non volumées)
docker compose -f docker-compose.prod.yml down -v
```

### Certificat SSL expiré
```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### Base de données corrompue
```bash
# Restore depuis backup
docker exec -i quelyos-db-prod psql -U odoo quelyos_prod < backup.sql
```

---

## Notes Importantes

- **Toujours tester en staging avant prod**
- **Documenter chaque changement infrastructure**
- **Garder accès console VNC Contabo en backup**
- **Snapshot VPS avant modifications majeures**
- **Monitorer après chaque déploiement (30min minimum)**
