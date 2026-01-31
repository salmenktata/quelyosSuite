#!/bin/bash
# Script d'analyse bundle par édition

EDITION=${1:-finance}

echo "📊 Analyse Bundle : $EDITION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Build
echo "🔨 Build..."
VITE_EDITION=$EDITION pnpm build 2>&1 | tail -5

echo ""
echo "📦 Taille totale dist-$EDITION :"
du -sh dist-$EDITION

echo ""
echo "📊 Top 10 plus gros fichiers :"
find dist-$EDITION/assets -name "*.js" -exec ls -lh {} \; | sort -k5 -rh | head -10 | awk '{print $5, $9}'

echo ""
echo "✅ Fichiers > 100 KB :"
find dist-$EDITION/assets -name "*.js" -size +100k -exec ls -lh {} \; | awk '{print $5, $9}'

echo ""
echo "🎯 Bundle size initial (index) :"
ls -lh dist-$EDITION/assets/index-*.js | awk '{print $5}'
