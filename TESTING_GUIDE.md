# 🧪 Guide de Tests Manuels - Améliorations UX/UI

## 🚀 Démarrage Rapide

```bash
# Terminal 1 : Backend Odoo
cd backend
docker-compose up -d

# Terminal 2 : Frontend Next.js
cd frontend
npm install  # Si première fois ou après pull
npm run dev
```

**URLs à tester :**
- Frontend : http://localhost:3000
- Page produits : http://localhost:3000/products
- Backend Odoo : http://localhost:8069

---

## 📱 Tests Mobile (PRIORITAIRE)

### 1. FilterDrawer Mobile ⭐⭐⭐

**Emplacement :** http://localhost:3000/products

**Procédure :**
1. Ouvrir sur mobile ou DevTools (F12 → Toggle device toolbar)
2. Vérifier que la sidebar filtres est cachée (< 1024px)
3. Bouton flottant vert visible en bas à droite
4. **Test 1 : Ouverture**
   - Cliquer sur le bouton flottant
   - Drawer monte depuis le bas avec animation slide-up
   - Overlay semi-transparent apparaît
5. **Test 2 : Swipe to close**
   - Glisser le handle (petite barre en haut) vers le bas
   - Drawer se ferme avec animation
6. **Test 3 : Filtres**
   - Cocher "Produits vedettes"
   - Badge compteur "1" apparaît sur bouton flottant
   - Cliquer "Voir les résultats"
   - Drawer se ferme, produits filtrés s'affichent
7. **Test 4 : Badge compteur**
   - Appliquer plusieurs filtres (vedettes + nouveautés + catégorie)
   - Badge affiche "3" ou plus
   - "Réinitialiser" efface tout

**✅ Résultat attendu :**
- Drawer fluide, pas de lag
- Swipe fonctionne naturellement
- Badge mis à jour en temps réel
- Overlay ferme drawer au clic

---

### 2. Bouton "Ajouter au Panier" Toujours Visible ⭐⭐⭐

**Emplacement :** http://localhost:3000/products

**Procédure :**
1. Mode mobile (< 1024px)
2. Scroller sur les cartes produits
3. **Sur mobile :** Bouton vert visible sans hover
4. **Sur desktop :** Bouton apparaît au hover

**Test avec variant en rupture :**
1. Trouver un produit avec stock 0
2. Bouton grisé "Rupture de stock"
3. Désactivé (cursor-not-allowed)

**✅ Résultat attendu :**
- Mobile : toujours visible (opacity-100)
- Desktop : apparaît au hover (opacity-0 → opacity-100)
- Rupture : bouton désactivé

---

### 3. Toast Notifications ⭐⭐⭐

**Emplacement :** http://localhost:3000/products/[n'importe-quel-produit]

**Procédure :**
1. Cliquer "Ajouter au panier"
2. Toast vert apparaît en haut à droite
3. Message : "Produit ajouté au panier !"
4. Disparaît après 3 secondes
5. Bouton X pour fermeture manuelle

**✅ Résultat attendu :**
- Animation slide-in-right fluide
- Auto-dismiss après 3s
- Fermeture manuelle fonctionne
- Ne bloque pas l'interaction (pas comme alert())

---

### 4. Galerie Images avec Swipe ⭐⭐⭐

**Emplacement :** http://localhost:3000/products/[produit-avec-plusieurs-images]

**Procédure :**
1. Mode mobile
2. **Swipe horizontal :**
   - Glisser l'image principale vers la gauche
   - Image suivante apparaît avec animation
   - Dots en bas se mettent à jour
3. **Thumbnails (desktop) :**
   - 4 miniatures en dessous
   - Cliquer sur une miniature
   - Image principale change
   - Bordure verte sur miniature active
4. **Modal Zoom :**
   - Cliquer sur image principale
   - Modal fullscreen s'ouvre
   - Navigation avec flèches (← →)
   - Escape pour fermer
5. **Keyboard nav (desktop) :**
   - Focus sur galerie
   - Touche → : image suivante
   - Touche ← : image précédente
   - Escape : ferme modal

**✅ Résultat attendu :**
- Swipe naturel, pas de glitch
- Animations fluides (spring physics)
- Modal s'ouvre instantanément
- Keyboard navigation fonctionne

---

### 5. Variants Touch-Friendly ⭐⭐

**Emplacement :** http://localhost:3000/products/[produit-avec-variants]

**Procédure :**
1. Page détail produit avec variants (ex: T-shirt avec couleurs/tailles)
2. Vérifier taille des boutons variants :
   - Min height 60px (min-h-15)
   - Largeur suffisante pour texte
   - Grille 2 colonnes mobile, 3 desktop
3. **Test sélection :**
   - Taper sur un variant
   - Checkmark apparaît en coin
   - Variant sélectionné = fond vert, texte blanc
   - Prix mis à jour si différent
4. **Test variant épuisé :**
   - Badge rouge "Épuisé" en coin
   - Bouton grisé, cursor-not-allowed

**✅ Résultat attendu :**
- Facile à taper (> 44x44px WCAG)
- Feedback visuel immédiat
- Animation scale au tap
- Prix dynamique

---

### 6. Pagination Moderne ⭐⭐

**Emplacement :** http://localhost:3000/products (si > 12 produits)

**Procédure :**
1. Scroller en bas de page
2. Pagination visible si > 1 page
3. **Test navigation :**
   - Cliquer "Suivant" → page 2
   - Scroll automatique vers le haut
   - Numéro page actif = fond vert
   - Ellipsis (...) si > 7 pages
4. **Test boutons :**
   - "Première" / "Dernière" (desktop)
   - Hover effects fonctionnent
   - Animations scale au clic
5. **Test info :**
   - Toolbar en haut : "Affichage 13-24 sur 45 articles"
   - Mis à jour à chaque page

**✅ Résultat attendu :**
- Design moderne et professionnel
- Scroll automatique smooth
- Ellipsis intelligents
- Désactivation correcte (première/dernière page)

---

## 🖥️ Tests Desktop

### 7. ProductGrid Animations ⭐⭐

**Emplacement :** http://localhost:3000/products

**Procédure :**
1. Recharger la page (Cmd/Ctrl + R)
2. Observer le chargement :
   - Skeletons apparaissent immédiatement
   - Produits apparaissent en cascade (stagger)
   - Délai ~80ms entre chaque carte
3. **Test filtre :**
   - Appliquer un filtre
   - Produits disparaissent avec fade-out
   - Nouveaux produits apparaissent avec stagger

**✅ Résultat attendu :**
- Animation fluide, pas de saccades
- Skeletons = même layout que produits
- Pas de layout shift

---

### 8. ActiveFilterChips ⭐⭐

**Emplacement :** http://localhost:3000/products

**Procédure :**
1. Appliquer plusieurs filtres :
   - Vedettes
   - Nouveautés
   - Catégorie "Sports"
   - Prix 50-200 TND
2. Chips apparaissent au-dessus de la grille
3. **Test retrait individuel :**
   - Cliquer X sur chip "Vedettes"
   - Chip disparaît avec animation scale-out
   - Filtre retiré, produits mis à jour
4. **Test "Tout effacer" :**
   - Cliquer "Tout effacer" (si > 1 filtre)
   - Tous les chips disparaissent
   - Réinitialisation complète

**✅ Résultat attendu :**
- Animations entrée/sortie fluides
- URL mise à jour (vérifier barre adresse)
- "Tout effacer" visible si > 1 filtre

---

### 9. RecentlyViewedCarousel ⭐⭐

**Emplacement :** http://localhost:3000/products

**Procédure :**
1. **Première visite :** Carousel n'apparaît pas (normal)
2. Visiter 3-4 produits différents :
   - Rester 1s+ sur chaque page détail
   - Retourner sur `/products`
3. Carousel apparaît en bas :
   - Titre "Récemment consultés"
   - 3-4 mini-cartes produits
   - Scroll horizontal
4. **Test boutons navigation :**
   - Flèches gauche/droite
   - Scroll fluide de 300px
5. **Test persistance :**
   - Fermer navigateur
   - Rouvrir → produits toujours présents

**✅ Résultat attendu :**
- Apparaît seulement si produits vus
- Persist dans localStorage
- Scroll horizontal smooth
- Max 10 produits, cleanup après 7j

---

### 10. URL Synchronisation ⭐⭐

**Emplacement :** http://localhost:3000/products

**Procédure :**
1. Appliquer des filtres :
   - Catégorie : Office
   - Prix : 50-200
   - Cocher "Nouveautés"
2. Observer URL : `?category=1&min_price=50&max_price=200&new=true`
3. **Test partage :**
   - Copier URL complète
   - Ouvrir nouvel onglet
   - Coller URL
   - → Filtres appliqués automatiquement
4. **Test navigation :**
   - Bouton Back du navigateur
   - Filtres se retirent correctement

**✅ Résultat attendu :**
- URL mise à jour en temps réel
- Shallow routing (pas de reload)
- Copier/coller fonctionne
- Historique navigateur OK

---

## ♿ Tests Accessibilité

### 11. Keyboard Navigation ⭐

**Procédure :**
1. Page produits : Tab pour naviguer
2. Filtres : Space pour cocher
3. Galerie images : ← → pour naviguer
4. Modal : Escape pour fermer
5. Vérifier focus visible (outline) sur tous éléments

**✅ Résultat attendu :**
- Navigation complète au clavier
- Focus visible (ring vert)
- Escape ferme modals/drawers

---

### 12. Screen Reader

**Procédure :**
1. Activer VoiceOver (Mac) ou NVDA (Windows)
2. Naviguer sur la page
3. Vérifier annonces :
   - Toast : role="alert"
   - Pagination : aria-label="Page X"
   - Boutons icône : aria-label présents

**✅ Résultat attendu :**
- ARIA labels corrects
- Annonces appropriées
- Structure sémantique

---

## 🔧 Tests de Régression

### 13. Fonctionnalités Existantes

**Vérifier que rien n'est cassé :**
- [ ] Ajout au panier fonctionne
- [ ] Wishlist fonctionne
- [ ] Compare fonctionne
- [ ] Search fonctionne
- [ ] Login/Register OK
- [ ] Checkout intact

---

## 📊 Tests Performance

### 14. Lighthouse (Chrome DevTools)

**Procédure :**
1. F12 → Lighthouse tab
2. Mode Mobile
3. Run audit
4. Vérifier scores :
   - Performance : > 90
   - Accessibility : > 95
   - Best Practices : > 90
   - SEO : > 90

**✅ Résultat attendu :**
- Tous scores > 90
- First Contentful Paint < 1.8s
- Time to Interactive < 3.5s

---

## 🐛 Bugs Connus & Workarounds

### Images Odoo
Si images ne chargent pas :
```bash
# Vérifier Odoo tourne
curl http://localhost:8069

# Vérifier config Next.js
cat frontend/next.config.ts | grep remotePatterns
```

### Framer Motion Peer Deps
Si erreur installation :
```bash
npm install framer-motion --legacy-peer-deps
```

### Toast n'apparaît pas
Vérifier `<ToastContainer />` dans layout.tsx ligne 33

---

## ✅ Checklist Finale

### Avant Déploiement
- [ ] Tous tests mobile passent
- [ ] Tous tests desktop passent
- [ ] Lighthouse score > 90
- [ ] Accessibilité validée
- [ ] Pas de console errors
- [ ] Images chargent correctement
- [ ] Régression tests OK

### Documentation
- [ ] UX_UI_IMPROVEMENTS_SUMMARY.md lu
- [ ] TESTING_GUIDE.md (ce fichier) suivi
- [ ] Équipe formée aux nouvelles features

---

**Prêt pour la production ! 🚀**
