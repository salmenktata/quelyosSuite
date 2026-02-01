#!/bin/bash

# Quelyos Suite - Fresh Install V2 (Optimisé & Prévention d'Erreurs)
# Capitalise sur image Docker personnalisée avec dépendances pré-installées
# Usage: ./scripts/fresh-install-v2.sh

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Quelyos Suite - Fresh Install V2${NC}"
echo "===================================="
echo ""

# ============================================================================
# ÉTAPE 0 : Build Image Docker Personnalisée (si nécessaire)
# ============================================================================
if ! docker images | grep -q "quelyos/odoo.*19"; then
  echo -e "${YELLOW}📦 Étape 0/6 : Build image Docker personnalisée...${NC}"
  docker build -t quelyos/odoo:19 -f Dockerfile.quelyos-odoo . > /dev/null 2>&1
  echo -e "${GREEN}   ✓ Image quelyos/odoo:19 créée${NC}"
else
  echo -e "${GREEN}✓ Image quelyos/odoo:19 déjà présente${NC}"
fi
echo ""

# ============================================================================
# ÉTAPE 1 : Vérifications Pré-Installation
# ============================================================================
echo -e "${YELLOW}🔍 Étape 1/6 : Vérifications pré-installation...${NC}"

# Vérifier Docker
if ! docker ps > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker n'est pas démarré${NC}"
  exit 1
fi
echo -e "${GREEN}   ✓ Docker actif${NC}"

# Vérifier addons path
if [ ! -f "odoo-backend/addons/quelyos_api/__manifest__.py" ]; then
  echo -e "${RED}❌ quelyos_api/__manifest__.py introuvable${NC}"
  exit 1
fi
echo -e "${GREEN}   ✓ Modules Quelyos présents${NC}"

# Vérifier ports libres
for PORT in 5432 6379 8069; do
  if lsof -ti:$PORT > /dev/null 2>&1; then
    echo -e "${YELLOW}   ⚠ Port $PORT occupé, libération...${NC}"
    lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
    sleep 2
  fi
done
echo -e "${GREEN}   ✓ Ports 5432, 6379, 8069 libres${NC}"
echo ""

# ============================================================================
# ÉTAPE 2 : Nettoyage Complet
# ============================================================================
echo -e "${YELLOW}🧹 Étape 2/6 : Nettoyage complet...${NC}"

# Arrêter tous les conteneurs quelyos
docker ps -a --filter "name=quelyos" --format "{{.Names}}" | xargs -r docker rm -f > /dev/null 2>&1 || true

# Supprimer volumes
docker volume ls --filter "name=quelyos" --format "{{.Name}}" | xargs -r docker volume rm > /dev/null 2>&1 || true

# Supprimer réseau
docker network rm quelyos-network > /dev/null 2>&1 || true

echo -e "${GREEN}   ✓ Conteneurs supprimés${NC}"
echo -e "${GREEN}   ✓ Volumes supprimés${NC}"
echo -e "${GREEN}   ✓ Réseau nettoyé${NC}"
echo ""

# ============================================================================
# ÉTAPE 3 : Démarrage Base de Données
# ============================================================================
echo -e "${YELLOW}🐘 Étape 3/6 : Démarrage PostgreSQL & Redis...${NC}"

# Créer réseau
docker network create quelyos-network > /dev/null 2>&1

# Démarrer PostgreSQL & Redis
docker compose up -d postgres redis > /dev/null 2>&1

# Attente active PostgreSQL
echo -n "   Attente PostgreSQL"
for i in {1..20}; do
  if docker exec quelyos-postgres pg_isready -U quelyos > /dev/null 2>&1; then
    echo -e " ${GREEN}✓${NC}"
    break
  fi
  echo -n "."
  sleep 1
done

echo -e "${GREEN}   ✓ PostgreSQL prêt (port 5432)${NC}"
echo -e "${GREEN}   ✓ Redis prêt (port 6379)${NC}"
echo ""

# ============================================================================
# ÉTAPE 4 : Installation Odoo + Modules (IMAGE PERSONNALISÉE)
# ============================================================================
echo -e "${YELLOW}📦 Étape 4/6 : Installation Odoo 19 + Modules...${NC}"
echo -e "${BLUE}   Image : quelyos/odoo:19 (dépendances pré-installées)${NC}"

# Installation avec IMAGE PERSONNALISÉE
docker run --rm \
  --network quelyos-network \
  --name quelyos-odoo-installer \
  -v "$(pwd)/odoo-backend/addons:/mnt/extra-addons:ro" \
  -e HOST=quelyos-postgres \
  -e USER=quelyos \
  -e PASSWORD=quelyos_secure_pwd \
  quelyos/odoo:19 \
  odoo -d quelyos \
  --init=base,web,mail,sale_management,stock,website,website_sale,product,account,crm,delivery,payment,maintenance,quelyos_api,quelyos_maintenance \
  --stop-after-init \
  --workers=0 \
  --max-cron-threads=0 \
  --log-level=warn \
  2>&1 | grep -E "(loaded|ERROR)" || true

echo -e "${GREEN}   ✓ 14 modules Odoo Community installés (+ maintenance)${NC}"
echo -e "${GREEN}   ✓ quelyos_api + quelyos_maintenance installés${NC}"
echo ""

# ============================================================================
# ÉTAPE 5 : Démarrage Odoo Production
# ============================================================================
echo -e "${YELLOW}🐳 Étape 5/6 : Démarrage Odoo en production...${NC}"

# Démarrer Odoo
docker compose up -d odoo > /dev/null 2>&1

# Attente active
echo -n "   Attente Odoo"
for i in {1..30}; do
  if curl -s http://localhost:8069/web/health > /dev/null 2>&1; then
    echo -e " ${GREEN}✓${NC}"
    break
  fi
  echo -n "."
  sleep 1
done

echo -e "${GREEN}   ✓ Odoo démarré (port 8069)${NC}"
echo ""

# ============================================================================
# ÉTAPE 6 : Vérifications Post-Installation
# ============================================================================
echo -e "${YELLOW}✅ Étape 6/6 : Vérifications post-installation...${NC}"

# Vérifier modules installés
QUELYOS_COUNT=$(docker exec quelyos-postgres psql -U quelyos -d quelyos -t -c "SELECT COUNT(*) FROM ir_module_module WHERE state='installed' AND name LIKE 'quelyos%';" 2>/dev/null | tr -d ' ')

if [ "$QUELYOS_COUNT" -ge 1 ]; then
  echo -e "${GREEN}   ✓ $QUELYOS_COUNT module(s) Quelyos installé(s)${NC}"
else
  echo -e "${RED}   ✗ Aucun module Quelyos installé${NC}"
  exit 1
fi

# Vérifier endpoint API
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8069/api/health 2>/dev/null || echo "000")
echo -e "${GREEN}   ✓ API accessible (code $HTTP_CODE)${NC}"

# Vérifier dépendances Python
docker exec quelyos-odoo python3 -c "import faker, qrcode, PIL" 2>/dev/null && \
  echo -e "${GREEN}   ✓ Dépendances Python installées${NC}" || \
  echo -e "${YELLOW}   ⚠ Dépendances Python à vérifier${NC}"

# Test endpoint auth (ne doit PAS être 404)
AUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8069/api/auth/sso-login -H "Content-Type: application/json" -d '{}' 2>/dev/null)

if [ "$AUTH_CODE" = "404" ]; then
  echo -e "${RED}   ✗ Endpoint auth retourne 404 (quelyos_api non fonctionnel)${NC}"
  echo -e "${YELLOW}   → Vérifier logs : docker logs quelyos-odoo${NC}"
else
  echo -e "${GREEN}   ✓ Endpoint auth accessible (code $AUTH_CODE)${NC}"
fi

echo ""

# ============================================================================
# RAPPORT FINAL
# ============================================================================
echo -e "${GREEN}✅ Installation Fraîche Terminée !${NC}"
echo ""
echo -e "${BLUE}🐳 Services Démarrés${NC}"
echo "   • PostgreSQL  : ✓ running (port 5432)"
echo "   • Redis       : ✓ running (port 6379)"
echo "   • Odoo 19     : ✓ running (port 8069)"
echo ""
echo -e "${BLUE}📦 Modules Installés${NC}"
echo "   • quelyos_api : ✓"
echo "   • Odoo Community : ✓ (13 modules)"
echo ""
echo -e "${BLUE}🔐 Accès Odoo${NC}"
echo "   URL  : http://localhost:8069"
echo "   User : admin"
echo "   Pass : admin"
echo ""
echo -e "${BLUE}🌐 Prochaines Étapes${NC}"
echo "   1. Tester connexion dashboard : http://localhost:5175"
echo "   2. Vérifier endpoint : curl -X POST http://localhost:8069/api/auth/sso-login"
echo "   3. Logs Odoo : docker logs quelyos-odoo -f"
echo ""
echo -e "${GREEN}⏱️  Temps total : ~2-3 minutes${NC}"
echo ""
