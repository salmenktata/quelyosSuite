# Guide Build Docker - Éditions Quelyos

---

## 🐳 Build Image Finance

### **Commande Basique**
```bash
# Depuis racine du projet (QuelyosSuite/)
docker build \
  --build-arg EDITION=finance \
  -t quelyos-finance:latest \
  -f dashboard-client/Dockerfile \
  .
```

### **Avec Build Context Correct**
```bash
# Depuis dashboard-client/
cd dashboard-client
docker build \
  --build-arg EDITION=finance \
  -t quelyos-finance:latest \
  -f Dockerfile \
  ..
```

---

## 🏗️ Build Toutes Éditions

```bash
# Script build multiple éditions
for edition in finance store copilote sales retail team support; do
  echo "🔨 Building $edition..."
  docker build \
    --build-arg EDITION=$edition \
    -t quelyos-$edition:latest \
    -f dashboard-client/Dockerfile \
    .
done
```

---

## 🚀 Lancer Container Finance

### **Mode Détaché**
```bash
docker run -d \
  -p 3010:80 \
  --name quelyos-finance \
  quelyos-finance:latest
```

### **Avec Logs**
```bash
docker run \
  -p 3010:80 \
  --name quelyos-finance \
  quelyos-finance:latest
```

### **Vérifier Logs**
```bash
docker logs quelyos-finance
docker logs -f quelyos-finance  # Follow mode
```

---

## ✅ Tests Container

### **Health Check**
```bash
curl http://localhost:3010/health
# Attendu: "OK"
```

### **Page Index**
```bash
curl -I http://localhost:3010
# Attendu: HTTP/1.1 200 OK
```

### **Vérifier Branding**
```bash
# Ouvrir navigateur
open http://localhost:3010

# Vérifications:
# - Titre : "Quelyos Finance"
# - Couleur : vert #059669
# - Modules : finance uniquement
```

---

## 🔧 Debug Container

### **Shell dans Container**
```bash
docker exec -it quelyos-finance sh
```

### **Vérifier Fichiers Buildés**
```bash
docker exec quelyos-finance ls -la /usr/share/nginx/html/assets
```

### **Vérifier Config Nginx**
```bash
docker exec quelyos-finance cat /etc/nginx/nginx.conf
```

---

## 🐳 Docker Compose (Toutes Éditions)

### **Lancer Toutes Éditions**
```bash
cd dashboard-client
docker-compose up -d
```

### **Vérifier Statut**
```bash
docker-compose ps
```

### **Logs Édition Spécifique**
```bash
docker-compose logs -f finance
```

### **Arrêter Tout**
```bash
docker-compose down
```

---

## 📊 Métriques Build

### **Taille Image Cible**
| Édition | Taille Attendue |
|---------|-----------------|
| Finance | ~150-200 MB |
| Store | ~180-250 MB |
| Retail | ~200-300 MB |

### **Vérifier Taille**
```bash
docker images | grep quelyos
```

### **Layers Image**
```bash
docker history quelyos-finance:latest
```

---

## 🚨 Troubleshooting

### **Erreur : "no such file or directory"**
**Cause** : Mauvais contexte build  
**Solution** :
```bash
# Vérifier répertoire courant
pwd

# Build depuis racine
cd /path/to/QuelyosSuite
docker build -f dashboard-client/Dockerfile .

# Ou depuis dashboard-client
cd dashboard-client
docker build -f Dockerfile ..
```

### **Erreur : "timeout" ou "network"**
**Cause** : Problème connexion Docker Hub  
**Solution** :
```bash
# Vérifier connexion
docker pull node:20-alpine

# Ou utiliser cache local si disponible
docker build --cache-from quelyos-finance:previous .
```

### **Erreur : Build échoue (COPY failed)**
**Cause** : Fichiers manquants dans contexte  
**Solution** :
```bash
# Vérifier .dockerignore
cat dashboard-client/.dockerignore

# Vérifier contexte
docker build -f dashboard-client/Dockerfile --no-cache .
```

### **Container démarre mais page 404**
**Cause** : Fichiers non copiés correctement  
**Solution** :
```bash
# Vérifier fichiers dans container
docker exec quelyos-finance ls /usr/share/nginx/html

# Rebuild sans cache
docker build --no-cache -t quelyos-finance .
```

---

## 🎯 Checklist Validation

- [ ] Image build réussit (pas d'erreur)
- [ ] Taille image < 250 MB
- [ ] Container démarre (`docker ps` montre running)
- [ ] Health check OK (`curl localhost:3010/health`)
- [ ] Page index charge (`curl localhost:3010`)
- [ ] Branding Finance visible (navigateur)
- [ ] Logs nginx propres (`docker logs`)

---

## 📋 Commandes Utiles

```bash
# Nettoyer images anciennes
docker image prune -a

# Rebuild complet sans cache
docker build --no-cache -t quelyos-finance .

# Inspecter image
docker inspect quelyos-finance:latest

# Export image
docker save quelyos-finance:latest | gzip > quelyos-finance.tar.gz

# Import image
docker load < quelyos-finance.tar.gz

# Tag pour registry
docker tag quelyos-finance:latest registry.quelyos.com/finance:v1.0.0

# Push registry
docker push registry.quelyos.com/finance:v1.0.0
```

---

**Statut** : Guide créé  
**Prochaine étape** : Exécuter build Docker avec connexion stable
