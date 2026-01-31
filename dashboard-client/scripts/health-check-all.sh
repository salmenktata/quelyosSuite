#!/bin/bash
# Health check toutes éditions
# Usage: ./scripts/health-check-all.sh [staging|production]

ENV="${1:-staging}"

if [ "$ENV" = "production" ]; then
  urls=(
    "https://finance.quelyos.com"
    "https://team.quelyos.com"
    "https://sales.quelyos.com"
    "https://store.quelyos.com"
    "https://copilote.quelyos.com"
    "https://retail.quelyos.com"
    "https://support.quelyos.com"
  )
else
  urls=(
    "http://localhost:3010"  # finance
    "http://localhost:3015"  # team
    "http://localhost:3013"  # sales
    "http://localhost:3011"  # store
    "http://localhost:3012"  # copilote
    "http://localhost:3014"  # retail
    "http://localhost:3016"  # support
  )
fi

editions=(finance team sales store copilote retail support)

echo "======================================"
echo "🏥 HEALTH CHECK - ${ENV^^}"
echo "======================================"
echo ""

all_healthy=true

for i in "${!editions[@]}"; do
  edition="${editions[$i]}"
  url="${urls[$i]}"
  
  printf "%-12s " "$edition:"
  
  if response=$(curl -sf "$url/health" 2>/dev/null); then
    status=$(echo "$response" | jq -r .status 2>/dev/null || echo "unknown")
    if [ "$status" = "ok" ]; then
      echo "✅ OK"
    else
      echo "⚠️  Status: $status"
      all_healthy=false
    fi
  else
    echo "❌ UNREACHABLE"
    all_healthy=false
  fi
done

echo ""
if [ "$all_healthy" = true ]; then
  echo "✅ Toutes éditions healthy"
  exit 0
else
  echo "❌ Certaines éditions ont des problèmes"
  exit 1
fi
