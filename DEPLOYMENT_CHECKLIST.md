# Checklist Déploiement Kubernetes - Quelyos Suite

## ✅ Préparation (Avant Déploiement)

### 1. Configuration Registry Docker

**Option A : GitHub Container Registry (GHCR)** - Recommandé
```bash
# Créer Personal Access Token GitHub
# Settings → Developer settings → Personal access tokens → Tokens (classic)
# Cocher: write:packages, read:packages, delete:packages

# Login
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"
echo $GITHUB_TOKEN | docker login ghcr.io -u VOTRE_USERNAME --password-stdin

# Tester
docker pull ghcr.io/VOTRE_USERNAME/test:latest || echo "Registry prêt"
```

**Option B : Docker Hub**
```bash
docker login
# Username + Password
```

### 2. Vérifier Accès VPS

```bash
# Test connexion
ssh quelyos-vps "echo 'OK'"

# Vérifier sudo
ssh quelyos-vps "sudo whoami"  # Doit retourner: root
```

### 3. Configuration DNS (Préparer mais pas encore appliquer)

**Records à créer chez votre registrar** :
```
Type  Nom                   Valeur           TTL
─────────────────────────────────────────────────
A     quelyos.com           184.174.32.177   300
A     www.quelyos.com       184.174.32.177   300
A     shop.quelyos.com      184.174.32.177   300
A     backoffice.quelyos.com 184.174.32.177  300
A     admin.quelyos.com      184.174.32.177  300
A     api.quelyos.com        184.174.32.177  300
```

**⚠️ Sous-domaines réels (pas dashboard.quelyos.com)** :
- `quelyos.com` / `www.quelyos.com` → Site vitrine (port 3000)
- `shop.quelyos.com` → E-commerce (port 3001)
- `backoffice.quelyos.com` → Dashboard ERP (port 5175)
- `admin.quelyos.com` → Super Admin SaaS (port 9000)
- `api.quelyos.com` → Backend API (port 8069)

**⚠️ Attendre propagation DNS (5-30 min) AVANT de lancer cert-manager**

### 4. Vérifier Variables Environnement

Fichier `.env.production` créé : ✅
- `DOMAIN=quelyos.com`
- `LETSENCRYPT_EMAIL=admin@quelyos.com`
- Passwords sécurisés

### 5. Build Images Docker (Test Local)

```bash
# Test build toutes les images
./scripts/docker-build-local.sh

# Vérifier images créées
docker images | grep quelyos
```

---

## 🚀 Jour du Déploiement

### Étape 1 : DNS (Faire en PREMIER)

1. Créer les 5 records DNS (voir checklist ci-dessus)
2. Vérifier propagation :
   ```bash
   dig quelyos.com +short
   # Doit retourner: 184.174.32.177
   ```
3. ⏰ **ATTENDRE 30 min minimum** (propagation DNS mondiale)

### Étape 2 : Déploiement Automatique

```bash
# Lance tout automatiquement
./scripts/deploy-to-contabo.sh

# Le script va :
# - Vérifier connexion VPS
# - Installer K3s (si besoin)
# - Configurer MetalLB, Nginx, cert-manager
# - Build images (vous demande confirmation)
# - Push vers GHCR (vous demande confirmation)
# - Générer secrets
# - Déployer Quelyos Suite
# - Attendre que tout soit ready
```

**Réponses attendues** :
- `Build nouvelles images ? (o/N):` → **o**
- `Continuer push GHCR ? (o/N):` → **o** (après docker login ghcr.io)

### Étape 3 : Vérification

```bash
# Status général
./scripts/contabo-status.sh

# Vérifier certificats TLS (attendre 2-5 min)
export KUBECONFIG=/tmp/k3s-config.yaml
kubectl get certificates -n quelyos
# STATUS doit être: True

# Logs si problème
./scripts/contabo-logs.sh backend
./scripts/contabo-logs.sh vitrine-client
```

### Étape 4 : Tests Finaux

```bash
# Tester endpoints
curl https://quelyos.com
curl https://shop.quelyos.com
curl https://dashboard.quelyos.com
curl https://api.quelyos.com/web/health

# Depuis navigateur
open https://quelyos.com
open https://shop.quelyos.com
open https://dashboard.quelyos.com
```

---

## 📋 Troubleshooting Commun

### Certificat TLS bloqué à "False"

```bash
# Vérifier ClusterIssuer
kubectl describe clusterissuer letsencrypt-prod

# Vérifier challenge
kubectl get challenges -n quelyos

# Logs cert-manager
kubectl logs -n cert-manager -l app=cert-manager --tail=100

# Cause fréquente: DNS pas propagé → Attendre + supprimer/recréer
kubectl delete certificate quelyos-tls -n quelyos
kubectl apply -k k8s/overlays/contabo
```

### Pods en CrashLoop

```bash
# Voir erreur
kubectl describe pod <pod-name> -n quelyos
kubectl logs <pod-name> -n quelyos --previous

# Causes fréquentes:
# - Image inexistante → Vérifier push GHCR
# - Secrets manquants → kubectl get secrets -n quelyos
# - DB pas ready → kubectl get pods -n quelyos
```

### LoadBalancer Pending

```bash
# Vérifier MetalLB
kubectl get pods -n metallb-system
kubectl logs -n metallb-system -l app=metallb

# Re-configurer IP
ssh quelyos-vps "sudo kubectl edit configmap config -n metallb-system"
# Vérifier: addresses: - 184.174.32.177/32
```

---

## 🔄 Mises à Jour Futures

### Update Code Seulement

```bash
# 1. Modifier code
vim vitrine-client/src/pages/...

# 2. Re-déployer
./scripts/deploy-to-contabo.sh
# → o (build)
# → o (push)

# 3. Vérifier rollout
kubectl rollout status deployment/vitrine-client -n quelyos
```

### Rollback Version Précédente

```bash
export KUBECONFIG=/tmp/k3s-config.yaml

# Rollback un service
kubectl rollout undo deployment/vitrine-client -n quelyos

# Rollback tous les services
kubectl rollout undo deployment/backend -n quelyos
kubectl rollout undo deployment/vitrine-quelyos -n quelyos
kubectl rollout undo deployment/vitrine-client -n quelyos
kubectl rollout undo deployment/dashboard-client -n quelyos
```

### Scaling Manuel

```bash
# Scale up
kubectl scale deployment/vitrine-client --replicas=5 -n quelyos

# Scale down
kubectl scale deployment/vitrine-client --replicas=1 -n quelyos
```

---

## 💾 Backup Réguliers

### Backup PostgreSQL (Manuel)

```bash
export KUBECONFIG=/tmp/k3s-config.yaml

# Backup
kubectl exec -n quelyos postgres-0 -- \
  pg_dump -U quelyos quelyos | gzip > backup-$(date +%Y%m%d).sql.gz

# Restore
gunzip < backup-20260129.sql.gz | \
  kubectl exec -i -n quelyos postgres-0 -- \
  psql -U quelyos quelyos
```

### Backup Automatique (Déjà configuré)

CronJob créé : Backup quotidien à 2h AM → `/root/backups/` sur VPS

---

## 📊 Monitoring (Optionnel)

### Installer Prometheus + Grafana

```bash
export KUBECONFIG=/tmp/k3s-config.yaml

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace

# Port-forward Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Login: admin / prom-operator
# Importer dashboards Kubernetes
```

---

## 🎯 Checklist Finale

**Avant Déploiement** :
- [ ] GitHub Token créé (GHCR)
- [ ] Docker login GHCR réussi
- [ ] SSH VPS fonctionne
- [ ] DNS records préparés (mais pas encore appliqués)
- [ ] Build test local réussi

**Jour J** :
- [ ] Appliquer DNS records
- [ ] Attendre 30 min (propagation)
- [ ] Vérifier DNS : `dig quelyos.com +short`
- [ ] Lancer `./scripts/deploy-to-contabo.sh`
- [ ] Confirmer build images
- [ ] Confirmer push GHCR
- [ ] Attendre fin déploiement (~15 min)
- [ ] Vérifier certificats TLS
- [ ] Tester tous les domaines

**Post-Déploiement** :
- [ ] Sauvegarder secrets générés (POSTGRES_PASSWORD, JWT_SECRET, etc.)
- [ ] Configurer backup automatique PostgreSQL
- [ ] Tester création compte utilisateur
- [ ] Tester tunnel de paiement (Stripe)
- [ ] Monitoring setup (Prometheus optionnel)

---

## 📞 Support

**Logs en temps réel** :
```bash
./scripts/contabo-logs.sh backend
./scripts/contabo-logs.sh vitrine-client
```

**Status complet** :
```bash
./scripts/contabo-status.sh
```

**Kubectl direct** :
```bash
export KUBECONFIG=/tmp/k3s-config.yaml
kubectl get all -n quelyos
kubectl describe pod <pod-name> -n quelyos
```
