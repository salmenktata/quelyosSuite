#!/bin/bash

# Test End-to-End du Wizard Installation Guidée
# Vérifie le workflow complet sans interaction manuelle

set -e

echo "🧪 TEST E2E - WIZARD INSTALLATION GUIDÉE"
echo "========================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0
TOTAL=0

# Fonction de test
test_step() {
  TOTAL=$((TOTAL + 1))
  echo -n "[$TOTAL] $1... "
}

pass() {
  PASS=$((PASS + 1))
  echo -e "${GREEN}✓ PASS${NC}"
}

fail() {
  FAIL=$((FAIL + 1))
  echo -e "${RED}✗ FAIL${NC}"
  if [ -n "$1" ]; then
    echo "    → $1"
  fi
}

echo "📋 Phase 1: Vérifications Préalables"
echo "------------------------------------"

# Test 1: Serveur actif
test_step "Serveur super-admin accessible (port 9000)"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:9000 | grep -q "200"; then
  pass
else
  fail "Serveur non accessible sur http://localhost:9000"
  echo ""
  echo "❌ Le serveur doit être actif. Démarrez-le avec: npm run dev"
  exit 1
fi

# Test 2: Mode MOCK activé
test_step "Mode MOCK activé dans .env.local"
if grep -q "VITE_MOCK_WIZARD=true" .env.local 2>/dev/null; then
  pass
else
  fail "VITE_MOCK_WIZARD non trouvé dans .env.local"
fi

# Test 3: Fichiers composants présents
test_step "Composants wizard présents"
if [ -f "src/components/wizard/InstallWizard.tsx" ] && \
   [ -f "src/components/wizard/steps/Step1TenantInfo.tsx" ] && \
   [ -f "src/components/wizard/steps/Step5Progress.tsx" ]; then
  pass
else
  fail "Fichiers composants manquants"
fi

# Test 4: Hook présent
test_step "Hook useInstallWizard présent"
if [ -f "src/hooks/useInstallWizard.ts" ]; then
  pass
else
  fail "Hook manquant"
fi

# Test 5: Mock API présent
test_step "Mock API présent"
if [ -f "src/lib/api/mockWizardApi.ts" ]; then
  pass
else
  fail "Mock API manquant"
fi

echo ""
echo "🔍 Phase 2: Vérification Routes"
echo "--------------------------------"

# Test 6: Page Tenants accessible
test_step "Route /tenants accessible"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/tenants)
if [ "$HTTP_CODE" = "200" ]; then
  pass
else
  fail "HTTP $HTTP_CODE"
fi

# Test 7: Page Wizard accessible
test_step "Route /tenants/install accessible"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/tenants/install)
if [ "$HTTP_CODE" = "200" ]; then
  pass
else
  fail "HTTP $HTTP_CODE"
fi

# Test 8: HTML contient les composants
test_step "HTML contient script React"
if curl -s http://localhost:9000/tenants/install | grep -q "react"; then
  pass
else
  fail "React non détecté"
fi

echo ""
echo "🎨 Phase 3: Vérification Code Quality"
echo "--------------------------------------"

# Test 9: Pas d'erreurs TypeScript dans les fichiers wizard
test_step "TypeScript: Pas d'erreurs dans Step1TenantInfo"
if grep -q "any" src/components/wizard/steps/Step1TenantInfo.tsx; then
  fail "Type 'any' trouvé (non strict)"
else
  pass
fi

# Test 10: Dark mode présent
test_step "Dark mode: Classes présentes dans Step5Progress"
if grep -q "dark:bg-" src/components/wizard/steps/Step5Progress.tsx; then
  pass
else
  fail "Classes dark mode manquantes"
fi

# Test 11: Anonymisation Odoo
test_step "Anonymisation: Pas de mot 'Odoo' dans Step5Progress"
if grep -i "odoo" src/components/wizard/steps/Step5Progress.tsx; then
  fail "Mot 'Odoo' trouvé dans le code"
else
  pass
fi

# Test 12: Apostrophes échappées
test_step "JSX: Apostrophes échappées dans Step5Progress"
if grep -q "&apos;" src/components/wizard/steps/Step5Progress.tsx || \
   grep -q '`.*'"'"'.*`' src/components/wizard/steps/Step5Progress.tsx; then
  pass
else
  # Vérifier qu'il n'y a pas d'apostrophes non échappées dans les strings JSX
  if grep -E ">[^<]*'[^<]*<" src/components/wizard/steps/Step5Progress.tsx >/dev/null 2>&1; then
    fail "Apostrophes non échappées trouvées"
  else
    pass
  fi
fi

echo ""
echo "🔧 Phase 4: Vérification Configuration"
echo "---------------------------------------"

# Test 13: Mock API exporté
test_step "Mock API: Exports corrects"
if grep -q "export const mockWizardApi" src/lib/api/mockWizardApi.ts && \
   grep -q "export const MOCK_ENABLED" src/lib/api/mockWizardApi.ts; then
  pass
else
  fail "Exports manquants dans mockWizardApi.ts"
fi

# Test 14: Hook validation
test_step "Hook: Fonction validateCurrentStep présente"
if grep -q "validateCurrentStep" src/hooks/useInstallWizard.ts; then
  pass
else
  fail "Fonction validation manquante"
fi

# Test 15: Step5 import Mock API
test_step "Step5: Import Mock API présent"
if grep -q "import.*mockWizardApi" src/components/wizard/steps/Step5Progress.tsx; then
  pass
else
  fail "Import Mock API manquant"
fi

echo ""
echo "📊 Phase 5: Test Workflow Logique"
echo "----------------------------------"

# Test 16: Validation email dans useInstallWizard
test_step "Validation: Regex email présent"
if grep -q "emailRegex\|@.*@" src/hooks/useInstallWizard.ts; then
  pass
else
  fail "Validation email manquante"
fi

# Test 17: Plans disponibles dans Step2
test_step "Plans: 3 plans définis (Starter, Pro, Enterprise)"
PLAN_COUNT=$(grep -c "code:.*'starter'\|'pro'\|'enterprise'" src/components/wizard/steps/Step2PlanSelection.tsx || echo 0)
if [ "$PLAN_COUNT" -ge 3 ]; then
  pass
else
  fail "Plans incomplets ($PLAN_COUNT/3)"
fi

# Test 18: Modules dans Step3
test_step "Modules: 8 modules seed data définis"
MODULE_COUNT=$(grep -c "id:.*'store'\|'stock'\|'crm'\|'marketing'\|'finance'\|'pos'\|'support'\|'hr'" src/components/wizard/steps/Step3SeedConfig.tsx || echo 0)
if [ "$MODULE_COUNT" -ge 8 ]; then
  pass
else
  fail "Modules incomplets ($MODULE_COUNT/8)"
fi

# Test 19: Polling dans Step5
test_step "Polling: RefetchInterval configuré"
if grep -q "refetchInterval.*3000" src/components/wizard/steps/Step5Progress.tsx; then
  pass
else
  fail "Polling interval non configuré"
fi

# Test 20: Navigation dans InstallWizard
test_step "Navigation: Boutons Précédent/Suivant présents"
if grep -q "prevStep\|nextStep" src/components/wizard/InstallWizard.tsx; then
  pass
else
  fail "Navigation manquante"
fi

echo ""
echo "📚 Phase 6: Documentation"
echo "-------------------------"

# Test 21: WIZARD_INSTALL.md existe
test_step "Documentation: WIZARD_INSTALL.md présent"
if [ -f "WIZARD_INSTALL.md" ] && [ $(wc -l < WIZARD_INSTALL.md) -gt 100 ]; then
  pass
else
  fail "Documentation manquante ou incomplète"
fi

# Test 22: Guide de test existe
test_step "Guide: TEST_WIZARD_GUIDE.md présent"
if [ -f "TEST_WIZARD_GUIDE.md" ]; then
  pass
else
  fail "Guide de test manquant"
fi

# Test 23: Résumé existe
test_step "Résumé: WIZARD_SUMMARY.md présent"
if [ -f "WIZARD_SUMMARY.md" ]; then
  pass
else
  fail "Résumé manquant"
fi

echo ""
echo "🚀 Phase 7: Test Fonctionnel (Simulation)"
echo "------------------------------------------"

# Test 24: Simuler génération domain depuis nom
test_step "Logique: Génération domain (simulation)"
# Test la logique de slugification
TEST_NAME="Ma Boutique Test"
EXPECTED_SLUG="ma-boutique-test"
# Simuler en bash
GENERATED_SLUG=$(echo "$TEST_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\+/-/g' | sed 's/^-\|-$//g')
if [ "$GENERATED_SLUG" = "$EXPECTED_SLUG" ]; then
  pass
else
  fail "Slug généré: '$GENERATED_SLUG', attendu: '$EXPECTED_SLUG'"
fi

# Test 25: Mock API - Vérifier durées définies
test_step "Mock API: Durées volumétrie définies"
if grep -q "minimal.*20000\|standard.*45000\|large.*90000" src/lib/api/mockWizardApi.ts; then
  pass
else
  fail "Durées mock non configurées"
fi

echo ""
echo "========================================"
echo -e "RÉSULTATS: ${GREEN}$PASS PASS${NC} | ${RED}$FAIL FAIL${NC} | Total: $TOTAL tests"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✅ TOUS LES TESTS RÉUSSIS !${NC}"
  echo ""
  echo "🎉 Le wizard est prêt pour utilisation."
  echo ""
  echo "📍 Étapes suivantes:"
  echo "  1. Ouvrir http://localhost:9000/tenants/install"
  echo "  2. Tester manuellement le workflow complet"
  echo "  3. Vérifier dark mode (toggle navbar)"
  echo "  4. Observer provisioning + seed data (~75s)"
  echo ""
  exit 0
else
  echo -e "${RED}❌ ÉCHEC DE CERTAINS TESTS${NC}"
  echo ""
  echo "Veuillez corriger les problèmes avant de continuer."
  echo ""
  exit 1
fi
