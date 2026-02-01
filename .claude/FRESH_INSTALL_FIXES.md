# 🔧 Corrections Fresh Install - Session 2026-02-01

## 📋 Problèmes Résolus

### 1. ✅ Dépendances Python Manquantes

**Problème** : `ModuleNotFoundError: No module named 'faker'`, `jwt`, `stripe`

**Solution** : Création image Docker personnalisée avec toutes les dépendances pré-installées

**Fichier** : `Dockerfile.quelyos-odoo`
```dockerfile
FROM odoo:19
USER root
RUN apt-get update && apt-get install -y \
    python3-pip python3-dev build-essential \
    libjpeg-dev libpng-dev libfreetype6-dev libzbar0 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --break-system-packages \
    faker==30.8.2 \
    qrcode==8.0 \
    Pillow==10.4.0 \
    PyJWT==2.10.1 \
    stripe==14.3.0 \
    redis==5.2.1

USER odoo
```

**Versions corrigées** :
- ❌ `Pillow==11.2.0` (n'existe pas) → ✅ `Pillow==10.4.0`
- ❌ `stripe==13.4.0` (n'existe pas) → ✅ `stripe==14.3.0`

### 2. ✅ Hooks Odoo 19 - Signatures Incompatibles

**Problème** : `AttributeError: 'Environment' object has no attribute 'execute'`

**Cause** : Odoo 19 a changé les signatures des hooks

**Fichier** : `odoo-backend/addons/quelyos_api/hooks.py`

**Avant** (Odoo 18 et antérieurs) :
```python
def pre_init_hook(cr):
    cr.execute(...)

def post_init_hook(cr, registry):
    cr.execute(...)
```

**Après** (Odoo 19) :
```python
def pre_init_hook(env):
    env.cr.execute(...)

def post_init_hook(env):
    env.cr.execute(...)
```

### 3. ✅ Champs XML Payment Providers

**Problème** : `ParseError` dans `payment_providers.xml`

**Cause** : Champs dans le modèle Python ont préfixe `x_`, mais XML les référençait sans préfixe

**Fichier** : `odoo-backend/addons/quelyos_api/data/payment_providers.xml`

**Avant** :
```xml
<field name="flouci_timeout">60</field>
<field name="konnect_lifespan">10</field>
```

**Après** :
```xml
<field name="x_flouci_timeout">60</field>
<field name="x_konnect_lifespan">10</field>
```

### 4. ✅ Image Docker dans docker-compose.yml

**Problème** : Conteneur utilisait `odoo:19` sans dépendances Python

**Fichier** : `docker-compose.yml`

**Avant** :
```yaml
services:
  odoo:
    image: odoo:19
```

**Après** :
```yaml
services:
  odoo:
    image: quelyos/odoo:19
```

## 🚀 Workflow Fresh Install Optimisé

### Étape 0 : Build Image (1ère fois uniquement)
```bash
docker build -t quelyos/odoo:19 -f Dockerfile.quelyos-odoo .
```

### Étape 1-5 : Installation Automatique
Le script `fresh-install-v2.sh` gère tout automatiquement :
1. Vérifications pré-installation
2. Nettoyage complet
3. Démarrage PostgreSQL & Redis
4. Installation modules via conteneur temporaire
5. Vérifications post-installation

### Temps d'Exécution Cible
- **Avec image déjà buildée** : ~2 minutes
- **Première fois (build + install)** : ~3 minutes

## 📦 Modules Installés Automatiquement

1. **Odoo Community** (13 modules) :
   - base, web, mail
   - sale_management, stock, website, website_sale
   - product, account, crm, delivery, payment

2. **OCA** (2 modules intégrés dans quelyos_api) :
   - stock_inventory
   - stock_warehouse_calendar

3. **Quelyos** (1 module) :
   - quelyos_api (v19.0.1.63.0)

## ✅ Validation Post-Installation

### Test 1 : Module installé
```bash
docker exec quelyos-postgres psql -U quelyos -d quelyos -c \
  "SELECT name, state FROM ir_module_module WHERE name = 'quelyos_api';"
```
**Attendu** : `state = 'installed'`

### Test 2 : Endpoint API
```bash
curl -s -w "\nHTTP: %{http_code}\n" \
  -X POST http://localhost:8069/api/auth/sso-login \
  -H "Content-Type: application/json" \
  -d '{"login":"test","password":"test"}'
```
**Attendu** : `HTTP: 401` (PAS 404 !)

### Test 3 : Dépendances Python
```bash
docker exec quelyos-odoo python3 -c \
  "import faker, qrcode, PIL, jwt, stripe, redis; print('✅ OK')"
```
**Attendu** : `✅ OK`

## 🔄 Prochaine Installation

Lors de la prochaine utilisation de `/fresh-install` :

1. ✅ L'image `quelyos/odoo:19` sera déjà buildée
2. ✅ Toutes les corrections sont appliquées
3. ✅ Les hooks utilisent les bonnes signatures Odoo 19
4. ✅ Les champs XML ont les bons préfixes
5. ✅ docker-compose.yml utilise l'image personnalisée

**Résultat attendu** : Installation fluide en ~2 minutes sans erreur ! 🎉

## 📝 Checklist Développeur

Avant de modifier les scripts d'installation, vérifier :

- [ ] Image Docker personnalisée à jour
- [ ] Versions des packages Python valides (pip search)
- [ ] Signatures hooks compatibles Odoo 19 (`env` au lieu de `cr`)
- [ ] Préfixes `x_` sur champs hérités Odoo
- [ ] docker-compose.yml pointe vers image personnalisée

## 🐛 Debug Rapide

### Problème : "No module named 'X'"
→ Ajouter package dans `Dockerfile.quelyos-odoo` et rebuild

### Problème : "AttributeError: 'Environment' object..."
→ Vérifier signature hook : `def hook(env)` pas `def hook(cr)`

### Problème : "ParseError" dans XML
→ Vérifier préfixes `x_` sur champs personnalisés

### Problème : HTTP 404 sur /api/*
→ Module quelyos_api pas installé, relancer installation
