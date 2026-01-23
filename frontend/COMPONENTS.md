# 📦 Guide des Composants Frontend - Quelyos

Documentation des composants React créés pour le frontend Next.js.

## 🎨 Composants UI de Base

### Button

Bouton personnalisable avec variantes et états de chargement.

**Import:**
```typescript
import { Button } from '@/components/common';
```

**Usage:**
```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Ajouter au panier
</Button>

<Button variant="outline" isLoading={loading}>
  Enregistrer
</Button>

<Button variant="ghost" fullWidth>
  Continuer
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `isLoading`: boolean
- `fullWidth`: boolean
- + Toutes les props HTML button

### Input

Champ de saisie avec label, erreur et icône optionnelle.

**Import:**
```typescript
import { Input } from '@/components/common';
```

**Usage:**
```tsx
<Input
  label="Email"
  type="email"
  placeholder="votre@email.com"
  required
  error={errors.email}
  helperText="Nous ne partagerons jamais votre email"
  icon={<MailIcon />}
/>
```

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `icon`: ReactNode
- + Toutes les props HTML input

### Card

Carte conteneur avec effet hover optionnel.

**Import:**
```typescript
import { Card } from '@/components/common';
```

**Usage:**
```tsx
<Card hover onClick={handleClick}>
  <div className="p-4">
    Contenu de la carte
  </div>
</Card>
```

**Props:**
- `hover`: boolean - Active l'effet hover
- `onClick`: () => void
- `className`: string

### Badge

Badge pour afficher des tags ou statuts.

**Import:**
```typescript
import { Badge } from '@/components/common';
```

**Usage:**
```tsx
<Badge variant="success">Nouveau</Badge>
<Badge variant="danger">Épuisé</Badge>
<Badge variant="primary" size="md">Promo -20%</Badge>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
- `size`: 'sm' | 'md'

### Loading

Indicateur de chargement avec spinner.

**Import:**
```typescript
import { Loading } from '@/components/common';
```

**Usage:**
```tsx
<Loading size="md" text="Chargement..." />
<Loading size="lg" fullScreen /> {/* Plein écran */}
```

**Props:**
- `size`: 'sm' | 'md' | 'lg'
- `text`: string
- `fullScreen`: boolean

---

## 🛍️ Composants Produits

### ProductCard

Carte produit complète avec image, prix, badges et bouton panier.

**Import:**
```typescript
import { ProductCard } from '@/components/product';
```

**Usage:**
```tsx
<ProductCard product={product} />
```

**Fonctionnalités:**
- ✅ Image du produit avec lazy loading
- ✅ Badges (Nouveau, Vedette, Épuisé)
- ✅ Prix formaté avec devise
- ✅ Bouton "Ajouter au panier" avec état de chargement
- ✅ Bouton wishlist (icône coeur)
- ✅ Lien vers page détail produit

**Props:**
- `product`: Product (type défini dans @/types)

### ProductGrid

Grille responsive pour afficher plusieurs produits.

**Import:**
```typescript
import { ProductGrid } from '@/components/product';
```

**Usage:**
```tsx
<ProductGrid 
  products={products} 
  isLoading={loading}
  columns={4}
/>
```

**Fonctionnalités:**
- ✅ Grille responsive (1-4 colonnes selon l'écran)
- ✅ État de chargement avec spinner
- ✅ Message "Aucun produit" si liste vide
- ✅ Utilise ProductCard pour chaque produit

**Props:**
- `products`: Product[]
- `isLoading`: boolean
- `columns`: 2 | 3 | 4 (défaut: 4)

---

## 🧭 Composants Layout

### Header

En-tête principal avec logo, recherche, navigation et panier.

**Import:**
```typescript
import { Header } from '@/components/layout';
```

**Usage:**
```tsx
<Header />
```

**Fonctionnalités:**
- ✅ Logo Quelyos cliquable (retour home)
- ✅ Barre de recherche avec soumission
- ✅ Navigation principale (Produits, Nouveautés, etc.)
- ✅ Icône panier avec compteur d'articles
- ✅ Bouton Login/Compte selon état authentification
- ✅ Barre supérieure avec contact et livraison
- ✅ Responsive mobile

**État utilisé:**
- `useCartStore` - Pour compteur panier
- `useAuthStore` - Pour état authentification

### Footer

Pied de page avec liens, newsletter et réseaux sociaux.

**Import:**
```typescript
import { Footer } from '@/components/layout';
```

**Usage:**
```tsx
<Footer />
```

**Fonctionnalités:**
- ✅ 4 colonnes (À propos, Liens, Service, Newsletter)
- ✅ Liens réseaux sociaux (Facebook, Twitter, Instagram)
- ✅ Formulaire newsletter
- ✅ Icônes moyens de paiement
- ✅ Copyright dynamique avec année actuelle
- ✅ Responsive mobile

---

## 📱 Utilisation avec Zustand

Les composants utilisent les stores Zustand pour la gestion d'état.

### Exemple: Panier

```tsx
import { useCartStore } from '@/store/cartStore';

function MyComponent() {
  const cart = useCartStore((state) => state.cart);
  const addToCart = useCartStore((state) => state.addToCart);
  const isLoading = useCartStore((state) => state.isLoading);

  const handleAdd = async () => {
    await addToCart(productId, quantity);
  };

  return (
    <div>
      {cart && <p>{cart.item_count} articles</p>}
      <Button onClick={handleAdd} isLoading={isLoading}>
        Ajouter
      </Button>
    </div>
  );
}
```

### Exemple: Authentification

```tsx
import { useAuthStore } from '@/store/authStore';

function MyComponent() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);

  if (!isAuthenticated) {
    return <Button onClick={() => login(email, pass)}>Login</Button>;
  }

  return <p>Bonjour {user?.name}</p>;
}
```

---

## 🎨 Personnalisation Couleurs

Les composants utilisent les couleurs Quelyos définies dans Tailwind:

```css
/* Couleur primaire (vert foncé) */
bg-[#01613a]
text-[#01613a]
border-[#01613a]
hover:bg-[#014d2e]

/* Couleur secondaire (beige/doré) */
bg-[#c9c18f]
text-[#c9c18f]
```

Pour modifier les couleurs, éditer `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      primary: '#01613a',
      secondary: '#c9c18f',
    },
  },
},
```

---

## 📝 Exemple Complet: Page Produits

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { odooClient } from '@/lib/odoo/client';
import { ProductGrid } from '@/components/product';
import { Product } from '@/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await odooClient.getProducts({ limit: 20 });
        if (response.success && response.products) {
          setProducts(response.products);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Nos Produits</h1>
      <ProductGrid products={products} isLoading={loading} columns={4} />
    </div>
  );
}
```

---

## 🚀 Prochaines Étapes

### Composants à Créer

**Panier:**
- [ ] `CartDrawer` - Tiroir latéral panier
- [ ] `CartItem` - Ligne article panier
- [ ] `CartSummary` - Résumé totaux panier

**Checkout:**
- [ ] `CheckoutForm` - Formulaire checkout
- [ ] `PaymentForm` - Formulaire paiement
- [ ] `ShippingForm` - Formulaire livraison

**Compte:**
- [ ] `ProfileForm` - Formulaire profil
- [ ] `OrderList` - Liste commandes
- [ ] `OrderDetail` - Détail commande

---

## 📚 Ressources

- **Types TypeScript:** `src/types/index.ts`
- **Client API:** `src/lib/odoo/client.ts`
- **Stores Zustand:** `src/store/`
- **Tailwind Config:** `tailwind.config.ts`

---

**Version:** 1.0.0  
**Date:** 23 Janvier 2026  
**Statut:** ✅ Composants de base complets
