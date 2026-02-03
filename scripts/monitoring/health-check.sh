#!/bin/bash
# Script de monitoring santé des services Quelyos Suite
# Usage: ./health-check.sh [--notify] [--verbose]

set -e

# Configuration
SERVICES=(
    "vitrine|https://quelyos.com/|Page d'accueil"
    "vitrine-health|https://quelyos.com/api/health|Health Check API"
    "ecommerce|https://shop.quelyos.com/|Page d'accueil"
    "ecommerce-health|https://shop.quelyos.com/api/health|Health Check API"
    "dashboard|https://backoffice.quelyos.com/|Page d'accueil"
    "superadmin|https://admin.quelyos.com/|Page d'accueil"
    "api-health|https://api.quelyos.com/api/health|Backend Health"
)

# Options
NOTIFY=false
VERBOSE=false
WEBHOOK_URL=""  # Slack/Discord webhook pour notifications

for arg in "$@"; do
    case $arg in
        --notify) NOTIFY=true ;;
        --verbose) VERBOSE=true ;;
        --webhook=*) WEBHOOK_URL="${arg#*=}" ;;
    esac
done

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Compteurs
TOTAL=0
SUCCESS=0
FAILED=0
WARNINGS=0

echo "╔════════════════════════════════════════════════════════╗"
echo "║     QUELYOS SUITE - HEALTH CHECK MONITORING          ║"
echo "║     $(date '+%Y-%m-%d %H:%M:%S')                            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo

# Fonction de test
check_service() {
    local name=$1
    local url=$2
    local description=$3

    TOTAL=$((TOTAL + 1))

    # Test avec timeout de 10s
    response=$(curl -s -o /dev/null -w "%{http_code}|%{time_total}" --max-time 10 "$url" 2>/dev/null || echo "000|0")
    http_code=$(echo "$response" | cut -d'|' -f1)
    time_total=$(echo "$response" | cut -d'|' -f2)

    if [ "$http_code" = "200" ]; then
        SUCCESS=$((SUCCESS + 1))
        printf "${GREEN}✓${NC} %-20s %s (${http_code}) - ${time_total}s\n" "$name" "$description"
        [ "$VERBOSE" = true ] && echo "  URL: $url"
    elif [ "$http_code" = "000" ]; then
        FAILED=$((FAILED + 1))
        printf "${RED}✗${NC} %-20s %s - ${RED}TIMEOUT/ERROR${NC}\n" "$name" "$description"
        [ "$VERBOSE" = true ] && echo "  URL: $url"
    else
        WARNINGS=$((WARNINGS + 1))
        printf "${YELLOW}⚠${NC} %-20s %s (${http_code})\n" "$name" "$description"
        [ "$VERBOSE" = true ] && echo "  URL: $url"
    fi
}

# Tests des services
for service in "${SERVICES[@]}"; do
    IFS='|' read -r name url description <<< "$service"
    check_service "$name" "$url" "$description"
done

# Résumé
echo
echo "╔════════════════════════════════════════════════════════╗"
echo "║                      RÉSUMÉ                            ║"
echo "╠════════════════════════════════════════════════════════╣"
printf "║  Total tests    : %-36s║\n" "$TOTAL"
printf "║  ${GREEN}Succès${NC}       : %-36s║\n" "$SUCCESS"
printf "║  ${YELLOW}Avertissements${NC}: %-36s║\n" "$WARNINGS"
printf "║  ${RED}Échecs${NC}       : %-36s║\n" "$FAILED"
echo "╚════════════════════════════════════════════════════════╝"

# Calcul du taux de réussite
success_rate=$((SUCCESS * 100 / TOTAL))
echo
if [ $success_rate -eq 100 ]; then
    echo -e "${GREEN}✓ Tous les services sont opérationnels (${success_rate}%)${NC}"
    exit_code=0
elif [ $success_rate -ge 80 ]; then
    echo -e "${YELLOW}⚠ Certains services rencontrent des problèmes (${success_rate}%)${NC}"
    exit_code=1
else
    echo -e "${RED}✗ Problèmes critiques détectés (${success_rate}%)${NC}"
    exit_code=2
fi

# Notification webhook (Slack/Discord)
if [ "$NOTIFY" = true ] && [ -n "$WEBHOOK_URL" ]; then
    status_emoji="✅"
    [ $exit_code -eq 1 ] && status_emoji="⚠️"
    [ $exit_code -eq 2 ] && status_emoji="❌"

    message="{\"text\":\"$status_emoji Quelyos Health Check: $SUCCESS/$TOTAL services OK ($success_rate%)\"}"
    curl -s -X POST -H 'Content-type: application/json' --data "$message" "$WEBHOOK_URL" > /dev/null
fi

exit $exit_code
