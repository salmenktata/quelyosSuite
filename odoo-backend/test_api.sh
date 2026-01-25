#!/bin/bash
# Script de test des endpoints API Quelyos

BASE_URL="http://localhost:8069/api/ecommerce"
TOTAL_TESTS=0
PASSED_TESTS=0

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "🧪 Tests des Endpoints API Quelyos"
echo "======================================"
echo ""

# Fonction pour tester un endpoint
test_endpoint() {
    local name="$1"
    local endpoint="$2"
    local params="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    response=$(curl -s -X POST "${BASE_URL}${endpoint}" \
        -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"method\":\"call\",\"params\":${params},\"id\":1}")

    if echo "$response" | grep -q '"success": true\|"result"'; then
        echo -e "${GREEN}✅${NC} $name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌${NC} $name"
        echo "   Response: $response" | head -c 200
        echo ""
        return 1
    fi
}

echo "📦 Produits"
test_endpoint "Liste produits" "/products" "{\"limit\": 10}"
test_endpoint "Produit par ID" "/products/1" "{}"
test_endpoint "Recherche produits" "/products" "{\"search\": \"test\"}"

echo ""
echo "🗂️  Catégories"
test_endpoint "Liste catégories" "/categories" "{}"
test_endpoint "Arbre catégories" "/categories" "{\"include_tree\": true}"

echo ""
echo "🔐 Authentification"
test_endpoint "Session info" "/auth/session" "{}"

echo ""
echo "🛒 Panier"
test_endpoint "Get cart" "/cart" "{}"

echo ""
echo "📊 Analytics"
test_endpoint "Stats globales" "/analytics/stats" "{}"

echo ""
echo "🚚 Livraison"
test_endpoint "Méthodes livraison" "/delivery/methods" "{}"

echo ""
echo "======================================"
echo -e "Résultats: ${GREEN}${PASSED_TESTS}/${TOTAL_TESTS}${NC} tests passés"
echo "======================================"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    exit 0
else
    exit 1
fi
