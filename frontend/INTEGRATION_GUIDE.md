# Guide d'intégration des composants avancés

Ce guide explique comment intégrer les composants avancés (reviews, wishlist, comparison) dans vos pages produits.

## 1. ProductCard Component

### Localisation
`frontend/src/components/product/ProductCard.tsx`

### Modifications à apporter

```typescript
import { WishlistButton } from '@/components/product/WishlistButton';
import { CompareButton } from '@/components/product/CompareButton';

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Boutons wishlist et comparaison (en haut à droite) */}
      <div className="absolute top-2 right-2 flex gap-2 z-10">
        <WishlistButton productId={product.id} size="sm" />
        <CompareButton product={product} variant="icon" />
      </div>

      {/* Image produit */}
      <Link href={`/products/${product.slug}`}>
        {/* ... existing image code ... */}
      </Link>

      {/* Informations produit */}
      <div className="p-4">
        {/* ... existing product info ... */}

        {/* Note moyenne (si disponible) */}
        {product.avg_rating && product.avg_rating > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center">
              {Array.from({ length: 5 }, (_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(product.avg_rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-600">({product.review_count})</span>
          </div>
        )}

        {/* ... existing add to cart button ... */}
      </div>
    </div>
  );
}
```

---

## 2. ProductDetail Page

### Localisation
`frontend/src/app/products/[slug]/page.tsx`

### Modifications à apporter

#### 2.1 Imports
```typescript
import { WishlistButton } from '@/components/product/WishlistButton';
import { CompareButton } from '@/components/product/CompareButton';
import { ProductReviews } from '@/components/product/reviews/ProductReviews';
import { ProductRecommendations } from '@/components/product/ProductRecommendations';
import { ComparisonBar } from '@/components/product/ComparisonBar';
```

#### 2.2 State pour les reviews
```typescript
const [reviews, setReviews] = useState([]);
const [reviewStats, setReviewStats] = useState({
  average_rating: 0,
  total_reviews: 0,
  rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
});

useEffect(() => {
  if (product) {
    fetchReviews();
  }
}, [product]);

const fetchReviews = async () => {
  try {
    const response = await odooClient.getProductReviews(product.id);
    if (response.success) {
      setReviews(response.reviews);
      setReviewStats(response.stats);
    }
  } catch (error) {
    console.error('Error fetching reviews:', error);
  }
};
```

#### 2.3 Boutons actions (ligne ~359)
Remplacer la section actions par:

```typescript
<div className="flex gap-4 mb-4">
  <button
    onClick={handleAddToCart}
    disabled={!product.in_stock || isAddingToCart}
    className="flex-1 bg-[#01613a] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#024d2e] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
  >
    {/* ... existing button content ... */}
  </button>

  {isAuthenticated && (
    <>
      <WishlistButton productId={product.id} size="lg" showLabel />
      <CompareButton product={product} variant="button" />
    </>
  )}
</div>
```

#### 2.4 Section Reviews (après les tabs, ligne ~698)
```typescript
{/* Avis clients */}
<div className="mt-8">
  <ProductReviews
    productId={product.id}
    reviews={reviews}
    stats={reviewStats}
    onReviewSubmitted={fetchReviews}
  />
</div>
```

#### 2.5 Section Recommendations (ligne ~700)
```typescript
{/* Produits similaires */}
<div className="mt-8">
  <ProductRecommendations
    productId={product.id}
    type="similar"
    limit={4}
    title="Produits similaires"
  />
</div>

{/* Produits complémentaires */}
<div className="mt-8">
  <ProductRecommendations
    productId={product.id}
    type="complementary"
    limit={4}
    title="Souvent achetés ensemble"
  />
</div>
```

#### 2.6 ComparisonBar global (à la fin du JSX, ligne ~763)
```typescript
{/* Barre de comparaison */}
<ComparisonBar />
```

---

## 3. Layout global (optionnel)

### Localisation
`frontend/src/app/layout.tsx`

Si vous voulez que ComparisonBar soit visible sur toutes les pages:

```typescript
import { ComparisonBar } from '@/components/product/ComparisonBar';

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        {/* Barre de comparaison globale */}
        <ComparisonBar />
      </body>
    </html>
  );
}
```

---

## 4. Types TypeScript

Assurez-vous que vos interfaces Product incluent les champs nécessaires:

### Localisation
`frontend/src/types/index.ts`

```typescript
export interface Product {
  id: number;
  name: string;
  slug: string;
  // ... existing fields ...

  // Reviews
  avg_rating?: number;
  review_count?: number;
  rating_distribution?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };

  // Relations
  related_products?: Product[];
}

export interface Review {
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

export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
```

---

## 5. Odoo Client - Méthodes API

### Localisation
`frontend/src/lib/odoo/client.ts`

Ajoutez les méthodes suivantes à votre classe OdooClient:

```typescript
export class OdooClient {
  // ... existing methods ...

  /**
   * Get product reviews
   */
  async getProductReviews(productId: number, params: {
    limit?: number;
    offset?: number;
    sort_by?: 'recent' | 'helpful' | 'highest' | 'lowest';
  } = {}) {
    const { limit = 10, offset = 0, sort_by = 'recent' } = params;
    return this.request('POST', `/api/ecommerce/products/${productId}/reviews`, {
      limit,
      offset,
      sort_by
    });
  }

  /**
   * Submit a product review
   */
  async submitReview(productId: number, data: {
    rating: number;
    title: string;
    comment: string;
    images?: string[];
  }) {
    return this.request('POST', `/api/ecommerce/products/${productId}/reviews`, data);
  }

  /**
   * Mark review as helpful
   */
  async markReviewHelpful(reviewId: number) {
    return this.request('POST', `/api/ecommerce/reviews/${reviewId}/helpful`, {});
  }

  /**
   * Get wishlist
   */
  async getWishlist() {
    return this.request('GET', '/api/ecommerce/wishlist', {});
  }

  /**
   * Add to wishlist
   */
  async addToWishlist(productId: number) {
    return this.request('POST', '/api/ecommerce/wishlist/add', { product_id: productId });
  }

  /**
   * Remove from wishlist
   */
  async removeFromWishlist(productId: number) {
    return this.request('DELETE', `/api/ecommerce/wishlist/remove/${productId}`, {});
  }
}
```

---

## 6. Checklist d'intégration

### Backend Odoo
- [ ] Installer le module `quelyos_ecommerce` avec update
- [ ] Vérifier que les modèles sont créés (product.review, product.wishlist)
- [ ] Tester les endpoints API avec Postman/curl
- [ ] Approuver quelques reviews de test

### Frontend
- [ ] Mettre à jour ProductCard.tsx
- [ ] Mettre à jour ProductDetail page.tsx
- [ ] Ajouter ComparisonBar au layout ou aux pages
- [ ] Mettre à jour les types TypeScript
- [ ] Ajouter les méthodes API à OdooClient
- [ ] Tester les stores Zustand (wishlist, comparison)

### Tests
- [ ] Tester l'ajout de produits au wishlist
- [ ] Tester l'ajout de produits à la comparaison
- [ ] Tester la soumission d'un avis
- [ ] Tester le marquage d'avis comme utile
- [ ] Tester la navigation vers /compare

---

## 7. Dépannage

### Les stores ne persistent pas
Vérifiez que localStorage est accessible (mode SSR):
```typescript
if (typeof window !== 'undefined') {
  // Safe to use localStorage
}
```

### Les images ne se chargent pas
Vérifiez la configuration Next.js (`next.config.js`):
```javascript
images: {
  remotePatterns: [
    {
      hostname: 'localhost',
      port: '8069',
      pathname: '/web/image/**',
    },
  ],
}
```

### Les APIs retournent des erreurs 401
- Vérifiez que l'utilisateur est authentifié (`isAuthenticated`)
- Vérifiez que le cookie de session est envoyé
- Testez l'endpoint `/api/auth/session` d'abord

---

## 8. Ressources

- Documentation Zustand: https://docs.pmnd.rs/zustand
- Documentation Next.js: https://nextjs.org/docs
- ADVANCED_FEATURES.md pour les détails complets
