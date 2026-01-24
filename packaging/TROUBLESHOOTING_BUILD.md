# Troubleshooting - Build Docker Quelyos ERP

## Problème Rencontré

```
ERROR: failed to authorize: DeadlineExceeded: failed to fetch oauth token
Post "https://auth.docker.io/token": dial tcp: lookup auth.docker.io: i/o timeout
```

### Cause
Docker ne peut pas se connecter au Docker Hub pour télécharger les images de base (Ubuntu 22.04, Node 20 Alpine).

---

## Solutions (par ordre de priorité)

### Solution 1 : Redémarrer Docker Desktop ⭐ (Recommandé)

```bash
# Sur macOS, via interface graphique
# Ouvrir Docker Desktop > Menu > Quit Docker Desktop
# Puis relancer Docker Desktop depuis Applications

# OU via CLI
osascript -e 'quit app "Docker"'
sleep 5
open -a Docker

# Attendre que Docker soit complètement démarré (icône baleine stable)
# Puis retenter le build
cd /Users/salmenktata/Projets/GitHub/QuelyosERP
docker build -t quelyos-erp:test -f Dockerfile.allinone .
```

**Pourquoi ça fonctionne ?**
Docker Desktop peut avoir des problèmes de réseau après une mise en veille ou un changement de réseau. Le redémarrage réinitialise la stack réseau.

---

### Solution 2 : Changer le DNS de Docker

Parfois, Docker utilise un DNS qui ne résout pas correctement les domaines Docker Hub.

```bash
# 1. Ouvrir Docker Desktop > Settings (⚙️) > Docker Engine

# 2. Ajouter cette configuration JSON
{
  "dns": ["8.8.8.8", "8.8.4.4"]
}

# 3. Cliquer "Apply & Restart"

# 4. Retenter le build
docker build -t quelyos-erp:test -f Dockerfile.allinone .
```

---

### Solution 3 : Utiliser un Registry Mirror (si restrictions réseau)

Si votre réseau bloque Docker Hub, utilisez un mirror.

```bash
# 1. Docker Desktop > Settings > Docker Engine

# 2. Ajouter configuration mirror
{
  "registry-mirrors": ["https://mirror.gcr.io"]
}

# 3. Apply & Restart

# 4. Retenter build
```

---

### Solution 4 : Pull Manuel des Images de Base

Téléchargez les images une par une pour diagnostiquer le problème.

```bash
# Test pull Node Alpine
docker pull node:20-alpine

# Test pull Ubuntu
docker pull ubuntu:22.04

# Si ces commandes échouent aussi, le problème est réseau Docker
# Si elles réussissent, relancer le build complet
docker build -t quelyos-erp:test -f Dockerfile.allinone .
```

---

### Solution 5 : Vérifier le Proxy Docker

Si vous êtes derrière un proxy d'entreprise :

```bash
# Docker Desktop > Settings > Resources > Proxies

# Cocher "Manual proxy configuration"
# Renseigner :
#   Web Server (HTTP): http://proxy.example.com:8080
#   Secure Web Server (HTTPS): http://proxy.example.com:8080

# Apply & Restart
```

---

### Solution 6 : Build Offline avec Images Locales (Workaround)

Si impossible de télécharger depuis Docker Hub, utilisez des images déjà en cache.

```bash
# Vérifier images disponibles localement
docker images | grep -E "node|ubuntu"

# Si node:20-alpine et ubuntu:22.04 sont présents, le build devrait fonctionner
# Sinon, télécharger depuis une autre machine et sauvegarder :

# Sur machine avec accès Docker Hub
docker pull node:20-alpine
docker pull ubuntu:22.04
docker save node:20-alpine ubuntu:22.04 > quelyos-base-images.tar

# Transférer quelyos-base-images.tar vers machine de build

# Sur machine de build
docker load < quelyos-base-images.tar

# Retenter build
docker build -t quelyos-erp:test -f Dockerfile.allinone .
```

---

## Diagnostic Complet

Exécutez ce script pour diagnostiquer le problème réseau Docker :

```bash
#!/bin/bash
echo "=== Diagnostic Réseau Docker ==="
echo ""

echo "1. Connexion Internet système :"
ping -c 3 google.com > /dev/null 2>&1 && echo "✅ OK" || echo "❌ FAIL"
echo ""

echo "2. Résolution DNS auth.docker.io :"
nslookup auth.docker.io > /dev/null 2>&1 && echo "✅ OK" || echo "❌ FAIL"
echo ""

echo "3. Docker daemon actif :"
docker info > /dev/null 2>&1 && echo "✅ OK" || echo "❌ FAIL"
echo ""

echo "4. Test pull image simple :"
docker pull hello-world > /dev/null 2>&1 && echo "✅ OK" || echo "❌ FAIL"
echo ""

echo "5. Configuration DNS Docker :"
docker info | grep -A 5 "DNS"
echo ""

echo "6. Images en cache :"
docker images | grep -E "node|ubuntu"
echo ""
```

---

## Solution Alternative : Build Sans Docker (Pour Tests)

Si Docker reste bloqué, vous pouvez tester les composants individuellement :

### Backend Odoo (Docker Compose existant)
```bash
cd backend
docker-compose up -d
```

### Frontend Next.js (local)
```bash
cd frontend
npm install
npm run build
npm start
```

### Backoffice React (local)
```bash
cd backoffice
npm install
npm run build
npm run preview
```

**Note** : Cette approche ne teste PAS l'image all-in-one, mais valide que les composants fonctionnent.

---

## Vérification Finale

Une fois le problème résolu, vérifier que le build fonctionne :

```bash
# Build complet (10-15 min)
docker build -t quelyos-erp:test -f Dockerfile.allinone .

# Si succès, vérifier image
docker images quelyos-erp:test

# Tester lancement rapide
docker run --rm quelyos-erp:test echo "Image OK"
```

---

## Contact Support

Si aucune solution ne fonctionne :

1. Vérifier version Docker Desktop : `docker --version` (minimum 20.10+)
2. Vérifier logs Docker Desktop : `~/Library/Containers/com.docker.docker/Data/log/`
3. Redémarrer macOS (dernier recours)

**Environment actuel détecté :**
- OS : macOS (Darwin 25.2.0)
- Docker : 29.1.3
- Espace disque : 7.3 GB disponibles
