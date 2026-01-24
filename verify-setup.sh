#!/bin/bash

# Script de vérification de l'installation UX/UI improvements
# Usage: bash verify-setup.sh

set -e

echo "🔍 Vérification de l'installation des améliorations UX/UI..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SUCCESS=0
WARNINGS=0
ERRORS=0

# Fonction de log
log_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((SUCCESS++))
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

log_error() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

# Vérifier Node.js
echo "📦 Vérification des prérequis..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    log_success "Node.js installé: $NODE_VERSION"
else
    log_error "Node.js non installé"
fi

# Vérifier npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    log_success "npm installé: $NPM_VERSION"
else
    log_error "npm non installé"
fi

echo ""
echo "📂 Vérification de la structure des fichiers..."

# Fichiers critiques Phase 1
FILES_PHASE1=(
    "frontend/src/components/common/Toast.tsx"
    "frontend/src/store/toastStore.ts"
    "frontend/src/components/common/Skeleton.tsx"
    "frontend/src/components/product/FilterDrawer.tsx"
    "frontend/src/components/product/StockBadge.tsx"
)

for file in "${FILES_PHASE1[@]}"; do
    if [ -f "$file" ]; then
        log_success "Phase 1: $file"
    else
        log_error "Manquant: $file"
    fi
done

# Fichiers Phase 3
FILES_PHASE3=(
    "frontend/src/lib/animations/variants.ts"
    "frontend/src/lib/animations/transitions.ts"
    "frontend/src/components/product/ProductGrid.tsx"
    "frontend/src/components/product/ProductImageGallery.tsx"
    "frontend/src/components/product/RecentlyViewedCarousel.tsx"
    "frontend/src/components/filters/ActiveFilterChips.tsx"
    "frontend/src/components/filters/PriceRangeSlider.tsx"
    "frontend/src/store/recentlyViewedStore.ts"
    "frontend/src/hooks/useKeyboardNav.ts"
    "frontend/src/hooks/useRecentlyViewed.ts"
    "frontend/src/hooks/useFilterSync.ts"
)

for file in "${FILES_PHASE3[@]}"; do
    if [ -f "$file" ]; then
        log_success "Phase 3: $file"
    else
        log_error "Manquant: $file"
    fi
done

# Fichiers Phase 4
FILES_PHASE4=(
    "frontend/src/components/common/Pagination.tsx"
    "frontend/src/components/common/OptimizedImage.tsx"
)

for file in "${FILES_PHASE4[@]}"; do
    if [ -f "$file" ]; then
        log_success "Phase 4: $file"
    else
        log_error "Manquant: $file"
    fi
done

echo ""
echo "📦 Vérification des dépendances..."

cd frontend 2>/dev/null || { log_error "Dossier frontend/ non trouvé"; exit 1; }

# Vérifier package.json
if [ -f "package.json" ]; then
    log_success "package.json trouvé"
    
    # Vérifier framer-motion
    if grep -q "framer-motion" package.json; then
        log_success "framer-motion dans package.json"
    else
        log_error "framer-motion manquant dans package.json"
        echo "   → Installer avec: npm install framer-motion --legacy-peer-deps"
    fi
    
    # Vérifier zustand
    if grep -q "zustand" package.json; then
        log_success "zustand dans package.json"
    else
        log_warning "zustand pourrait être manquant"
    fi
else
    log_error "package.json non trouvé"
fi

# Vérifier node_modules
if [ -d "node_modules" ]; then
    log_success "node_modules/ existe"
    
    if [ -d "node_modules/framer-motion" ]; then
        log_success "framer-motion installé"
    else
        log_error "framer-motion non installé dans node_modules"
    fi
else
    log_warning "node_modules/ manquant - exécuter 'npm install'"
fi

cd ..

echo ""
echo "⚙️  Vérification des configurations..."

# Vérifier tailwind.config.ts
if grep -q "slide-in-right" frontend/tailwind.config.ts 2>/dev/null; then
    log_success "Animations Tailwind configurées"
else
    log_warning "Animations Tailwind potentiellement manquantes"
fi

# Vérifier next.config.ts
if grep -q "remotePatterns" frontend/next.config.ts 2>/dev/null; then
    log_success "Next.js images config OK"
else
    log_warning "Config Next.js images à vérifier"
fi

# Vérifier layout.tsx
if grep -q "ToastContainer" frontend/src/app/layout.tsx 2>/dev/null; then
    log_success "ToastContainer intégré dans layout"
else
    log_error "ToastContainer manquant dans layout.tsx"
fi

echo ""
echo "📄 Vérification de la documentation..."

DOCS=(
    "UX_UI_IMPROVEMENTS_SUMMARY.md"
    "TESTING_GUIDE.md"
    "CHANGELOG_UX_UI.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        log_success "Doc: $doc"
    else
        log_warning "Doc manquante: $doc"
    fi
done

echo ""
echo "═══════════════════════════════════════════"
echo "📊 RÉSUMÉ DE LA VÉRIFICATION"
echo "═══════════════════════════════════════════"
echo -e "${GREEN}✓ Succès:${NC} $SUCCESS"
echo -e "${YELLOW}⚠ Warnings:${NC} $WARNINGS"
echo -e "${RED}✗ Erreurs:${NC} $ERRORS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Installation complète et correcte !${NC}"
    echo ""
    echo "🚀 Prochaines étapes:"
    echo "   1. cd frontend && npm run dev"
    echo "   2. Ouvrir http://localhost:3000"
    echo "   3. Suivre TESTING_GUIDE.md"
    exit 0
elif [ $ERRORS -le 3 ]; then
    echo -e "${YELLOW}⚠️  Installation quasi-complète avec quelques erreurs${NC}"
    echo ""
    echo "🔧 Actions recommandées:"
    echo "   1. Vérifier les fichiers manquants ci-dessus"
    echo "   2. cd frontend && npm install"
    exit 1
else
    echo -e "${RED}❌ Installation incomplète - plusieurs erreurs détectées${NC}"
    echo ""
    echo "🔧 Actions requises:"
    echo "   1. Vérifier que tous les fichiers ont été créés"
    echo "   2. cd frontend && npm install framer-motion --legacy-peer-deps"
    echo "   3. Relancer ce script"
    exit 1
fi
