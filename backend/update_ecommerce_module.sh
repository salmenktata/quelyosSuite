#!/bin/bash
# Script de mise à jour du module quelyos_ecommerce

set -e

echo "=================================================="
echo "🔄 Mise à jour du module quelyos_ecommerce"
echo "=================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Détecter le nom de la base de données
echo -e "${YELLOW}🔍 Détection de la base de données...${NC}"

# Essayer de récupérer le nom de la base depuis l'environnement Docker
DB_NAME=$(docker-compose exec -T db psql -U odoo -tAc "SELECT datname FROM pg_database WHERE datname NOT IN ('postgres', 'template0', 'template1') LIMIT 1;" 2>/dev/null | tr -d ' ')

if [ -z "$DB_NAME" ]; then
    echo -e "${RED}✗ Aucune base de données trouvée${NC}"
    echo ""
    echo "Bases de données disponibles:"
    docker-compose exec -T db psql -U odoo -tAc "SELECT datname FROM pg_database WHERE datname NOT IN ('postgres', 'template0', 'template1');"
    echo ""
    read -p "Entrez le nom de la base de données: " DB_NAME
fi

echo -e "${GREEN}✓ Base de données: $DB_NAME${NC}"
echo ""

# Vérifier si le module est déjà installé
echo -e "${YELLOW}🔍 Vérification du statut du module...${NC}"
MODULE_STATE=$(docker-compose exec -T db psql -U odoo -d "$DB_NAME" -tAc \
  "SELECT state FROM ir_module_module WHERE name = 'quelyos_ecommerce';" 2>/dev/null | tr -d ' ')

if [ -z "$MODULE_STATE" ]; then
    echo -e "${YELLOW}⚠️  Module non installé, installation en cours...${NC}"
    ACTION="install"
    OPTION="-i"
elif [ "$MODULE_STATE" = "installed" ]; then
    echo -e "${YELLOW}📦 Module déjà installé, mise à jour en cours...${NC}"
    ACTION="update"
    OPTION="-u"
else
    echo -e "${RED}⚠️  État du module: $MODULE_STATE${NC}"
    echo -e "${YELLOW}Installation du module...${NC}"
    ACTION="install"
    OPTION="-i"
fi
echo ""

# Arrêter Odoo temporairement
echo -e "${YELLOW}🛑 Arrêt temporaire d'Odoo...${NC}"
docker-compose stop odoo
echo -e "${GREEN}✓ Odoo arrêté${NC}"
echo ""

# Installer ou mettre à jour le module
echo -e "${YELLOW}📦 ${ACTION^} du module quelyos_ecommerce...${NC}"
docker-compose run --rm odoo \
  odoo --addons-path=/mnt/extra-addons,/usr/lib/python3/dist-packages/odoo/addons \
  -d "$DB_NAME" \
  $OPTION quelyos_ecommerce \
  --stop-after-init

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Module quelyos_ecommerce mis à jour avec succès${NC}"
else
    echo -e "${RED}✗ Erreur lors de la mise à jour${NC}"
    echo ""
    echo "Pour voir les erreurs détaillées, consultez les logs:"
    echo "docker-compose logs odoo"
    exit 1
fi
echo ""

# Redémarrer Odoo
echo -e "${YELLOW}🚀 Redémarrage d'Odoo...${NC}"
docker-compose start odoo
echo "   Attente du démarrage (15 secondes)..."
sleep 15
echo -e "${GREEN}✓ Odoo redémarré${NC}"
echo ""

# Vérification finale
echo -e "${YELLOW}✅ Vérification finale...${NC}"
MODULE_STATE=$(docker-compose exec -T db psql -U odoo -d "$DB_NAME" -tAc \
  "SELECT state FROM ir_module_module WHERE name = 'quelyos_ecommerce';" | tr -d ' ')

if [ "$MODULE_STATE" = "installed" ]; then
    echo -e "${GREEN}✓ Module quelyos_ecommerce: $MODULE_STATE${NC}"
else
    echo -e "${RED}✗ Module quelyos_ecommerce: $MODULE_STATE${NC}"
fi
echo ""

# Test de l'API
echo -e "${YELLOW}🧪 Test de l'API...${NC}"
sleep 5  # Attendre qu'Odoo soit vraiment prêt

API_RESPONSE=$(curl -s -X POST http://localhost:8069/api/ecommerce/products/list \
  -H "Content-Type: application/json" \
  -d '{"limit": 1}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$API_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$API_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ API fonctionne correctement (HTTP 200)${NC}"
    echo "   Réponse: $(echo "$RESPONSE_BODY" | head -c 100)..."
elif [ "$HTTP_CODE" = "404" ]; then
    echo -e "${RED}✗ API retourne 404 - Le module n'est peut-être pas complètement chargé${NC}"
    echo "   Attendez quelques secondes et réessayez manuellement:"
    echo "   curl -X POST http://localhost:8069/api/ecommerce/products/list -H 'Content-Type: application/json' -d '{\"limit\": 5}'"
else
    echo -e "${YELLOW}⚠️  API retourne HTTP $HTTP_CODE${NC}"
fi
echo ""

echo "=================================================="
echo -e "${GREEN}✅ Mise à jour terminée !${NC}"
echo "=================================================="
echo ""
echo "🌐 Vérifications:"
echo "   1. Backend Odoo: http://localhost:8069"
echo "   2. Vérifier les menus E-commerce dans Odoo"
echo "   3. Tester l'API:"
echo "      curl -X POST http://localhost:8069/api/ecommerce/products/list \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"limit\": 5}'"
echo ""
echo "   4. Lancer le frontend Next.js:"
echo "      cd ../frontend && npm run dev"
echo ""
echo "📊 Logs Odoo (en cas de problème):"
echo "   docker-compose logs -f odoo"
echo ""
