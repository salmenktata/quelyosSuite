# Favicons Quelyos

⚠️ **IMPORTANT**: Placez vos favicons Quelyos dans ce dossier avant d'installer le module.

## Fichiers requis

### Favicons (HAUTE PRIORITÉ)

1. **favicon.ico**
   - Dimensions: Multiples (16x16, 32x32, 48x48)
   - Format: ICO
   - Utilisation: Navigateurs desktop
   - Icône Quelyos au format .ico

2. **favicon-16x16.png**
   - Dimensions: 16x16px
   - Format: PNG
   - Utilisation: Petite icône navigateur

3. **favicon-32x32.png**
   - Dimensions: 32x32px
   - Format: PNG
   - Utilisation: Icône navigateur standard

4. **apple-touch-icon.png**
   - Dimensions: 180x180px
   - Format: PNG
   - Utilisation: iOS (raccourci écran d'accueil)

5. **android-chrome-192x192.png** (OPTIONNEL)
   - Dimensions: 192x192px
   - Format: PNG
   - Utilisation: Android

6. **android-chrome-512x512.png** (OPTIONNEL)
   - Dimensions: 512x512px
   - Format: PNG
   - Utilisation: Android (haute résolution)

## Spécifications techniques

- **Format**: PNG pour les icônes individuelles, ICO pour favicon.ico
- **Fond**: Transparent ou couleur unie selon le design
- **Couleurs**: Utiliser la couleur primaire Quelyos (#1e40af)
- **Design**: Simple et reconnaissable à petite taille
- **Poids**: < 100 KB par fichier

## Génération des favicons

### Méthode 1: Outils en ligne (Recommandé)

1. **Favicon Generator** - https://realfavicongenerator.net/
   - Upload une image source (512x512px minimum)
   - Génère automatiquement toutes les tailles
   - Télécharge un package complet

2. **Favicon.io** - https://favicon.io/
   - Convertit logo en favicon
   - Génère toutes les tailles nécessaires

### Méthode 2: Manuellement

1. Créer une icône source (SVG ou PNG 512x512px)
2. Utiliser un éditeur d'images (Photoshop, GIMP, Figma)
3. Exporter aux différentes tailles requises
4. Convertir en .ico avec un outil comme IcoFX

### Méthode 3: Depuis le logo

Si vous avez le logo Quelyos:
1. Extraire juste l'icône/symbole (sans le texte)
2. Créer une version carrée
3. Simplifier pour être lisible à petite taille
4. Exporter aux tailles requises

## Design recommandé

### Pour un bon favicon:

- ✅ **Simple**: 2-3 couleurs maximum
- ✅ **Reconnaissable**: Visible à 16x16px
- ✅ **Carré**: Format 1:1
- ✅ **Contraste**: Bon contraste avec fond clair/foncé
- ✅ **Cohérent**: Reprendre l'identité visuelle Quelyos

### À éviter:

- ❌ Trop de détails
- ❌ Texte trop petit
- ❌ Dégradés complexes
- ❌ Formes trop fines

## Où sont utilisés les favicons ?

| Fichier | Utilisations |
|---------|--------------|
| `favicon.ico` | Onglets navigateur (tous navigateurs) |
| `favicon-16x16.png` | Chrome, Firefox (petite taille) |
| `favicon-32x32.png` | Safari, Edge (taille standard) |
| `apple-touch-icon.png` | iOS (raccourci écran d'accueil) |
| `android-chrome-*.png` | Android (raccourci, PWA) |

## Test des favicons

Après avoir ajouté les favicons:

1. Vider le cache du navigateur (Ctrl+Shift+R)
2. Accéder à http://localhost:8069
3. Vérifier l'icône dans l'onglet du navigateur
4. Tester sur mobile (iOS et Android)
5. Créer un raccourci sur écran d'accueil mobile

## Exemple de structure

```
favicon/
├── favicon.ico              (Navigateurs desktop)
├── favicon-16x16.png        (Petite taille)
├── favicon-32x32.png        (Taille standard)
├── apple-touch-icon.png     (iOS)
├── android-chrome-192x192.png (Android)
└── android-chrome-512x512.png (Android HD)
```

## Support

Pour toute question:
- Documentation: https://docs.quelyos.com
- Support: https://support.quelyos.com
