#!/bin/bash
# Déploiement staging toutes éditions
# Usage: ./scripts/deploy-staging.sh

set -e

editions=(finance team sales store copilote retail support)
ports=(3010 3015 3013 3011 3012 3014 3016)
API_URL="${API_URL:-https://api-staging.quelyos.com}"

echo "======================================"
echo "🚀 DÉPLOIEMENT STAGING - 7 ÉDITIONS"
echo "======================================"
echo "API: $API_URL"
echo ""

# Arrêter containers existants
echo "🛑 Arrêt containers existants..."
for edition in "${editions[@]}"; do
  docker stop "quelyos-$edition-staging" 2>/dev/null || true
  docker rm "quelyos-$edition-staging" 2>/dev/null || true
done
echo ""

# Déployer chaque édition
for i in "${!editions[@]}"; do
  edition="${editions[$i]}"
  port="${ports[$i]}"
  
  echo "📦 Déploiement $edition (port $port)..."
  
  docker run -d \
    --name "quelyos-$edition-staging" \
    --restart always \
    -p "$port:80" \
    -e VITE_EDITION="$edition" \
    -e VITE_API_URL="$API_URL" \
    -e VITE_ENABLE_DEBUG="false" \
    quelyos/quelyos-$edition:latest
  
  # Attendre démarrage
  sleep 2
  
  # Health check
  if curl -sf "http://localhost:$port/health" > /dev/null; then
    echo "   ✅ $edition démarré et healthy (port $port)"
  else
    echo "   ⚠️  $edition démarré mais health check failed"
  fi
  echo ""
done

echo "======================================"
echo "✅ DÉPLOIEMENT STAGING TERMINÉ"
echo "======================================"
echo ""
echo "URLs accessibles:"
for i in "${!editions[@]}"; do
  edition="${editions[$i]}"
  port="${ports[$i]}"
  echo "  - $edition: http://localhost:$port"
done
