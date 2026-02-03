# 📊 Monitoring Quelyos Suite

Scripts et configurations pour monitorer la santé de Quelyos Suite en production.

## 🛠️ Scripts Disponibles

### 1. Health Check HTTP (`health-check.sh`)

Vérifie la disponibilité de tous les services via HTTP.

```bash
# Check basique
./health-check.sh

# Avec détails verbeux
./health-check.sh --verbose

# Avec notifications Slack/Discord
./health-check.sh --notify --webhook=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Services monitorés** :
- ✅ Vitrine (quelyos.com)
- ✅ E-commerce (shop.quelyos.com)
- ✅ Dashboard (backoffice.quelyos.com)
- ✅ Super Admin (admin.quelyos.com)
- ✅ API Backend (api.quelyos.com)
- ✅ Health endpoints

### 2. Docker Monitor (`docker-monitor.sh`)

Surveille l'état des conteneurs Docker sur le VPS.

```bash
# Check basique
./docker-monitor.sh

# Redémarrer automatiquement les conteneurs unhealthy
./docker-monitor.sh --restart-unhealthy

# Avec notifications
./docker-monitor.sh --notify --webhook=YOUR_WEBHOOK_URL
```

**Informations fournies** :
- État de chaque conteneur (running/unhealthy/stopped)
- Utilisation disque VPS
- Utilisation mémoire
- Load average

## 🔄 Automatisation avec Cron

### Sur votre machine locale

```bash
# Éditer crontab
crontab -e

# Ajouter ces lignes :

# Health check toutes les 5 minutes
*/5 * * * * /chemin/vers/scripts/monitoring/health-check.sh >> /var/log/quelyos-health.log 2>&1

# Docker monitor toutes les 10 minutes avec restart auto
*/10 * * * * /chemin/vers/scripts/monitoring/docker-monitor.sh --restart-unhealthy >> /var/log/quelyos-docker.log 2>&1

# Health check avec notification chaque heure
0 * * * * /chemin/vers/scripts/monitoring/health-check.sh --notify --webhook=YOUR_WEBHOOK >> /var/log/quelyos-notify.log 2>&1
```

### Sur le VPS (monitoring local)

```bash
# Se connecter au VPS
ssh quelyos-vps

# Éditer crontab
crontab -e

# Ajouter monitoring local
*/5 * * * * /home/deploy/quelyos-suite/scripts/monitoring/docker-monitor.sh >> /var/log/quelyos-docker.log 2>&1
```

## 📈 UptimeRobot Configuration

### Configuration Automatique

Utilisez le fichier `uptimerobot-config.json` pour configurer UptimeRobot via leur API.

### Configuration Manuelle

1. Créer un compte sur [uptimerobot.com](https://uptimerobot.com)
2. Ajouter ces monitors :

| Nom | URL | Type | Intervalle |
|-----|-----|------|------------|
| Quelyos Vitrine | https://quelyos.com/ | HTTP(s) | 5 min |
| Quelyos E-commerce | https://shop.quelyos.com/ | HTTP(s) | 5 min |
| Quelyos Dashboard | https://backoffice.quelyos.com/ | HTTP(s) | 5 min |
| Quelyos Super Admin | https://admin.quelyos.com/ | HTTP(s) | 5 min |
| API Health | https://api.quelyos.com/api/health | HTTP(s) | 5 min |

3. Configurer alertes :
   - Email
   - Slack/Discord webhook
   - SMS (optionnel)

## 🔔 Notifications

### Slack

1. Créer un webhook Slack : https://api.slack.com/messaging/webhooks
2. Utiliser avec `--webhook=YOUR_SLACK_WEBHOOK`

Format du message :
```
✅ Quelyos Health Check: 7/7 services OK (100%)
```

### Discord

1. Créer un webhook Discord dans paramètres du serveur
2. Utiliser avec `--webhook=YOUR_DISCORD_WEBHOOK`

### Email (via UptimeRobot)

Configuré automatiquement dans `uptimerobot-config.json`

## 📊 Métriques Surveillées

### HTTP Health Checks
- ✅ Code HTTP 200
- ⏱️ Temps de réponse
- 🔍 Présence de mots-clés (pour API health)

### Docker Containers
- 🐳 État (running/stopped)
- 💚 Santé (healthy/unhealthy/starting)
- 💾 Utilisation ressources VPS

## 🚨 Alertes et Seuils

### Niveaux d'alerte

- **🟢 OK** : Tous services opérationnels (100%)
- **🟡 Warning** : 80-99% services OK
- **🔴 Critical** : < 80% services OK

### Actions automatiques

- Conteneurs unhealthy → Redémarrage auto avec `--restart-unhealthy`
- Services down → Notification immédiate
- Ressources faibles → Alerte monitoring

## 📝 Logs

Les logs sont stockés dans :

- **Local** : `/var/log/quelyos-*.log`
- **VPS** : `/var/log/quelyos-*.log`
- **Docker** : `docker logs <container>`

### Consulter les logs

```bash
# Logs health check
tail -f /var/log/quelyos-health.log

# Logs Docker monitor
tail -f /var/log/quelyos-docker.log

# Logs d'un conteneur spécifique
ssh quelyos-vps "docker logs quelyos-ecommerce --tail 100 -f"
```

## 🔧 Configuration Avancée

### Variables d'environnement

```bash
# VPS Host
export VPS_HOST=quelyos-vps

# Webhook pour notifications
export WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Personnalisation des seuils

Modifier dans `health-check.sh` :

```bash
# Timeout HTTP (défaut: 10s)
--max-time 10

# Intervalle cron (défaut: */5 * * * *)
# Ajuster selon besoins
```

## 📚 Ressources

- [UptimeRobot Documentation](https://uptimerobot.com/api/)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [Discord Webhooks](https://support.discord.com/hc/en-us/articles/228383668)
- [Cron Syntax](https://crontab.guru/)

## 🆘 Support

En cas de problème :

1. Vérifier les logs : `/var/log/quelyos-*.log`
2. Tester manuellement : `./health-check.sh --verbose`
3. Vérifier connectivité VPS : `ssh quelyos-vps "docker ps"`
