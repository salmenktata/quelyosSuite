# Fix Marketplace Thèmes - 2026-02-03

## Problèmes corrigés

### 1. Route manquante (404)
**Erreur** : `No routes matched location "/store/themes/marketplace"`

**Cause** : La route `/store/themes/marketplace` n'existait pas dans `routes.tsx`

**Solution** : Ajout de la route dans `src/routes.tsx` :
```tsx
<Route path="/store/themes/marketplace" element={<P><ThemesMarketplace /></P>} />
```

---

### 2. Endpoint API incorrect (404)
**Erreur** : `Failed to execute 'json' on 'Response': Unexpected end of JSON input` dans `builder.tsx`

**Cause** : Le frontend appelait `/api/themes/submissions/create` mais le backend expose `/api/themes/submissions`

**Solution** : Corrigé l'URL dans `builder.tsx:96`
```typescript
// Avant
fetch(`${VITE_BACKEND_URL}/api/themes/submissions/create`, ...)

// Après
fetch('/api/themes/submissions', ...)
```

---

### 3. Paramètres API marketplace mal passés
**Erreur** : Paramètres ignorés par le backend (category, is_premium, sort)

**Cause** : Les paramètres étaient passés en query string (`?category=tech&sort=popular`) au lieu du body JSON-RPC

**Solution** : Corrigé dans `marketplace.tsx:56-89`
```typescript
// Avant
const params = new URLSearchParams();
params.append('category', selectedCategory);
fetch(`/api/themes/marketplace?${params}`, {
  body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: {}, id: 1 })
})

// Après
fetch('/api/themes/marketplace', {
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'call',
    params: { category: selectedCategory, is_premium: ..., sort: sortBy },
    id: 1
  })
})
```

---

### 4. URLs Backend invalides (ERREUR PRINCIPALE)
**Erreur** : `Failed to execute 'json' on 'Response': Unexpected end of JSON input` sur TOUS les endpoints

**Cause** : `VITE_BACKEND_URL` n'était pas défini dans `.env`, créant des URLs invalides :
```typescript
`${import.meta.env.VITE_BACKEND_URL}/api/themes/marketplace`
// Devenait : "undefined/api/themes/marketplace" ❌
```

**Solution** : Remplacé toutes les URLs absolues par des URLs relatives (12 fichiers modifiés) :

**Fichiers corrigés** :
- `src/pages/store/themes/marketplace.tsx`
- `src/pages/store/themes/builder.tsx`
- `src/pages/store/themes/submit.tsx`
- `src/pages/store/themes/my-submissions.tsx`
- `src/pages/store/themes/analytics.tsx`
- `src/pages/store/themes/payouts.tsx`
- `src/pages/store/themes/import.tsx`

**Pattern de correction** :
```typescript
// Avant (URL invalide)
fetch(`${import.meta.env.VITE_BACKEND_URL}/api/themes/marketplace`, ...)

// Après (URL relative proxifiée par Vite)
fetch('/api/themes/marketplace', ...)
```

**Avantages** :
- ✅ Pas besoin de `VITE_BACKEND_URL` en dev
- ✅ Évite les problèmes CORS (proxy Vite)
- ✅ Masque l'URL backend réelle (anonymisation)
- ✅ Configuration plus simple

---

### 5. Base de données vide (pas d'erreur mais marketplace vide)
**Problème** : 0 thèmes marketplace dans la DB

**Solution** : Création de 4 thèmes de démonstration :

| Code | Nom | Catégorie | Type | Prix | Rating | Downloads |
|------|-----|-----------|------|------|--------|-----------|
| `tech-minimal` | Tech Minimal | tech | Gratuit | 0€ | 4.5★ | 1832 |
| `beauty-cosmetics` | Beauty Cosmetics | beauty | Gratuit | 0€ | 4.6★ | 923 |
| `food-organic` | Food Organic | food | Premium | 49.99€ | 4.9★ | 567 |
| `fashion-luxury` | Fashion Luxury | fashion | Premium | 79.99€ | 4.8★ | 245 |

**Script SQL** : `/tmp/seed_marketplace_themes.sql`

---

## Configuration Vite Proxy

Le proxy Vite est configuré dans `packages/config/src/api.ts` :

```typescript
export function getViteProxyConfig() {
  return {
    '/api': {
      target: 'http://localhost:8069',  // Backend Odoo
      changeOrigin: true,
      rewrite: (path) => path,
      secure: false,
      ws: true,
    },
  };
}
```

**Routage des requêtes** :
```
Frontend: http://localhost:5175/api/themes/marketplace
   ↓ (Proxy Vite)
Backend:  http://localhost:8069/api/themes/marketplace
```

---

## Variables d'environnement

### Avant
```bash
# .env (requis mais non défini → erreur)
VITE_BACKEND_URL=http://localhost:8069  # ❌ Oublié
```

### Après
```bash
# .env (plus nécessaire en dev)
# NOTE: VITE_BACKEND_URL n'est PLUS utilisée
# Les URLs relatives (/api/*) sont proxifiées par Vite
```

**Fichiers mis à jour** :
- ✅ `.env` : Commentaire ajouté pour clarifier
- ✅ `.env.example` : Créé avec documentation

---

## Test de l'API

```bash
# Test direct backend
curl -X POST 'http://localhost:8069/api/themes/marketplace' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"call","params":{"sort":"popular"},"id":1}'

# Réponse attendue
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "success": true,
    "themes": [
      {
        "id": "tech-minimal",
        "name": "Tech Minimal",
        "category": "tech",
        "is_premium": false,
        "price": 0.0,
        "rating": 4.5,
        "downloads": 1832,
        ...
      },
      ...
    ]
  }
}
```

---

## Vérification

### 1. Vérifier que le proxy Vite fonctionne
```bash
# Dans le navigateur (DevTools → Network)
# La requête doit apparaître comme : /api/themes/marketplace (pas localhost:8069)
```

### 2. Vérifier que les thèmes s'affichent
```bash
# Ouvrir : http://localhost:5175/store/themes/marketplace
# Résultat attendu : 4 thèmes visibles (tech-minimal, beauty-cosmetics, food-organic, fashion-luxury)
```

### 3. Vérifier que les filtres fonctionnent
```bash
# Tester filtres : Catégorie (fashion, tech, food, beauty), Prix (gratuit, premium), Tri (populaire, récent, note)
```

---

## Commandes utiles

```bash
# Vérifier thèmes dans la DB
docker exec quelyos-db psql -U odoo -d quelyos -c \
  "SELECT code, name->>'en_US' as name, category, is_premium, price, rating, downloads FROM quelyos_theme WHERE is_marketplace = true;"

# Tester l'API directement
curl -X POST 'http://localhost:8069/api/themes/marketplace' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"call","params":{},"id":1}'

# Nettoyer les thèmes de test (si besoin)
docker exec quelyos-db psql -U odoo -d quelyos -c \
  "DELETE FROM quelyos_theme WHERE code IN ('tech-minimal', 'beauty-cosmetics', 'food-organic', 'fashion-luxury');"
```

---

## Prochaines étapes recommandées

1. **Ajouter des thumbnails** : Les thèmes actuels ont `thumbnail: false`
   - Uploader des images dans `/web/image` ou utiliser URLs externes
   - Mettre à jour `thumbnail` dans la DB

2. **Créer des designers** : Actuellement `designer_id = null` (affiché comme "Quelyos")
   - Créer des entrées dans `quelyos.theme.designer`
   - Associer aux thèmes

3. **Tester les soumissions** : Vérifier que `/store/themes/submit` fonctionne

4. **Tester le builder** : Vérifier que `/store/themes/builder` fonctionne

5. **Implémenter l'achat** : Endpoint `/api/themes/<id>/purchase` existe mais Stripe non configuré

---

## Notes techniques

### Pourquoi utiliser des URLs relatives ?

**Avantages** :
- ✅ Pas de configuration `VITE_BACKEND_URL` nécessaire en dev
- ✅ Proxy Vite gère CORS automatiquement
- ✅ Anonymisation backend (URLs ne révèlent pas localhost:8069)
- ✅ Même comportement dev/prod (reverse proxy nginx en prod)

**Configuration proxy** :
```typescript
// vite.config.ts (via @quelyos/config)
server: {
  proxy: getViteProxyConfig()  // Proxie /api/* vers localhost:8069
}
```

### Endpoints JSON-RPC Odoo

**Structure requête** :
```json
{
  "jsonrpc": "2.0",
  "method": "call",
  "params": { "category": "tech", "sort": "popular" },
  "id": 1
}
```

**Structure réponse** :
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": { "success": true, "themes": [...] }
}
```

**IMPORTANT** : Les paramètres doivent être dans `params`, pas en query string !

---

## Checklist de vérification

- [x] Route `/store/themes/marketplace` ajoutée
- [x] Endpoint API corrigé (`/submissions` au lieu de `/submissions/create`)
- [x] Paramètres API passés dans body JSON-RPC
- [x] Toutes les URLs converties en chemins relatifs (12 fichiers)
- [x] 4 thèmes de démonstration insérés dans la DB
- [x] `.env` mis à jour avec commentaires
- [x] `.env.example` créé
- [x] API testée et fonctionnelle
- [ ] Frontend testé dans le navigateur
- [ ] Filtres marketplace testés
- [ ] Builder de thèmes testé
- [ ] Soumissions testées
