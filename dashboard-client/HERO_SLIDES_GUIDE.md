# 🎨 Guide Utilisation Hero Slides - Images

## 🚀 Démarrage Rapide (0 configuration)

### Option 1 : Images de Démonstration (Immédiat)

1. **Ouvrir** http://localhost:5173/hero-slides
2. **Cliquer** "Nouveau" ou modifier un slide existant
3. **Scroller** vers section "Images de démonstration"
4. **Cliquer** sur une des 4 images
5. **Sauvegarder**
6. ✅ **Résultat** : Image visible sur http://localhost:3000

### Option 2 : URL Manuelle (Immédiat)

1. **Trouver une image** sur [Unsplash.com](https://unsplash.com) ou [Pexels.com](https://pexels.com)
2. **Copier l'URL** de l'image (clic droit → Copier adresse de l'image)
3. **Coller** dans "Ou coller une URL d'image"
4. **Sauvegarder**
5. ✅ **Résultat** : Image visible sur homepage

---

## 🔍 Recherche Intelligente (Avec APIs configurées)

### Configuration Préalable

Suivre [IMAGE_API_SETUP.md](./IMAGE_API_SETUP.md) pour obtenir clés API gratuites.

### Utilisation

#### 1. Choisir Source
```
┌─────────────────────────────────────────┐
│  [ Les deux ]  [ Unsplash ]  [ Pexels ] │
└─────────────────────────────────────────┘
```
- **Les deux** : Maximum de résultats (recommandé)
- **Unsplash** : Images artistiques, haute qualité
- **Pexels** : Images commerciales, variété

#### 2. Rechercher
```
┌─────────────────────────────────────────┐
│  Ex: sport, fitness, promo...           │
│  [ Rechercher ]                         │
└─────────────────────────────────────────┘
```

**Mots-clés suggérés** :
- **Sport** : `basketball`, `football`, `running`, `fitness`
- **Promo** : `sale`, `discount`, `shopping`, `deals`
- **Lifestyle** : `health`, `wellness`, `yoga`, `training`
- **Business** : `success`, `team`, `office`, `startup`

#### 3. Sélectionner
```
┌────────┬────────┬────────┐
│ [U]    │ [P]    │ [U]    │  ← Badges source
│  Img1  │  Img2  │  Img3  │
└────────┴────────┴────────┘
```
- **U** = Unsplash
- **P** = Pexels
- Cliquer pour sélectionner
- ✓ apparaît sur image sélectionnée

#### 4. Preview & Sauvegarder
- Preview s'affiche automatiquement en haut
- Vérifier l'image
- Cliquer "Sauvegarder"

---

## 📐 Bonnes Pratiques Images

### Dimensions Recommandées
- **Largeur** : 1200px minimum
- **Hauteur** : 600px minimum
- **Ratio** : 2:1 (paysage)

### Critères de Sélection
✅ **Bonne image** :
- Haute résolution
- Contraste élevé (texte lisible par-dessus)
- Zone de texte claire (gauche ou droite)
- Orientation paysage
- Pas trop chargée

❌ **Éviter** :
- Images portrait (vertical)
- Trop sombres/claires
- Texte déjà présent sur l'image
- Basse résolution (<1200px)

### Exemples par Secteur

**E-commerce Sport** :
```
Mots-clés : basketball, running shoes, gym equipment
Format : Action shots, gros plans produits
```

**E-commerce Mode** :
```
Mots-clés : fashion, clothing, style, model
Format : Photos mannequins, lookbooks
```

**E-commerce Tech** :
```
Mots-clés : technology, gadgets, devices, innovation
Format : Gros plans produits, environnements modernes
```

---

## 🎯 Workflow Complet

### Créer un Slide de A à Z

```
1. Créer Slide
   ↓
2. Remplir Informations
   - Nom interne : "Promo Été 2026"
   - Titre : "Soldes d'été -50%"
   - Sous-titre : "Sur toute la collection"
   - Description : "Profitez de..."
   ↓
3. Sélectionner Image
   - Source : Les deux
   - Recherche : "summer sale sport"
   - Sélection : Cliquer image
   ↓
4. Configurer CTAs
   - Bouton principal : "Voir les promos" → /products?promo=true
   - Bouton secondaire : "Collection été" → /categories/summer
   ↓
5. Sauvegarder
   ↓
6. ✅ Slide visible sur Homepage
```

---

## 🔄 Workflow Modification Rapide

**Cas d'usage** : Changer image d'un slide existant

```
1. Cliquer sur ligne du slide dans tableau
   ↓
2. Section image s'ouvre automatiquement
   ↓
3. Rechercher nouvelle image OU coller URL
   ↓
4. Sauvegarder
   ↓
5. ✅ Image mise à jour instantanément (cache 5min)
```

---

## 💡 Astuces Pro

### Recherche Multi-Langues
Les APIs comprennent l'anglais et le français :
- ✅ `sport` ou `sports`
- ✅ `fitness` ou `remise en forme`
- ✅ `sale` ou `soldes`

### Combiner Sources
```
"Les deux" = Unsplash + Pexels mélangés
→ Plus de variété, plus de choix
```

### URL Externe Persistante
Une fois une image Unsplash/Pexels sélectionnée :
- ✅ URL stockée en base de données
- ✅ Pas de réupload nécessaire
- ✅ Image servie directement depuis CDN Unsplash/Pexels
- ✅ Haute performance

### A/B Testing
Créer 2+ slides avec images différentes :
1. Activer slide 1
2. Analyser conversions (external tool)
3. Activer slide 2
4. Comparer performances
5. Garder meilleur slide

---

## ❓ Questions Fréquentes

### "La recherche ne renvoie rien"
- Vérifier API keys dans `.env`
- Redémarrer `pnpm dev`
- Essayer mot-clé en anglais
- Tester source "Les deux" au lieu d'une seule

### "Image ne s'affiche pas sur Homepage"
- Vérifier slide "Actif" = Oui
- Vérifier dates début/fin
- Vider cache navigateur (Ctrl+Shift+R)
- Attendre 5min (cache ISR Next.js)

### "Quelle source choisir ?"
| Besoin | Source Recommandée |
|--------|-------------------|
| Maximum de choix | **Les deux** |
| Images artistiques | **Unsplash** |
| Images commerciales | **Pexels** |
| Pas d'API configuré | **Démo images** |

### "Puis-je utiliser mes propres images ?"
Oui, coller l'URL de votre image hébergée (CDN, Cloudinary, etc.)

---

## 🎨 Exemples Concrets

### Slide Promo Sport
```yaml
Nom: "Promo Basketball"
Titre: "Équipez-vous pour la saison"
Sous-titre: "Tout le matériel basket"
Image: Recherche "basketball court" → Pexels
CTA Principal: "Voir les produits" → /categories/basketball
CTA Secondaire: "Nos meilleures ventes" → /products?featured=true
```

### Slide Collection Nouveauté
```yaml
Nom: "Nouvelle Collection 2026"
Titre: "Découvrez nos nouveautés"
Sous-titre: "Printemps-Été 2026"
Image: Recherche "running shoes colorful" → Unsplash
CTA Principal: "Découvrir" → /products?new=true
CTA Secondaire: null
```

### Slide Urgence
```yaml
Nom: "Flash Sale"
Titre: "Flash Sale 24h ⚡"
Sous-titre: "Jusqu'à -70%"
Image: Recherche "sale shopping red" → Pexels
CTA Principal: "J'en profite" → /products?promo=flash
CTA Secondaire: "Voir tout" → /products
```

---

## 📊 Checklist Qualité Slide

Avant de sauvegarder, vérifier :

- [ ] **Nom interne** renseigné (pour vous retrouver)
- [ ] **Titre** clair et accrocheur (<60 caractères)
- [ ] **Image** haute résolution (preview nette)
- [ ] **Image** contraste suffisant (texte lisible)
- [ ] **CTA principal** texte actionnable ("Découvrir", "Acheter", "Profiter")
- [ ] **CTA principal** lien correct (teste avec clic)
- [ ] **Actif** = Oui
- [ ] **Dates** cohérentes (début avant fin)

---

## 🚀 Pour Aller Plus Loin

### Créer Thème Visuel Cohérent
1. Choisir palette couleurs dominantes
2. Rechercher images avec ces couleurs
3. Appliquer même filtre/style sur toutes images
4. → Identité visuelle forte

### Optimiser Conversions
- **Texte** : Courts, percutants, orientés action
- **Images** : Produits en situation, lifestyle
- **CTAs** : Urgence (Offre limitée), Bénéfice (Économisez)

### Multi-langue
Odoo supporte traductions :
- Créer slide français
- Interface Odoo permet traduire titre/description
- Même image pour toutes langues (universel)

---

## 📞 Support

**Documentation complète** : [IMAGE_API_SETUP.md](./IMAGE_API_SETUP.md)

**Problème technique** : Vérifier console navigateur (F12)

**Besoin d'aide** : Contacter équipe dev avec screenshot + message erreur
