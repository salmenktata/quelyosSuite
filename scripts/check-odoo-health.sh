#!/bin/bash
# Script de vérification automatique du serveur Odoo
# Usage: Peut être ajouté à crontab pour vérification périodique

CONTAINER_NAME="quelyos-odoo"
PORT=8069

# Vérifier si le conteneur existe
if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Conteneur ${CONTAINER_NAME} introuvable"
    exit 1
fi

# Vérifier si le conteneur est en cours d'exécution
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "⚠️  Conteneur ${CONTAINER_NAME} arrêté. Redémarrage..."
    docker start ${CONTAINER_NAME}
    sleep 5
fi

# Vérifier la santé HTTP
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${PORT}/web/health 2>/dev/null)

if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ Odoo en bonne santé (HTTP ${HTTP_CODE})"
    exit 0
else
    echo "⚠️  Odoo ne répond pas correctement (HTTP ${HTTP_CODE})"
    echo "📋 Logs récents:"
    docker logs --tail 10 ${CONTAINER_NAME}
    exit 1
fi
