# Illustrations Quelyos

⚠️ **IMPORTANT**: Placez vos illustrations SVG dans ce dossier.

## Fichiers requis

### Illustrations (MOYENNE PRIORITÉ)

1. **empty_state.svg**
   - Format: SVG
   - Utilisation: Vues vides (listes, kanban sans données)
   - Style: Moderne, épuré, couleurs Quelyos
   - Dimensions: ~300x300px

2. **error_404.svg**
   - Format: SVG
   - Utilisation: Page d'erreur 404 (page non trouvée)
   - Style: Amical, pas trop sérieux
   - Dimensions: ~400x400px

3. **error_500.svg** (OPTIONNEL)
   - Format: SVG
   - Utilisation: Page d'erreur 500 (erreur serveur)
   - Style: Technique mais rassurant
   - Dimensions: ~400x400px

4. **maintenance.svg** (OPTIONNEL)
   - Format: SVG
   - Utilisation: Page de maintenance
   - Style: Temporaire, en cours
   - Dimensions: ~400x400px

## Spécifications techniques

- **Format**: SVG (vectoriel)
- **Couleurs**: Utiliser la palette Quelyos
  - Primaire: #1e40af
  - Secondaire: #10b981
  - Gris: #6b7280
- **Style**: Flat design, moderne, minimaliste
- **Poids**: < 50 KB par fichier
- **Optimisation**: SVG optimisé (SVGO)

## Style recommandé

### Caractéristiques des illustrations:

- ✅ **Flat design**: Style plat et moderne
- ✅ **Couleurs limitées**: 2-4 couleurs maximum
- ✅ **Cohérence**: Même style pour toutes les illustrations
- ✅ **Simplicité**: Formes simples et claires
- ✅ **Optimistes**: Ton positif et encourageant

### Empty State (Vues vides)

Thèmes suggérés:
- Boîte vide avec loupe
- Document vide avec icône +
- Tableau de bord vide
- Panier de shopping vide (pour e-commerce)

Message à transmettre: "Rien pour l'instant, ajoutez du contenu !"

### Error 404

Thèmes suggérés:
- Astronaute perdu dans l'espace
- Carte routière avec point d'interrogation
- Personne avec jumelles cherchant
- Robot confus

Message à transmettre: "Oups, page introuvable, mais on va vous aider !"

## Sources d'illustrations

### Illustrations gratuites:

1. **unDraw** - https://undraw.co/
   - Illustrations personnalisables
   - Changez la couleur primaire en #1e40af
   - Cherchez: "empty", "not found", "404"

2. **Storyset** - https://storyset.com/
   - Illustrations animées et statiques
   - Personnalisables
   - Gratuit avec attribution

3. **Humaaans** - https://humaaans.com/
   - Personnages modulaires
   - Créez vos propres scènes

4. **DrawKit** - https://drawkit.com/
   - Collections gratuites
   - Style cohérent

### Illustrations premium:

1. **Lottie Files** - https://lottiefiles.com/
   - Animations légères
   - Format JSON

2. **Noun Project** - https://thenounproject.com/
   - Icônes et illustrations
   - Payant mais abordable

### IA Generative:

**Midjourney** - https://midjourney.com/
```
Prompt: "flat design illustration for empty state, modern, blue #1e40af, minimalist, professional, SVG style --ar 1:1"
```

**DALL-E** - https://openai.com/dall-e
```
Prompt: "minimalist flat design illustration showing empty state, blue and green colors, modern tech style, simple shapes"
```

## Création manuelle

Si vous créez vos illustrations:

### Outils:

- **Figma** - https://figma.com/ (gratuit)
- **Adobe Illustrator** - https://adobe.com/illustrator
- **Inkscape** - https://inkscape.org/ (gratuit, open-source)
- **Vectr** - https://vectr.com/ (gratuit)

### Process:

1. Créer un artboard de 300x300px ou 400x400px
2. Utiliser des formes simples (cercles, rectangles, chemins)
3. Appliquer les couleurs Quelyos
4. Exporter en SVG
5. Optimiser avec SVGO

## Optimisation SVG

### Outils d'optimisation:

1. **SVGO** - https://github.com/svg/svgo
   ```bash
   npm install -g svgo
   svgo empty_state.svg
   ```

2. **SVGOMG** - https://jakearchibald.github.io/svgomg/
   - Version en ligne de SVGO
   - Interface graphique
   - Compression instantanée

### Checklist d'optimisation:

- [ ] Supprimer les métadonnées
- [ ] Supprimer les commentaires
- [ ] Minifier les chemins
- [ ] Simplifier les transformations
- [ ] Fusionner les chemins similaires
- [ ] Poids final < 50 KB

## Intégration dans le code

Les illustrations sont référencées dans:

```xml
<!-- Empty state -->
<img src="/quelyos_branding/static/src/img/illustrations/empty_state.svg"
     alt="Aucun contenu"/>

<!-- Error 404 -->
<img src="/quelyos_branding/static/src/img/illustrations/error_404.svg"
     alt="404"/>
```

## Alternative: Utiliser des icônes

Si vous n'avez pas d'illustrations:
- Utiliser Font Awesome ou Material Icons
- Icônes géantes avec couleur Quelyos
- Moins visuel mais fonctionnel

Exemple:
```html
<i class="fa fa-inbox" style="font-size: 100px; color: #1e40af;"></i>
```

## Test des illustrations

Après avoir ajouté les illustrations:

1. Vider une liste/kanban pour voir empty state
2. Accéder à une page inexistante (404)
3. Vérifier que les SVG se chargent
4. Vérifier le rendu sur mobile
5. Vérifier que les couleurs sont cohérentes

## Support

Pour toute question:
- Documentation: https://docs.quelyos.com
- Support: https://support.quelyos.com
