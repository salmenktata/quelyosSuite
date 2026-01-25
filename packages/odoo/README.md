# @quelyos/odoo

Unified Odoo client for Quelyos Suite monorepo.

## Features

✅ **Universal** - Works in Next.js SSR, Client, and Vite
✅ **Type-safe** - Full TypeScript types for Odoo models
✅ **60+ Methods** - High-level business API
✅ **ORM Access** - Low-level search, read, create, write, unlink
✅ **Auto-detect** - Automatic environment detection
✅ **Session Management** - Built-in authentication

## Installation

```bash
# Already installed in monorepo workspace
npm install
```

## Usage

### High-level API (Recommended)

```typescript
import { odooClient } from '@quelyos/odoo';

// Products
const products = await odooClient.getProducts({
  limit: 10,
  category_id: 5
});

// Cart
await odooClient.addToCart(product_id, 1);
const cart = await odooClient.getCart();

// Checkout
await odooClient.confirmOrder({
  shipping_address_id: 123,
  delivery_method_id: 1,
  payment_method: 'stripe'
});

// Authentication
const result = await odooClient.login('user@example.com', 'password');
```

### Low-level ORM

```typescript
import { odooRpc } from '@quelyos/odoo';

// Search products
const products = await odooRpc.search('product.product', [
  ['sale_ok', '=', true],
  ['active', '=', true]
], {
  fields: ['name', 'list_price', 'qty_available'],
  limit: 10,
  order: 'name ASC'
});

// Create record
const id = await odooRpc.create('res.partner', {
  name: 'John Doe',
  email: 'john@example.com'
});

// Update record
await odooRpc.write('res.partner', [id], {
  phone: '+1234567890'
});

// Delete record
await odooRpc.unlink('res.partner', [id]);
```

### Environment Detection

```typescript
import { detectEnvironment, getOdooConfig } from '@quelyos/odoo';

const env = detectEnvironment(); // 'server' | 'client' | 'vite'
const config = getOdooConfig();

console.log(config.baseURL); // Auto-configured per environment
```

### TypeScript Types

```typescript
import type {
  OdooProduct,
  OdooCategory,
  OdooSaleOrder,
  OdooResponse
} from '@quelyos/odoo';

const product: OdooProduct = {
  id: 1,
  name: 'Example Product',
  list_price: 99.99,
  qty_available: 10
};

const response: OdooResponse<{ products: OdooProduct[] }> =
  await odooClient.getProducts();
```

## API Reference

### Authentication
- `login(email, password)`
- `logout()`
- `register(data)`
- `getSession()`

### Products
- `getProducts(filters)`
- `getProduct(id)`
- `getProductBySlug(slug)`
- `getProductVariants(id)`
- `createProduct(data)`
- `updateProduct(id, data)`
- `deleteProduct(id)`

### Cart & Checkout
- `getCart()`
- `addToCart(product_id, quantity)`
- `updateCartLine(line_id, quantity)`
- `removeCartLine(line_id)`
- `clearCart()`
- `validateCart()`
- `calculateShipping(delivery_method_id)`
- `confirmOrder(data)`

### Orders
- `getOrders(filters)`
- `getOrder(id)`
- `cancelOrder(id)`

### Customers
- `getCustomers(filters)`
- `getCustomer(id)`
- `updateCustomer(id, data)`

### Categories
- `getCategories(filters)`
- `getCategory(id)`
- `createCategory(data)`
- `updateCategory(id, data)`
- `deleteCategory(id)`

### Wishlist
- `getWishlist()`
- `addToWishlist(product_id)`
- `removeFromWishlist(product_id)`
- `shareWishlist()`

### CMS
- `getSiteConfig()`
- `updateSiteConfig(data)`
- `getMenus(code?)`
- `getHeroSlides()`
- `getPromoBanners()`
- `getTrustBadges()`

### And 40+ more methods...

## Environment Variables

### Next.js (e-commerce)
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3006
ODOO_DATABASE=quelyos
```

### Vite (backoffice)
```env
VITE_API_URL=http://localhost:8069
VITE_ODOO_DATABASE=quelyos
```

## Architecture

```
@quelyos/odoo
├── src/
│   ├── client.ts      # High-level business API (60+ methods)
│   ├── rpc.ts         # Low-level JSON-RPC client + ORM
│   ├── config.ts      # Environment detection
│   ├── types.ts       # TypeScript types (30+ interfaces)
│   └── index.ts       # Exports
└── package.json
```

## License

MIT
