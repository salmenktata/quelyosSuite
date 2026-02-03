#!/bin/bash
# Script de monitoring des conteneurs Docker sur le VPS
# Usage: ./docker-monitor.sh [--restart-unhealthy] [--notify]

set -e

VPS_HOST="${VPS_HOST:-quelyos-vps}"
RESTART_UNHEALTHY=false
NOTIFY=false
WEBHOOK_URL=""

for arg in "$@"; do
    case $arg in
        --restart-unhealthy) RESTART_UNHEALTHY=true ;;
        --notify) NOTIFY=true ;;
        --webhook=*) WEBHOOK_URL="${arg#*=}" ;;
    esac
done

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "╔════════════════════════════════════════════════════════╗"
echo "║     QUELYOS DOCKER CONTAINERS MONITORING              ║"
echo "║     VPS: $VPS_HOST"
echo "║     $(date '+%Y-%m-%d %H:%M:%S')                            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo

# Récupérer l'état des conteneurs
container_status=$(ssh "$VPS_HOST" "docker ps -a --format '{{.Names}}|{{.Status}}|{{.State}}' --filter 'name=quelyos'")

TOTAL=0
RUNNING=0
UNHEALTHY=0
STOPPED=0

declare -a unhealthy_containers

echo "État des conteneurs:"
echo "─────────────────────────────────────────────────────────"

while IFS='|' read -r name status state; do
    TOTAL=$((TOTAL + 1))

    if [[ "$state" == "running" ]]; then
        if [[ "$status" == *"unhealthy"* ]]; then
            UNHEALTHY=$((UNHEALTHY + 1))
            printf "${YELLOW}⚠${NC} %-25s %s\n" "$name" "$status"
            unhealthy_containers+=("$name")
        elif [[ "$status" == *"healthy"* ]] || [[ "$status" == *"starting"* ]]; then
            RUNNING=$((RUNNING + 1))
            printf "${GREEN}✓${NC} %-25s %s\n" "$name" "$status"
        else
            RUNNING=$((RUNNING + 1))
            printf "${BLUE}●${NC} %-25s %s\n" "$name" "$status"
        fi
    else
        STOPPED=$((STOPPED + 1))
        printf "${RED}✗${NC} %-25s %s\n" "$name" "$status"
    fi
done <<< "$container_status"

echo "─────────────────────────────────────────────────────────"
echo

# Résumé
echo "╔════════════════════════════════════════════════════════╗"
echo "║                      RÉSUMÉ                            ║"
echo "╠════════════════════════════════════════════════════════╣"
printf "║  Total conteneurs : %-35s║\n" "$TOTAL"
printf "║  ${GREEN}Running/Healthy${NC} : %-35s║\n" "$RUNNING"
printf "║  ${YELLOW}Unhealthy${NC}       : %-35s║\n" "$UNHEALTHY"
printf "║  ${RED}Stopped${NC}         : %-35s║\n" "$STOPPED"
echo "╚════════════════════════════════════════════════════════╝"
echo

# Vérification ressources
echo "Utilisation des ressources VPS:"
echo "─────────────────────────────────────────────────────────"
ssh "$VPS_HOST" "df -h / | tail -1 | awk '{print \"Disque:  \" \$3 \" / \" \$2 \" (\" \$5 \" utilisé)\"}'"
ssh "$VPS_HOST" "free -h | grep Mem | awk '{print \"Mémoire: \" \$3 \" / \" \$2 \" (\" int(\$3/\$2*100) \"% utilisé)\"}'"
ssh "$VPS_HOST" "uptime | awk -F'load average:' '{print \"Load:    \" \$2}'"
echo

# Restart des conteneurs unhealthy si demandé
if [ "$RESTART_UNHEALTHY" = true ] && [ ${#unhealthy_containers[@]} -gt 0 ]; then
    echo "Redémarrage des conteneurs unhealthy..."
    for container in "${unhealthy_containers[@]}"; do
        echo -n "  Redémarrage $container... "
        ssh "$VPS_HOST" "docker restart $container" > /dev/null 2>&1
        echo -e "${GREEN}OK${NC}"
    done
    echo
fi

# Notification
if [ "$NOTIFY" = true ] && [ -n "$WEBHOOK_URL" ]; then
    status_emoji="✅"
    [ $UNHEALTHY -gt 0 ] && status_emoji="⚠️"
    [ $STOPPED -gt 0 ] && status_emoji="❌"

    message="{\"text\":\"$status_emoji Quelyos Docker: $RUNNING running, $UNHEALTHY unhealthy, $STOPPED stopped\"}"
    curl -s -X POST -H 'Content-type: application/json' --data "$message" "$WEBHOOK_URL" > /dev/null
fi

# Code de sortie
exit_code=0
[ $UNHEALTHY -gt 0 ] && exit_code=1
[ $STOPPED -gt 0 ] && exit_code=2

exit $exit_code
