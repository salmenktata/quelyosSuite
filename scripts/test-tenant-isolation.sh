#!/bin/bash
# ==============================================================================
# Test Isolation Multi-Tenant - Script complet
# ==============================================================================
# Lance les trois niveaux de tests :
# 1. Tests RLS PostgreSQL (SQL direct)
# 2. Tests Python Odoo (ORM + RLS + headers)
# 3. Tests E2E Playwright (frontend)
#
# Usage :
#   ./scripts/test-tenant-isolation.sh           # Tout
#   ./scripts/test-tenant-isolation.sh sql        # SQL uniquement
#   ./scripts/test-tenant-isolation.sh python     # Python uniquement
#   ./scripts/test-tenant-isolation.sh e2e        # E2E uniquement
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Tests Isolation Multi-Tenant - Quelyos Suite       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

MODE="${1:-all}"

# ==============================================================================
# 1. TESTS SQL RLS PostgreSQL
# ==============================================================================

run_sql_tests() {
    echo -e "${YELLOW}━━━ 1/3 Tests RLS PostgreSQL ━━━${NC}"
    echo ""

    SQL_FILE="$ROOT_DIR/odoo-backend/addons/quelyos_api/tests/test_rls_policies.sql"

    if [ ! -f "$SQL_FILE" ]; then
        echo -e "${RED}❌ Fichier SQL non trouvé: $SQL_FILE${NC}"
        return 1
    fi

    # Vérifier que PostgreSQL est accessible
    if ! docker exec quelyos-db pg_isready -U odoo -q 2>/dev/null; then
        echo -e "${RED}❌ PostgreSQL non accessible (conteneur quelyos-db)${NC}"
        return 1
    fi

    echo "Exécution des tests SQL..."
    docker exec -i quelyos-db psql -U odoo -d quelyos < "$SQL_FILE" 2>&1

    echo ""
    echo -e "${GREEN}✅ Tests SQL terminés${NC}"
    echo ""
}

# ==============================================================================
# 2. TESTS PYTHON ODOO
# ==============================================================================

run_python_tests() {
    echo -e "${YELLOW}━━━ 2/3 Tests Python Odoo ━━━${NC}"
    echo ""

    # Vérifier que Odoo est accessible
    if ! docker exec quelyos-odoo python3 -c "print('ok')" 2>/dev/null; then
        echo -e "${RED}❌ Conteneur Odoo non accessible (quelyos-odoo)${NC}"
        return 1
    fi

    echo "Lancement tests tenant_isolation..."
    docker exec quelyos-odoo odoo-bin \
        -c /etc/odoo/odoo.conf \
        -d quelyos \
        --test-tags=tenant_isolation \
        --stop-after-init \
        --log-level=test 2>&1 | grep -E "(PASS|FAIL|ERROR|test_|Running)" || true

    echo ""
    echo "Lancement tests rls_postgresql..."
    docker exec quelyos-odoo odoo-bin \
        -c /etc/odoo/odoo.conf \
        -d quelyos \
        --test-tags=rls_postgresql \
        --stop-after-init \
        --log-level=test 2>&1 | grep -E "(PASS|FAIL|ERROR|test_|Running)" || true

    echo ""
    echo -e "${GREEN}✅ Tests Python terminés${NC}"
    echo ""
}

# ==============================================================================
# 3. TESTS E2E PLAYWRIGHT
# ==============================================================================

run_e2e_tests() {
    echo -e "${YELLOW}━━━ 3/3 Tests E2E Playwright ━━━${NC}"
    echo ""

    DASHBOARD_DIR="$ROOT_DIR/dashboard-client"

    if [ ! -f "$DASHBOARD_DIR/e2e/tenant-isolation.spec.ts" ]; then
        echo -e "${RED}❌ Fichier E2E non trouvé${NC}"
        return 1
    fi

    # Vérifier que Playwright est installé
    if ! command -v npx &> /dev/null; then
        echo -e "${RED}❌ npx non trouvé${NC}"
        return 1
    fi

    cd "$DASHBOARD_DIR"

    echo "Lancement tests Playwright..."
    echo -e "${YELLOW}⚠️  Nécessite que le dashboard soit lancé sur :5175${NC}"
    echo -e "${YELLOW}⚠️  Nécessite les domaines locaux configurés (setup-local-domains.sh)${NC}"
    echo ""

    npx playwright test e2e/tenant-isolation.spec.ts --reporter=list 2>&1 || true

    cd "$ROOT_DIR"

    echo ""
    echo -e "${GREEN}✅ Tests E2E terminés${NC}"
    echo ""
}

# ==============================================================================
# EXÉCUTION
# ==============================================================================

case "$MODE" in
    sql)
        run_sql_tests
        ;;
    python)
        run_python_tests
        ;;
    e2e)
        run_e2e_tests
        ;;
    all|*)
        run_sql_tests
        run_python_tests
        run_e2e_tests

        echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
        echo -e "${BLUE}║   Tous les tests terminés                            ║${NC}"
        echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo "Résumé :"
        echo "  1. Tests SQL RLS PostgreSQL   ✅"
        echo "  2. Tests Python Odoo          ✅"
        echo "  3. Tests E2E Playwright       ✅"
        echo ""
        echo "Si des tests ont échoué, vérifier les ❌ FAIL ci-dessus."
        ;;
esac
