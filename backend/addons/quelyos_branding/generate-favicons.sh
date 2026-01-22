#!/bin/bash

# Script de génération automatique des favicons pour Quelyos Branding
# Nécessite: ImageMagick ou Inkscape

set -e

FAVICON_DIR="static/src/img/favicon"
SOURCE_SVG="$FAVICON_DIR/favicon.svg"

echo "🎨 Génération des favicons Quelyos..."
echo ""

# Vérifier que le fichier source existe
if [ ! -f "$SOURCE_SVG" ]; then
    echo "❌ Erreur: $SOURCE_SVG n'existe pas"
    exit 1
fi

cd "$(dirname "$0")"

# Fonction pour détecter ImageMagick
has_imagemagick() {
    command -v convert >/dev/null 2>&1
}

# Fonction pour détecter Inkscape
has_inkscape() {
    command -v inkscape >/dev/null 2>&1
}

# Choisir l'outil de conversion
if has_imagemagick; then
    echo "✅ ImageMagick détecté, génération en cours..."

    # Générer favicon-16x16.png
    convert "$SOURCE_SVG" -density 256 -background none -resize 16x16 "$FAVICON_DIR/favicon-16x16.png"
    echo "  ✓ favicon-16x16.png créé"

    # Générer favicon-32x32.png
    convert "$SOURCE_SVG" -density 256 -background none -resize 32x32 "$FAVICON_DIR/favicon-32x32.png"
    echo "  ✓ favicon-32x32.png créé"

    # Générer apple-touch-icon.png
    convert "$SOURCE_SVG" -density 256 -background none -resize 180x180 "$FAVICON_DIR/apple-touch-icon.png"
    echo "  ✓ apple-touch-icon.png créé"

    # Générer favicon.ico (multi-résolutions)
    convert "$SOURCE_SVG" -density 256 -background none \
        \( -clone 0 -resize 16x16 \) \
        \( -clone 0 -resize 32x32 \) \
        \( -clone 0 -resize 48x48 \) \
        -delete 0 "$FAVICON_DIR/favicon.ico"
    echo "  ✓ favicon.ico créé (16x16, 32x32, 48x48)"

    echo ""
    echo "✅ Tous les favicons ont été générés avec succès !"

elif has_inkscape; then
    echo "✅ Inkscape détecté, génération en cours..."

    # Générer avec Inkscape
    inkscape "$SOURCE_SVG" --export-filename="$FAVICON_DIR/favicon-16x16.png" --export-width=16 --export-height=16
    echo "  ✓ favicon-16x16.png créé"

    inkscape "$SOURCE_SVG" --export-filename="$FAVICON_DIR/favicon-32x32.png" --export-width=32 --export-height=32
    echo "  ✓ favicon-32x32.png créé"

    inkscape "$SOURCE_SVG" --export-filename="$FAVICON_DIR/apple-touch-icon.png" --export-width=180 --export-height=180
    echo "  ✓ apple-touch-icon.png créé"

    echo ""
    echo "⚠️  favicon.ico doit être créé manuellement ou avec ImageMagick"
    echo "    Utilisez: https://realfavicongenerator.net/"

else
    echo "❌ Ni ImageMagick ni Inkscape n'est installé"
    echo ""
    echo "Pour installer ImageMagick:"
    echo "  macOS:  brew install imagemagick"
    echo "  Ubuntu: sudo apt-get install imagemagick"
    echo ""
    echo "Ou utilisez un générateur en ligne:"
    echo "  https://realfavicongenerator.net/"
    exit 1
fi

echo ""
echo "📦 Favicons disponibles dans: $FAVICON_DIR/"
ls -lh "$FAVICON_DIR"/*.png "$FAVICON_DIR"/*.ico 2>/dev/null || true

echo ""
echo "🚀 Vous pouvez maintenant installer le module quelyos_branding !"
