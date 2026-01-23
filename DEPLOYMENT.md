# 🚀 Guide de Déploiement Production - Quelyos ERP

Ce guide détaille le déploiement complet de la plateforme Quelyos ERP en production.

## 📋 Prérequis Production

- Serveur Linux (Ubuntu 22.04 LTS recommandé)
- Docker & Docker Compose installés
- Nom de domaine configuré (ex: shop.quelyos.com)
- Certificat SSL/TLS (Let's Encrypt)
- Minimum 4GB RAM, 2 vCPU, 50GB SSD

## 🏗️ Architecture Production

```
                    Internet
                        ↓
                  [Load Balancer]
                        ↓
            ┌───────────┴───────────┐
            ↓                       ↓
    [Nginx Reverse Proxy]    [Nginx Reverse Proxy]
       (SSL Termination)        (SSL Termination)
            ↓                       ↓
    ┌───────┴───────┐       ┌───────┴───────┐
    ↓               ↓       ↓               ↓
[Next.js]      [Odoo]  [Next.js]      [Odoo]
    ↓               ↓       ↓               ↓
    └───────┬───────┘       └───────┬───────┘
            ↓                       ↓
    [PostgreSQL Primary]    [PostgreSQL Replica]
            ↓
       [Backup S3]
```

## 🔧 Configuration Environnement

### 1. Variables d'environnement

Créer `/root/.env.production`:

```bash
# Database
POSTGRES_DB=quelyos_prod
POSTGRES_USER=odoo
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD

# Odoo
ODOO_ADMIN_PASSWD=CHANGE_ME_ADMIN_MASTER_PASSWORD
ODOO_DB_HOST=db
ODOO_DB_PORT=5432
ODOO_DB_USER=odoo
ODOO_DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD

# Frontend
NEXT_PUBLIC_ODOO_URL=https://api.quelyos.com
NEXT_PUBLIC_SITE_URL=https://shop.quelyos.com
ODOO_DATABASE=quelyos_prod
ODOO_WEBHOOK_SECRET=CHANGE_ME_WEBHOOK_SECRET

# Security
SESSION_SECRET=CHANGE_ME_SESSION_SECRET
CORS_ALLOWED_ORIGINS=https://shop.quelyos.com,https://www.quelyos.com

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@quelyos.com
EMAIL_PASSWORD=CHANGE_ME_EMAIL_PASSWORD
EMAIL_FROM=noreply@quelyos.com

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=INFO

# Backup
BACKUP_S3_BUCKET=quelyos-backups
AWS_ACCESS_KEY_ID=YOUR_AWS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET
```

### 2. Docker Compose Production

Créer `/root/docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - backend
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

  odoo:
    image: odoo:19.0
    restart: always
    depends_on:
      - db
    environment:
      - HOST=db
      - USER=${ODOO_DB_USER}
      - PASSWORD=${ODOO_DB_PASSWORD}
    volumes:
      - ./addons:/mnt/extra-addons
      - odoo-web-data:/var/lib/odoo
      - ./config:/etc/odoo
    networks:
      - backend
      - frontend
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile.prod
    restart: always
    env_file:
      - .env.production
    networks:
      - frontend
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    networks:
      - frontend
    depends_on:
      - odoo
      - frontend

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - backend

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true

volumes:
  postgres-data:
  odoo-web-data:
  redis-data:
```

### 3. Configuration Nginx

Créer `/root/nginx/nginx.conf`:

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    # Frontend Next.js
    upstream frontend {
        least_conn;
        server frontend:3000 max_fails=3 fail_timeout=30s;
    }

    # Backend Odoo
    upstream odoo {
        least_conn;
        server odoo:8069 max_fails=3 fail_timeout=30s;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name shop.quelyos.com api.quelyos.com;
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # Frontend HTTPS
    server {
        listen 443 ssl http2;
        server_name shop.quelyos.com;

        ssl_certificate /etc/letsencrypt/live/shop.quelyos.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/shop.quelyos.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # Backend Odoo HTTPS
    server {
        listen 443 ssl http2;
        server_name api.quelyos.com;

        ssl_certificate /etc/letsencrypt/live/api.quelyos.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api.quelyos.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        client_max_body_size 100M;

        location / {
            proxy_pass http://odoo;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_redirect off;
        }

        location /longpolling {
            proxy_pass http://odoo;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
        }
    }
}
```

## 🔐 SSL/TLS avec Let's Encrypt

### 1. Installation Certbot

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

### 2. Obtenir Certificats

```bash
# Frontend
sudo certbot certonly --nginx -d shop.quelyos.com

# Backend API
sudo certbot certonly --nginx -d api.quelyos.com
```

### 3. Auto-renewal

```bash
# Tester le renouvellement
sudo certbot renew --dry-run

# Cron pour auto-renewal (déjà configuré par certbot)
sudo systemctl status certbot.timer
```

## 📦 Déploiement

### 1. Initial Deployment

```bash
# 1. SSH sur le serveur
ssh user@your-server.com

# 2. Cloner le repo
git clone https://github.com/your-org/QuelyosERP.git /opt/quelyos
cd /opt/quelyos

# 3. Copier .env
cp .env.production.example .env.production
nano .env.production  # Éditer avec vraies valeurs

# 4. Build & Start
docker-compose -f docker-compose.prod.yml up -d --build

# 5. Installer modules Odoo
docker-compose -f docker-compose.prod.yml exec odoo \
  odoo -d quelyos_prod -i quelyos_branding,quelyos_ecommerce --stop-after-init

# 6. Redémarrer
docker-compose -f docker-compose.prod.yml restart
```

### 2. Continuous Deployment (CI/CD)

Exemple avec GitHub Actions (`.github/workflows/deploy.yml`):

```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/quelyos
            git pull origin main
            docker-compose -f docker-compose.prod.yml up -d --build
            docker-compose -f docker-compose.prod.yml exec -T odoo \
              odoo -d quelyos_prod -u quelyos_ecommerce --stop-after-init
            docker-compose -f docker-compose.prod.yml restart
```

## 📊 Monitoring

### 1. Logs

```bash
# Voir logs en temps réel
docker-compose -f docker-compose.prod.yml logs -f

# Logs spécifiques
docker-compose -f docker-compose.prod.yml logs -f odoo
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### 2. Métriques

Installer Prometheus + Grafana:

```bash
# Prometheus pour Odoo
docker run -d -p 9090:9090 prom/prometheus

# Grafana
docker run -d -p 3001:3000 grafana/grafana
```

### 3. Health Checks

Créer `/opt/quelyos/healthcheck.sh`:

```bash
#!/bin/bash

# Check Odoo
curl -f http://localhost:8069/web/health || exit 1

# Check Frontend
curl -f http://localhost:3000/api/health || exit 1

# Check Database
docker-compose -f docker-compose.prod.yml exec -T db \
  pg_isready -U odoo -d quelyos_prod || exit 1

echo "All services healthy"
```

## 💾 Backups

### 1. Backup Automatique PostgreSQL

Créer `/opt/quelyos/scripts/backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/opt/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="quelyos_prod"

# Créer répertoire backup
mkdir -p $BACKUP_DIR

# Dump PostgreSQL
docker-compose -f /opt/quelyos/docker-compose.prod.yml exec -T db \
  pg_dump -U odoo $DB_NAME | gzip > $BACKUP_DIR/quelyos_$DATE.sql.gz

# Upload vers S3
aws s3 cp $BACKUP_DIR/quelyos_$DATE.sql.gz \
  s3://quelyos-backups/database/

# Garder seulement 30 derniers jours localement
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: quelyos_$DATE.sql.gz"
```

### 2. Cron Backup

```bash
# Éditer crontab
crontab -e

# Ajouter backup quotidien à 2h du matin
0 2 * * * /opt/quelyos/scripts/backup.sh >> /var/log/quelyos-backup.log 2>&1
```

## 🔄 Mise à Jour

```bash
# 1. Backup avant mise à jour
/opt/quelyos/scripts/backup.sh

# 2. Pull dernières modifications
cd /opt/quelyos
git pull origin main

# 3. Rebuild & Restart
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Mettre à jour modules Odoo
docker-compose -f docker-compose.prod.yml exec odoo \
  odoo -d quelyos_prod -u quelyos_ecommerce --stop-after-init

# 5. Restart
docker-compose -f docker-compose.prod.yml restart
```

## 🛡️ Sécurité Checklist

- [ ] Firewall configuré (UFW)
- [ ] SSH avec clés publiques seulement
- [ ] Passwords forts dans .env.production
- [ ] SSL/TLS configuré (Let's Encrypt)
- [ ] Headers sécurité dans Nginx
- [ ] Rate limiting actif
- [ ] Backups automatiques quotidiens
- [ ] Monitoring actif
- [ ] Logs centralisés
- [ ] Mises à jour système automatiques

## 📈 Performance Tuning

### PostgreSQL

Éditer `/etc/postgresql/postgresql.conf`:

```ini
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
work_mem = 10MB
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = 4
max_parallel_workers_per_gather = 2
max_parallel_workers = 4
```

### Odoo

Éditer `/etc/odoo/odoo.conf`:

```ini
[options]
workers = 4
max_cron_threads = 2
db_maxconn = 64
limit_memory_hard = 2684354560
limit_memory_soft = 2147483648
limit_request = 8192
limit_time_cpu = 600
limit_time_real = 1200
```

---

**Documentation version:** 1.0.0
