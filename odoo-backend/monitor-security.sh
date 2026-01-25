#!/bin/bash
# Script de monitoring de sécurité en temps réel
# Surveille les tentatives d'accès non autorisées

echo "==================================================================="
echo "🔒 Monitoring de Sécurité - Quelyos API"
echo "==================================================================="
echo "Version module: 19.0.1.0.15"
echo "Surveillance: Tentatives d'accès non autorisées"
echo "-------------------------------------------------------------------"
echo ""
echo "📊 Statistiques des dernières 24h:"
echo ""

# Compter les tentatives non autorisées
UNAUTHORIZED_COUNT=$(docker logs quelyos-odoo 2>&1 | grep -c "Unauthorized")
ADMIN_REQUIRED=$(docker logs quelyos-odoo 2>&1 | grep -c "ADMIN_REQUIRED")
OWNERSHIP_VIOLATION=$(docker logs quelyos-odoo 2>&1 | grep -c "OWNERSHIP_VIOLATION")
GUEST_EMAIL_MISMATCH=$(docker logs quelyos-odoo 2>&1 | grep -c "GUEST_EMAIL_MISMATCH")

echo "  ⚠️  Total tentatives non autorisées: $UNAUTHORIZED_COUNT"
echo "  🔐 Accès admin refusés: $ADMIN_REQUIRED"
echo "  👤 Violations ownership: $OWNERSHIP_VIOLATION"
echo "  📧 Guest email invalides: $GUEST_EMAIL_MISMATCH"
echo ""
echo "-------------------------------------------------------------------"
echo "📋 Derniers événements de sécurité (10 plus récents):"
echo "-------------------------------------------------------------------"
echo ""

docker logs quelyos-odoo 2>&1 | grep "Unauthorized" | tail -10

echo ""
echo "-------------------------------------------------------------------"
echo "💡 Utilisation:"
echo "   ./monitor-security.sh              # Afficher statistiques"
echo "   ./monitor-security.sh --live       # Mode temps réel"
echo "   ./monitor-security.sh --today      # Filtrer aujourd'hui"
echo "==================================================================="

# Mode live si demandé
if [ "$1" = "--live" ]; then
    echo ""
    echo "🔴 Mode LIVE activé - Appuyez sur Ctrl+C pour arrêter"
    echo ""
    docker logs -f quelyos-odoo 2>&1 | grep --line-buffered "Unauthorized\|WARNING.*admin\|WARNING.*customer"
fi

# Filtrer aujourd'hui si demandé
if [ "$1" = "--today" ]; then
    TODAY=$(date +"%Y-%m-%d")
    echo ""
    echo "📅 Événements du $TODAY:"
    echo ""
    docker logs quelyos-odoo 2>&1 | grep "$TODAY" | grep "Unauthorized"
fi
