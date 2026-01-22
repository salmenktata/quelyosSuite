# 🎨 Quelyos Branding - Debranding Uniquement

## ✅ Configuration Actuelle

Le module **quelyos_branding** fait uniquement du **debranding** (remplacement de textes), **sans modification des styles CSS** d'Odoo.

---

## 📋 Ce Qui Est Actif

### 1. **JavaScript de Debranding** ✅

Fichier: `static/src/js/remove_odoo_branding.js`

**Remplace automatiquement:**
- Tous les textes "Odoo" → "Quelyos" dans le DOM
- Titres de page
- Attributs HTML (title, placeholder, aria-label)
- Meta tags
- Liens vers odoo.com

**Fonctionnalités:**
- ✅ Vérification au chargement de la page
- ✅ Observer du DOM pour les éléments dynamiques
- ✅ Vérification périodique toutes les 2 secondes
- ✅ Vérification lors d'événements (click, focus, mouseenter)
- ✅ Blocage des liens vers odoo.com
- ✅ Suppression des bannières promotionnelles Odoo

### 2. **Templates XML de Debranding** ✅

#### Fichier: `views/webclient_templates.xml`

**Modifie:**
- ✅ **Favicon** → Quelyos (favicon.ico + PNG multi-résolutions)
- ✅ **Titre de page** → "Quelyos ERP - Plateforme Retail Omnicanal"
- ✅ **Meta tags** → application-name, apple-mobile-web-app-title
- ✅ **Brand promotion message** → "Powered by Quelyos" (footer website)

#### Fichier: `views/login_templates.xml`

**Modifie:**
- ✅ **Footer login** → "Powered by Quelyos"

---

## 🚫 Ce Qui N'Est PAS Actif

### Fichiers SCSS Vides (Pas de Modification de Style)

Tous les fichiers SCSS sont **intentionnellement vides** pour conserver le comportement par défaut d'Odoo:

- ❌ `quelyos_branding.scss` - Vide
- ❌ `_backend.scss` - Vide
- ❌ `_login.scss` - Vide
- ❌ `_website.scss` - Vide
- ❌ `_pos.scss` - Vide
- ❌ `_variables.scss` - Vide

**Résultat:** Les styles par défaut d'Odoo sont conservés (couleurs, typographie, mise en page, etc.)

---

## 🎯 Résumé

| Élément | Status | Description |
|---------|--------|-------------|
| Textes "Odoo" → "Quelyos" | ✅ Actif | Via JavaScript automatique |
| Favicon Quelyos | ✅ Actif | Via templates XML |
| Titre "Quelyos ERP" | ✅ Actif | Via templates XML |
| Footer "Powered by Quelyos" | ✅ Actif | Via templates XML |
| Meta tags Quelyos | ✅ Actif | Via templates XML |
| Styles CSS personnalisés | ❌ Désactivé | Fichiers SCSS vides |
| Couleurs Odoo | ✅ Conservées | Pas de modification |
| Typographie Odoo | ✅ Conservée | Pas de modification |
| Layout Odoo | ✅ Conservé | Pas de modification |

---

## 🔍 Vérification

Pour vérifier que le debranding fonctionne:

1. **Ouvrir** http://localhost:8069/web/login
2. **Vérifier:**
   - Favicon Quelyos dans l'onglet ✅
   - Titre "Quelyos ERP" dans l'onglet ✅
   - Footer "Powered by Quelyos" ✅
   - Aucune référence "Odoo" visible ✅
   - Styles identiques à Odoo par défaut ✅

3. **Console JavaScript:**
   ```javascript
   // Vérifier que le JavaScript est chargé
   console.log(window.quelyosBranding);

   // Forcer le remplacement manuel si besoin
   window.quelyosBranding.replaceOdooText();
   ```

---

## 📝 Notes Techniques

### JavaScript

Le JavaScript s'exécute:
1. Au chargement du DOM (`DOMContentLoaded`)
2. Au chargement complet de la page (`load` + 500ms)
3. Toutes les 2 secondes (`setInterval`)
4. Sur les événements utilisateur (`click`, `focus`, `mouseenter`)
5. Via un `MutationObserver` pour les éléments dynamiques

### Templates XML

Les templates héritent des templates Odoo avec `priority="99"` pour s'appliquer en dernier:
- `web.layout` → Favicon, titre, meta tags
- `web.brand_promotion_message` → Footer "Powered by"
- `web.login_layout` → Footer page de login

### Assets

Les assets sont définis dans `__manifest__.py`:
```python
'assets': {
    'web.assets_backend': [
        'quelyos_branding/static/src/scss/_variables.scss',  # Vide
        'quelyos_branding/static/src/scss/quelyos_branding.scss',  # Vide
        'quelyos_branding/static/src/scss/_backend.scss',  # Vide
        'quelyos_branding/static/src/scss/_login.scss',  # Vide
        'quelyos_branding/static/src/js/remove_odoo_branding.js',  # Actif ✅
    ],
}
```

---

## 🔧 Maintenance

### Pour Réactiver les Styles CSS (Si Besoin Plus Tard)

Si vous souhaitez réactiver les styles personnalisés Quelyos:

1. **Restaurer** les fichiers SCSS depuis le commit précédent
2. **Mettre à jour** le module: `odoo -u quelyos_branding`
3. **Redémarrer** Odoo

### Pour Désactiver Complètement le Module

```bash
# Désinstaller
docker-compose exec odoo odoo shell -d odoo << 'EOF'
module = env['ir.module.module'].search([('name', '=', 'quelyos_branding')])
module.button_immediate_uninstall()
EOF

# Redémarrer
docker-compose restart odoo
```

---

## 📚 Documentation

- [README.md](README.md) - Documentation complète
- [INSTALLATION_COMPLETE.md](INSTALLATION_COMPLETE.md) - Guide d'installation
- [PROBLEMES_RESOLUS.md](PROBLEMES_RESOLUS.md) - Problèmes résolus
- **[DEBRANDING_UNIQUEMENT.md](DEBRANDING_UNIQUEMENT.md)** - Ce fichier

---

**Dernière mise à jour:** 2026-01-22 21:16
**Configuration:** Debranding uniquement, sans modification de style
**Status:** ✅ Actif et fonctionnel
