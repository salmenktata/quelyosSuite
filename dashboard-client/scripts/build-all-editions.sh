#!/bin/bash
# Build toutes les éditions Quelyos
# Usage: ./scripts/build-all-editions.sh [--push]

set -e

REGISTRY="${DOCKER_REGISTRY:-quelyos}"
VERSION="${VERSION:-1.0.0}"
PUSH_IMAGES="${1:-}"

editions=(finance team sales store copilote retail support)

echo "======================================"
echo "🚀 BUILD TOUTES LES ÉDITIONS QUELYOS"
echo "======================================"
echo "Registry: $REGISTRY | Version: $VERSION"
echo ""

total_start=$(date +%s)

for edition in "${editions[@]}"; do
  echo "📦 Build $edition..."
  start=$(date +%s)
  
  docker build \
    --build-arg EDITION="$edition" \
    -t "$REGISTRY/quelyos-$edition:$VERSION" \
    -t "$REGISTRY/quelyos-$edition:latest" \
    -f Dockerfile \
    . > /dev/null 2>&1
  
  end=$(date +%s)
  duration=$((end - start))
  size=$(docker images "$REGISTRY/quelyos-$edition:$VERSION" --format "{{.Size}}")
  
  echo "   ✅ Build réussi en ${duration}s (Taille: $size)"
  
  if [ "$PUSH_IMAGES" = "--push" ]; then
    echo "   🚢 Push vers registry..."
    docker push "$REGISTRY/quelyos-$edition:$VERSION" > /dev/null 2>&1
    docker push "$REGISTRY/quelyos-$edition:latest" > /dev/null 2>&1
  fi
  echo ""
done

total_end=$(date +%s)
total_duration=$((total_end - total_start))

echo "✅ BUILDS TERMINÉS"
echo "Temps total: ${total_duration}s | Moyenne: $((total_duration / ${#editions[@]}))s/édition"
