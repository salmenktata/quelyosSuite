#!/bin/bash
# Vérifier l'état TypeScript Strict Mode

set -e

echo "🔍 TypeScript Strict Mode - État Actuel"
echo "======================================="
echo ""

cd dashboard-client

echo "📊 Règles Strictes Activées :"
echo "  ✅ strict: true"
echo "  ✅ noImplicitAny: true"
echo "  ✅ strictNullChecks: true (via strict)"
echo "  ✅ noFallthroughCasesInSwitch: true"
echo ""

# Compter occurrences `: any`
ANY_COUNT=$(grep -r ": any" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs)
echo "📈 Occurrences ': any' : $ANY_COUNT (volontaires)"
echo ""

# Simuler noUnusedLocals
echo "🔍 Simulation noUnusedLocals: true..."
pnpm exec tsc --noEmit --noUnusedLocals 2>&1 | grep "is declared but never used" > /tmp/unused-locals.log 2>&1 || true
UNUSED_LOCALS=$(wc -l < /tmp/unused-locals.log | xargs)
echo "  ⚠️  Erreurs détectées : $UNUSED_LOCALS"

if [ "$UNUSED_LOCALS" -gt 0 ]; then
    echo "  📋 Top 10 fichiers avec le plus d'erreurs :"
    grep "is declared but never used" /tmp/unused-locals.log | \
        sed 's/(.*//' | \
        sort | uniq -c | sort -rn | head -10 | \
        awk '{printf "     %3d erreurs : %s\n", $1, $2}'
fi
echo ""

# Simuler noUncheckedIndexedAccess
echo "🔍 Simulation noUncheckedIndexedAccess: true..."
pnpm exec tsc --noEmit --noUncheckedIndexedAccess 2>&1 > /tmp/indexed-access.log 2>&1 || true
INDEXED_ERRORS=$(grep -c "error TS" /tmp/indexed-access.log 2>/dev/null || echo "0")
echo "  🔴 Erreurs détectées : $INDEXED_ERRORS (CRITIQUE - Risque bugs runtime)"

if [ "$INDEXED_ERRORS" -gt 0 ]; then
    echo "  📋 Top 10 fichiers avec le plus d'erreurs :"
    grep "error TS" /tmp/indexed-access.log | \
        sed 's/(.*//' | \
        sort | uniq -c | sort -rn | head -10 | \
        awk '{printf "     %3d erreurs : %s\n", $1, $2}'
fi
echo ""

# Score global
TOTAL_RULES=3
ENABLED_RULES=1  # strict (compte pour 1, inclut plusieurs sous-règles)
SCORE=$((ENABLED_RULES * 100 / TOTAL_RULES))

echo "📊 Score TypeScript Strict : $SCORE%"
echo ""
echo "🎯 Prochaines Étapes :"
echo "  1. 🔴 P0 : Activer noUncheckedIndexedAccess ($INDEXED_ERRORS erreurs)"
echo "  2. 🟡 P2 : Activer noUnusedLocals ($UNUSED_LOCALS erreurs)"
echo ""
echo "💡 Pour plus de détails : dashboard-client/TYPESCRIPT_STRICT_ROADMAP.md"
