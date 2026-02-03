#!/bin/bash

###############################################################################
# Script de Vérification URLs Hardcodées
#
# Détecte les URLs hardcodées interdites dans les frontends.
# Conformité avec la règle "🎯 URLS CENTRALISÉES - RÈGLE ABSOLUE" (CLAUDE.md)
#
# Usage :
#   ./scripts/check-hardcoded-urls.sh
#
# Exit code :
#   0 : Aucune URL hardcodée détectée
#   1 : URLs hardcodées détectées (erreur)
###############################################################################

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Patterns URLs interdites
FORBIDDEN_PATTERNS=(
  "http://localhost:8069"
  "https://api.quelyos.com"
  "http://localhost:3000"
  "http://localhost:3001"
  "http://localhost:5175"
  "http://localhost:9000"
  "://localhost:8069"
  "://api.quelyos.com"
)

# Répertoires à vérifier
DIRECTORIES=(
  "dashboard-client"
  "vitrine-client"
  "super-admin-client"
  "vitrine-quelyos"
  "packages/backend"
  "packages/ui"
)

# Exclusions
EXCLUDE_DIRS=(
  "node_modules"
  ".next"
  "dist"
  "build"
  ".turbo"
)

# Exclusions fichiers
EXCLUDE_FILES=(
  "*.md"
  "*.lock"
  "pnpm-lock.yaml"
  "package-lock.json"
  "yarn.lock"
  ".env.example"
)

echo -e "${BLUE}🔍 Vérification URLs hardcodées...${NC}\n"

# Construire commande grep
GREP_EXCLUDES=""
for exclude_dir in "${EXCLUDE_DIRS[@]}"; do
  GREP_EXCLUDES="$GREP_EXCLUDES --exclude-dir=$exclude_dir"
done

for exclude_file in "${EXCLUDE_FILES[@]}"; do
  GREP_EXCLUDES="$GREP_EXCLUDES --exclude=$exclude_file"
done

# Fonction de recherche
search_pattern() {
  local pattern="$1"
  local found=0

  for dir in "${DIRECTORIES[@]}"; do
    if [ ! -d "$dir" ]; then
      continue
    fi

    # Rechercher le pattern
    if grep -rn $GREP_EXCLUDES "$pattern" "$dir" 2>/dev/null; then
      found=1
    fi
  done

  return $found
}

# Vérifier chaque pattern
violations=0
for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
  echo -e "${YELLOW}Recherche : $pattern${NC}"

  if search_pattern "$pattern"; then
    violations=$((violations + 1))
    echo -e "${RED}❌ Détecté : $pattern${NC}\n"
  else
    echo -e "${GREEN}✅ Aucune occurrence${NC}\n"
  fi
done

# Résultat final
echo -e "\n${BLUE}════════════════════════════════════════${NC}"
if [ $violations -eq 0 ]; then
  echo -e "${GREEN}✅ Aucune URL hardcodée détectée${NC}"
  echo -e "${GREEN}✅ Conformité règle CLAUDE.md validée${NC}"
  exit 0
else
  echo -e "${RED}❌ $violations pattern(s) détecté(s)${NC}"
  echo -e "${YELLOW}📖 Voir CLAUDE.md section '🎯 URLS CENTRALISÉES'${NC}"
  echo -e "${YELLOW}💡 Solution : Utiliser @quelyos/config${NC}"
  echo -e "${YELLOW}   import { PORTS, APPS, API } from '@quelyos/config'${NC}"
  exit 1
fi
