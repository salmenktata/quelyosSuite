#!/bin/bash

# Script de test pour l'API Chat Assistant Quelyos
# Usage: ./test.sh [base_url]
# Exemple: ./test.sh http://localhost:3000

BASE_URL=${1:-http://localhost:3000}
API_URL="$BASE_URL/api/chat"

echo "🧪 Tests API Chat Assistant Quelyos"
echo "🌐 Base URL: $BASE_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

test_count=0
passed_count=0

# Fonction de test
run_test() {
  test_count=$((test_count + 1))
  local test_name="$1"
  local payload="$2"
  local expected_intent="$3"

  echo -e "${BLUE}Test $test_count: $test_name${NC}"
  echo "📤 Payload: $payload"

  response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "$payload")

  echo "📥 Response:"
  echo "$response" | jq '.'

  # Vérifier l'intent si fourni
  if [ -n "$expected_intent" ]; then
    actual_intent=$(echo "$response" | jq -r '.intent')
    if [ "$actual_intent" = "$expected_intent" ]; then
      echo -e "${GREEN}✅ PASS - Intent correct: $actual_intent${NC}"
      passed_count=$((passed_count + 1))
    else
      echo -e "${RED}❌ FAIL - Intent attendu: $expected_intent, reçu: $actual_intent${NC}"
    fi
  else
    echo -e "${GREEN}✅ Test exécuté${NC}"
    passed_count=$((passed_count + 1))
  fi

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
}

# Test 1: Healthcheck
echo -e "${BLUE}Test 0: Healthcheck (GET)${NC}"
curl -s "$API_URL" | jq '.'
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 2: Salutation
run_test "Salutation" \
  '{"message": "Bonjour"}' \
  "greeting"

# Test 3: Tarifs
run_test "Question sur les tarifs" \
  '{"message": "Quels sont vos tarifs ?"}' \
  "pricing"

# Test 4: Modules
run_test "Question sur les modules" \
  '{"message": "Quels modules proposez-vous ?"}' \
  "modules"

# Test 5: Inscription
run_test "Question sur l'inscription" \
  '{"message": "Comment créer un compte ?"}' \
  "signup"

# Test 6: Support
run_test "Question support" \
  '{"message": "J'ai besoin d'aide"}' \
  "support"

# Test 7: Sécurité
run_test "Question sécurité" \
  '{"message": "Mes données sont-elles sécurisées ?"}' \
  "security"

# Test 8: IA
run_test "Question IA" \
  '{"message": "Comment fonctionne l'IA de prévision ?"}' \
  "ai"

# Test 9: Démo
run_test "Question démo" \
  '{"message": "Je voudrais voir une démo"}' \
  "demo"

# Test 10: Remerciements
run_test "Remerciements" \
  '{"message": "Merci beaucoup !"}' \
  "thanks"

# Test 11: Question inconnue
run_test "Question inconnue" \
  '{"message": "Quelle est la couleur du ciel ?"}' \
  "unknown"

# Test 12: Avec historique
run_test "Avec historique de conversation" \
  '{
    "message": "Et pour les modules ?",
    "history": [
      {"type": "user", "text": "Bonjour", "timestamp": "2024-01-30T10:00:00Z"},
      {"type": "bot", "text": "Bonjour !", "timestamp": "2024-01-30T10:00:01Z"}
    ]
  }'

# Test 13: Message vide (devrait échouer)
echo -e "${BLUE}Test: Message vide (erreur attendue)${NC}"
response=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"message": ""}')
echo "📥 Response:"
echo "$response" | jq '.'
if echo "$response" | jq -e '.error' > /dev/null; then
  echo -e "${GREEN}✅ PASS - Erreur correctement retournée${NC}"
  passed_count=$((passed_count + 1))
else
  echo -e "${RED}❌ FAIL - Aucune erreur retournée${NC}"
fi
test_count=$((test_count + 1))
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Résumé
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 Résumé des tests${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total: $test_count tests"
echo -e "Réussis: ${GREEN}$passed_count${NC}"
echo -e "Échoués: ${RED}$((test_count - passed_count))${NC}"

if [ $passed_count -eq $test_count ]; then
  echo -e "${GREEN}✅ Tous les tests sont passés !${NC}"
  exit 0
else
  echo -e "${RED}❌ Certains tests ont échoué${NC}"
  exit 1
fi
