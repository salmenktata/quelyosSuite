#!/bin/bash

# Script d'analyse des erreurs ESLint
# Quelyos Dashboard Client - Analyse détaillée

echo "🔍 Analyse des erreurs ESLint..."
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# Analyse par catégorie
# ============================================================================

echo "══════════════════════════════════════════════════════════════"
echo "  RÉSUMÉ DES ERREURS PAR CATÉGORIE"
echo "══════════════════════════════════════════════════════════════"
echo ""

# 1. Types any
ANY_COUNT=$(pnpm lint 2>&1 | grep "no-explicit-any" | wc -l | xargs)
echo "${YELLOW}📊 Types 'any' explicites : ${ANY_COUNT}${NC}"
if [ "$ANY_COUNT" -gt 0 ]; then
  echo "   Fichiers concernés :"
  pnpm lint 2>&1 | grep -B 1 "no-explicit-any" | grep "^/" | sort -u | head -10 | sed 's/^/   - /'
fi
echo ""

# 2. Dépendances hooks
DEPS_COUNT=$(pnpm lint 2>&1 | grep "exhaustive-deps" | wc -l | xargs)
echo "${YELLOW}🔗 Dépendances hooks manquantes : ${DEPS_COUNT}${NC}"
if [ "$DEPS_COUNT" -gt 0 ]; then
  echo "   Fichiers concernés :"
  pnpm lint 2>&1 | grep -B 1 "exhaustive-deps" | grep "^/" | sort -u | head -10 | sed 's/^/   - /'
fi
echo ""

# 3. React refresh
REFRESH_COUNT=$(pnpm lint 2>&1 | grep "only-export-components" | wc -l | xargs)
echo "${BLUE}⚡ React refresh warnings : ${REFRESH_COUNT}${NC}"
echo "   (Non-critique, warnings dev uniquement)"
echo ""

# 4. Variables non utilisées
UNUSED_COUNT=$(pnpm lint 2>&1 | grep "unused" | wc -l | xargs)
echo "${YELLOW}🗑️  Variables non utilisées : ${UNUSED_COUNT}${NC}"
if [ "$UNUSED_COUNT" -gt 0 ]; then
  echo "   Exemples :"
  pnpm lint 2>&1 | grep "unused" | head -5 | sed 's/^/   /'
fi
echo ""

# ============================================================================
# Top 10 fichiers avec le plus d'erreurs
# ============================================================================

echo "══════════════════════════════════════════════════════════════"
echo "  TOP 10 FICHIERS AVEC LE PLUS D'ERREURS"
echo "══════════════════════════════════════════════════════════════"
echo ""

pnpm lint 2>&1 | grep "^/" | awk '{print $1}' | sort | uniq -c | sort -rn | head -10 | while read count file; do
  echo "  ${RED}${count} erreurs${NC} → $file"
done

echo ""

# ============================================================================
# Recommandations
# ============================================================================

echo "══════════════════════════════════════════════════════════════"
echo "  RECOMMANDATIONS"
echo "══════════════════════════════════════════════════════════════"
echo ""

TOTAL=$(pnpm lint 2>&1 | grep -o "[0-9]* warnings" | grep -o "[0-9]*" || echo "0")

echo "📋 Total warnings : ${RED}${TOTAL}${NC}"
echo ""

if [ "$ANY_COUNT" -gt 20 ]; then
  echo "1️⃣  Priorité 1 : Supprimer les 'as any'"
  echo "   → Lancer : ./scripts/fix-lint-errors.sh"
  echo ""
fi

if [ "$DEPS_COUNT" -gt 20 ]; then
  echo "2️⃣  Priorité 2 : Corriger les dépendances hooks"
  echo "   → Wrapper les fonctions dans useCallback"
  echo "   → Fichiers à corriger en priorité (top 5) :"
  pnpm lint 2>&1 | grep -B 1 "exhaustive-deps" | grep "^/" | sort -u | head -5 | sed 's/^/      /'
  echo ""
fi

if [ "$UNUSED_COUNT" -gt 10 ]; then
  echo "3️⃣  Priorité 3 : Variables non utilisées"
  echo "   → Ajouter préfixe '_' aux variables inutilisées"
  echo ""
fi

echo "✅ Actions rapides :"
echo "   • Auto-fix : ${GREEN}pnpm lint --fix${NC}"
echo "   • Script batch : ${GREEN}./scripts/fix-lint-errors.sh${NC}"
echo "   • Analyse détaillée : ${GREEN}pnpm lint > lint-report.txt${NC}"
echo ""
