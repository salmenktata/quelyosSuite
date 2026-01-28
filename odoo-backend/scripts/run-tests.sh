#!/bin/bash
# Script pour lancer les tests API Quelyos
# Usage: ./scripts/run-tests.sh [options]
#
# Options:
#   --all         Lancer tous les tests
#   --auth        Tests d'authentification uniquement
#   --products    Tests produits uniquement
#   --orders      Tests commandes uniquement
#   --customers   Tests clients uniquement
#   --security    Tests sécurité uniquement
#   --fast        Exclure les tests lents
#   --coverage    Avec rapport de couverture

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Tests API Quelyos ===${NC}"

# Vérifier que pytest est installé
if ! command -v pytest &> /dev/null; then
    echo -e "${YELLOW}Installation de pytest...${NC}"
    pip install pytest pytest-cov pytest-timeout requests
fi

# Vérifier que Odoo est accessible
echo -e "${YELLOW}Vérification connexion Odoo...${NC}"
ODOO_URL="${ODOO_URL:-http://localhost:8069}"

if ! curl -s --connect-timeout 5 "$ODOO_URL/web/health" > /dev/null 2>&1; then
    if ! curl -s --connect-timeout 5 "$ODOO_URL" > /dev/null 2>&1; then
        echo -e "${RED}Erreur: Odoo n'est pas accessible sur $ODOO_URL${NC}"
        echo "Lancez d'abord: ./scripts/dev-start.sh backend"
        exit 1
    fi
fi
echo -e "${GREEN}Odoo accessible sur $ODOO_URL${NC}"

# Parser les arguments
PYTEST_ARGS="-v"
MARKERS=""

for arg in "$@"; do
    case $arg in
        --all)
            MARKERS=""
            ;;
        --auth)
            MARKERS="-m auth"
            ;;
        --products)
            MARKERS="-m products"
            ;;
        --orders)
            MARKERS="-m orders"
            ;;
        --customers)
            MARKERS="-m customers"
            ;;
        --security)
            MARKERS="-m security"
            ;;
        --fast)
            MARKERS="$MARKERS -m 'not slow'"
            ;;
        --coverage)
            PYTEST_ARGS="$PYTEST_ARGS --cov=addons/quelyos_api --cov-report=html --cov-report=term"
            ;;
        --verbose)
            PYTEST_ARGS="$PYTEST_ARGS -vv"
            ;;
        --debug)
            PYTEST_ARGS="$PYTEST_ARGS -s --tb=long"
            ;;
        *)
            echo "Option inconnue: $arg"
            ;;
    esac
done

# Lancer les tests
echo -e "${YELLOW}Lancement des tests...${NC}"
echo "pytest $PYTEST_ARGS $MARKERS tests/"

pytest $PYTEST_ARGS $MARKERS tests/

# Résultat
if [ $? -eq 0 ]; then
    echo -e "${GREEN}=== Tous les tests passent ===${NC}"
else
    echo -e "${RED}=== Certains tests ont échoué ===${NC}"
    exit 1
fi
