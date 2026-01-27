#!/bin/bash
# Script de vérification des console.log non autorisés
# Utilisé par lint-staged dans les pre-commit hooks

set -e

# Couleurs
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RESET='\033[0m'

# Fichiers à vérifier (passés en arguments par lint-staged)
FILES="$@"

if [ -z "$FILES" ]; then
  echo -e "${GREEN}✓ Aucun fichier à vérifier${RESET}"
  exit 0
fi

# Patterns autorisés (fichiers où console.log est autorisé)
ALLOWED_PATTERNS=(
  "logger.ts"
  "logger.js"
  ".test.ts"
  ".test.tsx"
  ".spec.ts"
  ".spec.tsx"
  "dev-monitor.js"
)

# Fonction pour vérifier si un fichier est autorisé
is_allowed() {
  local file=$1
  for pattern in "${ALLOWED_PATTERNS[@]}"; do
    if [[ "$file" == *"$pattern"* ]]; then
      return 0
    fi
  done
  return 1
}

# Vérifier chaque fichier
ERRORS=0
for file in $FILES; do
  # Ignorer les fichiers autorisés
  if is_allowed "$file"; then
    continue
  fi

  # Chercher console.log, console.warn, console.error (mais pas dans les commentaires)
  if grep -n "^\s*console\.\(log\|warn\|error\|debug\)" "$file" > /dev/null 2>&1; then
    echo -e "${RED}✗ Console.log trouvé dans: ${file}${RESET}"
    grep -n "^\s*console\.\(log\|warn\|error\|debug\)" "$file" | while read -r line; do
      echo -e "${YELLOW}  $line${RESET}"
    done
    ERRORS=$((ERRORS + 1))
  fi
done

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${RED}❌ $ERRORS fichier(s) contiennent des console.log non autorisés${RESET}"
  echo -e "${YELLOW}💡 Utiliser 'logger' de @/lib/logger à la place${RESET}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  exit 1
fi

echo -e "${GREEN}✓ Aucun console.log non autorisé détecté${RESET}"
exit 0
