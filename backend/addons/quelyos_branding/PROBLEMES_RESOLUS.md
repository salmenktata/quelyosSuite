# 🔧 Problèmes Résolus - quelyos_branding

## Erreur de Compilation SCSS ✅ RÉSOLU

### Symptôme
```
Style error

The style compilation failed. This is an administrator or developer error
that must be fixed for the entire database before continuing working.
See browser console or server logs for details.
```

### Cause
Les fichiers SCSS contenaient des imports (`@import 'variables'`) qui ne fonctionnent pas dans Odoo 18.0. Odoo compile chaque fichier SCSS séparément, et les chemins d'import relatifs échouent.

### Fichiers Affectés
- `quelyos_branding.scss` (ligne 7)
- `_backend.scss` (ligne 6)
- `_login.scss` (ligne 6)
- `_pos.scss` (ligne 6)
- `_website.scss` (ligne 6)

### Solution Appliquée
Suppression de tous les `@import 'variables'` dans les fichiers SCSS. Les variables sont maintenant disponibles car `_variables.scss` est chargé en premier dans le manifest.py:

```python
'assets': {
    'web.assets_backend': [
        'quelyos_branding/static/src/scss/_variables.scss',  # ← En premier!
        'quelyos_branding/static/src/scss/quelyos_branding.scss',
        # ... autres fichiers
    ],
}
```

### Commandes Exécutées
```bash
# Suppression des imports
cd backend/addons/quelyos_branding/static/src/scss
for file in *.scss; do
    sed -i '' "/^@import 'variables';$/d" "$file"
done

# Mise à jour du module
docker-compose exec odoo odoo -u quelyos_branding -d odoo --stop-after-init
docker-compose restart odoo
```

### Résultat
✅ Compilation SCSS réussie
✅ Module quelyos_branding fonctionnel
✅ Interface accessible sans erreur

---

## Problèmes d'Installation Initiaux ✅ RÉSOLUS

### 1. Erreur "External ID not found: web.assets_backend"

**Symptôme:** Le module tentait d'hériter de `web.assets_backend` via XML.

**Solution:** Dans Odoo 18.0, les assets sont définis directement dans le manifest.py sous la clé `'assets'` au lieu de templates XML.

**Fichier modifié:** `__manifest__.py`
- Désactivé: `'views/assets_templates.xml'`
- Ajouté: Section `'assets': { 'web.assets_backend': [...] }`

---

### 2. Erreur "You cannot create recursive inherited views"

**Symptôme:** Les templates utilisaient le même ID que leur parent (ex: `id="web.navbar"` héritant de `web.navbar`).

**Solution:** Utiliser des IDs uniques préfixés par le nom du module:
- `web.navbar` → `quelyos_branding.navbar`
- `web.login` → `quelyos_branding.login`
- etc.

**Fichiers modifiés:**
- `views/webclient_templates.xml`
- `views/login_templates.xml`
- `views/backend_templates.xml`

---

### 3. Erreur "Element cannot be located in parent view"

**Symptôme:** Les XPath ne trouvaient pas les éléments ciblés dans les templates Odoo 18.0.

**Cause:** La structure des templates a changé dans Odoo 18.0:
- Navbar et menus sont maintenant des composants OWL (JavaScript)
- Beaucoup de templates XML ont été supprimés

**Solution:**
- Désactivé les templates qui n'existent plus (`web.navbar`, `web.nocontent`, etc.)
- Simplifié les templates login pour cibler uniquement les éléments existants
- Utilisé CSS et JavaScript pour le branding au lieu de templates XML

**Fichiers désactivés:**
- `views/backend_templates.xml` (templates n'existent plus)
- Certains XPath complexes dans `views/login_templates.xml`

---

## Architecture Finale Fonctionnelle

### ✅ Ce Qui Fonctionne

1. **Assets CSS/JS** (via manifest.py)
   - Variables SCSS chargées globalement
   - Styles backend, frontend, common
   - JavaScript de debranding

2. **Templates XML** (simplifiés)
   - `web.layout` → Favicon et titre
   - `web.login_layout` → Footer "Powered by Quelyos"

3. **Paramètres de Configuration**
   - 20 paramètres dans `ir.config_parameter`
   - Personnalisables via Paramètres → Général

### ⚠️ Limitations Connues

1. **Navbar:** Pas de modification XML possible (composant OWL)
   - Branding via CSS uniquement
   - JavaScript pour remplacer les textes

2. **Empty States:** Template `web.nocontent` n'existe plus dans Odoo 18.0
   - Solution future: Créer un composant OWL personnalisé

3. **Page Login:** Structure limitée
   - Modification du footer uniquement
   - Design split complet nécessite un composant OWL

---

## Bonnes Pratiques Odoo 18.0

### 1. Assets
```python
# ✅ CORRECT - Dans __manifest__.py
'assets': {
    'web.assets_backend': [
        'module/static/src/scss/file.scss',
    ],
}

# ❌ INCORRECT - Via templates XML
<template id="assets" inherit_id="web.assets_backend">
    <link href="..."/>
</template>
```

### 2. SCSS
```scss
// ❌ INCORRECT - Imports ne fonctionnent pas
@import 'variables';

// ✅ CORRECT - Variables chargées via manifest en premier
$quelyos-primary: #1e40af;  // Utilisable directement
```

### 3. Templates
```xml
<!-- ❌ INCORRECT - ID récursif -->
<template id="web.login" inherit_id="web.login">

<!-- ✅ CORRECT - ID unique -->
<template id="module.login" inherit_id="web.login">
```

### 4. Composants UI
```
❌ Templates XML pour navbar/menus (n'existe plus)
✅ Composants OWL JavaScript
✅ CSS pour styling
✅ JavaScript pour textes dynamiques
```

---

## Fichiers de Documentation

- [README.md](README.md) - Documentation complète
- [INSTALLATION.md](INSTALLATION.md) - Guide d'installation
- [INSTALLATION_COMPLETE.md](INSTALLATION_COMPLETE.md) - Résumé de l'installation
- [PROBLEMES_RESOLUS.md](PROBLEMES_RESOLUS.md) - Ce fichier

---

**Dernière mise à jour:** 2026-01-22 20:57
**Statut:** ✅ TOUS LES PROBLÈMES RÉSOLUS
