#!/bin/bash
# =============================================================================
# Configuration du cron pour backup automatique PostgreSQL
# =============================================================================
#
# Ce script configure un cron job pour:
# - Backup quotidien à 2h du matin
# - Backup hebdomadaire complet le dimanche à 3h
# - Nettoyage automatique des vieux backups
#
# Usage: ./scripts/setup-backup-cron.sh [--install|--remove|--status]
#
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-db.sh"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

CRON_MARKER="# Quelyos ERP Database Backup"

install_cron() {
    echo -e "${GREEN}Installation des cron jobs de backup...${NC}"

    # Vérifier que le script de backup existe
    if [ ! -f "$BACKUP_SCRIPT" ]; then
        echo -e "${RED}Erreur: Script de backup non trouvé: $BACKUP_SCRIPT${NC}"
        exit 1
    fi

    # Créer les entrées cron
    CRON_ENTRIES="$CRON_MARKER
# Backup quotidien à 2h00
0 2 * * * $BACKUP_SCRIPT >> $PROJECT_DIR/logs/backup.log 2>&1
# Backup complet hebdomadaire le dimanche à 3h00
0 3 * * 0 $BACKUP_SCRIPT --full >> $PROJECT_DIR/logs/backup.log 2>&1
# Nettoyage mensuel des vieux backups (1er du mois à 4h00)
0 4 1 * * $BACKUP_SCRIPT --cleanup >> $PROJECT_DIR/logs/backup.log 2>&1
$CRON_MARKER END"

    # Supprimer les anciennes entrées Quelyos
    crontab -l 2>/dev/null | grep -v "$CRON_MARKER" | grep -v "backup-db.sh" > /tmp/crontab.tmp || true

    # Ajouter les nouvelles entrées
    echo "$CRON_ENTRIES" >> /tmp/crontab.tmp

    # Installer le nouveau crontab
    crontab /tmp/crontab.tmp
    rm /tmp/crontab.tmp

    # Créer le répertoire de logs
    mkdir -p "$PROJECT_DIR/logs"

    echo -e "${GREEN}Cron jobs installés:${NC}"
    echo "  - Backup quotidien: 2h00"
    echo "  - Backup complet: dimanche 3h00"
    echo "  - Nettoyage: 1er du mois 4h00"
    echo ""
    echo "Logs: $PROJECT_DIR/logs/backup.log"
}

remove_cron() {
    echo -e "${YELLOW}Suppression des cron jobs de backup...${NC}"

    crontab -l 2>/dev/null | grep -v "$CRON_MARKER" | grep -v "backup-db.sh" > /tmp/crontab.tmp || true
    crontab /tmp/crontab.tmp
    rm /tmp/crontab.tmp

    echo -e "${GREEN}Cron jobs supprimés${NC}"
}

status_cron() {
    echo -e "${GREEN}Cron jobs Quelyos actuels:${NC}"
    echo ""
    crontab -l 2>/dev/null | grep -A5 "$CRON_MARKER" || echo "Aucun cron job Quelyos installé"
}

case "${1:-}" in
    --install|-i)
        install_cron
        ;;
    --remove|-r)
        remove_cron
        ;;
    --status|-s|"")
        status_cron
        ;;
    *)
        echo "Usage: $0 [--install|--remove|--status]"
        exit 1
        ;;
esac
