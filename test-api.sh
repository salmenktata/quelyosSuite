#!/bin/bash

# Script de test des APIs E-commerce Quelyos
# Usage: ./test-api.sh

ODOO_URL="http://localhost:8069"
DB="quelyos"

echo "================================================"
echo "🧪 Tests API E-commerce Quelyos"
echo "================================================"
echo ""

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_count=0
pass_count=0
fail_count=0

# Fonction pour tester un endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=${5:-200}

    test_count=$((test_count + 1))
    echo -n "Test $test_count: $name ... "

    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$ODOO_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$ODOO_URL$endpoint")
    fi

    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    if [ "$status_code" == "$expected_status" ] || [ "$status_code" == "200" ] || [ "$status_code" == "303" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
        pass_count=$((pass_count + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $status_code, expected $expected_status)"
        fail_count=$((fail_count + 1))
        echo "  Response: $body" | head -c 200
        echo ""
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Tests Serveur & Santé"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Server is UP" "GET" "/"
test_endpoint "Database info" "GET" "/web/database/selector"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Tests Endpoints E-commerce (Public)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
# Note: Ces tests peuvent échouer s'ils nécessitent une auth
test_endpoint "Liste produits" "GET" "/api/ecommerce/products"
test_endpoint "Categories" "GET" "/api/ecommerce/categories"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Test Documentation API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "API Health Check" "GET" "/api/ecommerce/health"

echo ""
echo "================================================"
echo "📊 Résultats des Tests"
echo "================================================"
echo -e "Total:  $test_count tests"
echo -e "${GREEN}Passés: $pass_count${NC}"
echo -e "${RED}Échoués: $fail_count${NC}"
echo ""

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}✓ Tous les tests sont passés!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Certains tests ont échoué${NC}"
    echo "Note: Les tests nécessitant une authentification peuvent échouer."
    echo "Pour tester les endpoints authentifiés, utilisez Postman ou curl avec session."
    exit 1
fi
