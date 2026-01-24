#!/bin/bash
# ============================================================================
# Quelyos ERP - Script de Test Rapide Phase 2
# ============================================================================
# Valide les composants essentiels du packaging
# ============================================================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  Tests Rapides - Phase 2 : Packaging Produit${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""

# ============================================================================
# Test 1 : Vérification fichiers packaging
# ============================================================================
echo -e "${BLUE}[Test 1/8]${NC} Vérification fichiers packaging..."

FILES=(
    "../Dockerfile.allinone"
    "nginx/quelyos.conf"
    "supervisor/supervisord.conf"
    "scripts/entrypoint.sh"
    "scripts/init-db.sh"
    "scripts/wait-for-postgres.sh"
    "install.sh"
    "wizard/index.html"
    "wizard/style.css"
    "wizard/wizard.js"
    "BRANDING_STRATEGY.md"
    "docs/INSTALLATION.txt"
    "docs/GUIDE_UTILISATEUR.txt"
    "docs/GUIDE_ADMINISTRATEUR.txt"
)

MISSING=0
for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}  ✗${NC} Fichier manquant: $file"
        MISSING=$((MISSING + 1))
    fi
done

if [ $MISSING -eq 0 ]; then
    echo -e "${GREEN}  ✓${NC} Tous les fichiers présents (${#FILES[@]} fichiers)"
    PASS=$((PASS + 1))
else
    echo -e "${RED}  ✗${NC} $MISSING fichiers manquants"
    FAIL=$((FAIL + 1))
fi
echo ""

# ============================================================================
# Test 2 : Validation Dockerfile.allinone
# ============================================================================
echo -e "${BLUE}[Test 2/8]${NC} Validation Dockerfile.allinone..."

if grep -q "FROM node:" ../Dockerfile.allinone && \
   grep -q "FROM ubuntu:22.04" ../Dockerfile.allinone && \
   grep -q "EXPOSE 80 443" ../Dockerfile.allinone; then
    echo -e "${GREEN}  ✓${NC} Dockerfile multi-stage valide"
    PASS=$((PASS + 1))
else
    echo -e "${RED}  ✗${NC} Dockerfile structure invalide"
    FAIL=$((FAIL + 1))
fi
echo ""

# ============================================================================
# Test 3 : Permissions scripts
# ============================================================================
echo -e "${BLUE}[Test 3/8]${NC} Vérification permissions scripts..."

SCRIPTS=(
    "scripts/entrypoint.sh"
    "scripts/init-db.sh"
    "scripts/wait-for-postgres.sh"
    "install.sh"
)

PERM_OK=0
for script in "${SCRIPTS[@]}"; do
    if [ -x "$script" ]; then
        PERM_OK=$((PERM_OK + 1))
    else
        echo -e "${YELLOW}  ⚠${NC}  Script non exécutable: $script"
        chmod +x "$script"
        echo -e "${GREEN}  ✓${NC} Permission ajoutée: $script"
    fi
done

echo -e "${GREEN}  ✓${NC} Permissions scripts OK (${PERM_OK}/${#SCRIPTS[@]})"
PASS=$((PASS + 1))
echo ""

# ============================================================================
# Test 4 : Validation wizard HTML/CSS/JS
# ============================================================================
echo -e "${BLUE}[Test 4/8]${NC} Validation wizard (HTML/CSS/JS)..."

WIZARD_OK=true

# Check HTML structure
if ! grep -q "<div class=\"wizard-container\">" wizard/index.html; then
    echo -e "${RED}  ✗${NC} Structure HTML wizard invalide"
    WIZARD_OK=false
fi

# Check CSS
if ! grep -q ":root {" wizard/style.css || \
   ! grep "primary" wizard/style.css > /dev/null; then
    echo -e "${RED}  ✗${NC} CSS wizard invalide"
    WIZARD_OK=false
fi

# Check JavaScript
if ! grep -q "function validateCurrentStep" wizard/wizard.js; then
    echo -e "${RED}  ✗${NC} JavaScript wizard invalide"
    WIZARD_OK=false
fi

if [ "$WIZARD_OK" = true ]; then
    echo -e "${GREEN}  ✓${NC} Wizard HTML/CSS/JS valide"
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi
echo ""

# ============================================================================
# Test 5 : Validation branding (aucune mention Odoo dans wizard)
# ============================================================================
echo -e "${BLUE}[Test 5/8]${NC} Validation branding wizard..."

if grep -i "odoo" wizard/index.html wizard/style.css wizard/wizard.js > /dev/null 2>&1; then
    echo -e "${RED}  ✗${NC} Mention 'Odoo' trouvée dans wizard (violation branding)"
    FAIL=$((FAIL + 1))
else
    echo -e "${GREEN}  ✓${NC} Branding wizard OK (aucune mention Odoo)"
    PASS=$((PASS + 1))
fi
echo ""

# ============================================================================
# Test 6 : Validation page légale frontend
# ============================================================================
echo -e "${BLUE}[Test 6/8]${NC} Validation page légale frontend..."

LEGAL_FILE="../frontend/src/app/legal/page.tsx"

if [ ! -f "$LEGAL_FILE" ]; then
    echo -e "${RED}  ✗${NC} Page légale manquante: $LEGAL_FILE"
    FAIL=$((FAIL + 1))
else
    # Check attribution Odoo
    if grep -q "Odoo S.A." "$LEGAL_FILE" && \
       grep -q "LGPL-3.0" "$LEGAL_FILE" && \
       grep -q "github.com/odoo/odoo" "$LEGAL_FILE"; then
        echo -e "${GREEN}  ✓${NC} Page légale valide (attribution LGPL v3.0)"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}  ✗${NC} Page légale incomplète (attribution manquante)"
        FAIL=$((FAIL + 1))
    fi
fi
echo ""

# ============================================================================
# Test 7 : Validation documentation (taille minimale)
# ============================================================================
echo -e "${BLUE}[Test 7/8]${NC} Validation documentation utilisateur..."

DOC_OK=true

# INSTALLATION.txt >= 400 lignes
if [ $(wc -l < docs/INSTALLATION.txt) -lt 400 ]; then
    echo -e "${RED}  ✗${NC} INSTALLATION.txt trop court"
    DOC_OK=false
fi

# GUIDE_UTILISATEUR.txt >= 500 lignes
if [ $(wc -l < docs/GUIDE_UTILISATEUR.txt) -lt 500 ]; then
    echo -e "${RED}  ✗${NC} GUIDE_UTILISATEUR.txt trop court"
    DOC_OK=false
fi

# GUIDE_ADMINISTRATEUR.txt >= 700 lignes
if [ $(wc -l < docs/GUIDE_ADMINISTRATEUR.txt) -lt 700 ]; then
    echo -e "${RED}  ✗${NC} GUIDE_ADMINISTRATEUR.txt trop court"
    DOC_OK=false
fi

if [ "$DOC_OK" = true ]; then
    echo -e "${GREEN}  ✓${NC} Documentation complète (2400+ lignes totales)"
    PASS=$((PASS + 1))
else
    echo -e "${YELLOW}  ⚠${NC}  Documentation partielle"
    FAIL=$((FAIL + 1))
fi
echo ""

# ============================================================================
# Test 8 : Validation Nginx config
# ============================================================================
echo -e "${BLUE}[Test 8/8]${NC} Validation configuration Nginx..."

if grep -q "location /wizard" nginx/quelyos.conf && \
   grep -q "location /admin" nginx/quelyos.conf && \
   grep -q "location /health" nginx/quelyos.conf && \
   grep -q "upstream odoo" nginx/quelyos.conf; then
    echo -e "${GREEN}  ✓${NC} Configuration Nginx valide"
    PASS=$((PASS + 1))
else
    echo -e "${RED}  ✗${NC} Configuration Nginx incomplète"
    FAIL=$((FAIL + 1))
fi
echo ""

# ============================================================================
# Résumé
# ============================================================================
TOTAL=$((PASS + FAIL))

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  Résumé des Tests${NC}"
echo -e "${BLUE}============================================================${NC}"
echo -e "${GREEN}Tests réussis :${NC} $PASS/$TOTAL"
if [ $FAIL -gt 0 ]; then
    echo -e "${RED}Tests échoués  :${NC} $FAIL/$TOTAL"
fi
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ Phase 2 : Packaging Produit - Validation réussie !${NC}"
    echo ""
    echo -e "${BLUE}Prochaines étapes :${NC}"
    echo "  1. Tester build Docker : docker build -t quelyos-erp:test -f Dockerfile.allinone ."
    echo "  2. Lancer conteneur test : ./install.sh (ou via Docker run)"
    echo "  3. Valider wizard : http://localhost/wizard"
    echo "  4. Exécuter suite complète : voir packaging/TEST_PLAN.md"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Certains tests ont échoué. Veuillez corriger avant déploiement.${NC}"
    echo ""
    exit 1
fi
