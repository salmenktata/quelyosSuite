#!/bin/bash
# Script de vérification rapide de la santé des services
# Usage: ./scripts/check-health.sh

set -e

COLORS_RED='\033[0;31m'
COLORS_GREEN='\033[0;32m'
COLORS_YELLOW='\033[1;33m'
COLORS_CYAN='\033[0;36m'
COLORS_RESET='\033[0m'

echo -e "${COLORS_CYAN}🏥 Vérification santé des services...${COLORS_RESET}"
echo ""

# Fonction pour vérifier un service
check_service() {
  local name=$1
  local port=$2
  local url="http://localhost:${port}/api/health"

  echo -n -e "${COLORS_CYAN}${name} (port ${port}):${COLORS_RESET} "

  # Vérifier si le service répond
  if ! response=$(curl -s --max-time 2 "$url" 2>/dev/null); then
    echo -e "${COLORS_RED}❌ DOWN (service non joignable)${COLORS_RESET}"
    return 1
  fi

  # Extraire le status
  status=$(echo "$response" | jq -r '.status' 2>/dev/null)

  case "$status" in
    "healthy")
      echo -e "${COLORS_GREEN}✓ HEALTHY${COLORS_RESET}"
      ;;
    "degraded")
      echo -e "${COLORS_YELLOW}⚠️  DEGRADED${COLORS_RESET}"
      # Afficher le nombre d'erreurs
      error_count=$(echo "$response" | jq -r '.metrics.errorCount' 2>/dev/null)
      if [ -n "$error_count" ] && [ "$error_count" != "null" ]; then
        echo -e "    ${COLORS_YELLOW}→ ${error_count} erreurs récentes${COLORS_RESET}"
      fi
      ;;
    "down")
      echo -e "${COLORS_RED}✗ DOWN (trop d'erreurs)${COLORS_RESET}"
      error_count=$(echo "$response" | jq -r '.metrics.errorCount' 2>/dev/null)
      if [ -n "$error_count" ] && [ "$error_count" != "null" ]; then
        echo -e "    ${COLORS_RED}→ ${error_count} erreurs récentes${COLORS_RESET}"
      fi
      ;;
    *)
      echo -e "${COLORS_RED}❌ DOWN (réponse invalide)${COLORS_RESET}"
      return 1
      ;;
  esac
}

# Vérifier tous les services
check_service "Dashboard Backoffice" 5175
echo ""
check_service "E-commerce Client" 3001
echo ""
check_service "Vitrine Quelyos" 3000

echo ""
echo -e "${COLORS_CYAN}═══════════════════════════════════════════${COLORS_RESET}"

# Vérifier si jq est installé
if ! command -v jq &> /dev/null; then
  echo -e "${COLORS_YELLOW}⚠️  Note: installer 'jq' pour plus de détails (brew install jq)${COLORS_RESET}"
fi
