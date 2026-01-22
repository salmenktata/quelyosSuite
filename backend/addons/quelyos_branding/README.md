# Quelyos Branding

Module de debranding/rebranding complet pour Odoo 18.0, transformant l'interface Odoo en interface Quelyos.

## 📋 Description

Ce module supprime toutes les références à Odoo et les remplace par le branding Quelyos sur l'ensemble de la plateforme :

- ✅ Interface backend (navbar, menus, formulaires)
- ✅ Page de connexion redesignée
- ✅ Site web et e-commerce
- ✅ Interface Point of Sale (POS)
- ✅ Templates d'emails
- ✅ Portail client
- ✅ Favicons et logos
- ✅ Couleurs et typographie personnalisées

## 🎨 Fonctionnalités

### Backend
- Logo Quelyos dans la navbar
- Favicon personnalisé
- Titre "Quelyos ERP" dans les onglets
- Liens vers docs.quelyos.com et support.quelyos.com
- Classes CSS personnalisées (quelyos_*)
- Suppression automatique des références "Odoo"

### Page de Connexion
- Design split moderne (gauche: branding, droite: formulaire)
- Background image personnalisé
- Logo et slogan Quelyos
- Formulaire stylisé avec les couleurs Quelyos
- Footer "Powered by Quelyos"

### Website/E-commerce
- Header et footer brandés
- Logo Quelyos
- Couleurs cohérentes avec le backend
- Suppression "Powered by Odoo"

### Point of Sale (POS)
- Logo Quelyos dans l'interface POS
- Tickets de caisse brandés
- Interface stylisée aux couleurs Quelyos

### Emails
- Header email avec logo Quelyos
- Footer personnalisé
- Signature email Quelyos
- Liens vers le support et la documentation

## 🎨 Palette de Couleurs

```scss
Primaire:    #1e40af (Bleu)
Secondaire:  #10b981 (Vert)
Accent:      #f59e0b (Orange)
Danger:      #ef4444 (Rouge)
Warning:     #f59e0b (Orange)
Info:        #06b6d4 (Cyan)
```

## 📦 Installation

### 1. Prérequis

- Odoo 18.0
- Module `quelyos_core` installé
- Modules: web, website, website_sale, point_of_sale, mail, portal, auth_signup

### 2. Installation du module

```bash
# Copier le module dans addons
cp -r quelyos_branding /path/to/odoo/addons/

# Mettre à jour la liste des modules
docker-compose exec odoo odoo-bin -u all -d odoo --stop-after-init

# Installer le module
docker-compose exec odoo odoo-bin -i quelyos_branding -d odoo --stop-after-init

# Redémarrer Odoo
docker-compose restart odoo
```

### 3. Assets statiques requis

⚠️ **Important**: Vous devez ajouter les images suivantes avant l'installation:

#### Logos (HAUTE PRIORITÉ)
```
static/src/img/logo/
├── quelyos_logo.png          (1000x250px, couleur)
├── quelyos_logo_white.png    (1000x250px, blanc)
├── quelyos_logo_small.png    (180x46px, navbar)
└── quelyos_logo.svg          (vectoriel)
```

#### Favicons (HAUTE PRIORITÉ)
```
static/src/img/favicon/
├── favicon.ico               (16x16, 32x32, 48x48)
├── favicon-32x32.png
├── favicon-16x16.png
└── apple-touch-icon.png      (180x180)
```

#### Images (MOYENNE PRIORITÉ)
```
static/src/img/backgrounds/
└── login_bg.jpg              (1920x1080)

static/src/img/illustrations/
├── empty_state.svg
└── error_404.svg
```

## ⚙️ Configuration

### Accéder aux paramètres

1. Aller dans **Paramètres** → **Général**
2. Chercher la section **Quelyos Branding**
3. Configurer:
   - Nom de l'entreprise
   - URLs (site web, support, documentation)
   - Couleurs principales et secondaires
   - Slogan
   - Email de contact
   - Textes des footers

### Paramètres disponibles

| Paramètre | Par défaut | Description |
|-----------|------------|-------------|
| `quelyos.branding.company_name` | Quelyos | Nom de l'entreprise |
| `quelyos.branding.primary_color` | #1e40af | Couleur principale |
| `quelyos.branding.secondary_color` | #10b981 | Couleur secondaire |
| `quelyos.branding.slogan` | La plateforme SaaS omnicanal pour le retail | Slogan affiché |
| `quelyos.branding.company_url` | https://quelyos.com | URL du site |
| `quelyos.branding.support_url` | https://support.quelyos.com | URL du support |
| `quelyos.branding.docs_url` | https://docs.quelyos.com | URL de la documentation |

## 🧪 Tests

### Checklist de vérification

#### Backend
- [ ] Favicon Quelyos visible dans l'onglet
- [ ] Titre "Quelyos ERP" dans l'onglet
- [ ] Logo Quelyos blanc dans la navbar
- [ ] Liens vers docs.quelyos.com et support.quelyos.com
- [ ] Aucune référence "Odoo" visible
- [ ] Couleur primaire: bleu #1e40af

#### Page de Connexion
- [ ] Background image visible côté gauche
- [ ] Logo Quelyos blanc + slogan visibles
- [ ] Formulaire stylisé côté droit
- [ ] Bouton "Se connecter" bleu Quelyos
- [ ] Footer "Powered by Quelyos"
- [ ] Responsive sur mobile

#### Website
- [ ] Favicon Quelyos
- [ ] Logo Quelyos dans header
- [ ] Footer sans "Powered by Odoo"

#### POS
- [ ] Logo Quelyos dans interface POS
- [ ] Ticket de caisse avec logo Quelyos

#### Emails
- [ ] Header email avec logo Quelyos
- [ ] Footer "Envoyé par Quelyos"

## 🔧 Dépannage

### Le module ne s'installe pas

1. Vérifier que `quelyos_core` est installé
2. Vérifier les logs Odoo: `docker-compose logs -f odoo`
3. Vérifier que tous les modules dépendants sont installés

### Les styles ne s'appliquent pas

1. Vider le cache du navigateur (Ctrl+Shift+R)
2. Régénérer les assets Odoo:
```bash
docker-compose exec odoo odoo-bin -u quelyos_branding -d odoo --stop-after-init
```

### Les images ne s'affichent pas

1. Vérifier que les images sont présentes dans `static/src/img/`
2. Vérifier les permissions des fichiers:
```bash
chmod -R 755 static/
```
3. Redémarrer Odoo

### Les textes "Odoo" sont toujours visibles

1. Attendre quelques secondes (le JavaScript s'exécute après le chargement)
2. Vérifier la console JavaScript pour des erreurs
3. Forcer le remplacement: `window.quelyosBranding.replaceOdooText()`

## 📝 Structure du Module

```
quelyos_branding/
├── __init__.py
├── __manifest__.py
├── README.md
├── models/
│   ├── __init__.py
│   └── res_config_settings.py
├── static/
│   ├── description/
│   │   └── icon.png
│   └── src/
│       ├── img/
│       │   ├── logo/
│       │   ├── favicon/
│       │   ├── backgrounds/
│       │   └── illustrations/
│       ├── scss/
│       │   ├── _variables.scss
│       │   ├── quelyos_branding.scss
│       │   ├── _login.scss
│       │   ├── _backend.scss
│       │   ├── _website.scss
│       │   └── _pos.scss
│       └── js/
│           └── remove_odoo_branding.js
├── views/
│   ├── assets_templates.xml
│   ├── webclient_templates.xml
│   ├── login_templates.xml
│   ├── backend_templates.xml
│   └── portal_templates.xml
├── templates/
│   ├── website/
│   ├── pos/
│   └── mail/
├── data/
│   ├── branding_data.xml
│   └── remove_odoo_menus.xml
└── security/
    └── ir.model.access.csv
```

## 🌐 Compatibilité

- ✅ Odoo 18.0 Community
- ✅ Odoo 18.0 Enterprise
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Mobile (responsive)

## 📚 Documentation

- Site web: https://quelyos.com
- Documentation: https://docs.quelyos.com
- Support: https://support.quelyos.com

## 👨‍💻 Développement

### Debug

Le module expose des fonctions JavaScript pour le debug:

```javascript
// Dans la console du navigateur
window.quelyosBranding.updatePageTitle()       // Forcer la mise à jour du titre
window.quelyosBranding.replaceOdooText()       // Forcer le remplacement des textes
window.quelyosBranding.removePromotions()      // Supprimer les promotions Odoo
```

### Personnalisation

Pour personnaliser les couleurs, modifier le fichier:
```
static/src/scss/_variables.scss
```

Pour personnaliser les templates, override les fichiers XML dans:
```
views/
templates/
```

## 📄 Licence

LGPL-3

## 👥 Auteur

Quelyos - 2026

---

**Note**: Ce module nécessite des assets graphiques (logos, favicons, images) pour fonctionner complètement. Consultez la section "Assets statiques requis" ci-dessus.
