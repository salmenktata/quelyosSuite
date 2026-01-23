# Fonctionnalités Avancées - Quelyos E-commerce

Documentation complète des fonctionnalités avancées implémentées dans le frontend Next.js 14.

## 📊 Système d'Avis Produits (Reviews)

### Composants

#### 1. StarRating Component
**Localisation**: `frontend/src/components/product/reviews/StarRating.tsx`

**Fonctionnalités**:
- Affichage visuel de notes (1-5 étoiles)
- Mode interactif pour saisie de notes
- Mode affichage pour consultation
- Effet hover sur les étoiles
- Support de différentes tailles (sm, md, lg)
- Affichage du nombre d'avis

**Props**:
```typescript
interface StarRatingProps {
  rating: number;           // Note de 0 à 5
  interactive?: boolean;    // Mode saisie ou affichage
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;      // Afficher le nombre d'avis
  reviewCount?: number;     // Nombre total d'avis
}
```

**Utilisation**:
```tsx
// Mode affichage
<StarRating rating={4.5} size="md" showCount reviewCount={127} />

// Mode saisie
<StarRating
  rating={userRating}
  interactive
  onChange={(rating) => setUserRating(rating)}
/>
```

---

#### 2. ReviewItem Component
**Localisation**: `frontend/src/components/product/reviews/ReviewItem.tsx`

**Fonctionnalités**:
- Affichage d'un avis individuel
- Avatar utilisateur avec initiale
- Badge "Achat vérifié" pour les achats confirmés
- Date de publication formatée
- Bouton "Utile" avec compteur
- Images attachées (si disponibles)

**Props**:
```typescript
interface ReviewItemProps {
  review: Review;
  onHelpful: (reviewId: number) => void;
}

interface Review {
  id: number;
  user_name: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  verified_purchase: boolean;
  helpful_count: number;
  images?: string[];
}
```

**Utilisation**:
```tsx
<ReviewItem
  review={review}
  onHelpful={(id) => markReviewHelpful(id)}
/>
```

---

#### 3. ReviewForm Component
**Localisation**: `frontend/src/components/product/reviews/ReviewForm.tsx`

**Fonctionnalités**:
- Formulaire de soumission d'avis
- Sélection de note par étoiles
- Champ titre (requis, max 100 caractères)
- Champ commentaire (min 10 caractères, max 1000)
- Compteur de caractères en temps réel
- Validation côté client
- Upload d'images (optionnel, max 5)
- États de chargement

**Validation**:
- Note: Obligatoire (1-5 étoiles)
- Titre: 3-100 caractères
- Commentaire: 10-1000 caractères
- Images: Max 5, formats acceptés: JPG, PNG, WebP

**Utilisation**:
```tsx
<ReviewForm
  productId={product.id}
  onSubmit={async (data) => {
    const result = await submitReview(data);
    if (result.success) {
      setShowForm(false);
      refreshReviews();
    }
  }}
  onCancel={() => setShowForm(false)}
/>
```

---

#### 4. ProductReviews Component (Composant principal)
**Localisation**: `frontend/src/components/product/reviews/ProductReviews.tsx`

**Fonctionnalités**:
- Vue d'ensemble des avis produit
- Note moyenne et nombre total d'avis
- Distribution des notes (graphique à barres)
- Tri des avis (Récents, Utiles, Mieux notés, Moins bien notés)
- Pagination des avis
- Toggle affichage formulaire d'avis
- Résumé des points forts (tags)

**Props**:
```typescript
interface ProductReviewsProps {
  productId: number;
  reviews: Review[];
  stats: ReviewStats;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}
```

**Utilisation**:
```tsx
// Dans la page produit
<ProductReviews
  productId={product.id}
  reviews={reviews}
  stats={{
    average_rating: 4.3,
    total_reviews: 127,
    rating_distribution: {
      5: 65,
      4: 42,
      3: 15,
      2: 3,
      1: 2
    }
  }}
  onLoadMore={loadMoreReviews}
  hasMore={hasMoreReviews}
/>
```

---

## 🎯 Système de Recommandations

### ProductRecommendations Component
**Localisation**: `frontend/src/components/product/ProductRecommendations.tsx`

**Fonctionnalités**:
- Affichage de produits recommandés
- Multiple algorithmes de recommandation
- Grid responsive 2-4 colonnes
- Integration avec ProductGrid

**Types de recommandations**:

1. **similar** - Produits similaires
   - Même catégorie
   - Tags similaires
   - Gamme de prix comparable

2. **complementary** - Produits complémentaires
   - Souvent achetés ensemble
   - Accessoires
   - Bundles suggérés

3. **recently_viewed** - Récemment consultés
   - Historique local (localStorage)
   - Max 10 produits
   - FIFO (premier entré, premier sorti)

4. **popular** - Produits populaires
   - Meilleures ventes
   - Plus de vues
   - Mieux notés

**Props**:
```typescript
interface ProductRecommendationsProps {
  productId?: number;
  type: 'similar' | 'complementary' | 'recently_viewed' | 'popular';
  limit?: number;
  title?: string;
}
```

**Utilisation**:
```tsx
// Sur page produit
<ProductRecommendations
  productId={product.id}
  type="similar"
  limit={4}
  title="Produits similaires"
/>

// Sur homepage
<ProductRecommendations
  type="popular"
  limit={8}
  title="Meilleures ventes"
/>
```

---

## ❤️ Système de Wishlist (Liste de souhaits)

### Wishlist Store (Zustand)
**Localisation**: `frontend/src/store/wishlistStore.ts`

**State**:
```typescript
interface WishlistState {
  items: number[];              // IDs des produits
  isLoading: boolean;
  addToWishlist: (productId: number) => Promise<boolean>;
  removeFromWishlist: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
  fetchWishlist: () => Promise<void>;
  clearWishlist: () => void;
}
```

**Persistance**:
- localStorage: `quelyos-wishlist-storage`
- Synchronisation avec backend Odoo
- Fusion des données après login

**Actions**:

1. **addToWishlist(productId)**
   - Ajoute produit à la wishlist
   - Sync backend si authentifié
   - Retourne succès/échec

2. **removeFromWishlist(productId)**
   - Retire produit de la wishlist
   - Sync backend si authentifié

3. **isInWishlist(productId)**
   - Vérifie si produit est dans la wishlist
   - Recherche rapide O(n)

4. **fetchWishlist()**
   - Charge la wishlist depuis le backend
   - Merge avec données locales

---

### WishlistButton Component
**Localisation**: `frontend/src/components/product/WishlistButton.tsx`

**Fonctionnalités**:
- Bouton cœur toggle
- Icône pleine si dans wishlist
- Icône vide sinon
- Animation au clic
- Vérification authentification
- États de chargement

**Props**:
```typescript
interface WishlistButtonProps {
  productId: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}
```

**Utilisation**:
```tsx
// Sur ProductCard
<WishlistButton productId={product.id} size="md" />

// Sur ProductDetail
<WishlistButton
  productId={product.id}
  size="lg"
  showLabel
/>
```

---

## 🔄 Système de Comparaison

### Comparison Store (Zustand)
**Localisation**: `frontend/src/store/comparisonStore.ts`

**State**:
```typescript
interface ComparisonState {
  products: Product[];
  maxProducts: number;        // Limite: 4 produits
  addProduct: (product: Product) => boolean;
  removeProduct: (productId: number) => void;
  clearComparison: () => void;
  isInComparison: (productId: number) => boolean;
  canAddMore: () => boolean;
}
```

**Contraintes**:
- Maximum 4 produits en comparaison
- Persistance localStorage
- Même catégorie recommandée

**Actions**:

1. **addProduct(product)**
   - Ajoute produit si place disponible
   - Retourne false si limite atteinte
   - Affiche alerte utilisateur

2. **removeProduct(productId)**
   - Retire produit de la comparaison

3. **clearComparison()**
   - Vide toute la comparaison

4. **canAddMore()**
   - Vérifie si ajout possible
   - `products.length < maxProducts`

---

### CompareButton Component
**Localisation**: `frontend/src/components/product/CompareButton.tsx`

**Fonctionnalités**:
- Bouton toggle pour comparaison
- Badge indicateur (X/4)
- État actif/inactif
- Alert si limite atteinte

**Props**:
```typescript
interface CompareButtonProps {
  product: Product;
  variant?: 'icon' | 'button';
}
```

**Utilisation**:
```tsx
// Version icône
<CompareButton product={product} variant="icon" />

// Version bouton complet
<CompareButton product={product} variant="button" />
```

---

## 📋 Page de Comparaison

### ComparisonBar Component
**Localisation**: `frontend/src/components/product/ComparisonBar.tsx`

**Fonctionnalités**:
- Barre flottante en bas de l'écran
- Miniatures des produits comparés
- Bouton de suppression par produit
- Bouton "Comparer maintenant"
- Affichage uniquement si produits ajoutés

**Affichage**:
```
[🖼️ Product 1 ×] [🖼️ Product 2 ×] [🖼️ Product 3 ×]  [Comparer (3/4)]
```

**Navigation**:
- Clic sur "Comparer" → `/compare`
- Affiche tableau comparatif

---

### Page Comparaison (/compare)
**À créer**: `frontend/src/app/compare/page.tsx`

**Fonctionnalités prévues**:
- Tableau côte-à-côte
- Attributs comparables:
  - Image
  - Nom
  - Prix
  - Note
  - Disponibilité
  - Caractéristiques techniques
  - Avis clients
- Actions:
  - Ajouter au panier depuis comparaison
  - Retirer de la comparaison
  - Voir détail produit

---

## 🔧 Intégration Backend Odoo

### API Endpoints requis

#### Reviews
```typescript
// GET /api/ecommerce/products/:id/reviews
interface ReviewsResponse {
  reviews: Review[];
  stats: ReviewStats;
  total: number;
}

// POST /api/ecommerce/products/:id/reviews
interface SubmitReviewRequest {
  rating: number;
  title: string;
  comment: string;
  images?: File[];
}

// POST /api/ecommerce/reviews/:id/helpful
interface MarkHelpfulRequest {
  helpful: boolean;
}
```

#### Wishlist
```typescript
// GET /api/ecommerce/wishlist
interface WishlistResponse {
  items: number[];  // Product IDs
}

// POST /api/ecommerce/wishlist/add
interface AddToWishlistRequest {
  product_id: number;
}

// DELETE /api/ecommerce/wishlist/remove/:product_id
```

#### Recommendations
```typescript
// GET /api/ecommerce/products/:id/recommendations
interface RecommendationsRequest {
  type: 'similar' | 'complementary';
  limit?: number;
}

interface RecommendationsResponse {
  products: Product[];
}
```

---

## 📦 Installation et Configuration

### 1. Dépendances
Toutes les dépendances sont déjà installées (Next.js 14, Zustand, Tailwind CSS).

### 2. Configuration State Stores

Les stores sont déjà configurés avec persistance:
- `wishlistStore.ts` → localStorage: `quelyos-wishlist-storage`
- `comparisonStore.ts` → localStorage: `quelyos-comparison-storage`

### 3. Intégration dans les pages

#### Page Produit ([slug]/page.tsx)
Ajouter les composants avancés:

```tsx
import { ProductReviews } from '@/components/product/reviews/ProductReviews';
import { ProductRecommendations } from '@/components/product/ProductRecommendations';
import { WishlistButton } from '@/components/product/WishlistButton';
import { CompareButton } from '@/components/product/CompareButton';
import { ComparisonBar } from '@/components/product/ComparisonBar';

export default function ProductDetailPage() {
  // ... existing code

  return (
    <>
      {/* Existing product detail */}

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleAddToCart}>Ajouter au panier</Button>
        <WishlistButton productId={product.id} size="lg" />
        <CompareButton product={product} />
      </div>

      {/* Reviews */}
      <ProductReviews
        productId={product.id}
        reviews={reviews}
        stats={reviewStats}
      />

      {/* Recommendations */}
      <ProductRecommendations
        productId={product.id}
        type="similar"
        limit={4}
        title="Produits similaires"
      />

      {/* Comparison Bar (global) */}
      <ComparisonBar />
    </>
  );
}
```

#### ProductCard Component
Ajouter boutons wishlist et comparaison:

```tsx
import { WishlistButton } from '@/components/product/WishlistButton';
import { CompareButton } from '@/components/product/CompareButton';

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="product-card">
      {/* Image, name, price */}

      <div className="absolute top-2 right-2 flex gap-2">
        <WishlistButton productId={product.id} size="sm" />
        <CompareButton product={product} variant="icon" />
      </div>

      {/* Add to cart button */}
    </div>
  );
}
```

---

## 🎨 Personnalisation

### Couleurs
Les composants utilisent la palette Quelyos:
- Primary: `#01613a` (vert foncé)
- Secondary: `#028a52` (vert clair)
- Accent: `#c9c18f` (doré)

### Textes et labels
Tous les textes sont en français. Pour modifier:
- Reviews: `frontend/src/components/product/reviews/*.tsx`
- Wishlist: `frontend/src/components/product/WishlistButton.tsx`
- Comparison: `frontend/src/components/product/CompareButton.tsx`

---

## 📊 Métriques et Analytics

### Événements à tracker

1. **Reviews**:
   - `review_submitted` - Avis soumis
   - `review_helpful_clicked` - Avis marqué utile
   - `review_filter_changed` - Tri modifié

2. **Wishlist**:
   - `wishlist_added` - Produit ajouté
   - `wishlist_removed` - Produit retiré
   - `wishlist_viewed` - Page wishlist consultée

3. **Comparison**:
   - `comparison_added` - Produit ajouté à comparaison
   - `comparison_removed` - Produit retiré
   - `comparison_viewed` - Page comparaison consultée

---

## 🔒 Sécurité

### Authentification
- Wishlist: Requiert authentification pour sync backend
- Reviews: Requiert authentification pour soumission
- Comparison: Fonctionne sans authentification (localStorage)

### Validation
- Reviews: Validation côté client + backend
- Upload images: Taille max 5MB, formats autorisés
- XSS Protection: Sanitization des commentaires côté backend

---

## 🧪 Tests

### Tests unitaires recommandés

1. **Stores**:
   ```typescript
   describe('wishlistStore', () => {
     it('should add product to wishlist');
     it('should remove product from wishlist');
     it('should persist to localStorage');
   });
   ```

2. **Components**:
   ```typescript
   describe('StarRating', () => {
     it('should display correct number of stars');
     it('should handle click in interactive mode');
     it('should not handle click in display mode');
   });
   ```

### Tests E2E (Playwright)

```typescript
test('User can submit a review', async ({ page }) => {
  await page.goto('/products/product-slug');
  await page.click('text=Écrire un avis');
  await page.click('[data-star="5"]');
  await page.fill('[name="title"]', 'Excellent produit');
  await page.fill('[name="comment"]', 'Très satisfait de mon achat...');
  await page.click('text=Publier mon avis');
  await expect(page.locator('text=Avis publié avec succès')).toBeVisible();
});
```

---

## 📚 Ressources

### Documentation Odoo
- [Product Reviews Module](https://www.odoo.com/documentation/19.0/applications/website/ecommerce/reviews.html)
- [Wishlist Implementation](https://www.odoo.com/documentation/19.0/developer/reference/backend/orm.html)

### Documentation Next.js
- [Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

### Zustand
- [State Persistence](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)
- [Best Practices](https://docs.pmnd.rs/zustand/getting-started/introduction#best-practices)

---

## 🚀 Prochaines Étapes

1. **Backend Odoo**:
   - [ ] Créer modèle `product.review`
   - [ ] Implémenter API reviews
   - [ ] Créer modèle `product.wishlist`
   - [ ] Implémenter API wishlist

2. **Frontend**:
   - [ ] Créer page `/compare`
   - [ ] Ajouter ComparisonBar global
   - [ ] Intégrer composants dans ProductCard
   - [ ] Ajouter analytics tracking

3. **Tests**:
   - [ ] Tests unitaires stores
   - [ ] Tests unitaires composants
   - [ ] Tests E2E parcours complet

4. **Documentation**:
   - [ ] Guide utilisateur avis
   - [ ] Guide utilisateur wishlist
   - [ ] Guide utilisateur comparaison

---

## ✅ Checklist d'implémentation

### Reviews ✓
- [x] StarRating component
- [x] ReviewItem component
- [x] ReviewForm component
- [x] ProductReviews component
- [ ] Backend API
- [ ] Tests

### Wishlist ✓
- [x] wishlistStore (Zustand)
- [x] WishlistButton component
- [ ] Page /wishlist
- [ ] Backend API
- [ ] Tests

### Comparison ✓
- [x] comparisonStore (Zustand)
- [x] CompareButton component
- [x] ComparisonBar component (partiellement)
- [ ] Page /compare
- [ ] Tests

### Recommendations ✓
- [x] ProductRecommendations component
- [ ] Backend algorithmes
- [ ] Tests

---

**Statut global**: 🟢 **Frontend 85% complet** | 🔴 **Backend 0% complet**

**Prochaine priorité**: Implémenter les APIs backend Odoo pour reviews et wishlist.
