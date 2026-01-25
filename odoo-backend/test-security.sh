#!/bin/bash
# Script de test des endpoints sécurisés
# Vérifie que les contrôles d'autorisation fonctionnent correctement

echo "==================================================================="
echo "🔒 Tests de Sécurité - Quelyos API v19.0.1.0.15"
echo "==================================================================="
echo ""
echo "Ce script teste que les endpoints sécurisés rejettent bien les"
echo "tentatives d'accès non autorisées."
echo ""
echo "-------------------------------------------------------------------"
echo "📋 Phase 1: Endpoints Admin (CRUD Produits/Catégories/Stock)"
echo "-------------------------------------------------------------------"
echo ""

# Test 1: Création produit sans auth (devrait échouer)
echo "Test 1: POST /api/ecommerce/products/create (sans auth)"
echo "  Attendu: Erreur 'AUTH_REQUIRED' ou 401"
RESPONSE=$(curl -s -X POST "http://localhost:8069/api/ecommerce/products/create" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"call","params":{"name":"Test Product"},"id":1}')
echo "  Réponse: $RESPONSE" | head -c 100
echo "..."
echo ""

# Test 2: Suppression produit sans auth (devrait échouer)
echo "Test 2: POST /api/ecommerce/products/1/delete (sans auth)"
echo "  Attendu: Erreur 'AUTH_REQUIRED' ou 401"
RESPONSE=$(curl -s -X POST "http://localhost:8069/api/ecommerce/products/1/delete" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"call","params":{},"id":1}')
echo "  Réponse: $RESPONSE" | head -c 100
echo "..."
echo ""

echo "-------------------------------------------------------------------"
echo "📋 Phase 2: Endpoints Customer (Données personnelles)"
echo "-------------------------------------------------------------------"
echo ""

# Test 3: Modification profil sans auth (devrait échouer)
echo "Test 3: POST /api/ecommerce/customer/profile/update (sans auth)"
echo "  Attendu: Erreur 'AUTH_REQUIRED' ou 401"
RESPONSE=$(curl -s -X POST "http://localhost:8069/api/ecommerce/customer/profile/update" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"call","params":{"name":"Hacker"},"id":1}')
echo "  Réponse: $RESPONSE" | head -c 100
echo "..."
echo ""

# Test 4: Création adresse sans auth (devrait échouer)
echo "Test 4: POST /api/ecommerce/customer/addresses/create (sans auth)"
echo "  Attendu: Erreur 'AUTH_REQUIRED' ou 401"
RESPONSE=$(curl -s -X POST "http://localhost:8069/api/ecommerce/customer/addresses/create" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"call","params":{"street":"123 Hack St"},"id":1}')
echo "  Réponse: $RESPONSE" | head -c 100
echo "..."
echo ""

echo "-------------------------------------------------------------------"
echo "📋 Phase 3: Endpoints Images/Variants (Admin uniquement)"
echo "-------------------------------------------------------------------"
echo ""

# Test 5: Suppression image sans auth (devrait échouer)
echo "Test 5: POST /api/ecommerce/products/1/images/1/delete (sans auth)"
echo "  Attendu: Erreur 'AUTH_REQUIRED' ou 401"
RESPONSE=$(curl -s -X POST "http://localhost:8069/api/ecommerce/products/1/images/1/delete" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"call","params":{},"id":1}')
echo "  Réponse: $RESPONSE" | head -c 100
echo "..."
echo ""

echo "==================================================================="
echo "✅ Tests terminés"
echo ""
echo "💡 Vérifier que tous les tests affichent des erreurs AUTH_REQUIRED"
echo "   Si un endpoint retourne des données, c'est une faille de sécurité!"
echo ""
echo "📊 Pour voir les logs de sécurité:"
echo "   ./monitor-security.sh"
echo "   ./monitor-security.sh --live    # Mode temps réel"
echo "==================================================================="
