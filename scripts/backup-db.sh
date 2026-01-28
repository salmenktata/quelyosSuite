#!/bin/bash
# =============================================================================
# Script de backup PostgreSQL pour Quelyos ERP
# =============================================================================
#
# Usage:
#   ./scripts/backup-db.sh              # Backup standard
#   ./scripts/backup-db.sh --full       # Backup complet avec blobs
#   ./scripts/backup-db.sh --restore    # Restaurer le dernier backup
#   ./scripts/backup-db.sh --list       # Lister les backups disponibles
#   ./scripts/backup-db.sh --cleanup    # Nettoyer les vieux backups
#
# Configuration via variables d'environnement :
#   POSTGRES_HOST     (défaut: localhost)
#   POSTGRES_PORT     (défaut: 5432)
#   POSTGRES_USER     (défaut: odoo)
#   POSTGRES_PASSWORD (défaut: odoo)
#   POSTGRES_DB       (défaut: quelyos)
#   BACKUP_DIR        (défaut: ./backups)
#   BACKUP_RETENTION  (défaut: 30 jours)
#
# =============================================================================

set -e

# Configuration
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-odoo}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-odoo}"
POSTGRES_DB="${POSTGRES_DB:-quelyos}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION:-30}"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Créer le répertoire de backup s'il n'existe pas
mkdir -p "$BACKUP_DIR"

# Export password pour pg_dump
export PGPASSWORD="$POSTGRES_PASSWORD"

# Timestamp pour le nom de fichier
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_ONLY=$(date +%Y%m%d)

# =============================================================================
# FONCTIONS
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_postgres() {
    log_info "Vérification connexion PostgreSQL..."
    if ! pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" > /dev/null 2>&1; then
        log_error "PostgreSQL n'est pas accessible sur $POSTGRES_HOST:$POSTGRES_PORT"
        exit 1
    fi
    log_success "PostgreSQL accessible"
}

backup_standard() {
    local BACKUP_FILE="$BACKUP_DIR/quelyos_${TIMESTAMP}.sql.gz"

    log_info "Démarrage backup standard de '$POSTGRES_DB'..."
    log_info "Destination: $BACKUP_FILE"

    pg_dump \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        | gzip > "$BACKUP_FILE"

    local SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_success "Backup créé: $BACKUP_FILE ($SIZE)"

    # Créer un lien symbolique vers le dernier backup
    ln -sf "$BACKUP_FILE" "$BACKUP_DIR/quelyos_latest.sql.gz"

    echo "$BACKUP_FILE"
}

backup_full() {
    local BACKUP_FILE="$BACKUP_DIR/quelyos_full_${TIMESTAMP}.dump"

    log_info "Démarrage backup complet (format custom) de '$POSTGRES_DB'..."
    log_info "Destination: $BACKUP_FILE"

    pg_dump \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        -Fc \
        --no-owner \
        --no-privileges \
        --blobs \
        > "$BACKUP_FILE"

    local SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_success "Backup complet créé: $BACKUP_FILE ($SIZE)"

    # Créer un lien symbolique
    ln -sf "$BACKUP_FILE" "$BACKUP_DIR/quelyos_latest.dump"

    echo "$BACKUP_FILE"
}

restore_backup() {
    local BACKUP_FILE="$1"

    if [ -z "$BACKUP_FILE" ]; then
        # Utiliser le dernier backup
        if [ -f "$BACKUP_DIR/quelyos_latest.dump" ]; then
            BACKUP_FILE="$BACKUP_DIR/quelyos_latest.dump"
        elif [ -f "$BACKUP_DIR/quelyos_latest.sql.gz" ]; then
            BACKUP_FILE="$BACKUP_DIR/quelyos_latest.sql.gz"
        else
            log_error "Aucun backup trouvé. Spécifiez un fichier."
            exit 1
        fi
    fi

    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Fichier non trouvé: $BACKUP_FILE"
        exit 1
    fi

    log_warning "ATTENTION: Cette opération va REMPLACER la base '$POSTGRES_DB'"
    read -p "Continuer? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        log_info "Restauration annulée"
        exit 0
    fi

    log_info "Restauration depuis: $BACKUP_FILE"

    # Déterminer le type de backup
    if [[ "$BACKUP_FILE" == *.dump ]]; then
        # Format custom
        pg_restore \
            -h "$POSTGRES_HOST" \
            -p "$POSTGRES_PORT" \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB" \
            --clean \
            --if-exists \
            --no-owner \
            --no-privileges \
            "$BACKUP_FILE"
    elif [[ "$BACKUP_FILE" == *.sql.gz ]]; then
        # Format SQL compressé
        gunzip -c "$BACKUP_FILE" | psql \
            -h "$POSTGRES_HOST" \
            -p "$POSTGRES_PORT" \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB" \
            -q
    elif [[ "$BACKUP_FILE" == *.sql ]]; then
        # Format SQL
        psql \
            -h "$POSTGRES_HOST" \
            -p "$POSTGRES_PORT" \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB" \
            -f "$BACKUP_FILE" \
            -q
    else
        log_error "Format de backup non reconnu: $BACKUP_FILE"
        exit 1
    fi

    log_success "Restauration terminée"
}

list_backups() {
    log_info "Backups disponibles dans $BACKUP_DIR:"
    echo ""

    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
        log_warning "Aucun backup trouvé"
        return
    fi

    ls -lh "$BACKUP_DIR"/quelyos_*.{sql.gz,dump} 2>/dev/null | while read line; do
        echo "  $line"
    done

    echo ""
    log_info "Dernier backup:"
    if [ -L "$BACKUP_DIR/quelyos_latest.sql.gz" ]; then
        echo "  SQL: $(readlink -f "$BACKUP_DIR/quelyos_latest.sql.gz")"
    fi
    if [ -L "$BACKUP_DIR/quelyos_latest.dump" ]; then
        echo "  DUMP: $(readlink -f "$BACKUP_DIR/quelyos_latest.dump")"
    fi
}

cleanup_old_backups() {
    log_info "Nettoyage des backups > $BACKUP_RETENTION_DAYS jours..."

    local COUNT=$(find "$BACKUP_DIR" -name "quelyos_*.sql.gz" -o -name "quelyos_*.dump" -mtime +$BACKUP_RETENTION_DAYS 2>/dev/null | wc -l)

    if [ "$COUNT" -gt 0 ]; then
        find "$BACKUP_DIR" -name "quelyos_*.sql.gz" -mtime +$BACKUP_RETENTION_DAYS -delete
        find "$BACKUP_DIR" -name "quelyos_*.dump" -mtime +$BACKUP_RETENTION_DAYS -delete
        log_success "$COUNT ancien(s) backup(s) supprimé(s)"
    else
        log_info "Aucun backup à nettoyer"
    fi
}

show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  (sans option)  Backup standard (SQL compressé)"
    echo "  --full         Backup complet avec blobs (format pg_dump custom)"
    echo "  --restore      Restaurer depuis le dernier backup"
    echo "  --restore FILE Restaurer depuis un fichier spécifique"
    echo "  --list         Lister les backups disponibles"
    echo "  --cleanup      Supprimer les backups > $BACKUP_RETENTION_DAYS jours"
    echo "  --help         Afficher cette aide"
    echo ""
    echo "Variables d'environnement:"
    echo "  POSTGRES_HOST     Hôte PostgreSQL (défaut: localhost)"
    echo "  POSTGRES_PORT     Port PostgreSQL (défaut: 5432)"
    echo "  POSTGRES_USER     Utilisateur (défaut: odoo)"
    echo "  POSTGRES_PASSWORD Mot de passe (défaut: odoo)"
    echo "  POSTGRES_DB       Base de données (défaut: quelyos)"
    echo "  BACKUP_DIR        Répertoire des backups (défaut: ./backups)"
    echo "  BACKUP_RETENTION  Rétention en jours (défaut: 30)"
}

# =============================================================================
# MAIN
# =============================================================================

echo -e "${GREEN}=== Quelyos Database Backup ===${NC}"
echo ""

case "${1:-}" in
    --full)
        check_postgres
        backup_full
        ;;
    --restore)
        check_postgres
        restore_backup "${2:-}"
        ;;
    --list)
        list_backups
        ;;
    --cleanup)
        cleanup_old_backups
        ;;
    --help|-h)
        show_help
        ;;
    "")
        check_postgres
        backup_standard
        cleanup_old_backups
        ;;
    *)
        log_error "Option inconnue: $1"
        show_help
        exit 1
        ;;
esac

echo ""
log_success "Terminé"
