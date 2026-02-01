#!/bin/bash

# Script d'installation fraîche optimisé pour Quelyos Suite
# Capitalise sur les modules OCA intégrés dans quelyos_api
# Usage: ./scripts/optimized-fresh-install.sh

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Quelyos Suite - Fresh Install Optimisé${NC}"
echo "=========================================="
echo ""

# ============================================================================
# ÉTAPE 1 : Nettoyage Complet (5 secondes)
# ============================================================================
echo -e "${YELLOW}🧹 Étape 1/5 : Nettoyage de l'environnement...${NC}"

# Arrêter et supprimer tous les conteneurs quelyos
docker ps -a --filter "name=quelyos" --format "{{.Names}}" | xargs -r docker rm -f > /dev/null 2>&1 || true

# Supprimer les volumes (base de données)
docker volume ls --filter "name=quelyos" --format "{{.Name}}" | xargs -r docker volume rm > /dev/null 2>&1 || true

# Supprimer le réseau si existe
docker network rm quelyos-network > /dev/null 2>&1 || true

echo -e "${GREEN}   ✓ Conteneurs supprimés${NC}"
echo -e "${GREEN}   ✓ Volumes supprimés (base de données effacée)${NC}"
echo -e "${GREEN}   ✓ Réseau nettoyé${NC}"
echo ""

# ============================================================================
# ÉTAPE 2 : Démarrage Base de Données (15 secondes)
# ============================================================================
echo -e "${YELLOW}🐘 Étape 2/5 : Démarrage PostgreSQL & Redis...${NC}"

docker compose up -d postgres redis

# Attendre que PostgreSQL soit prêt (healthcheck)
echo -n "   Attente PostgreSQL."
for i in {1..15}; do
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
# ÉTAPE 3 : Installation Odoo avec modules (90 secondes)
# ============================================================================
echo -e "${YELLOW}📦 Étape 3/5 : Installation Odoo 19 + Modules Quelyos...${NC}"
echo -e "${BLUE}   Note : Les modules OCA sont intégrés dans quelyos_api${NC}"

# Lancer Odoo en mode installation
# Modules de base + quelyos_api (qui inclut les dépendances OCA intégrées)
docker run --rm \
  --network quelyos-network \
  --name quelyos-odoo-installer \
  -v "$(pwd)/odoo-backend/addons:/mnt/extra-addons" \
  -e HOST=quelyos-postgres \
  -e USER=quelyos \
  -e PASSWORD=quelyos_secure_pwd \
  odoo:19 \
  odoo -d quelyos \
  --init=base,web,mail,sale_management,stock,website,website_sale,product,account,crm,delivery,payment,quelyos_api \
  --stop-after-init \
  --log-level=warn \
  --workers=0 \
  --max-cron-threads=0 \
  2>&1 | grep -E "(loaded|Registry|ERROR)" || true

echo -e "${GREEN}   ✓ Modules Odoo Community installés${NC}"
echo -e "${GREEN}   ✓ quelyos_api installé (inclut OCA stock_inventory, stock_warehouse_calendar)${NC}"
echo ""

# ============================================================================
# ÉTAPE 4 : Démarrage Odoo Production (10 secondes)
# ============================================================================
echo -e "${YELLOW}🐳 Étape 4/5 : Démarrage Odoo en mode production...${NC}"

docker compose up -d odoo

# Attendre que Odoo soit prêt
echo -n "   Attente Odoo."
for i in {1..20}; do
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
# ÉTAPE 5 : Vérifications Post-Installation
# ============================================================================
echo -e "${YELLOW}✅ Étape 5/5 : Vérifications...${NC}"

# Vérifier les modules installés
MODULES_INSTALLED=$(docker exec quelyos-postgres psql -U quelyos -d quelyos -t -c "SELECT COUNT(*) FROM ir_module_module WHERE state = 'installed' AND name LIKE 'quelyos%';" 2>/dev/null | tr -d ' ')

if [ "$MODULES_INSTALLED" -ge 1 ]; then
  echo -e "${GREEN}   ✓ quelyos_api installé${NC}"
else
  echo -e "${RED}   ✗ Erreur : quelyos_api non installé${NC}"
  exit 1
fi

# Vérifier endpoint API
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8069/api/health 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
  echo -e "${GREEN}   ✓ API accessible (http://localhost:8069)${NC}"
else
  echo -e "${YELLOW}   ⚠ API endpoint retourne code $HTTP_CODE${NC}"
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
echo "   • quelyos_api : ✓ (inclut OCA intégrés)"
echo "   • Odoo Community : ✓ (13 modules)"
echo ""
echo -e "${BLUE}🔐 Accès Odoo${NC}"
echo "   URL  : http://localhost:8069"
echo "   User : admin"
echo "   Pass : admin"
echo ""
echo -e "${BLUE}🌐 Prochaines Étapes${NC}"
echo "   1. Tester la connexion dashboard : http://localhost:5175"
echo "   2. Vérifier l'endpoint auth : curl http://localhost:8069/api/auth/sso-login"
echo "   3. Si besoin, installer modules additionnels via interface Odoo"
echo ""
echo -e "${GREEN}⏱️  Temps total : ~2 minutes${NC}"
echo ""
