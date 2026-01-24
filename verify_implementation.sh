#!/bin/bash

# Script de vérification de l'implémentation QuelyosERP
# Ce script teste tous les endpoints API après installation du module

ODOO_URL="${ODOO_URL:-http://localhost:8069}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

echo "============================================"
echo "   Vérification QuelyosERP E-commerce"
echo "============================================"
echo ""

# Couleurs pour l'output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
PASSED=0
FAILED=0

# Fonction de test
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"

    echo -n "Testing: $name... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$ODOO_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X POST "$ODOO_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        ((FAILED++))
        return 1
    fi
}

echo "=== Phase 1: Features Core ==="
echo ""

echo "1.1 - API Product List"
test_endpoint "Products List" "POST" "/api/ecommerce/products/list" '{"limit": 10}'

echo "1.2 - Filtres Avancés"
test_endpoint "Products with Filters" "POST" "/api/ecommerce/products/list" '{"limit": 10, "filters": {"in_stock": true}}'

echo "1.3 - SEO Slugs"
test_endpoint "Product by Slug" "POST" "/api/ecommerce/products/by-slug" '{"slug": "test-product"}'

echo ""
echo "=== Phase 2: Shopping Cart & Checkout ==="
echo ""

echo "2.1 - Cart Management"
test_endpoint "Get Cart" "POST" "/api/ecommerce/cart" '{}'

echo "2.2 - Checkout Process"
test_endpoint "Checkout Info" "POST" "/api/ecommerce/checkout/info" '{}'

echo "2.3 - Multi-step Checkout"
test_endpoint "Shipping Methods" "POST" "/api/ecommerce/checkout/shipping" '{}'

echo ""
echo "=== Phase 3: Customer Features ==="
echo ""

echo "3.1 - Wishlist"
test_endpoint "Get Wishlist" "POST" "/api/ecommerce/wishlist" '{}'

echo "3.2 - Reviews"
test_endpoint "Get Reviews" "POST" "/api/ecommerce/products/1/reviews" '{}'

echo "3.3 - Customer Account"
test_endpoint "Customer Info" "POST" "/api/ecommerce/customer/info" '{}'

echo "3.4 - Analytics"
test_endpoint "Analytics Dashboard" "POST" "/api/ecommerce/analytics/dashboard" '{}'

echo "3.5 - Coupons"
test_endpoint "Validate Coupon" "POST" "/api/ecommerce/coupon/validate" '{"code": "TEST"}'

echo ""
echo "=== Phase 4: Performance & SEO ==="
echo ""

echo "4.4 - SEO Advanced"
test_endpoint "SEO Metadata" "POST" "/api/ecommerce/seo/product/1" '{}'
test_endpoint "Breadcrumbs" "POST" "/api/ecommerce/seo/breadcrumbs/1" '{}'
test_endpoint "Organization Schema" "POST" "/api/ecommerce/seo/organization" '{}'
test_endpoint "Sitemap XML" "GET" "/api/ecommerce/sitemap.xml" ""

echo "4.5 - Redis Cache"
test_endpoint "Cache Stats" "POST" "/api/ecommerce/cache/stats" '{}'
test_endpoint "Cached Products" "POST" "/api/ecommerce/products/list/cached" '{"limit": 10}'

echo ""
echo "=== Frontend Routes ==="
echo ""

if curl -s "$FRONTEND_URL" > /dev/null; then
    echo -n "Testing: Frontend Home... "
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))

    echo -n "Testing: Frontend Sitemap... "
    if curl -s "$FRONTEND_URL/sitemap.xml" | grep -q "<?xml"; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
    fi

    echo -n "Testing: Frontend Robots.txt... "
    if curl -s "$FRONTEND_URL/robots.txt" | grep -q "User-agent"; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ Frontend not running at $FRONTEND_URL${NC}"
fi

echo ""
echo "============================================"
echo "   Résultats"
echo "============================================"
echo -e "Tests réussis: ${GREEN}$PASSED${NC}"
echo -e "Tests échoués: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Tous les tests sont passés!${NC}"
    echo ""
    echo "Prochaines étapes:"
    echo "  1. Testez le frontend manuellement"
    echo "  2. Vérifiez les menus Odoo (E-commerce)"
    echo "  3. Configurez Redis (optionnel): voir README_REDIS.md"
    echo "  4. Configurez SMTP pour les emails"
    exit 0
else
    echo -e "${RED}✗ Certains tests ont échoué${NC}"
    echo ""
    echo "Vérifiez que:"
    echo "  1. Le module quelyos_ecommerce est installé/mis à jour"
    echo "  2. Odoo est démarré: $ODOO_URL"
    echo "  3. Les dépendances sont correctes dans __manifest__.py"
    echo "  4. Aucune erreur dans les logs Odoo"
    exit 1
fi
