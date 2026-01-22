# Guide d'Installation - Quelyos Branding

## 📦 Résumé du Module

Le module `quelyos_branding` transforme complètement l'interface Odoo en interface Quelyos:
- ✅ 37 fichiers créés
- ✅ Logos SVG récupérés et adaptés
- ✅ Page de connexion moderne redessinée
- ✅ Backend, POS, Website, Emails brandés
- ⚠️ Favicons PNG/ICO à générer (facile avec un outil en ligne)

---

## 🎨 Assets Disponibles

### ✅ Logos (PRÊTS)

Les logos SVG ont été récupérés depuis votre projet Quelyos et adaptés:

```
static/src/img/logo/
├── quelyos_logo.svg          ✅ Logo principal (gradient violet)
├── quelyos_logo_white.svg    ✅ Logo blanc pour navbar
└── quelyos_logo_small.svg    ✅ Logo compact pour navbar
```

### ⚠️ Favicons (À GÉNÉRER - 5 minutes)

```
static/src/img/favicon/
├── favicon.svg               ✅ Source SVG prête
├── favicon.ico               ❌ À générer
├── favicon-16x16.png         ❌ À générer
├── favicon-32x32.png         ❌ À générer
└── apple-touch-icon.png      ❌ À générer
```

**Solution rapide:** Utilisez https://realfavicongenerator.net/
1. Uploadez `static/src/img/favicon/favicon.svg`
2. Téléchargez le package
3. Copiez les fichiers dans `static/src/img/favicon/`

---

## 🚀 Installation

### Étape 1: Générer les Favicons (5 minutes)

#### Option A: Générateur en ligne (RECOMMANDÉ)

1. Aller sur https://realfavicongenerator.net/
2. Sélectionner `backend/addons/quelyos_branding/static/src/img/favicon/favicon.svg`
3. Cliquer "Generate favicons"
4. Télécharger le package
5. Extraire et copier les fichiers dans `backend/addons/quelyos_branding/static/src/img/favicon/`

#### Option B: Installer ImageMagick et utiliser le script

```bash
# Installer ImageMagick
brew install imagemagick

# Générer les favicons
cd backend/addons/quelyos_branding
./generate-favicons.sh
```

#### Option C: Continuer sans favicons (fonctionnel mais sans icône)

Le module fonctionnera sans les favicons PNG/ICO, mais l'icône dans les onglets ne s'affichera pas correctement. Vous pourrez les ajouter plus tard.

### Étape 2: Installer le Module

```bash
# Depuis le dossier racine du projet
cd /Users/salmenktata/Projets/GitHub/QuelyosERP

# Vérifier que quelyos_core est installé
docker-compose exec odoo odoo-bin shell -d odoo -c "print('quelyos_core' in env['ir.module.module'].search([('name', '=', 'quelyos_core')]).mapped('state'))"

# Installer quelyos_branding
docker-compose exec odoo odoo-bin -i quelyos_branding -d odoo --stop-after-init

# Redémarrer Odoo
docker-compose restart odoo
```

### Étape 3: Vérifier l'Installation

1. Accéder à http://localhost:8069/web/login
2. Vérifier la nouvelle page de connexion (split design)
3. Se connecter et vérifier:
   - Logo Quelyos blanc dans la navbar
   - Titre "Quelyos ERP" dans l'onglet
   - Favicon Quelyos (si généré)
   - Absence de références "Odoo"

---

## 🎯 Configuration Post-Installation

### Paramètres dans Odoo

1. Aller dans **Paramètres** → **Général**
2. Chercher la section **Quelyos Branding**
3. Configurer selon vos besoins:
   - Nom de l'entreprise
   - URLs (site web, support, documentation)
   - Couleurs (par défaut: #1e40af bleu, #10b981 vert)
   - Slogan
   - Textes des footers

### Paramètres disponibles

Tous les paramètres sont stockés dans `ir.config_parameter`:

```python
# Exemple de modification via Python
env['ir.config_parameter'].set_param('quelyos.branding.slogan', 'Votre nouveau slogan')
env['ir.config_parameter'].set_param('quelyos.branding.primary_color', '#0000ff')
```

---

## ✅ Checklist de Vérification

### Backend
- [ ] Favicon Quelyos visible dans l'onglet (si favicons générés)
- [ ] Titre "Quelyos ERP - Plateforme Retail Omnicanal"
- [ ] Logo Quelyos blanc dans la navbar
- [ ] Liens "Documentation Quelyos" et "Support Quelyos"
- [ ] Aucune référence "Odoo" visible
- [ ] Couleur primaire: bleu #1e40af
- [ ] Menus et boutons stylisés

### Page de Connexion
- [ ] Design split (gauche: branding, droite: formulaire)
- [ ] Logo Quelyos blanc visible à gauche
- [ ] Slogan "Bienvenue sur Quelyos"
- [ ] Formulaire stylisé à droite
- [ ] Bouton "Se connecter" bleu Quelyos
- [ ] Footer "Powered by Quelyos © 2026"
- [ ] Responsive sur mobile

### Website/E-commerce
- [ ] Favicon Quelyos (si généré)
- [ ] Logo Quelyos dans le header
- [ ] Footer "© 2026 Quelyos - Tous droits réservés"
- [ ] Pas de "Powered by Odoo"

### POS
- [ ] Logo Quelyos dans l'interface POS
- [ ] Tickets de caisse avec logo et footer Quelyos

### Emails
- [ ] Header email avec logo Quelyos
- [ ] Footer "Envoyé par Quelyos"
- [ ] Liens vers quelyos.com

---

## 🐛 Dépannage

### Le module ne s'installe pas

```bash
# Vérifier les logs
docker-compose logs -f odoo

# Vérifier que quelyos_core est installé
docker-compose exec odoo odoo-bin -d odoo -c "from odoo import api, SUPERUSER_ID; env = api.Environment(cr, SUPERUSER_ID, {}); print(env['ir.module.module'].search([('name', '=', 'quelyos_core')]).state)"
```

### Les styles ne s'appliquent pas

```bash
# Vider le cache et régénérer les assets
docker-compose exec odoo odoo-bin -u quelyos_branding -d odoo --stop-after-init
docker-compose restart odoo

# Dans le navigateur: Ctrl+Shift+R (forcer le rechargement)
```

### Les images ne s'affichent pas

```bash
# Vérifier les permissions
chmod -R 755 backend/addons/quelyos_branding/static/

# Vérifier que les fichiers existent
ls -lh backend/addons/quelyos_branding/static/src/img/logo/
ls -lh backend/addons/quelyos_branding/static/src/img/favicon/
```

### Les textes "Odoo" sont encore visibles

1. Attendre 2-3 secondes (le JavaScript s'exécute après le chargement)
2. Ouvrir la console JavaScript (F12) et vérifier les erreurs
3. Forcer le remplacement manuellement:
   ```javascript
   window.quelyosBranding.replaceOdooText()
   ```

### Le favicon ne s'affiche pas

1. Vérifier que les favicons PNG/ICO ont été générés
2. Vider le cache du navigateur (Ctrl+Shift+Delete)
3. Redémarrer le navigateur
4. Tester en navigation privée

---

## 📊 Statistiques du Module

- **Fichiers créés:** 37
- **Lignes de code:** ~4000
- **Templates XML:** 13
- **Fichiers SCSS:** 6
- **Fichiers JavaScript:** 1
- **Paramètres configurables:** 20+
- **Langues supportées:** FR, EN, AR (à compléter)

---

## 🎨 Personnalisation Avancée

### Modifier les couleurs

Éditer `static/src/scss/_variables.scss`:

```scss
$quelyos-primary: #1e40af;        // Votre couleur principale
$quelyos-secondary: #10b981;      // Votre couleur secondaire
$quelyos-accent: #f59e0b;         // Couleur d'accent
```

### Modifier le design de login

Éditer `static/src/scss/_login.scss` pour personnaliser la page de connexion.

### Ajouter une image de fond login

1. Placer votre image dans `static/src/img/backgrounds/login_bg.jpg`
2. Redémarrer Odoo
3. L'image apparaîtra automatiquement sur la page de connexion

---

## 📚 Documentation

- **README.md** - Documentation complète du module
- **ASSETS_STATUS.md** - État des assets et instructions
- **INSTALLATION.md** - Ce fichier
- **static/src/img/*/README.md** - Guides spécifiques pour chaque type d'asset

---

## 🎉 Prochaines Étapes

Après l'installation:

1. ✅ Générer les favicons manquants
2. ✅ Ajouter une image de fond pour la page login (optionnel)
3. ✅ Ajouter des illustrations pour empty states (optionnel)
4. ✅ Configurer les paramètres dans Settings
5. ✅ Tester sur différents navigateurs
6. ✅ Tester la création d'un tenant
7. ✅ Tester POS et e-commerce
8. ✅ Tester l'envoi d'emails

---

## 💡 Support

- Documentation: https://docs.quelyos.com
- Support: https://support.quelyos.com
- GitHub: https://github.com/quelyos

---

**Module créé avec ❤️ pour Quelyos ERP**
