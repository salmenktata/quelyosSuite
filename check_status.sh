#!/bin/bash
# Script de vérification rapide du statut Quelyos ERP

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     QUELYOS ERP - VÉRIFICATION STATUT SYSTÈME            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Vérifier si on est dans le bon répertoire
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Erreur: Exécutez ce script depuis la racine du projet${NC}"
    exit 1
fi

cd backend

echo -e "${BLUE}📊 Vérification des containers Docker...${NC}"
echo ""

# Vérifier PostgreSQL
if docker ps | grep -q "quelyos-db"; then
    PG_STATUS=$(docker inspect -f '{{.State.Health.Status}}' quelyos-db 2>/dev/null || echo "unknown")
    if [ "$PG_STATUS" = "healthy" ]; then
        echo -e "  ${GREEN}✅${NC} PostgreSQL: Running (healthy)"
    else
        echo -e "  ${YELLOW}⚠️${NC}  PostgreSQL: Running ($PG_STATUS)"
    fi
else
    echo -e "  ${RED}❌${NC} PostgreSQL: Not running"
    echo ""
    echo -e "${YELLOW}Démarrage de PostgreSQL...${NC}"
    docker-compose up -d db
    sleep 5
fi

# Vérifier Odoo
if docker ps | grep -q "quelyos-odoo"; then
    echo -e "  ${GREEN}✅${NC} Odoo: Running"
else
    echo -e "  ${RED}❌${NC} Odoo: Not running"
    echo ""
    echo -e "${YELLOW}Démarrage d'Odoo...${NC}"
    docker-compose up -d odoo
    echo "  Attente du démarrage (15 secondes)..."
    sleep 15
fi

echo ""
echo -e "${BLUE}🧪 Tests API Backend...${NC}"
echo ""

# Test HTTP Odoo
ODOO_HTTP=$(curl -s http://localhost:8069 -o /dev/null -w "%{http_code}" 2>/dev/null)
if [ "$ODOO_HTTP" = "303" ] || [ "$ODOO_HTTP" = "200" ]; then
    echo -e "  ${GREEN}✅${NC} Odoo Web: http://localhost:8069 (HTTP $ODOO_HTTP)"
else
    echo -e "  ${RED}❌${NC} Odoo Web: Not responding (HTTP $ODOO_HTTP)"
fi

# Test API Products
PRODUCTS_TEST=$(curl -s -X POST http://localhost:8069/api/ecommerce/products \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "call", "params": {"limit": 1}, "id": 1}' \
  2>/dev/null | python3 -c "import sys, json; d=json.load(sys.stdin); print(d['result']['total']) if 'result' in d else print('0')" 2>/dev/null || echo "0")

if [ "$PRODUCTS_TEST" -gt "0" ]; then
    echo -e "  ${GREEN}✅${NC} API Products: $PRODUCTS_TEST produits disponibles"
else
    echo -e "  ${RED}❌${NC} API Products: Erreur ou aucun produit"
fi

# Test API Categories
CATEGORIES_TEST=$(curl -s -X POST http://localhost:8069/api/ecommerce/categories \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "call", "params": {}, "id": 1}' \
  2>/dev/null | python3 -c "import sys, json; d=json.load(sys.stdin); print(len(d['result']['categories'])) if 'result' in d else print('0')" 2>/dev/null || echo "0")

if [ "$CATEGORIES_TEST" -gt "0" ]; then
    echo -e "  ${GREEN}✅${NC} API Categories: $CATEGORIES_TEST catégories"
else
    echo -e "  ${YELLOW}⚠️${NC}  API Categories: Aucune catégorie"
fi

# Test API Cart
CART_TEST=$(curl -s -X POST http://localhost:8069/api/ecommerce/cart \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "call", "params": {}, "id": 1}' \
  2>/dev/null | python3 -c "import sys, json; d=json.load(sys.stdin); print('ok') if 'result' in d else print('error')" 2>/dev/null || echo "error")

if [ "$CART_TEST" = "ok" ]; then
    echo -e "  ${GREEN}✅${NC} API Cart: Fonctionnel"
else
    echo -e "  ${RED}❌${NC} API Cart: Erreur"
fi

echo ""
echo -e "${BLUE}🌐 Vérification Frontend...${NC}"
echo ""

cd ../frontend

# Vérifier si Next.js est lancé
FRONTEND_HTTP=$(curl -s http://localhost:3000 -o /dev/null -w "%{http_code}" 2>/dev/null)
if [ "$FRONTEND_HTTP" = "200" ]; then
    echo -e "  ${GREEN}✅${NC} Next.js: http://localhost:3000 (HTTP $FRONTEND_HTTP)"
else
    echo -e "  ${YELLOW}⚠️${NC}  Next.js: Not running (HTTP $FRONTEND_HTTP)"
    echo ""
    echo -e "${YELLOW}Pour démarrer le frontend:${NC}"
    echo "  cd frontend && npm run dev"
fi

# Test Sitemap
if [ "$FRONTEND_HTTP" = "200" ]; then
    SITEMAP_CHECK=$(curl -s http://localhost:3000/sitemap.xml 2>/dev/null | grep -c "product/" || echo "0")
    if [ "$SITEMAP_CHECK" -gt "0" ]; then
        echo -e "  ${GREEN}✅${NC} Sitemap.xml: Généré avec $SITEMAP_CHECK produits"
    else
        echo -e "  ${YELLOW}⚠️${NC}  Sitemap.xml: Généré sans produits"
    fi
fi

cd ..

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    RÉSUMÉ                                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Compter les services OK
SERVICES_OK=0
SERVICES_TOTAL=5

[ "$PG_STATUS" = "healthy" ] && ((SERVICES_OK++))
[ "$ODOO_HTTP" = "303" ] || [ "$ODOO_HTTP" = "200" ] && ((SERVICES_OK++))
[ "$PRODUCTS_TEST" -gt "0" ] && ((SERVICES_OK++))
[ "$CART_TEST" = "ok" ] && ((SERVICES_OK++))
[ "$FRONTEND_HTTP" = "200" ] && ((SERVICES_OK++))

if [ "$SERVICES_OK" -eq "$SERVICES_TOTAL" ]; then
    echo -e "${GREEN}✅ Tous les services sont opérationnels ($SERVICES_OK/$SERVICES_TOTAL)${NC}"
    echo ""
    echo "🌐 Accès:"
    echo "  - Backend Odoo:  http://localhost:8069"
    echo "  - Frontend:      http://localhost:3000"
    echo "  - API Docs:      Voir STATUS_FINAL.md"
    echo ""
    echo "🔑 Login Odoo: admin / admin"
elif [ "$SERVICES_OK" -ge 3 ]; then
    echo -e "${YELLOW}⚠️  Certains services nécessitent attention ($SERVICES_OK/$SERVICES_TOTAL OK)${NC}"
    echo ""
    echo "Consultez les logs pour plus de détails:"
    echo "  docker-compose -f backend/docker-compose.yml logs -f odoo"
else
    echo -e "${RED}❌ Plusieurs services ne fonctionnent pas ($SERVICES_OK/$SERVICES_TOTAL OK)${NC}"
    echo ""
    echo "Pour redémarrer les services:"
    echo "  cd backend && docker-compose restart"
fi

echo ""
echo "📚 Documentation: STATUS_FINAL.md"
echo ""
