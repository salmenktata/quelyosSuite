#!/bin/bash
# ============================================================================
# Quelyos ERP - Moniteur Build Docker
# ============================================================================
# Affiche la progression du build en temps réel
# ============================================================================

LOG_FILE="/tmp/docker-build.log"

echo "📊 Monitoring du build Docker en cours..."
echo "Fichier de log: $LOG_FILE"
echo ""
echo "Press Ctrl+C pour arrêter la surveillance (le build continuera)"
echo "================================================================"
echo ""

# Afficher les dernières lignes en temps réel
tail -f "$LOG_FILE" 2>/dev/null || {
    echo "⚠️  Fichier de log non trouvé. Le build n'a peut-être pas encore démarré."
    echo "Attente..."
    sleep 2
    tail -f "$LOG_FILE"
}
