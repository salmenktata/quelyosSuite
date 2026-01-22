# Images de Fond Quelyos

⚠️ **IMPORTANT**: Placez vos images de fond dans ce dossier.

## Fichiers requis

### Background Login (MOYENNE PRIORITÉ)

1. **login_bg.jpg**
   - Dimensions: 1920x1080px (Full HD)
   - Format: JPG ou PNG
   - Utilisation: Page de connexion (partie gauche)
   - Poids: < 500 KB (optimisé)

2. **login_bg_mobile.jpg** (OPTIONNEL)
   - Dimensions: 640x1136px (portrait)
   - Format: JPG
   - Utilisation: Page de connexion mobile
   - Poids: < 200 KB

## Spécifications techniques

- **Format**: JPG (recommandé), PNG
- **Dimensions**: 1920x1080px minimum
- **Ratio**: 16:9 (landscape)
- **Qualité**: Haute résolution mais optimisée pour le web
- **Poids**: < 500 KB (compression WebP recommandée)
- **Orientation**: Paysage

## Style recommandé

### Pour une bonne image de fond de login:

- ✅ **Moderne**: Style contemporain, professionnel
- ✅ **Cohérente**: S'aligne avec l'identité Quelyos
- ✅ **Couleurs**: Bleu (#1e40af) ou tons neutres
- ✅ **Contraste**: Permet la lisibilité du texte blanc
- ✅ **Abstraite**: Motifs géométriques, gradients
- ✅ **Retail**: Évoque le commerce, la technologie

### Thèmes suggérés:

1. **Abstrait technologique**
   - Circuit imprimé stylisé
   - Réseaux de connexions
   - Formes géométriques bleues

2. **Retail moderne**
   - Point de vente stylisé
   - Shopping moderne (flou artistique)
   - E-commerce abstrait

3. **Dégradé de marque**
   - Dégradé bleu #1e40af → #3b82f6
   - Formes organiques
   - Design minimaliste

## Sources d'images

### Images libres de droits:

1. **Unsplash** - https://unsplash.com/
   - Recherche: "technology blue", "retail modern", "abstract business"
   - Gratuit, haute qualité

2. **Pexels** - https://pexels.com/
   - Recherche: "abstract blue", "modern retail", "tech background"
   - Gratuit

3. **Pixabay** - https://pixabay.com/
   - Recherche: "technology", "business", "modern"

### Images premium:

1. **Shutterstock** - https://shutterstock.com/
2. **Adobe Stock** - https://stock.adobe.com/
3. **iStock** - https://istockphoto.com/

### IA Generative:

1. **Midjourney** - https://midjourney.com/
   - Prompt: "modern retail technology background, blue gradient, abstract, professional, 16:9"

2. **DALL-E** - https://openai.com/dall-e
   - Prompt: "abstract blue technology background for login page, modern, professional"

## Optimisation

### Avant d'utiliser l'image:

1. **Redimensionner**: 1920x1080px exactement
2. **Compresser**: Utiliser TinyPNG, Squoosh.app
3. **Format WebP**: Pour meilleure compression (optionnel)
4. **Vérifier le poids**: < 500 KB

### Outils d'optimisation:

- **TinyPNG** - https://tinypng.com/
- **Squoosh** - https://squoosh.app/
- **ImageOptim** (Mac) - https://imageoptim.com/

## Utilisation dans le module

L'image de fond est utilisée:
- Page de connexion (partie gauche avec opacité 15%)
- Overlay bleu #1e40af par-dessus
- Logo et texte blanc affichés devant

## Test de l'image

Après avoir ajouté l'image:

1. Accéder à http://localhost:8069/web/login
2. Vérifier l'affichage sur desktop
3. Vérifier le responsive sur mobile
4. S'assurer que le texte blanc est lisible
5. Vérifier le temps de chargement

## Alternative: Pas d'image

Si vous n'avez pas d'image de fond:
- Le module utilisera un dégradé bleu uni
- Modifiez `_login.scss` et commentez la propriété `background-image`
- Le résultat sera un dégradé propre et professionnel

```scss
.quelyos_login_bg {
    // Commenter cette ligne si pas d'image:
    // background-image: url('/quelyos_branding/static/src/img/backgrounds/login_bg.jpg');
}
```

## Support

Pour toute question:
- Documentation: https://docs.quelyos.com
- Support: https://support.quelyos.com
