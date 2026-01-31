#!/bin/bash

# Test E2E Wizard avec Backend Réel
# Teste la création d'un tenant via le wizard avec provisioning réel

set -e

echo "🧪 TEST E2E WIZARD - BACKEND RÉEL"
echo "================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="http://localhost:8069"
TIMESTAMP=$(date +%s)
TENANT_NAME="Boutique Test E2E $(date +%H%M%S)"
DOMAIN="test-e2e-${TIMESTAMP}.quelyos.com"
ADMIN_EMAIL="admin-e2e-${TIMESTAMP}@test.com"
ADMIN_NAME="Admin Test"
PLAN_CODE="pro"

echo -e "${BLUE}Configuration:${NC}"
echo "  API: $API_URL"
echo "  Tenant: $TENANT_NAME"
echo "  Domain: $DOMAIN"
echo "  Email: $ADMIN_EMAIL"
echo "  Plan: $PLAN_CODE"
echo ""

# Fichier cookies temporaire
COOKIE_FILE="/tmp/wizard-test-cookies.txt"
rm -f "$COOKIE_FILE"

# Étape 1: Authentification
echo -e "${YELLOW}[1/4] Authentification super admin...${NC}"
AUTH_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -c "$COOKIE_FILE" \
  -H "Content-Type: application/json" \
  -d '{
    "login": "admin",
    "password": "6187"
  }')

echo "Auth Response: $AUTH_RESPONSE" | head -c 200

SESSION_ID=$(echo "$AUTH_RESPONSE" | jq -r '.session_id // empty')

if [ -z "$SESSION_ID" ]; then
  echo -e "${RED}✗ Échec authentification${NC}"
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Authentifié${NC}"
echo "  Session ID: ${SESSION_ID:0:40}..."
echo ""

# Étape 2: Créer le tenant
echo -e "${YELLOW}[2/4] Création du tenant...${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/api/super-admin/tenants" \
  -b "$COOKIE_FILE" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$TENANT_NAME\",
    \"domain\": \"$DOMAIN\",
    \"plan_code\": \"$PLAN_CODE\",
    \"admin_email\": \"$ADMIN_EMAIL\",
    \"admin_name\": \"$ADMIN_NAME\"
  }")

echo "Create Response: $CREATE_RESPONSE" | head -c 300

SUCCESS=$(echo "$CREATE_RESPONSE" | jq -r '.success // false')
TENANT_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.tenant_id // empty')
JOB_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.provisioning_job_id // empty')

if [ "$SUCCESS" != "true" ] || [ -z "$JOB_ID" ]; then
  echo -e "${RED}✗ Échec création tenant${NC}"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Tenant créé${NC}"
echo "  Tenant ID: $TENANT_ID"
echo "  Job ID: $JOB_ID"
echo ""

# Étape 3: Polling du provisioning
echo -e "${YELLOW}[3/4] Polling provisioning (max 2 minutes)...${NC}"

MAX_ATTEMPTS=40  # 40 x 3s = 120s
ATTEMPT=0
STATUS="pending"

while [ "$STATUS" != "completed" ] && [ "$STATUS" != "failed" ] && [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))

  STATUS_RESPONSE=$(curl -s -X GET "$API_URL/api/super-admin/provisioning/status/$JOB_ID" \
    -b "$COOKIE_FILE")

  STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.data.status // "unknown"')
  PROGRESS=$(echo "$STATUS_RESPONSE" | jq -r '.data.progress_percent // 0')
  CURRENT_STEP=$(echo "$STATUS_RESPONSE" | jq -r '.data.current_step // "..."')

  echo -ne "\r  [$ATTEMPT/$MAX_ATTEMPTS] Status: $STATUS | Progress: $PROGRESS% | $CURRENT_STEP                    "

  if [ "$STATUS" = "completed" ]; then
    echo ""
    break
  fi

  if [ "$STATUS" = "failed" ]; then
    echo -e "\n${RED}✗ Provisioning échoué${NC}"
    ERROR_MSG=$(echo "$STATUS_RESPONSE" | jq -r '.data.error_message // "Unknown error"')
    echo "Error: $ERROR_MSG"
    exit 1
  fi

  sleep 3
done

if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
  echo -e "\n${RED}✗ Timeout après 2 minutes${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Provisioning terminé${NC}"
echo ""

# Étape 4: Récupérer les résultats
echo -e "${YELLOW}[4/4] Récupération des résultats...${NC}"

FINAL_RESPONSE=$(curl -s -X GET "$API_URL/api/super-admin/provisioning/status/$JOB_ID" \
  -b "$COOKIE_FILE")

STORE_URL=$(echo "$FINAL_RESPONSE" | jq -r '.data.store_url // "N/A"')
ADMIN_URL=$(echo "$FINAL_RESPONSE" | jq -r '.data.admin_url // "N/A"')
TEMP_PASSWORD=$(echo "$FINAL_RESPONSE" | jq -r '.data.temp_password // "N/A"')

echo -e "${GREEN}✓ Résultats récupérés${NC}"
echo ""

# Afficher les résultats
echo "========================================"
echo -e "${GREEN}✅ TEST RÉUSSI !${NC}"
echo "========================================"
echo ""
echo -e "${BLUE}Informations Tenant:${NC}"
echo "  Nom: $TENANT_NAME"
echo "  Domain: $DOMAIN"
echo "  ID: $TENANT_ID"
echo ""
echo -e "${BLUE}URLs d'accès:${NC}"
echo "  Boutique: $STORE_URL"
echo "  Backoffice: $ADMIN_URL"
echo ""
echo -e "${BLUE}Credentials Admin:${NC}"
echo "  Email: $ADMIN_EMAIL"
echo "  Password: $TEMP_PASSWORD"
echo ""
echo -e "${YELLOW}⚠️  Changez le mot de passe lors de la première connexion${NC}"
echo ""

exit 0
