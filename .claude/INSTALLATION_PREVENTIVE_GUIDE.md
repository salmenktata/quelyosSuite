# 🛡️ Guide Préventif d'Installation - Quelyos Suite

## 🎯 Objectif

Éviter les problèmes d'installation rencontrés lors du déploiement initial en capitalisant sur les leçons apprises.

## 📋 Checklist Pré-Installation OBLIGATOIRE

Avant TOUTE installation ou `/fresh-install`, vérifier :

### 1. Image Docker Personnalisée (CRITIQUE)

❌ **Problème Rencontré** :
```
ImportError: No package metadata was found for faker
```

✅ **Solution Préventive** :

Créer une image Docker personnalisée avec toutes les dépendances Python :

```dockerfile
# Dockerfile.quelyos-odoo
FROM odoo:19

USER root

# Installer dépendances système
RUN apt-get update && apt-get install -y \
    python3-pip \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Installer dépendances Python pour quelyos_api
RUN pip install --no-cache-dir --break-system-packages \
    faker==30.8.2 \
    qrcode==8.0 \
    Pillow==11.2.0

USER odoo
```

**Build de l'image** :
```bash
docker build -t quelyos/odoo:19 -f Dockerfile.quelyos-odoo .
```

**Mise à jour docker-compose.yml** :
```yaml
services:
  odoo:
    image: quelyos/odoo:19  # Au lieu de odoo:19
    # ... reste de la config
```

### 2. Vérification des Chemins d'Addons

❌ **Problème Rencontré** :
```
ModuleNotFoundError: No module named 'quelyos_api'
```

✅ **Solution Préventive** :

**Script de vérification** (`scripts/check-addons-path.sh`) :
```bash
#!/bin/bash

echo "Vérification des chemins d'addons..."

# Vérifier que le dossier existe
if [ ! -d "odoo-backend/addons" ]; then
  echo "❌ Erreur : odoo-backend/addons n'existe pas"
  exit 1
fi

# Vérifier que quelyos_api existe
if [ ! -f "odoo-backend/addons/quelyos_api/__manifest__.py" ]; then
  echo "❌ Erreur : quelyos_api/__manifest__.py introuvable"
  exit 1
fi

# Compter les modules quelyos
QUELYOS_MODULES=$(ls -d odoo-backend/addons/quelyos_* 2>/dev/null | wc -l)
echo "✅ $QUELYOS_MODULES modules Quelyos trouvés"

# Vérifier le montage Docker
MOUNTED_PATH=$(docker inspect quelyos-odoo 2>/dev/null | jq -r '.[0].Mounts[] | select(.Destination=="/mnt/extra-addons") | .Source')

if [ "$MOUNTED_PATH" != "$(pwd)/odoo-backend/addons" ]; then
  echo "⚠️  Warning : Chemin monté différent : $MOUNTED_PATH"
fi

echo "✅ Chemins d'addons validés"
```

### 3. Dépendances Python dans __manifest__.py

❌ **Problème Rencontré** :
```python
'external_dependencies': {
    'python': ['qrcode', 'Pillow', 'faker'],
}
```
Ces dépendances n'étaient pas installées dans l'image.

✅ **Solution Préventive** :

**Créer un requirements.txt** pour quelyos_api :
```txt
# odoo-backend/addons/quelyos_api/requirements.txt
faker==30.8.2
qrcode==8.0
Pillow==11.2.0
```

**Script de vérification des dépendances** (`scripts/check-python-deps.sh`) :
```bash
#!/bin/bash

echo "Vérification des dépendances Python..."

# Extraire les dépendances de __manifest__.py
REQUIRED_DEPS=$(grep -A 5 "external_dependencies" odoo-backend/addons/quelyos_api/__manifest__.py | grep -oP "'\\K[^']+(?=')" | grep -v "python")

for dep in $REQUIRED_DEPS; do
  if docker exec quelyos-odoo python3 -c "import $dep" 2>/dev/null; then
    echo "✅ $dep installé"
  else
    echo "❌ $dep MANQUANT"
    exit 1
  fi
done

echo "✅ Toutes les dépendances Python sont installées"
```

### 4. Configuration PostgreSQL Cohérente

❌ **Problème Rencontré** :
- Conteneurs utilisaient `POSTGRES_USER=odoo` / `DB=quelyos_fresh`
- docker-compose.yml définissait `POSTGRES_USER=quelyos` / `DB=quelyos`

✅ **Solution Préventive** :

**Fichier .env obligatoire** :
```env
# .env
POSTGRES_USER=quelyos
POSTGRES_PASSWORD=quelyos_secure_pwd
POSTGRES_DB=quelyos

# Ne JAMAIS changer ces valeurs une fois en production
# Migration DB nécessaire si changement
```

**Vérification** :
```bash
docker exec quelyos-postgres psql -U quelyos -d quelyos -c "SELECT current_database(), current_user;"
```

### 5. Ordre d'Installation des Modules

❌ **Problème Rencontré** :
Installation de `quelyos_api` échouait car les modules de base n'étaient pas installés.

✅ **Solution Préventive** :

**Ordre STRICT** :
```bash
# Étape 1 : Modules Odoo de base
base,web,mail

# Étape 2 : Modules e-commerce
sale_management,stock,website,website_sale,product,account,crm,delivery,payment

# Étape 3 : Modules Quelyos
quelyos_api  # Installe automatiquement les dépendances OCA intégrées
```

**Script d'installation séquentielle** (`scripts/install-modules-sequential.sh`) :
```bash
#!/bin/bash

MODULES=(
  "base,web,mail"
  "sale_management,stock,website,website_sale,product,account,crm,delivery,payment"
  "quelyos_api"
)

for MODULE_GROUP in "${MODULES[@]}"; do
  echo "Installation : $MODULE_GROUP"
  docker exec quelyos-odoo odoo -d quelyos -i "$MODULE_GROUP" --stop-after-init

  if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de l'installation de $MODULE_GROUP"
    exit 1
  fi
done

echo "✅ Tous les modules installés avec succès"
```

## 🏗️ Image Docker Optimisée

### Dockerfile Complet (✅ CORRIGÉ)

```dockerfile
# Dockerfile.quelyos-odoo
FROM odoo:19

LABEL maintainer="Quelyos <dev@quelyos.com>"
LABEL description="Odoo 19 avec dépendances Quelyos pré-installées"
LABEL version="19.0.1"

USER root

# Installer dépendances système
RUN apt-get update && apt-get install -y \
    # Build tools
    python3-pip \
    python3-dev \
    build-essential \
    # Image processing
    libjpeg-dev \
    libpng-dev \
    libfreetype6-dev \
    # QR Code generation
    libzbar0 \
    && rm -rf /var/lib/apt/lists/*

# Installer dépendances Python pour quelyos_api
# Versions fixées pour reproductibilité
RUN pip install --no-cache-dir --break-system-packages \
    faker==30.8.2 \
    qrcode==8.0 \
    Pillow==10.4.0 \
    PyJWT==2.10.1 \
    stripe==14.3.0 \
    redis==5.2.1

# Vérifier l'installation
RUN python3 -c "import faker, qrcode, PIL, jwt, stripe, redis; print('✅ Dépendances Quelyos installées')"

# Retourner à l'utilisateur odoo comme dans l'image de base
USER odoo

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8069/web/health || exit 1
```

**⚠️ VERSIONS CORRIGÉES** :
- ❌ `Pillow==11.2.0` (n'existe pas sur PyPI) → ✅ `Pillow==10.4.0`
- ❌ `stripe==13.4.0` (n'existe pas) → ✅ `stripe==14.3.0`
- ✅ Ajout : `PyJWT==2.10.1` (requis par jwt_auth.py)
- ✅ Ajout : `redis==5.2.1` (requis par cache.py)

### Build & Push

```bash
# Build local
docker build -t quelyos/odoo:19 -f Dockerfile.quelyos-odoo .

# Tag pour versioning
docker tag quelyos/odoo:19 quelyos/odoo:19.0.1

# Push vers Docker Hub (optionnel)
docker push quelyos/odoo:19
docker push quelyos/odoo:19.0.1
```

### docker-compose.yml Mis à Jour (✅ CRITIQUE)

```yaml
services:
  odoo:
    image: quelyos/odoo:19  # ✅ Image personnalisée (PAS odoo:19)
    container_name: quelyos-odoo
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      HOST: postgres
      USER: ${POSTGRES_USER:-quelyos}
      PASSWORD: ${POSTGRES_PASSWORD:-quelyos_secure_pwd}
    volumes:
      - ./odoo-backend/addons:/mnt/extra-addons:ro  # Read-only pour sécurité
      - odoo_data:/var/lib/odoo
    ports:
      - "8069:8069"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8069/web/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
```

**⚠️ ATTENTION** : Utiliser `quelyos/odoo:19` et NON `odoo:19` !
- ❌ `odoo:19` → Pas de dépendances Python → ModuleNotFoundError
- ✅ `quelyos/odoo:19` → Toutes dépendances pré-installées → Fonctionne

## 🔧 Corrections Hooks Odoo 19

### 6. Signatures Hooks Incompatibles

❌ **Problème Rencontré** :
```
AttributeError: 'Environment' object has no attribute 'execute'
TypeError: post_init_hook() missing 1 required positional argument: 'registry'
```

✅ **Solution Préventive** :

**Odoo 19 a changé les signatures des hooks**. Fichier : `odoo-backend/addons/quelyos_api/hooks.py`

**Avant (Odoo 18 et antérieurs)** :
```python
def pre_init_hook(cr):
    """Hook pré-installation"""
    cr.execute("SELECT ...")
    result = cr.fetchone()

def post_init_hook(cr, registry):
    """Hook post-installation"""
    cr.execute("SELECT ...")
```

**Après (Odoo 19)** :
```python
def pre_init_hook(env):
    """Hook pré-installation"""
    env.cr.execute("SELECT ...")
    result = env.cr.fetchone()

def post_init_hook(env):
    """Hook post-installation"""
    env.cr.execute("SELECT ...")
```

**Changements** :
- `pre_init_hook(cr)` → `pre_init_hook(env)`
- `post_init_hook(cr, registry)` → `post_init_hook(env)`
- `cr.execute()` → `env.cr.execute()`
- `cr.fetchone()` → `env.cr.fetchone()`

### 7. Champs XML avec Préfixes Manquants

❌ **Problème Rencontré** :
```
ParseError: while parsing payment_providers.xml:5, somewhere inside
```

✅ **Solution Préventive** :

Les champs personnalisés dans les modèles hérités ont le préfixe `x_` en Python, mais le XML doit aussi l'utiliser.

**Fichier** : `odoo-backend/addons/quelyos_api/data/payment_providers.xml`

**Avant** :
```xml
<record id="payment_provider_flouci" model="payment.provider">
    <field name="flouci_timeout">60</field>
    <field name="flouci_accept_cards" eval="True"/>
</record>
```

**Après** :
```xml
<record id="payment_provider_flouci" model="payment.provider">
    <field name="x_flouci_timeout">60</field>
    <field name="x_flouci_accept_cards" eval="True"/>
</record>
```

**Règle** : Si le champ dans `payment_provider.py` est `x_flouci_timeout`, alors le XML doit utiliser `x_flouci_timeout`.

## 🔧 Script Fresh Install Final

```bash
#!/bin/bash
# scripts/fresh-install-final.sh

set -e

# Vérifications pré-installation
./scripts/check-addons-path.sh || exit 1

# Nettoyage
docker compose down -v
docker volume prune -f
docker network prune -f

# Création network
docker network create quelyos-network 2>/dev/null || true

# Démarrage PostgreSQL
docker compose up -d postgres redis
sleep 15

# Vérifier PostgreSQL
docker exec quelyos-postgres pg_isready -U quelyos || exit 1

# Installation Odoo avec IMAGE PERSONNALISÉE
docker run --rm \
  --network quelyos-network \
  -v "$(pwd)/odoo-backend/addons:/mnt/extra-addons:ro" \
  -e HOST=quelyos-postgres \
  -e USER=quelyos \
  -e PASSWORD=quelyos_secure_pwd \
  quelyos/odoo:19 \  # ← Image personnalisée avec dépendances
  odoo -d quelyos \
  --init=base,web,mail,sale_management,stock,website,website_sale,product,account,crm,delivery,payment,quelyos_api \
  --stop-after-init \
  --workers=0 \
  --log-level=info

# Démarrage production
docker compose up -d odoo

# Vérifications
./scripts/check-python-deps.sh
./scripts/test-api-endpoints.sh

echo "✅ Installation terminée avec succès"
```

## 📝 Tests Post-Installation

### Script de Test Complet

```bash
#!/bin/bash
# scripts/test-fresh-install.sh

set -e

echo "🧪 Tests Post-Installation"
echo "=========================="

# Test 1 : Services démarrés
echo "Test 1 : Services..."
docker ps | grep quelyos-odoo || { echo "❌ Odoo non démarré"; exit 1; }
docker ps | grep quelyos-postgres || { echo "❌ PostgreSQL non démarré"; exit 1; }
echo "✅ Services OK"

# Test 2 : Modules installés
echo "Test 2 : Modules..."
QUELYOS_INSTALLED=$(docker exec quelyos-postgres psql -U quelyos -d quelyos -t -c "SELECT COUNT(*) FROM ir_module_module WHERE state='installed' AND name LIKE 'quelyos%';" | tr -d ' ')
if [ "$QUELYOS_INSTALLED" -lt 1 ]; then
  echo "❌ Aucun module Quelyos installé"
  exit 1
fi
echo "✅ $QUELYOS_INSTALLED modules Quelyos installés"

# Test 3 : Endpoint API
echo "Test 3 : API..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8069/api/health)
if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "404" ]; then
  echo "❌ API non accessible (code $HTTP_CODE)"
  exit 1
fi
echo "✅ API accessible"

# Test 4 : Dépendances Python
echo "Test 4 : Dépendances Python..."
docker exec quelyos-odoo python3 -c "import faker, qrcode, PIL" || { echo "❌ Dépendances manquantes"; exit 1; }
echo "✅ Dépendances Python OK"

# Test 5 : Endpoint auth (ne doit PAS retourner 404)
echo "Test 5 : Endpoint Auth..."
AUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8069/api/auth/sso-login -H "Content-Type: application/json" -d '{}')
if [ "$AUTH_CODE" = "404" ]; then
  echo "❌ Endpoint auth retourne 404 (quelyos_api non installé)"
  exit 1
fi
echo "✅ Endpoint auth accessible (code $AUTH_CODE)"

echo ""
echo "✅ TOUS LES TESTS PASSÉS"
```

## 🚨 Prévention des Erreurs Communes

### 1. Port Déjà Utilisé
```bash
# Vérification automatique avant démarrage
if lsof -ti:8069 > /dev/null; then
  echo "⚠️  Port 8069 déjà utilisé"
  echo "Voulez-vous arrêter le processus ? (o/n)"
  read -r response
  if [ "$response" = "o" ]; then
    lsof -ti:8069 | xargs kill -9
  else
    exit 1
  fi
fi
```

### 2. Volumes Corrompus
```bash
# Détection corruption
docker volume inspect quelyossuite_postgres_data | jq -r '.[] | .Mountpoint' | xargs sudo du -sh

# Si taille anormale ou erreurs I/O
docker volume rm quelyossuite_postgres_data
docker volume create quelyossuite_postgres_data
```

### 3. Réseau Docker Saturé
```bash
# Cleanup réseau avant installation
docker network prune -f
docker network create quelyos-network
```

## 📚 Documentation de Référence

### Fichiers Critiques à Vérifier

1. `Dockerfile.quelyos-odoo` : Image avec dépendances
2. `docker-compose.yml` : Configuration services
3. `.env` : Variables d'environnement
4. `odoo-backend/addons/quelyos_api/__manifest__.py` : Dépendances module
5. `scripts/fresh-install-final.sh` : Script d'installation

### Commandes de Diagnostic

```bash
# Vérifier image utilisée
docker inspect quelyos-odoo | jq '.[0].Config.Image'

# Lister dépendances Python installées
docker exec quelyos-odoo pip list | grep -E "faker|qrcode|Pillow"

# Vérifier modules Odoo
docker exec quelyos-postgres psql -U quelyos -d quelyos -c "SELECT name, state FROM ir_module_module WHERE name LIKE 'quelyos%';"

# Logs en temps réel
docker logs quelyos-odoo -f
```

## ✅ Validation Finale

Avant de considérer l'installation comme réussie :

- [ ] Image Docker personnalisée buildée
- [ ] Dépendances Python vérifiées
- [ ] Chemins d'addons validés
- [ ] Configuration PostgreSQL cohérente
- [ ] Modules installés dans le bon ordre
- [ ] Tests post-installation passés
- [ ] Endpoint `/api/auth/sso-login` ne retourne PAS 404

## 🎯 Temps d'Installation Cible

| Étape | Temps | Cumulé |
|-------|-------|--------|
| Build image Docker | 60s | 60s |
| Nettoyage | 10s | 70s |
| Démarrage PostgreSQL | 15s | 85s |
| Installation modules | 90s | 175s |
| Démarrage Odoo | 10s | 185s |
| Tests | 5s | 190s |
| **TOTAL** | | **~3min** |

Avec l'image pré-buildée, temps réduit à **~2min**.

