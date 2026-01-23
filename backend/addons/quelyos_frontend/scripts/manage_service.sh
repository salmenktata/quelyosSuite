#!/bin/bash
# Gère le service systemd du frontend

SERVICE_NAME="quelyos-frontend"

case "$1" in
    start)
        sudo systemctl start "$SERVICE_NAME"
        echo "Frontend démarré"
        ;;
    stop)
        sudo systemctl stop "$SERVICE_NAME"
        echo "Frontend arrêté"
        ;;
    restart)
        sudo systemctl restart "$SERVICE_NAME"
        echo "Frontend redémarré"
        ;;
    status)
        systemctl status "$SERVICE_NAME"
        ;;
    logs)
        journalctl -u "$SERVICE_NAME" -f
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        exit 1
        ;;
esac
