#!/bin/bash
# ============================================================================
# Quelyos ERP - Wait for PostgreSQL Script
# ============================================================================
# Script d'attente de la disponibilité de PostgreSQL
# ============================================================================

set -e

MAX_TRIES=30
TRIES=0

echo "[WAIT] Attente de PostgreSQL..."

while [ $TRIES -lt $MAX_TRIES ]; do
    if su - postgres -c "psql -c 'SELECT 1' > /dev/null 2>&1"; then
        echo "[WAIT] ✓ PostgreSQL est prêt"
        exit 0
    fi

    TRIES=$((TRIES + 1))
    echo "[WAIT] Tentative ${TRIES}/${MAX_TRIES}..."
    sleep 2
done

echo "[ERROR] PostgreSQL n'est pas disponible après ${MAX_TRIES} tentatives"
exit 1
