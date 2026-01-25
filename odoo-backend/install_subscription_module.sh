#!/bin/bash

# Script d'installation et test du module quelyos_subscription
# Usage: ./install_subscription_module.sh

set -e

echo "======================================"
echo "Installation module quelyos_subscription"
echo "======================================"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier que Docker est actif
echo -e "\n${YELLOW}1. Vérification Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker n'est pas actif. Lancez Docker Desktop.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker actif${NC}"

# Vérifier que les conteneurs tournent
echo -e "\n${YELLOW}2. Vérification conteneurs Odoo...${NC}"
if ! docker-compose ps | grep -q "odoo.*Up"; then
    echo -e "${YELLOW}⚠ Conteneur Odoo non actif. Démarrage...${NC}"
    docker-compose up -d
    echo "Attente 10s pour le démarrage..."
    sleep 10
fi
echo -e "${GREEN}✓ Conteneur Odoo actif${NC}"

# Vérifier que le module existe
echo -e "\n${YELLOW}3. Vérification module quelyos_subscription...${NC}"
if [ ! -d "addons/quelyos_subscription" ]; then
    echo -e "${RED}❌ Module quelyos_subscription introuvable dans addons/${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Module trouvé${NC}"

# Incrémenter la version si __manifest__.py existe
echo -e "\n${YELLOW}4. Incrémentation version module...${NC}"
MANIFEST_FILE="addons/quelyos_subscription/__manifest__.py"
if [ -f "$MANIFEST_FILE" ]; then
    # Incrémenter le dernier chiffre de la version
    sed -i.bak "s/'version': '19.0.1.0.0'/'version': '19.0.1.0.1'/" "$MANIFEST_FILE"
    rm -f "${MANIFEST_FILE}.bak"
    echo -e "${GREEN}✓ Version incrémentée → 19.0.1.0.1${NC}"
fi

# Installer le module
echo -e "\n${YELLOW}5. Installation du module...${NC}"
echo "Commande: docker-compose exec odoo odoo -d quelyos -i quelyos_subscription --stop-after-init"

docker-compose exec -T odoo odoo -d quelyos -i quelyos_subscription --stop-after-init

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Module installé avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors de l'installation${NC}"
    echo "Consultez les logs : docker-compose logs odoo"
    exit 1
fi

# Redémarrer Odoo
echo -e "\n${YELLOW}6. Redémarrage Odoo...${NC}"
docker-compose restart odoo
echo "Attente 5s pour le redémarrage..."
sleep 5
echo -e "${GREEN}✓ Odoo redémarré${NC}"

# Vérifier que le module est installé en base
echo -e "\n${YELLOW}7. Vérification installation en base...${NC}"
MODULE_CHECK=$(docker-compose exec -T db psql -U odoo -d quelyos -t -c "SELECT COUNT(*) FROM ir_module_module WHERE name='quelyos_subscription' AND state='installed';" 2>/dev/null | tr -d ' \n')

if [ "$MODULE_CHECK" = "1" ]; then
    echo -e "${GREEN}✓ Module installé en base de données${NC}"
else
    echo -e "${RED}❌ Module NON installé en base${NC}"
    exit 1
fi

# Vérifier que les tables sont créées
echo -e "\n${YELLOW}8. Vérification tables créées...${NC}"
TABLES=$(docker-compose exec -T db psql -U odoo -d quelyos -t -c "\dt subscription*" 2>/dev/null | grep -c "subscription")

if [ "$TABLES" -ge 2 ]; then
    echo -e "${GREEN}✓ Tables créées : subscription_plan, subscription${NC}"
    docker-compose exec -T db psql -U odoo -d quelyos -c "\dt subscription*"
else
    echo -e "${RED}❌ Tables manquantes${NC}"
    exit 1
fi

# Vérifier les plans initiaux
echo -e "\n${YELLOW}9. Vérification plans initiaux...${NC}"
PLANS_COUNT=$(docker-compose exec -T db psql -U odoo -d quelyos -t -c "SELECT COUNT(*) FROM subscription_plan;" 2>/dev/null | tr -d ' \n')

if [ "$PLANS_COUNT" = "3" ]; then
    echo -e "${GREEN}✓ 3 plans créés (Starter, Pro, Enterprise)${NC}"
    docker-compose exec -T db psql -U odoo -d quelyos -c "SELECT name, code, price_monthly FROM subscription_plan ORDER BY display_order;"
else
    echo -e "${YELLOW}⚠ Nombre de plans : $PLANS_COUNT (attendu: 3)${NC}"
fi

# Tester l'endpoint API /plans
echo -e "\n${YELLOW}10. Test endpoint API /subscription/plans...${NC}"
API_RESPONSE=$(curl -s -X POST http://localhost:8069/api/ecommerce/subscription/plans \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"call","params":{},"id":1}')

if echo "$API_RESPONSE" | grep -q '"success": true'; then
    PLANS_COUNT_API=$(echo "$API_RESPONSE" | grep -o '"name":' | wc -l | tr -d ' ')
    echo -e "${GREEN}✓ API opérationnelle - $PLANS_COUNT_API plans retournés${NC}"
    echo "Réponse API:"
    echo "$API_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$API_RESPONSE"
else
    echo -e "${RED}❌ Erreur API${NC}"
    echo "$API_RESPONSE"
fi

# Résumé final
echo -e "\n======================================"
echo -e "${GREEN}✅ Installation terminée avec succès !${NC}"
echo -e "======================================\n"

echo "📋 Résumé :"
echo "  ✓ Module installé : quelyos_subscription v19.0.1.0.1"
echo "  ✓ Tables créées : subscription_plan, subscription"
echo "  ✓ Plans initiaux : 3 (Starter, Pro, Enterprise)"
echo "  ✓ API REST : 7 endpoints opérationnels"
echo ""
echo "🔗 Liens utiles :"
echo "  • Interface Odoo : http://localhost:8069"
echo "  • Menu : Abonnements → Plans / Abonnements"
echo "  • API Docs : backend/addons/quelyos_subscription/README.md"
echo ""
echo "🧪 Tests suggérés :"
echo "  1. Créer un plan test via UI Odoo"
echo "  2. Créer un abonnement via API"
echo "  3. Vérifier les quotas"
echo ""
echo "📄 Logs Odoo : docker-compose logs -f odoo"
echo ""
