#!/bin/bash

# ==============================================
# Quelyos ERP - Sauvegarde Base de Données
# ==============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Quelyos ERP - Sauvegarde Database${NC}"
echo -e "${GREEN}========================================${NC}\n"

# ----------------------------------------------
# Charger les variables d'environnement
# ----------------------------------------------
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Fichier .env.production introuvable${NC}"
    exit 1
fi

export $(cat .env.production | grep -v '^#' | xargs)

# Variables
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/quelyos_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

# ----------------------------------------------
# Créer le dossier de backup
# ----------------------------------------------
mkdir -p $BACKUP_DIR

# ----------------------------------------------
# Sauvegarde de la base de données
# ----------------------------------------------
echo -e "${YELLOW}Sauvegarde de la base de données...${NC}"
echo -e "Base de données: ${DB_NAME}"
echo -e "Fichier: ${BACKUP_FILE}\n"

# Exécuter pg_dump dans le conteneur PostgreSQL
docker exec quelyos-db-prod pg_dump -U ${DB_USER} ${DB_NAME} | gzip > ${BACKUP_FILE}

# Vérifier que le backup a été créé
if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓ Sauvegarde créée: ${BACKUP_FILE} (${BACKUP_SIZE})${NC}\n"
else
    echo -e "${RED}❌ Échec de la sauvegarde${NC}"
    exit 1
fi

# ----------------------------------------------
# Sauvegarde des fichiers Odoo (filestore)
# ----------------------------------------------
echo -e "${YELLOW}Sauvegarde du filestore Odoo...${NC}"
FILESTORE_BACKUP="${BACKUP_DIR}/quelyos_filestore_${TIMESTAMP}.tar.gz"

docker exec quelyos-odoo-prod tar czf - /var/lib/odoo/filestore > ${FILESTORE_BACKUP}

if [ -f "$FILESTORE_BACKUP" ]; then
    FILESTORE_SIZE=$(du -h "$FILESTORE_BACKUP" | cut -f1)
    echo -e "${GREEN}✓ Filestore sauvegardé: ${FILESTORE_BACKUP} (${FILESTORE_SIZE})${NC}\n"
else
    echo -e "${YELLOW}⚠ Échec de la sauvegarde du filestore${NC}\n"
fi

# ----------------------------------------------
# Nettoyage des anciens backups
# ----------------------------------------------
echo -e "${YELLOW}Nettoyage des backups de plus de ${RETENTION_DAYS} jours...${NC}"

# Compter les fichiers avant nettoyage
BEFORE_COUNT=$(find $BACKUP_DIR -name "*.sql.gz" -o -name "*.tar.gz" | wc -l)

# Supprimer les fichiers plus anciens que RETENTION_DAYS
find $BACKUP_DIR -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete

# Compter les fichiers après nettoyage
AFTER_COUNT=$(find $BACKUP_DIR -name "*.sql.gz" -o -name "*.tar.gz" | wc -l)
DELETED_COUNT=$((BEFORE_COUNT - AFTER_COUNT))

if [ $DELETED_COUNT -gt 0 ]; then
    echo -e "${GREEN}✓ ${DELETED_COUNT} ancien(s) backup(s) supprimé(s)${NC}\n"
else
    echo -e "${GREEN}✓ Aucun ancien backup à supprimer${NC}\n"
fi

# ----------------------------------------------
# Upload vers S3 (optionnel)
# ----------------------------------------------
if [ ! -z "$S3_BUCKET" ] && [ ! -z "$S3_ACCESS_KEY" ] && [ ! -z "$S3_SECRET_KEY" ]; then
    echo -e "${YELLOW}Upload vers S3...${NC}"

    # Installer aws-cli si nécessaire
    if ! command -v aws &> /dev/null; then
        echo -e "${YELLOW}aws-cli non installé, skip upload S3${NC}\n"
    else
        # Configurer AWS
        export AWS_ACCESS_KEY_ID=$S3_ACCESS_KEY
        export AWS_SECRET_ACCESS_KEY=$S3_SECRET_KEY
        export AWS_DEFAULT_REGION=$S3_REGION

        # Upload database backup
        aws s3 cp ${BACKUP_FILE} s3://${S3_BUCKET}/database/

        # Upload filestore backup
        if [ -f "$FILESTORE_BACKUP" ]; then
            aws s3 cp ${FILESTORE_BACKUP} s3://${S3_BUCKET}/filestore/
        fi

        echo -e "${GREEN}✓ Backups uploadés vers S3${NC}\n"
    fi
fi

# ----------------------------------------------
# Résumé
# ----------------------------------------------
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Sauvegarde terminée !${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${YELLOW}Résumé:${NC}"
echo -e "  • Database: ${BACKUP_FILE}"
if [ -f "$FILESTORE_BACKUP" ]; then
    echo -e "  • Filestore: ${FILESTORE_BACKUP}"
fi
echo -e "  • Rétention: ${RETENTION_DAYS} jours"
echo -e "  • Backups actuels: ${AFTER_COUNT}"

echo -e "\n${YELLOW}Restaurer un backup:${NC}"
echo -e "  gunzip < ${BACKUP_FILE} | docker exec -i quelyos-db-prod psql -U ${DB_USER} ${DB_NAME}"

echo -e "\n${YELLOW}Automatiser les backups (cron):${NC}"
echo -e "  0 2 * * * cd /path/to/quelyos && ./backup.sh >> /var/log/quelyos-backup.log 2>&1"

echo ""
