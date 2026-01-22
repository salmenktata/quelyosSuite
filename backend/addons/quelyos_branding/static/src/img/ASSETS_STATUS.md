# Status des Assets Quelyos Branding

## ✅ Fichiers disponibles

### Logos SVG (Récupérés depuis ~/Projets/GitHub/quelyos)

1. **quelyos_logo.svg** ✅
   - Source: `apps/website/public/logos/quelyos-suite.svg`
   - Couleurs: Gradient violet/indigo (#6366f1 → #a855f7)
   - Dimensions: 200x50px (viewBox)
   - Utilisation: Logo principal pour site web, emails, documents

2. **quelyos_logo_white.svg** ✅ (Créé)
   - Version blanche du logo
   - Pour fonds sombres (navbar backend)
   - Dimensions: 200x50px (viewBox)
   - Utilisation: Navbar backend, page de connexion

3. **quelyos_logo_small.svg** ✅ (Créé)
   - Version compacte du logo
   - Blanche, pour navbar compacte
   - Dimensions: 120x32px (viewBox)
   - Utilisation: Navbar compacte, tickets POS

### Favicon SVG

4. **favicon/favicon.svg** ✅
   - Source: `apps/website/public/logos/icon-suite.svg`
   - Icône "Q" stylisée avec gradient
   - Dimensions: 48x48px
   - Utilisation: Base pour générer les favicons

## ⚠️ Fichiers à générer

### Favicons PNG/ICO (À générer depuis favicon.svg)

Les fichiers suivants doivent être générés à partir de `favicon.svg`:

1. **favicon.ico** ❌
   - Multiples tailles: 16x16, 32x32, 48x48
   - Format: ICO

2. **favicon-16x16.png** ❌
   - 16x16px
   - Format: PNG transparent

3. **favicon-32x32.png** ❌
   - 32x32px
   - Format: PNG transparent

4. **apple-touch-icon.png** ❌
   - 180x180px
   - Format: PNG

## 🛠️ Comment générer les favicons manquants

### Option 1: Utiliser un générateur en ligne (RECOMMANDÉ)

1. Aller sur **https://realfavicongenerator.net/**
2. Upload `favicon.svg`
3. Télécharger le package complet
4. Copier les fichiers dans `static/src/img/favicon/`

### Option 2: Utiliser ImageMagick (ligne de commande)

Si ImageMagick est installé:

```bash
# Depuis le dossier du module
cd static/src/img/favicon/

# Convertir SVG en PNG 16x16
convert favicon.svg -resize 16x16 favicon-16x16.png

# Convertir SVG en PNG 32x32
convert favicon.svg -resize 32x32 favicon-32x32.png

# Convertir SVG en PNG 180x180 pour Apple
convert favicon.svg -resize 180x180 apple-touch-icon.png

# Créer le favicon.ico (multi-résolutions)
convert favicon.svg -resize 16x16 -resize 32x32 -resize 48x48 favicon.ico
```

### Option 3: Utiliser Inkscape

```bash
# Installer Inkscape si pas déjà fait
# brew install inkscape (sur Mac)

# Exporter en PNG
inkscape favicon.svg --export-filename=favicon-16x16.png --export-width=16 --export-height=16
inkscape favicon.svg --export-filename=favicon-32x32.png --export-width=32 --export-height=32
inkscape favicon.svg --export-filename=apple-touch-icon.png --export-width=180 --export-height=180
```

## 📝 Fichiers PNG pour logos (OPTIONNEL)

Pour de meilleures performances, vous pouvez aussi créer des versions PNG des logos:

```bash
# Logo principal 1000x250px
inkscape quelyos_logo.svg --export-filename=quelyos_logo.png --export-width=1000

# Logo blanc 1000x250px
inkscape quelyos_logo_white.svg --export-filename=quelyos_logo_white.png --export-width=1000

# Logo petit 180x46px
inkscape quelyos_logo_small.svg --export-filename=quelyos_logo_small.png --export-width=180
```

## 🎨 Images de fond (OPTIONNEL)

### Background login (login_bg.jpg)

Pour une meilleure expérience, ajoutez une image de fond pour la page de connexion:

**Spécifications:**
- Dimensions: 1920x1080px
- Format: JPG optimisé
- Poids: < 500 KB
- Style: Moderne, professionnel, évoque le retail/tech
- Couleurs: Tons bleus/violets cohérents avec le logo

**Sources recommandées:**
- Unsplash.com (recherche: "technology blue", "modern retail")
- Générer avec Midjourney/DALL-E

**Où placer:**
`static/src/img/backgrounds/login_bg.jpg`

## 🎯 Illustrations (OPTIONNEL)

### Empty states et erreurs

Pour compléter le branding, ajoutez des illustrations SVG:

1. **empty_state.svg** - Pour les vues vides (listes, kanban)
2. **error_404.svg** - Page 404
3. **error_500.svg** - Erreur serveur (optionnel)

**Où placer:**
`static/src/img/illustrations/`

**Sources recommandées:**
- undraw.co (personnalisables, gratuit)
- storyset.com (style cohérent)

## ✅ Checklist de déploiement

Avant d'installer le module, vérifiez:

- [x] Logo principal SVG (quelyos_logo.svg)
- [x] Logo blanc SVG (quelyos_logo_white.svg)
- [x] Logo petit SVG (quelyos_logo_small.svg)
- [x] Favicon SVG source (favicon.svg)
- [ ] favicon.ico (à générer)
- [ ] favicon-16x16.png (à générer)
- [ ] favicon-32x32.png (à générer)
- [ ] apple-touch-icon.png (à générer)
- [ ] login_bg.jpg (optionnel mais recommandé)
- [ ] empty_state.svg (optionnel)
- [ ] error_404.svg (optionnel)

## 🚀 Installation rapide des favicons

**Script automatique (si ImageMagick/Inkscape installé):**

```bash
#!/bin/bash
cd /Users/salmenktata/Projets/GitHub/QuelyosERP/backend/addons/quelyos_branding/static/src/img/favicon/

# Utiliser ImageMagick
convert favicon.svg -density 256 -background none -resize 16x16 favicon-16x16.png
convert favicon.svg -density 256 -background none -resize 32x32 favicon-32x32.png
convert favicon.svg -density 256 -background none -resize 180x180 apple-touch-icon.png
convert favicon.svg -density 256 -background none \( -clone 0 -resize 16x16 \) \( -clone 0 -resize 32x32 \) \( -clone 0 -resize 48x48 \) -delete 0 favicon.ico

echo "✅ Favicons générés avec succès !"
```

Sauvegardez ce script dans `generate-favicons.sh` et exécutez:
```bash
chmod +x generate-favicons.sh
./generate-favicons.sh
```

## 📦 État actuel

**Assets prêts:** 4/12 (33%)
**Status:** Logos SVG prêts, favicons à générer
**Action requise:** Générer les favicons PNG/ICO avec un outil en ligne ou ImageMagick
