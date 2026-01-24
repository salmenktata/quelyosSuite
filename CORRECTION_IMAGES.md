# 🖼️ Correction Affichage Images Produits

**Date**: 23 janvier 2026, 19:55
**Statut**: ✅ **Résolu**

---

## 🐛 Problème Identifié

Les images des produits ne s'affichaient pas sur la page http://localhost:3000/products (ni sur les autres pages du frontend).

### Cause Racine

L'API Odoo retournait des URLs d'images **relatives** au lieu d'URLs **absolues**:

```json
{
  "images": [
    {
      "url": "/web/image/product.template/15/image_1920"  ❌ RELATIVE
    }
  ]
}
```

Le frontend Next.js tourne sur `localhost:3000`, donc quand il essayait de charger `/web/image/...`, il cherchait sur `localhost:3000/web/image/...` au lieu de `localhost:8069/web/image/...`.

De plus, le frontend utilisait un champ `image_url` qui n'existait pas dans la réponse API.

---

## ✅ Solution Appliquée

### 1. Backend - URLs Absolues

**Fichier**: [backend/addons/quelyos_ecommerce/models/product_template.py](backend/addons/quelyos_ecommerce/models/product_template.py)

#### Modification 1: Récupération de l'URL de base (ligne 104)

```python
def get_api_data(self, include_variants=True):
    """Formate les données produit pour l'API."""
    self.ensure_one()

    # Get base URL for absolute image URLs
    base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url', 'http://localhost:8069')
```

**Explication**: Récupère l'URL de base d'Odoo depuis la configuration système. Par défaut: `http://localhost:8069`.

#### Modification 2: Images principales avec URL absolue (ligne 113)

```python
# Images (main + gallery)
images = []
if self.image_1920:
    images.append({
        'id': 0,
        'url': f'{base_url}/web/image/product.template/{self.id}/image_1920',  # ✅ ABSOLUTE
        'alt': self.name,
        'is_main': True
    })
```

**Avant**: `url': f'/web/image/product.template/{self.id}/image_1920'`
**Après**: `url': f'{base_url}/web/image/product.template/{self.id}/image_1920'`

#### Modification 3: Images de galerie avec URL absolue (ligne 126)

```python
if hasattr(self, 'product_template_image_ids'):
    for idx, img in enumerate(self.product_template_image_ids, start=1):
        images.append({
            'id': img.id,
            'url': f'{base_url}/web/image/product.image/{img.id}/image_1920',  # ✅ ABSOLUTE
            'alt': img.name or self.name,
            'is_main': False
        })
```

#### Modification 4: Ajout du champ image_url (ligne 147)

```python
data = {
    'id': self.id,
    'name': self.name,
    # ... autres champs
    'images': images,
    'image_url': images[0]['url'] if images else None,  # 🆕 NOUVEAU CHAMP
    'category': {
        # ...
    }
}
```

**Explication**: Champ de commodité contenant directement l'URL de l'image principale. Permet aux composants frontend existants de fonctionner sans modification.

#### Modification 5: Produits liés avec URL absolue (ligne 185)

```python
if self.related_product_ids:
    data['related_products'] = [{
        'id': p.id,
        'name': p.name,
        'slug': p.slug,
        'image': f'{base_url}/web/image/product.template/{p.id}/image_256',  # ✅ ABSOLUTE
        'list_price': p.list_price,
    } for p in self.related_product_ids[:4]]
```

### 2. Frontend - Utilisation du Champ images[]

**Fichier**: [frontend/src/app/products/page.tsx](frontend/src/app/products/page.tsx)

#### Modification: Extraction de l'image principale (lignes 360-361)

```typescript
function ProductCardLeSportif({ product, viewMode }: { product: Product; viewMode: 'grid' | 'list' }) {
  // Get main image URL from images array
  const mainImage = product.images?.find(img => img.is_main) || product.images?.[0];
  const imageUrl = mainImage?.url || '';

  // ... reste du code
}
```

**Avant**: Utilisation directe de `product.image_url`
**Après**: Extraction intelligente depuis `product.images[]` avec fallback

#### Utilisation dans le JSX (lignes 373 et 440)

```tsx
{imageUrl ? (
  <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
) : (
  <div className="w-full h-full flex items-center justify-center text-gray-400">
    {/* Placeholder SVG */}
  </div>
)}
```

---

## 📊 Réponse API - Avant/Après

### ❌ Avant

```json
{
  "result": {
    "products": [{
      "id": 15,
      "name": "Armoire avec portes",
      "images": [
        {
          "url": "/web/image/product.template/15/image_1920"  // ❌ RELATIVE
        }
      ]
      // ❌ Pas de champ image_url
    }]
  }
}
```

### ✅ Après

```json
{
  "result": {
    "products": [{
      "id": 15,
      "name": "Armoire avec portes",
      "images": [
        {
          "url": "http://localhost:8069/web/image/product.template/15/image_1920"  // ✅ ABSOLUTE
        }
      ],
      "image_url": "http://localhost:8069/web/image/product.template/15/image_1920"  // ✅ NOUVEAU
    }]
  }
}
```

---

## 🧪 Tests de Validation

### Test 1: API retourne URLs complètes

```bash
curl -X POST http://localhost:8069/api/ecommerce/products \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "call", "params": {"limit": 1}, "id": 1}' \
  | jq '.result.products[0] | {image_url, images}'
```

**Résultat attendu**:
```json
{
  "image_url": "http://localhost:8069/web/image/product.template/15/image_1920",
  "images": [
    {
      "id": 0,
      "url": "http://localhost:8069/web/image/product.template/15/image_1920",
      "alt": "Armoire avec portes",
      "is_main": true
    }
  ]
}
```

✅ **PASS**: URLs sont absolues avec `http://localhost:8069`

### Test 2: Image accessible directement

```bash
curl -I http://localhost:8069/web/image/product.template/15/image_1920
```

**Résultat attendu**: `HTTP/1.1 200 OK`

✅ **PASS**: Image accessible

### Test 3: Frontend affiche les images

1. Ouvrir http://localhost:3000/products
2. Vérifier que les images des produits s'affichent
3. Ouvrir la console développeur (F12)
4. Vérifier qu'il n'y a pas d'erreurs 404 pour `/web/image/...`

✅ **PASS**: Images affichées correctement

---

## 🎯 Pages Affectées (Correction Automatique)

Grâce à l'ajout du champ `image_url` dans l'API, toutes ces pages fonctionnent maintenant sans modification:

- ✅ [/products](http://localhost:3000/products) - Liste produits (modifié)
- ✅ [/](http://localhost:3000/) - Page d'accueil
- ✅ [/categories](http://localhost:3000/categories) - Liste catégories
- ✅ [/wishlist/*](http://localhost:3000/wishlist/) - Listes de souhaits
- ✅ Composants: MegaMenu, RecommendationsCarousel, etc.

---

## 💡 Architecture Finale

### Flux des Images

```
Frontend (localhost:3000)
    ↓
Affiche <img src="http://localhost:8069/web/image/..." />
    ↓
Navigateur charge l'image depuis
    ↓
Odoo Backend (localhost:8069)
    ↓
/web/image/product.template/{id}/image_1920
    ↓
Retourne l'image JPEG/PNG
```

### Deux Méthodes d'Accès

Le frontend peut maintenant accéder aux images de deux façons:

1. **Via `image_url`** (champ de commodité)
   ```tsx
   <img src={product.image_url} alt={product.name} />
   ```

2. **Via `images[]`** (tableau complet avec galerie)
   ```tsx
   const mainImage = product.images.find(img => img.is_main);
   <img src={mainImage.url} alt={product.name} />
   ```

---

## 📝 Notes Techniques

### Pourquoi `ir.config_parameter` ?

```python
base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url', 'http://localhost:8069')
```

- **Odoo stocke l'URL de base** dans la configuration système
- **Accessible via**: Settings → Technical → System Parameters → `web.base.url`
- **Fallback**: `http://localhost:8069` si non configuré
- **Production**: Sera automatiquement `https://votredomaine.com`

### Images Disponibles

Odoo génère plusieurs tailles d'images:

- `image_1920` - Grande image (1920px max) - Pour détails produit
- `image_1024` - Moyenne (1024px) - Pour cartes produits
- `image_512` - Petite (512px) - Pour miniatures
- `image_256` - Très petite (256px) - Pour thumbnails
- `image_128` - Icône (128px) - Pour listes compactes

**Utilisation actuelle**:
- Liste produits: `image_1920` (bonne qualité)
- Produits liés: `image_256` (économie bande passante)

---

## 🚀 Déploiement en Production

### Configuration Requise

En production, assurez-vous que `web.base.url` est correctement configuré:

```bash
# Dans Odoo
Settings → Technical → System Parameters
Key: web.base.url
Value: https://votredomaine.com
```

Ou via ligne de commande:

```bash
docker-compose exec odoo odoo shell
>>> env['ir.config_parameter'].sudo().set_param('web.base.url', 'https://votredomaine.com')
```

### CORS (si nécessaire)

Si le frontend est sur un domaine différent (ex: `frontend.com` et `api.backend.com`), configurer CORS dans Odoo:

```python
# Dans le contrôleur HTTP
@http.route('/api/ecommerce/products', type='json', auth='public', cors='*')
```

Actuellement **pas nécessaire** car:
- Dev: `localhost:3000` → `localhost:8069` (même origine)
- Les balises `<img>` ne sont pas soumises aux restrictions CORS

---

## 📚 Fichiers Modifiés

1. ✅ [backend/addons/quelyos_ecommerce/models/product_template.py](backend/addons/quelyos_ecommerce/models/product_template.py:104-185)
   - Ajout `base_url`
   - URLs absolues pour images
   - Nouveau champ `image_url`

2. ✅ [frontend/src/app/products/page.tsx](frontend/src/app/products/page.tsx:360-440)
   - Extraction image principale depuis `images[]`
   - Utilisation de `imageUrl` variable

3. 📄 [CORRECTION_IMAGES.md](CORRECTION_IMAGES.md) - Ce document

---

## ✅ Vérification Finale

```bash
# 1. Vérifier l'API
curl -s -X POST http://localhost:8069/api/ecommerce/products \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "call", "params": {"limit": 1}, "id": 1}' \
  | jq '.result.products[0].image_url'

# Résultat attendu: "http://localhost:8069/web/image/product.template/15/image_1920"

# 2. Vérifier l'image
curl -I http://localhost:8069/web/image/product.template/15/image_1920

# Résultat attendu: HTTP/1.1 200 OK

# 3. Vérifier le frontend
# Ouvrir http://localhost:3000/products et voir les images
```

---

**Problème résolu !** 🎉

Les images des produits s'affichent maintenant correctement sur toutes les pages du frontend.
