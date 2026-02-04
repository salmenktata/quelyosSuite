# Guide de Déploiement Production - Quelyos ERP

## Architecture Multi-Tenant

Chaque client (tenant) dispose de :
- **Frontend e-commerce** : `client.com` (Next.js)
- **Backoffice admin** : `admin.client.com` (React + Vite)
- **Backend API** : Odoo 19 (partagé)

## Configuration des Domaines Tenant

### 1. Dans Odoo

Accédez à la fiche du tenant dans Odoo et configurez :
- **Domaine principal** : `client.com` (pour le frontend)
- **Domaine backoffice** : `admin.client.com` (pour l'admin)

### 2. Génération des Configurations Nginx

Le script Python génère automatiquement les configurations Nginx pour chaque tenant actif :

```bash
# Installer les dépendances
pip install requests

# Configurer les variables d'environnement
export ODOO_URL="http://localhost:8069"
export ODOO_DB="quelyos"
export ODOO_ADMIN_USER="admin"
export ODOO_ADMIN_PASSWORD="724@Lnb.13"

# Générer les configs
python nginx/generate-tenant-configs.py
```

Le script :
1. Se connecte à Odoo
2. Récupère tous les tenants actifs
3. Génère un fichier `nginx/conf.d/tenants/{code}.conf` pour chaque tenant
4. Utilise le template `nginx/conf.d/tenant-routing.conf.template`

### 3. Recharger Nginx

```bash
# Vérifier la configuration
docker-compose exec nginx nginx -t

# Recharger sans interruption
docker-compose exec nginx nginx -s reload
```

## Déploiement avec Docker Compose

### Production

```bash
# Build et démarrage
docker-compose -f docker-compose.prod.yml up -d

# Logs
docker-compose -f docker-compose.prod.yml logs -f

# Arrêt
docker-compose -f docker-compose.prod.yml down
```

### Variables d'Environnement

Créez un fichier `.env.prod` :

```bash
# Odoo
ODOO_DB=quelyos
POSTGRES_USER=odoo
POSTGRES_PASSWORD=odoo
POSTGRES_DB=quelyos

# Site
SITE_URL=https://app.quelyos.com

# Email (optionnel)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@quelyos.com
EMAIL_PASSWORD=...
```

## SSL/HTTPS avec Let's Encrypt

Le service Certbot est configuré pour obtenir automatiquement les certificats SSL :

```bash
# Obtenir un certificat pour un nouveau domaine
docker-compose exec certbot certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d client.com \
  -d admin.client.com \
  --email admin@quelyos.com \
  --agree-tos \
  --no-eff-email

# Renouvellement automatique
# Le cron job est configuré dans docker-compose.prod.yml
```

## Ajout d'un Nouveau Tenant

1. Créer le tenant dans Odoo (module Quelyos API)
2. Configurer les domaines (principal + backoffice)
3. Exécuter le script de génération : `python nginx/generate-tenant-configs.py`
4. Obtenir les certificats SSL si nécessaire
5. Recharger Nginx : `docker-compose exec nginx nginx -s reload`

## Mise à Jour du Module Odoo

⚠️ **IMPORTANT** : Après modification du modèle `quelyos.tenant`, un upgrade est nécessaire.

```bash
# Utiliser la commande Claude
/upgrade-odoo

# Ou manuellement
docker-compose exec odoo odoo -u quelyos_api -d quelyos --stop-after-init
docker-compose restart odoo
```

## Monitoring

```bash
# Vérifier l'état des services
docker-compose ps

# Logs en temps réel
docker-compose logs -f nginx
docker-compose logs -f frontend
docker-compose logs -f backoffice
docker-compose logs -f odoo

# Santé des conteneurs
docker-compose exec nginx curl http://localhost/health
```

## Troubleshooting

### Nginx ne démarre pas
```bash
# Tester la configuration
docker-compose exec nginx nginx -t

# Vérifier les logs
docker-compose logs nginx
```

### Domaine non accessible
1. Vérifier la config Nginx dans `nginx/conf.d/tenants/{code}.conf`
2. Vérifier que le domaine pointe vers le serveur (DNS)
3. Vérifier le certificat SSL si HTTPS

### Odoo n'est pas accessible
```bash
# Vérifier que le service tourne
docker-compose ps odoo

# Logs Odoo
docker-compose logs odoo

# Redémarrer
docker-compose restart odoo
```
