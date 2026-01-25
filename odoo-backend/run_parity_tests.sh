#!/bin/bash
#
# Script pour lancer les tests de parité Backend Odoo ↔ API REST
#
# Usage:
#   ./run_parity_tests.sh          # Tous les tests
#   ./run_parity_tests.sh products # Tests produits uniquement
#   ./run_parity_tests.sh customers # Tests clients uniquement
#

set -e

echo "🧪 Tests de Parité Backend Odoo ↔ API REST"
echo "=========================================="

# Vérifier que Odoo est en cours d'exécution
if ! curl -s http://localhost:8069 > /dev/null 2>&1; then
    echo "❌ Erreur : Odoo n'est pas accessible sur http://localhost:8069"
    echo "   Démarrez Odoo avec : cd backend && docker-compose up -d"
    exit 1
fi

echo "✅ Odoo accessible"

# Installer les dépendances si nécessaire
if ! python3 -c "import pytest" 2>/dev/null; then
    echo "📦 Installation des dépendances pytest..."
    pip3 install -r tests/requirements.txt
fi

echo ""
echo "🚀 Lancement des tests..."
echo ""

# Lancer les tests
if [ -z "$1" ]; then
    # Tous les tests
    pytest tests/ -v --tb=short --maxfail=10
elif [ "$1" = "products" ]; then
    pytest tests/test_parity_products.py -v --tb=short
elif [ "$1" = "customers" ]; then
    pytest tests/test_parity_customers.py -v --tb=short
else
    echo "❌ Argument invalide: $1"
    echo "   Usage: ./run_parity_tests.sh [products|customers]"
    exit 1
fi

echo ""
echo "✅ Tests terminés"
