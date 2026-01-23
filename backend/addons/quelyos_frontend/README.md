# Module Quelyos Frontend

Module Odoo contenant le frontend Next.js avec déploiement automatisé.

## Architecture

- **Configuration**: Modèle `quelyos.frontend.config` dans Odoo
- **Code source**: Dossier `frontend/` contenant l'application Next.js complète
- **Déploiement**: Scripts automatiques + service systemd
- **Port**: 3000 (configurable)

## Installation Automatique

Lors de l'installation du module Odoo:
1. ✅ Vérification Node.js >= 18
2. ✅ Génération `.env.local` depuis config Odoo
3. ✅ `npm install` des dépendances (~300 MB)
4. ✅ `npm run build` pour production (peut prendre 5-10 minutes)
5. ✅ Installation service systemd (si sudo disponible)

## Installation Manuelle (si auto échoue)

### Prérequis

```bash
# Installer Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vérifier
node -v  # doit être >= v18.0.0
npm -v
```

### Déploiement

```bash
cd backend/addons/quelyos_frontend/frontend

# 1. Générer .env.local (ou copier depuis template)
cp .env.local.template .env.local
# Éditer .env.local avec vos URLs

# 2. Installer dépendances
npm install

# 3. Build production
npm run build

# 4. Démarrer (dev)
npm run dev

# 4. OU Démarrer (production)
npm start
```

### Service Systemd

```bash
cd backend/addons/quelyos_frontend/scripts

# Installer le service
sudo bash install_systemd.sh /chemin/absolu/vers/frontend

# Gérer le service
bash manage_service.sh start|stop|restart|status|logs
```

## Configuration

Accessible via : **Quelyos → Configuration → Frontend**

Champs configurables:
- **URLs** : frontend, backend, proxy
- **Webhooks** : secret, endpoints, types activés
- **Feature flags** : wishlist, comparison, reviews, guest checkout
- **API** : timeout, produits par page
- **Branding** : logos, couleurs

### Régénérer .env.local après changement

Après modification de la config dans Odoo:

```bash
cd backend/addons/quelyos_frontend/frontend
# Copier les nouvelles valeurs depuis l'UI Odoo vers .env.local
# OU régénérer via script Python si créé

sudo systemctl restart quelyos-frontend
```

## Maintenance

### Logs

```bash
# Logs systemd
journalctl -u quelyos-frontend -f

# Logs Next.js (si lancé manuellement)
cd frontend && npm run dev
```

### Mise à jour du code

```bash
cd backend/addons/quelyos_frontend/frontend

# Si git submodule
git pull

# Installer nouvelles dépendances
npm install

# Rebuild
npm run build

# Redémarrer
sudo systemctl restart quelyos-frontend
```

### Dépannage

**Erreur: Port 3000 déjà utilisé**

```bash
# Trouver le processus
sudo lsof -i :3000

# Tuer si nécessaire
sudo kill -9 <PID>
```

**Frontend n'affiche rien**

1. Vérifier que le service tourne: `systemctl status quelyos-frontend`
2. Vérifier les logs: `journalctl -u quelyos-frontend -f`
3. Vérifier .env.local existe et contient les bonnes URLs
4. Tester build: `cd frontend && npm run build`

**npm install échoue**

- Vérifier espace disque: `df -h`
- Vérifier version Node.js: `node -v` (doit être >= 18)
- Supprimer node_modules et réessayer: `rm -rf node_modules && npm install`

## Structure

```
quelyos_frontend/
├── __init__.py              # Post-install hook
├── __manifest__.py
├── README.md
├── frontend/                # Code Next.js complet
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.local.template
├── scripts/
│   ├── check_nodejs.sh
│   ├── install_systemd.sh
│   └── manage_service.sh
├── models/
│   └── frontend_config.py
├── views/
│   ├── frontend_config_views.xml
│   └── menu.xml
└── data/
    └── frontend_config.xml
```

## Développement

Pour développer le frontend localement:

```bash
cd backend/addons/quelyos_frontend/frontend
npm run dev
```

Le frontend sera accessible sur http://localhost:3000

## Licence

LGPL-3

## Auteur

Quelyos - https://quelyos.com
