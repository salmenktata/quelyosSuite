# Guide d'Installation Quelyos Suite

Guide complet pour installer Quelyos Suite sur un serveur fresh Odoo 19 Community.

## Table des Matières

1. [Prérequis Système](#prérequis-système)
2. [Installation Odoo 19](#installation-odoo-19)
3. [Installation Quelyos Suite](#installation-quelyos-suite)
4. [Vérification Post-Installation](#vérification-post-installation)
5. [Configuration Frontends](#configuration-frontends)
6. [Dépannage](#dépannage)

---

## Prérequis Système

### Système d'exploitation
- Ubuntu 22.04 LTS ou 24.04 LTS (recommandé)
- Debian 11 ou 12
- Autres distributions Linux compatibles

### Ressources minimales
- **CPU** : 2 cores (4 cores recommandés)
- **RAM** : 4 GB minimum (8 GB recommandés)
- **Disque** : 20 GB minimum (SSD recommandé)
- **Réseau** : Connexion internet stable

### Logiciels requis
- **Python** : 3.10 ou 3.11
- **PostgreSQL** : 14 ou 15
- **Node.js** : 18.x ou 20.x (pour frontends)
- **Git** : Version récente

---

## Installation Odoo 19

### 1. Installation des Dépendances Système

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation des dépendances Python
sudo apt install -y python3-pip python3-dev python3-venv \
    libxml2-dev libxslt1-dev zlib1g-dev libsasl2-dev \
    libldap2-dev build-essential libssl-dev libffi-dev \
    libjpeg-dev libpq-dev liblcms2-dev libblas-dev libatlas-base-dev

# Installation PostgreSQL
sudo apt install -y postgresql postgresql-client

# Installation wkhtmltopdf (pour PDF)
sudo apt install -y wkhtmltopdf

# Installation Node.js (pour frontends)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Création Utilisateur Odoo

```bash
# Créer utilisateur système odoo
sudo useradd -m -d /opt/odoo -U -r -s /bin/bash odoo

# Créer utilisateur PostgreSQL
sudo -u postgres createuser -s odoo
```

### 3. Installation Odoo 19 depuis Source

```bash
# Cloner Odoo 19 Community
sudo su - odoo
git clone https://github.com/odoo/odoo.git --depth 1 --branch 19.0 /opt/odoo/odoo-19
exit

# Installer les dépendances Python Odoo
sudo pip3 install -r /opt/odoo/odoo-19/requirements.txt
```

### 4. Installation Modules OCA

Quelyos Suite utilise des modules OCA. Les installer dans un dossier séparé :

```bash
# Créer dossier pour modules OCA
sudo mkdir -p /opt/odoo/oca-addons
sudo chown odoo:odoo /opt/odoo/oca-addons

# Cloner les repos OCA nécessaires
sudo su - odoo

# OCA Stock (v19)
git clone https://github.com/OCA/stock-logistics-warehouse.git --depth 1 --branch 19.0 /opt/odoo/oca-addons/stock-logistics-warehouse

# OCA Marketing (v16 - compatibles v19)
git clone https://github.com/OCA/social.git --depth 1 --branch 16.0 /opt/odoo/oca-addons/social

exit
```

### 5. Cloner Quelyos Suite

```bash
# Cloner le repo Quelyos Suite
sudo su - odoo
git clone https://github.com/salmenktata/QuelyosSuite.git /opt/odoo/quelyos-suite
exit
```

### 6. Configuration Odoo

```bash
# Créer dossier de configuration
sudo mkdir -p /etc/odoo
sudo mkdir -p /var/log/odoo
sudo chown odoo:odoo /var/log/odoo

# Créer fichier de configuration
sudo tee /etc/odoo/odoo.conf > /dev/null <<EOF
[options]
admin_passwd = admin_password_to_change
db_host = False
db_port = False
db_user = odoo
db_password = False
addons_path = /opt/odoo/odoo-19/addons,/opt/odoo/quelyos-suite/odoo-backend/addons,/opt/odoo/oca-addons/stock-logistics-warehouse,/opt/odoo/oca-addons/social
logfile = /var/log/odoo/odoo-server.log
log_level = info
xmlrpc_port = 8069
workers = 2
max_cron_threads = 1
EOF

sudo chown odoo:odoo /etc/odoo/odoo.conf
sudo chmod 640 /etc/odoo/odoo.conf
```

### 7. Créer Service Systemd

```bash
# Créer fichier service
sudo tee /etc/systemd/system/odoo.service > /dev/null <<EOF
[Unit]
Description=Odoo 19 Community
Requires=postgresql.service
After=network.target postgresql.service

[Service]
Type=simple
SyslogIdentifier=odoo
PermissionsStartOnly=true
User=odoo
Group=odoo
ExecStart=/opt/odoo/odoo-19/odoo-bin -c /etc/odoo/odoo.conf
StandardOutput=journal+console

[Install]
WantedBy=multi-user.target
EOF

# Activer et démarrer le service
sudo systemctl daemon-reload
sudo systemctl enable odoo
sudo systemctl start odoo

# Vérifier le statut
sudo systemctl status odoo
```

### 8. Créer Base de Données

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Créer la base de données
CREATE DATABASE quelyos_production OWNER odoo;
\q
```

---

## Installation Quelyos Suite

### Méthode 1 : Script Automatique (Recommandé)

```bash
# Lancer le script d'installation
cd /opt/odoo/quelyos-suite
./scripts/install_quelyos_suite.sh quelyos_production
```

Le script va :
1. ✅ Vérifier que la DB existe
2. ✅ Installer `quelyos_core` (orchestrateur)
3. ✅ Installer automatiquement tous les modules Quelyos
4. ✅ Redémarrer Odoo
5. ✅ Vérifier l'installation

**Durée** : 3-5 minutes

### Méthode 2 : Installation Manuelle via UI

1. **Accéder à Odoo** : http://votre-serveur:8069

2. **Login** : admin / admin (changer le mot de passe immédiatement)

3. **Apps** > Filtrer par "Quelyos" dans le menu gauche

4. **Chercher** "Quelyos Core Orchestrator"

5. **Clic** sur "Install"

6. **Attendre** 3-5 minutes (installation automatique de tous les modules)

7. **Redémarrer** Odoo :
   ```bash
   sudo systemctl restart odoo
   ```

### Modules Installés Automatiquement

Après l'installation de `quelyos_core`, les modules suivants sont installés automatiquement :

#### Odoo Standard (15 modules)
- base, web, mail, website, website_sale
- sale_management, product, account, crm, delivery
- payment, loyalty, stock, contacts, mass_mailing

#### OCA (8 modules)
- **Stock** (5) : stock_available_unreserved, stock_change_qty_reason, stock_demand_estimate, stock_inventory, stock_location_lockdown
- **Marketing** (3) : mass_mailing_partner, mass_mailing_list_dynamic, mass_mailing_resend

#### Quelyos (4-5 modules)
- **quelyos_core** : Orchestrateur (installé manuellement)
- **quelyos_api** : Infrastructure multi-tenant + API REST (TOUJOURS)
- **quelyos_stock_advanced** : Inventaire avancé (par défaut OUI)
- **quelyos_finance** : Trésorerie + Budgets (par défaut OUI)
- **quelyos_sms_tn** : Notifications SMS Tunisie (par défaut OUI)

---

## Vérification Post-Installation

### 1. Via Script Python

```bash
# Lancer le script de vérification
cd /opt/odoo/quelyos-suite
python3 scripts/verify_installation.py --db quelyos_production
```

**Attendu** : Tous les modules marqués `✓`, tenant admin trouvé, plans créés.

### 2. Via Odoo UI

1. **Apps** > Filtrer "Quelyos"
2. **Vérifier** : tous les modules affichent "Installed"
3. **Paramètres** > Utilisateurs & Sociétés > Utilisateurs
4. **Vérifier** : utilisateur admin existe

### 3. Via Odoo Shell

```bash
# Ouvrir shell Odoo
sudo -u odoo /opt/odoo/odoo-19/odoo-bin shell -c /etc/odoo/odoo.conf -d quelyos_production
```

```python
# Vérifier tenant admin
env['quelyos.tenant'].search([('code', '=', 'admin')])
# Attendu: quelyos.tenant(1,)

# Vérifier plans
env['quelyos.subscription.plan'].search([]).mapped('code')
# Attendu: ['starter', 'pro', 'business', 'enterprise']

# Vérifier modules installés
env['ir.module.module'].search([('state', '=', 'installed'), ('name', 'ilike', 'quelyos')]).mapped('name')
# Attendu: ['quelyos_core', 'quelyos_api', 'quelyos_stock_advanced', 'quelyos_finance', 'quelyos_sms_tn']
```

### 4. Tester API REST

```bash
# Liste produits
curl http://localhost:8069/api/products?tenant_code=admin

# Authentification
curl -X POST http://localhost:8069/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"tenant_code": "admin", "email": "admin@quelyos.tn", "password": "admin"}'
```

---

## Configuration Frontends

### 1. vitrine-quelyos (Site Vitrine - Next.js 14)

```bash
cd /opt/odoo/quelyos-suite/vitrine-quelyos

# Créer .env.local
cat > .env.local <<EOF
BACKEND_URL=http://localhost:8069
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF

# Installer dépendances
pnpm install

# Lancer en dev
pnpm dev
```

**Accès** : http://localhost:3000

### 2. vitrine-client (E-commerce - Next.js 16)

```bash
cd /opt/odoo/quelyos-suite/vitrine-client

# Créer .env.local
cat > .env.local <<EOF
BACKEND_URL=http://localhost:8069
NEXT_PUBLIC_TENANT_CODE=admin
NEXT_PUBLIC_SITE_URL=http://localhost:3001
EOF

# Installer dépendances
pnpm install

# Lancer en dev
pnpm dev
```

**Accès** : http://localhost:3001

### 3. dashboard-client (Backoffice - React + Vite)

```bash
cd /opt/odoo/quelyos-suite/dashboard-client

# Créer .env.local
cat > .env.local <<EOF
VITE_BACKEND_URL=http://localhost:8069
VITE_TENANT_CODE=admin
EOF

# Installer dépendances
pnpm install

# Lancer en dev
pnpm dev
```

**Accès** : http://localhost:5175

---

## Configuration Modules Optionnels

Par défaut, tous les modules optionnels sont installés. Pour désactiver un module lors de l'installation :

1. **Avant installation** de quelyos_core :

   Créer un fichier XML personnalisé dans `/opt/odoo/quelyos-suite/odoo-backend/addons/quelyos_core/data/installer_config_data.xml` et modifier les valeurs à `False`.

2. **Ou via UI Odoo** (après installation) :

   Paramètres > Technique > Paramètres > Paramètres système

   Modifier :
   - `quelyos.install_stock_advanced` → False
   - `quelyos.install_finance` → False
   - `quelyos.install_sms_tn` → False

   Puis désinstaller manuellement le module via Apps.

---

## Dépannage

Voir [TROUBLESHOOTING.md](TROUBLESHOOTING.md) pour les erreurs courantes :

- Module NOT FOUND
- Version mismatch OCA
- post_init_hook failed
- Installation bloquée
- Tenant admin non créé
- Performance lente

---

## Next Steps

1. **Changer mot de passe admin** : Odoo > Paramètres > Utilisateurs
2. **Configurer SMTP** : Odoo > Paramètres > Email (pour notifications)
3. **Configurer SMS** : Backoffice > Paramètres > SMS (API Tunisie SMS)
4. **Créer tenants** : Backoffice > Tenants > Créer
5. **Importer produits** : Backoffice > Boutique > Produits > Import CSV

---

## Support

- **Documentation** : [README.md](../README.md)
- **Architecture** : [ARCHITECTURE.md](../ARCHITECTURE.md)
- **Logs** : [LOGME.md](LOGME.md)
- **Issues** : https://github.com/salmenktata/QuelyosSuite/issues

---

**Bonne utilisation de Quelyos Suite ! 🚀**
