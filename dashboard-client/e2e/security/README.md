# Tests E2E Cross-Tenant Security

Tests de sécurité critiques vérifiant l'isolation complète entre tenants.

## ⚠️ CRITIQUE SÉCURITÉ

Ces tests **DOIVENT TOUS PASSER** avant toute mise en production. Un échec indique une faille de sécurité potentielle permettant l'accès cross-tenant.

## Prérequis

### 1. Base de données de test avec 2 tenants

Les tests nécessitent 2 tenants configurés :

```sql
-- Tenant 1
INSERT INTO res_company (id, name) VALUES (1, 'Tenant 1');
INSERT INTO res_users (id, login, password, company_id) 
VALUES (1, 'admin@tenant1.com', 'test123', 1);

-- Tenant 2  
INSERT INTO res_company (id, name) VALUES (2, 'Tenant 2');
INSERT INTO res_users (id, login, password, company_id)
VALUES (2, 'admin@tenant2.com', 'test123', 2);
```

### 2. Backend Odoo avec RLS activé

Vérifier que Row Level Security (RLS) est activée dans PostgreSQL :

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE '%product%';
```

Devrait retourner des politiques RLS pour isolation tenant.

## Lancer les tests

### Tous les tests de sécurité

```bash
pnpm test:e2e:security
```

### Test spécifique

```bash
pnpm playwright test e2e/security/cross-tenant.spec.ts --grep "header injection"
```

### Mode UI (debug)

```bash
pnpm playwright test e2e/security/cross-tenant.spec.ts --ui
```

### Mode headed (voir navigateur)

```bash
pnpm playwright test e2e/security/cross-tenant.spec.ts --headed
```

## Scénarios testés

### 🔴 Injection Header X-Tenant-ID
**Test** : `tenant1 cannot access tenant2 data via header injection`
**Attaque** : User tenant1 modifie header `X-Tenant-ID: 2`
**Attendu** : Backend rejette avec 403/401

### 🔴 Injection Body tenant_id
**Test** : `tenant1 cannot access tenant2 data via body injection`
**Attaque** : User tenant1 envoie `{ tenant_id: 2 }` dans body
**Attendu** : Backend rejette ou ignore

### 🔴 Isolation localStorage
**Test** : `localStorage is isolated per tenant`
**Attaque** : Tenter récupérer données tenant1 après login tenant2
**Attendu** : localStorage.clear() entre sessions

### 🔴 Contexte API toujours correct
**Test** : `API calls from tenant1 always include tenant1 context`
**Validation** : Toutes requêtes incluent bon `X-Tenant-ID`
**Attendu** : Headers cohérents avec user loggé

### 🔴 Switch tenant efface contexte
**Test** : `switching tenants clears previous tenant context`
**Validation** : Pas de fuite données entre sessions
**Attendu** : Tokens différents, tenant_id différent

### 🔴 Endpoints sans tenant rejetés
**Test** : `cannot access protected endpoints without tenant context`
**Validation** : Middleware frontend/backend rejette
**Attendu** : Erreur "Tenant context required"

### 🔴 URLs manipulées rejetées
**Test** : `manipulated URLs with wrong tenant_id are rejected`
**Attaque** : URL `/api/tenants/2/products` pour tenant1
**Attendu** : 403 ou 404

### 🔴 Données produits isolées
**Test** : `products from tenant2 are not visible to tenant1`
**Validation** : Aucun produit tenant2 dans résultats tenant1
**Attendu** : Filtrage backend correct

### 🔴 Données commandes isolées
**Test** : `orders from tenant2 are not visible to tenant1`
**Validation** : Aucune commande tenant2 dans résultats tenant1
**Attendu** : Filtrage backend correct

## En cas d'échec

### Test échoue : "header injection"

**Cause** : Backend n'utilise pas `X-Tenant-ID` du token JWT mais accepte header client
**Fix** : 
```python
# odoo-backend/addons/quelyos_api/lib/tenant_security.py
def get_tenant_from_request(request):
    # ❌ NE PAS faire confiance au header client
    # tenant_id = request.httprequest.headers.get('X-Tenant-ID')
    
    # ✅ TOUJOURS extraire du token JWT
    user = request.env.user
    tenant_id = user.company_id.id
    return tenant_id
```

### Test échoue : "body injection"

**Cause** : Backend utilise `params.tenant_id` au lieu du token
**Fix** :
```python
# Dans contrôleurs Odoo
@http.route('/api/products')
def get_products(self, **params):
    # ❌ NE PAS utiliser params['tenant_id']
    # tenant_id = params.get('tenant_id')
    
    # ✅ Extraire du user loggé
    tenant_id = request.env.user.company_id.id
    
    # Appliquer RLS
    with rls_tenant_context(request.env.cr, tenant_id):
        products = Product.search([])
```

### Test échoue : "localStorage isolation"

**Cause** : localStorage.clear() pas appelé au logout
**Fix** :
```typescript
// dashboard-client/src/lib/api.ts
async logout() {
  await this.request('/api/auth/logout')
  
  // ✅ CRITIQUE : Clear localStorage
  localStorage.clear()
  
  window.location.href = '/login'
}
```

### Test échoue : "data leakage"

**Cause** : RLS PostgreSQL mal configurée ou désactivée
**Fix** :
```sql
-- Activer RLS sur table product_template
ALTER TABLE product_template ENABLE ROW LEVEL SECURITY;

-- Créer politique RLS
CREATE POLICY tenant_isolation_policy ON product_template
USING (company_id = current_setting('app.current_tenant')::INTEGER);
```

## Monitoring continu

### CI/CD Integration

Ajouter dans `.github/workflows/security-tests.yml` :

```yaml
name: Security Tests
on: [push, pull_request]

jobs:
  cross-tenant-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm test:e2e:security
      
      # ❌ Bloquer merge si échec
      - name: Block if tests fail
        if: failure()
        run: exit 1
```

### Alerting

Si test échoue en prod :
1. **CRITIQUE** : Alerter équipe sécurité immédiatement
2. Investiguer logs backend (`X-Tenant-ID` vs `user.company_id`)
3. Vérifier RLS PostgreSQL actif
4. Audit accès récents (possibles accès cross-tenant)

## Ressources

- [OWASP Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
