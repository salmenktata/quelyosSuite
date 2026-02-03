#!/bin/bash
# Installation automatique du système de monitoring
# Configure les cron jobs et crée les fichiers de log

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="${LOG_DIR:-/var/log}"

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "╔════════════════════════════════════════════════════════╗"
echo "║     INSTALLATION MONITORING QUELYOS SUITE             ║"
echo "╚════════════════════════════════════════════════════════╝"
echo
echo "Project Root: $PROJECT_ROOT"
echo "Log Directory: $LOG_DIR"
echo

# Vérifier que les scripts existent
if [ ! -f "$SCRIPT_DIR/health-check.sh" ]; then
  echo "❌ Erreur: health-check.sh non trouvé"
  exit 1
fi

if [ ! -f "$SCRIPT_DIR/docker-monitor.sh" ]; then
  echo "❌ Erreur: docker-monitor.sh non trouvé"
  exit 1
fi

# Créer répertoire de logs si nécessaire
echo -e "${BLUE}[1/5]${NC} Création répertoire logs..."
if [ ! -d "$LOG_DIR" ]; then
  sudo mkdir -p "$LOG_DIR"
  echo "  ✓ Répertoire créé: $LOG_DIR"
else
  echo "  ✓ Répertoire existe: $LOG_DIR"
fi

# Créer fichiers de log
echo -e "${BLUE}[2/5]${NC} Initialisation fichiers logs..."
sudo touch "$LOG_DIR/quelyos-health.log"
sudo touch "$LOG_DIR/quelyos-docker.log"
sudo touch "$LOG_DIR/quelyos-notify.log"
sudo chmod 666 "$LOG_DIR/quelyos-*.log"
echo "  ✓ Fichiers logs créés"

# Préparer les lignes crontab
echo -e "${BLUE}[3/5]${NC} Préparation configuration cron..."
CRON_HEALTH="*/5 * * * * $SCRIPT_DIR/health-check.sh >> $LOG_DIR/quelyos-health.log 2>&1"
CRON_DOCKER="*/10 * * * * $SCRIPT_DIR/docker-monitor.sh --restart-unhealthy >> $LOG_DIR/quelyos-docker.log 2>&1"
CRON_NOTIFY="0 * * * * $SCRIPT_DIR/health-check.sh --notify --webhook=\$WEBHOOK_URL >> $LOG_DIR/quelyos-notify.log 2>&1"

echo "  Configuration cron préparée"
echo

# Afficher les tâches cron proposées
echo "╔════════════════════════════════════════════════════════╗"
echo "║                TÂCHES CRON PROPOSÉES                   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo
echo "# Health check toutes les 5 minutes"
echo "$CRON_HEALTH"
echo
echo "# Docker monitor toutes les 10 minutes avec restart auto"
echo "$CRON_DOCKER"
echo
echo "# Notification chaque heure (optionnel - nécessite WEBHOOK_URL)"
echo "$CRON_NOTIFY"
echo

# Demander confirmation pour ajouter au crontab
echo -e "${YELLOW}[4/5]${NC} Installation des tâches cron..."
read -p "Voulez-vous ajouter ces tâches au crontab ? (o/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
  # Sauvegarder crontab actuel
  crontab -l > /tmp/crontab.bak 2>/dev/null || true

  # Ajouter les nouvelles tâches
  (crontab -l 2>/dev/null || true; echo ""; echo "# Quelyos Suite Monitoring"; echo "$CRON_HEALTH"; echo "$CRON_DOCKER") | crontab -

  echo -e "  ${GREEN}✓${NC} Tâches cron ajoutées"
  echo "  ℹ️  Pour activer les notifications, définissez WEBHOOK_URL et ajoutez:"
  echo "     $CRON_NOTIFY"
else
  echo "  ⏭️  Installation cron ignorée"
  echo
  echo "Pour installer manuellement :"
  echo "  crontab -e"
  echo
  echo "Et ajoutez les lignes ci-dessus"
fi

# Test des scripts
echo
echo -e "${BLUE}[5/5]${NC} Test des scripts..."
echo
echo "Test health-check.sh..."
$SCRIPT_DIR/health-check.sh > /tmp/health-test.log 2>&1 || true
if [ $? -eq 0 ]; then
  echo -e "  ${GREEN}✓${NC} Health check fonctionnel"
else
  echo -e "  ${YELLOW}⚠${NC} Health check a rencontré une erreur (voir /tmp/health-test.log)"
fi

echo
echo "Test docker-monitor.sh..."
$SCRIPT_DIR/docker-monitor.sh > /tmp/docker-test.log 2>&1 || true
if [ $? -eq 0 ]; then
  echo -e "  ${GREEN}✓${NC} Docker monitor fonctionnel"
else
  echo -e "  ${YELLOW}⚠${NC} Docker monitor a rencontré une erreur (voir /tmp/docker-test.log)"
fi

# Résumé
echo
echo "╔════════════════════════════════════════════════════════╗"
echo "║              INSTALLATION TERMINÉE                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo
echo -e "${GREEN}✅ Monitoring Quelyos Suite installé${NC}"
echo
echo "Logs disponibles dans:"
echo "  - $LOG_DIR/quelyos-health.log"
echo "  - $LOG_DIR/quelyos-docker.log"
echo
echo "Commandes utiles:"
echo "  # Voir logs health check"
echo "  tail -f $LOG_DIR/quelyos-health.log"
echo
echo "  # Voir logs Docker monitor"
echo "  tail -f $LOG_DIR/quelyos-docker.log"
echo
echo "  # Lister tâches cron"
echo "  crontab -l | grep quelyos"
echo
echo "  # Test manuel"
echo "  $SCRIPT_DIR/health-check.sh --verbose"
echo

# Configuration UptimeRobot
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 PROCHAINE ÉTAPE: Configuration UptimeRobot"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "1. Créer compte sur: https://uptimerobot.com (gratuit)"
echo "2. Ajouter 6 monitors avec la configuration dans:"
echo "   $SCRIPT_DIR/uptimerobot-config.json"
echo
echo "URLs à monitorer:"
echo "  - https://quelyos.com/"
echo "  - https://shop.quelyos.com/"
echo "  - https://backoffice.quelyos.com/"
echo "  - https://admin.quelyos.com/"
echo "  - https://api.quelyos.com/api/health"
echo "  - https://shop.quelyos.com/api/health"
echo
