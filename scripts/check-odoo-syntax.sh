#!/bin/bash
# Script de vérification syntaxe Python pour Odoo
# Utilisé par lint-staged dans les pre-commit hooks

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RESET='\033[0m'

# Fichiers à vérifier (passés en arguments par lint-staged)
FILES="$@"

if [ -z "$FILES" ]; then
  echo -e "${GREEN}✓ Aucun fichier Python à vérifier${RESET}"
  exit 0
fi

# Vérifier si python3 est disponible
if ! command -v python3 &> /dev/null; then
  echo -e "${YELLOW}⚠️  python3 non trouvé, vérification syntaxe ignorée${RESET}"
  exit 0
fi

# Vérifier la syntaxe de chaque fichier
ERRORS=0
for file in $FILES; do
  if [ ! -f "$file" ]; then
    continue
  fi

  # Vérifier la syntaxe avec python3 -m py_compile
  if ! python3 -m py_compile "$file" 2>/dev/null; then
    echo -e "${RED}✗ Erreur de syntaxe dans: ${file}${RESET}"
    python3 -m py_compile "$file"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${RED}❌ $ERRORS fichier(s) Python avec erreurs de syntaxe${RESET}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  exit 1
fi

echo -e "${GREEN}✓ Syntaxe Python valide${RESET}"
exit 0
