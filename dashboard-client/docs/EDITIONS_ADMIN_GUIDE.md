# Guide Administration - Système Éditions Quelyos

**Version** : 1.0  
**Date** : 2026-01-31  
**Audience** : DevOps, SysAdmin, Responsables Infrastructure

---

## 🎯 Introduction

Ce guide explique comment **administrer, déployer et monitorer** les 8 éditions Quelyos. Chaque édition est une version spécialisée de Quelyos Suite déployable indépendamment.

### **8 Éditions Disponibles**

| Édition | Port Prod | URL Prod | Modules | Clients Cibles |
|---------|-----------|----------|---------|----------------|
| **full** | 5175 | suite.quelyos.com | Tous | Entreprises complètes |
| **finance** | 3010 | finance.quelyos.com | finance | DAF, Comptables |
| **team** | 3015 | team.quelyos.com | hr | RH, Managers |
| **sales** | 3013 | sales.quelyos.com | crm, marketing | Commerciaux |
| **store** | 3011 | store.quelyos.com | store, marketing | E-commerçants |
| **copilote** | 3012 | copilote.quelyos.com | stock, hr | GMAO, Maintenance |
| **retail** | 3014 | retail.quelyos.com | pos, store, stock | Magasins physiques |
| **support** | 3016 | support.quelyos.com | support, crm | Support client |

---

## 🚀 Déploiement Éditions

### **1. Build Édition Locale**

```bash
# Build Finance
VITE_EDITION=finance pnpm run build
# → dist/

# Vérifier bundle
ls -lh dist/assets/index-*.js
# → 568 KB attendu

# Test local
pnpm preview
# → http://localhost:4173
```

### **2. Build Docker**

```bash
# Build image Finance
docker build \
  --build-arg EDITION=finance \
  -t quelyos-finance:1.0.0 \
  -f dashboard-client/Dockerfile \
  .

# Vérifier image
docker images | grep quelyos-finance

# Test container
docker run -d \
  -p 3010:80 \
  --name finance-test \
  quelyos-finance:1.0.0

# Vérifier santé
curl http://localhost:3010/health
# → {"status": "ok", "edition": "finance"}
```

### **3. Déploiement Production**

#### **Option A : Docker Compose (Multi-Éditions)**

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  finance:
    image: quelyos-finance:1.0.0
    ports:
      - "3010:80"
    environment:
      - VITE_API_URL=https://api.quelyos.com
      - VITE_EDITION=finance
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  store:
    image: quelyos-store:1.0.0
    ports:
      - "3011:80"
    environment:
      - VITE_API_URL=https://api.quelyos.com
      - VITE_EDITION=store
    restart: always
    
  # ... autres éditions
```

```bash
# Déployer toutes éditions
docker-compose -f docker-compose.prod.yml up -d

# Vérifier status
docker-compose ps
```

#### **Option B : Kubernetes (Scalable)**

```yaml
# k8s/finance-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: quelyos-finance
  labels:
    app: quelyos
    edition: finance
spec:
  replicas: 3
  selector:
    matchLabels:
      app: quelyos
      edition: finance
  template:
    metadata:
      labels:
        app: quelyos
        edition: finance
    spec:
      containers:
      - name: finance
        image: quelyos-finance:1.0.0
        ports:
        - containerPort: 80
        env:
        - name: VITE_EDITION
          value: "finance"
        - name: VITE_API_URL
          value: "https://api.quelyos.com"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: quelyos-finance-service
spec:
  selector:
    app: quelyos
    edition: finance
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: LoadBalancer
```

```bash
# Déployer
kubectl apply -f k8s/finance-deployment.yaml

# Vérifier
kubectl get pods -l edition=finance
kubectl get svc quelyos-finance-service
```

---

## 🔄 Mise à Jour Édition

### **Stratégie Blue-Green Deployment**

```bash
# 1. Build nouvelle version
docker build --build-arg EDITION=finance -t quelyos-finance:1.1.0 .

# 2. Déployer "green" (nouvelle version)
docker run -d -p 3011:80 --name finance-green quelyos-finance:1.1.0

# 3. Tests smoke
curl http://localhost:3011/health
# Tests fonctionnels...

# 4. Switcher trafic (nginx)
# finance.quelyos.com → port 3011 (green)

# 5. Monitoring 10min

# 6. Arrêter "blue" (ancienne version)
docker stop finance-blue
docker rm finance-blue

# 7. Renommer green → blue
docker rename finance-green finance-blue
docker update --restart=always finance-blue
```

### **Rollback Rapide**

```bash
# Si problème détecté
# 1. Switcher trafic vers ancienne version
# finance.quelyos.com → port 3010 (blue)

# 2. Arrêter version problématique
docker stop finance-green
docker rm finance-green

# 3. Investiguer logs
docker logs finance-blue
```

---

## 📊 Monitoring par Édition

### **1. Métriques Système**

```bash
# CPU/RAM par édition
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Kubernetes
kubectl top pods -l edition=finance
```

### **2. Logs Applicatifs**

```bash
# Docker
docker logs -f finance --tail=100

# Kubernetes
kubectl logs -f deployment/quelyos-finance

# Filtrer erreurs
kubectl logs deployment/quelyos-finance | grep ERROR
```

### **3. Health Checks**

```bash
# Endpoint santé
curl https://finance.quelyos.com/health
# → {"status": "ok", "edition": "finance", "version": "1.0.0"}

# Script monitoring toutes éditions
#!/bin/bash
editions=(finance store copilote sales retail team support)
for ed in "${editions[@]}"; do
  status=$(curl -s https://$ed.quelyos.com/health | jq -r .status)
  echo "$ed: $status"
done
```

### **4. Dashboards Grafana**

**Métriques à Monitorer par Édition** :
- Requests/sec
- Temps réponse (p50, p95, p99)
- Taux erreur 4xx/5xx
- CPU/RAM usage
- Nombre utilisateurs actifs
- Bundle load time

```promql
# Requêtes par édition (Prometheus)
rate(http_requests_total{edition="finance"}[5m])

# Temps réponse
histogram_quantile(0.95, http_request_duration_seconds{edition="finance"})
```

---

## 🔧 Configuration par Environnement

### **Development**

```env
# .env.development
VITE_EDITION=finance
VITE_API_URL=http://localhost:8069
VITE_ENABLE_DEBUG=true
VITE_LOG_LEVEL=debug
```

### **Staging**

```env
# .env.staging
VITE_EDITION=finance
VITE_API_URL=https://api-staging.quelyos.com
VITE_ENABLE_DEBUG=false
VITE_LOG_LEVEL=info
```

### **Production**

```env
# .env.production
VITE_EDITION=finance
VITE_API_URL=https://api.quelyos.com
VITE_ENABLE_DEBUG=false
VITE_LOG_LEVEL=warn
VITE_SENTRY_DSN=https://...
```

---

## 🚨 Troubleshooting

### **Problème : Édition ne démarre pas**

```bash
# Vérifier logs
docker logs finance

# Erreurs communes :
# - "VITE_EDITION not set" → Ajouter env var
# - "Cannot connect to API" → Vérifier VITE_API_URL
# - "Port 3010 already in use" → Changer port ou arrêter processus
```

**Solution** :
```bash
# Redémarrer avec env vars
docker run -d \
  -p 3010:80 \
  -e VITE_EDITION=finance \
  -e VITE_API_URL=https://api.quelyos.com \
  quelyos-finance:1.0.0
```

### **Problème : Mauvais branding affiché**

```bash
# Vérifier édition détectée
curl https://finance.quelyos.com/api/edition
# → {"edition": "finance"}

# Si mauvaise édition
# 1. Vérifier VITE_EDITION dans container
docker exec finance env | grep VITE_EDITION

# 2. Rebuild avec bonne édition
docker build --build-arg EDITION=finance -t quelyos-finance:1.0.1 .
```

### **Problème : Performance dégradée**

```bash
# 1. Vérifier ressources
docker stats finance

# 2. Augmenter limites si nécessaire
docker update --memory=1g --cpus=2 finance

# 3. Monitorer temps load bundle
# DevTools → Network → index-*.js
# Doit être < 2s
```

---

## 🔐 Sécurité

### **1. Variables Sensibles**

**NE JAMAIS commit** :
```env
# .env.production (gitignored)
VITE_SENTRY_DSN=https://secret@sentry.io/123
VITE_API_KEY=sk_live_...
```

**Utiliser secrets manager** :
```bash
# Kubernetes secrets
kubectl create secret generic quelyos-finance \
  --from-literal=api-key=sk_live_... \
  --from-literal=sentry-dsn=https://...

# Docker secrets
docker secret create finance_api_key ./api_key.txt
```

### **2. HTTPS Obligatoire**

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name finance.quelyos.com;
    
    ssl_certificate /etc/ssl/finance.crt;
    ssl_certificate_key /etc/ssl/finance.key;
    
    location / {
        proxy_pass http://localhost:3010;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name finance.quelyos.com;
    return 301 https://$server_name$request_uri;
}
```

### **3. Rate Limiting**

```nginx
# Limiter requêtes par IP
limit_req_zone $binary_remote_addr zone=finance:10m rate=10r/s;

server {
    location / {
        limit_req zone=finance burst=20 nodelay;
        proxy_pass http://localhost:3010;
    }
}
```

---

## 📋 Checklist Déploiement

### **Pré-Déploiement**
- [ ] Build local réussi (`pnpm run build:[edition]`)
- [ ] Tests unitaires passent (`pnpm test`)
- [ ] Tests E2E passent (`pnpm run test:e2e:[edition]`)
- [ ] Bundle size < cible (voir ROADMAP.md)
- [ ] Variables env configurées (production)
- [ ] Secrets créés (API keys, Sentry, etc.)

### **Déploiement**
- [ ] Build Docker réussi
- [ ] Image pushée registry
- [ ] Health check répond (staging)
- [ ] Tests smoke passent (staging)
- [ ] Monitoring configuré (Grafana, Sentry)
- [ ] Alertes configurées (PagerDuty, Slack)

### **Post-Déploiement**
- [ ] Switchover trafic progressif (10% → 50% → 100%)
- [ ] Monitoring 48h sans erreur
- [ ] Rollback plan testé
- [ ] Documentation mise à jour
- [ ] Équipe formée (nouveaux features)

---

## 📞 Support

### **Escalation**

| Niveau | Problème | Contact |
|--------|----------|---------|
| **L1** | Redémarrage, config basique | support@quelyos.com |
| **L2** | Bugs applicatifs, performance | dev@quelyos.com |
| **L3** | Architecture, incidents critiques | CTO |

### **Incidents Critiques**

**Définition** : Édition inaccessible > 5min, taux erreur > 10%

**Procédure** :
1. Alerter équipe (Slack #incidents)
2. Activer plan rollback
3. Créer incident PagerDuty
4. Post-mortem dans 24h

---

**Auteur** : Équipe DevOps Quelyos  
**Dernière MAJ** : 2026-01-31  
**Contact** : devops@quelyos.com
