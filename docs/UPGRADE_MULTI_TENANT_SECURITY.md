# Guide d'Upgrade - Renforcement Sécurité Multi-Tenant

**Date** : 2026-01-29
**Version Module** : 19.0.1.2.1 → 19.0.1.3.0
**Type** : Upgrade de sécurité (ajout `ir.rule`)

---

## ⚠️ IMPORTANT : Upgrade Odoo Obligatoire

Les nouvelles règles d'isolation (`ir.rule.xml`) ne seront actives qu'après un upgrade du module `quelyos_api`.

**Sans upgrade** : Les règles ne sont PAS appliquées (isolation uniquement au niveau API)
**Avec upgrade** : Les règles sont actives (isolation automatique au niveau PostgreSQL)

---

## 📋 Pré-requis

### 1. Vérifier la Version Actuelle

```bash
cd /Users/salmenktata/Projets/GitHub/QuelyosSuite

# Vérifier version module
grep "version" odoo-backend/addons/quelyos_api/__manifest__.py
# Résultat attendu : 'version': '19.0.1.2.1'
```

### 2. Vérifier les Fichiers Ajoutés

```bash
# Vérifier que les nouveaux fichiers existent
ls -la odoo-backend/addons/quelyos_api/security/ir.rule.xml
ls -la odoo-backend/addons/quelyos_api/lib/tenant_security.py

# Vérifier que ir.rule.xml est dans __manifest__.py
grep "ir.rule.xml" odoo-backend/addons/quelyos_api/__manifest__.py
```

**Résultat attendu** :
```
✅ security/ir.rule.xml existe (150 lignes)
✅ lib/tenant_security.py existe (266 lignes)
✅ ir.rule.xml est dans __manifest__.py['data']
```

---

## 🚀 Procédure d'Upgrade

### Méthode 1 : Via Commande `/upgrade-odoo` (Recommandé)

```bash
# Depuis le terminal (dans le projet)
# Cette commande utilise le skill 'upgrade-odoo' qui :
# 1. Incrémente la version dans __manifest__.py
# 2. Redémarre Odoo
# 3. Upgrade le module quelyos_api
# 4. Vérifie que l'upgrade s'est bien déroulé

# NOTE : La commande sera lancée via Claude Code
```

### Méthode 2 : Manuelle (Si `/upgrade-odoo` indisponible)

#### Étape 1 : Incrémenter la Version

```bash
# Modifier __manifest__.py
cd odoo-backend/addons/quelyos_api

# Changer version : 19.0.1.2.1 → 19.0.1.3.0
# (ou 19.0.1.2.2 si c'est un patch mineur)
```

**Avant** :
```python
'version': '19.0.1.2.1',
```

**Après** :
```python
'version': '19.0.1.3.0',  # Ajout règles ir.rule + quotas
```

#### Étape 2 : Redémarrer Odoo

```bash
# Depuis la racine du projet
docker compose -f odoo-backend/docker-compose.yml restart odoo
```

#### Étape 3 : Upgrade via Interface Odoo

```bash
# 1. Accéder à Odoo : http://localhost:8069
# 2. Se connecter comme admin
# 3. Aller dans Apps (icône grille)
# 4. Rechercher "Quelyos API"
# 5. Cliquer sur "Upgrade" (bouton avec flèche circulaire)
# 6. Attendre la fin de l'upgrade (1-2 minutes)
```

#### Étape 4 : Vérifier l'Upgrade

```bash
# Se connecter à la base de données
docker exec -it odoo-backend-db-1 psql -U odoo -d quelyos

# Vérifier que les règles ir.rule existent
SELECT id, name, model_id FROM ir_rule WHERE name LIKE '%multi-%';

# Résultat attendu : 20+ règles avec noms :
# - Product Template: multi-company
# - Sale Order: multi-company
# - Product Review: multi-tenant
# - Wishlist: multi-tenant
# - etc.
```

---

## ✅ Vérification Post-Upgrade

### Test 1 : Règles `ir.rule` Actives

```bash
# Vérifier que les règles sont actives dans Odoo
docker exec -it odoo-backend-odoo-1 python3 << 'EOF'
import odoo
from odoo import registry

db_name = 'quelyos'
with registry(db_name).cursor() as cr:
    env = odoo.api.Environment(cr, 1, {})
    rules = env['ir.rule'].search([('name', 'like', 'multi-')])
    print(f"✅ {len(rules)} règles ir.rule actives")
    for rule in rules:
        print(f"  - {rule.name} ({rule.model_id.name})")
EOF
```

**Résultat attendu** : 20+ règles listées

### Test 2 : Isolation Fonctionnelle

```bash
# Créer 2 tenants de test
curl -X POST http://localhost:8069/api/admin/tenant \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Tenant A",
    "code": "test_a",
    "domain": "testa.local",
    "plan_code": "starter",
    "admin_email": "admin@testa.local"
  }'

curl -X POST http://localhost:8069/api/admin/tenant \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Tenant B",
    "code": "test_b",
    "domain": "testb.local",
    "plan_code": "starter",
    "admin_email": "admin@testb.local"
  }'

# Créer un produit dans Tenant A
curl -X POST http://localhost:8069/api/admin/products/create \
  -H "X-Tenant-Domain: testa.local" \
  -H "Authorization: Bearer <session_id_a>" \
  -d '{"name": "Product Test A", "price": 100}'

# Tenter de lire depuis Tenant B
curl -X POST http://localhost:8069/api/ecommerce/products \
  -H "X-Tenant-Domain: testb.local" \
  -d '{}'

# Résultat attendu : {"products": []} (liste vide - produit A invisible)
```

### Test 3 : Validation Header `X-Tenant-Domain`

```bash
# Se connecter comme admin tenant A
# Tenter d'accéder aux données de tenant B en manipulant le header

curl -X POST http://localhost:8069/api/admin/products \
  -H "X-Tenant-Domain: testb.local" \
  -H "Authorization: Bearer <session_id_tenant_a>" \
  -d '{}'

# Résultat attendu :
# {
#   "success": false,
#   "error": "Tenant invalide ou accès non autorisé",
#   "error_code": "TENANT_INVALID"
# }
```

### Test 4 : Quotas (Après Intégration dans Endpoints)

```bash
# Note : Ce test fonctionnera après intégration des quotas dans les endpoints
# Pour l'instant, les quotas sont définis mais non appliqués

# Vérifier statut quotas
curl -X POST http://localhost:8069/api/admin/quotas/status \
  -H "X-Tenant-Domain: testa.local" \
  -H "Authorization: Bearer <session_id>" \
  -d '{}'

# Résultat attendu :
# {
#   "success": true,
#   "quotas": {
#     "products": {"current": 1, "max": 1000, "percentage": 0.1},
#     "users": {"current": 1, "max": 5, "percentage": 20},
#     "orders": {"current": 0, "max": 5000, "percentage": 0},
#     "plan": {"name": "Starter", "code": "starter"}
#   }
# }
```

---

## 🔄 Rollback (Si Problème)

### Si l'Upgrade Échoue

```bash
# 1. Restaurer la version précédente
cd odoo-backend/addons/quelyos_api
git checkout __manifest__.py  # Revenir à 19.0.1.2.1

# 2. Supprimer ir.rule.xml du manifest
# Éditer __manifest__.py et retirer la ligne :
# 'security/ir.rule.xml',

# 3. Redémarrer Odoo
docker compose -f odoo-backend/docker-compose.yml restart odoo

# 4. Upgrade à nouveau (pour appliquer le manifest sans ir.rule)
# Via interface Odoo : Apps → Quelyos API → Upgrade
```

### Si les Règles Causent des Erreurs

```bash
# Désactiver temporairement les règles
docker exec -it odoo-backend-db-1 psql -U odoo -d quelyos

-- Désactiver toutes les règles multi-tenant
UPDATE ir_rule SET active = false WHERE name LIKE '%multi-%';

-- Réactiver plus tard
UPDATE ir_rule SET active = true WHERE name LIKE '%multi-%';
```

---

## 📊 Changelog

### Version 19.0.1.3.0 (2026-01-29)

**Ajouts** :
- ✅ `security/ir.rule.xml` - 20+ règles d'isolation multi-tenant
- ✅ `lib/tenant_security.py` - Validation tenant + vérification quotas
- ✅ Méthodes helper dans `controllers/base.py` :
  - `_get_tenant()` - Récupérer tenant validé
  - `_get_company()` - Récupérer company
  - `_check_tenant_quotas()` - Vérifier quotas
  - `_get_quota_status()` - Statut quotas

**Améliorations** :
- ✅ Isolation au niveau PostgreSQL (impossible de contourner via Odoo UI)
- ✅ Validation automatique `X-Tenant-Domain` vs `user.company_id`
- ✅ Quotas prêts à être appliqués dans les endpoints

**Breaking Changes** :
- ⚠️ Aucun (rétrocompatible)

**Migration requise** :
- ❌ Non (les règles s'ajoutent automatiquement)

---

## 📚 Références

- [STRATEGIE_MULTI_TENANT.md](STRATEGIE_MULTI_TENANT.md) - Stratégie globale
- [EXEMPLES_SECURITE_MULTI_TENANT.md](EXEMPLES_SECURITE_MULTI_TENANT.md) - Guide pratique
- [RAPPORT_IMPLEMENTATION_MULTI_TENANT_2026-01-29.md](RAPPORT_IMPLEMENTATION_MULTI_TENANT_2026-01-29.md) - Rapport complet

---

## 🆘 Support

### Problèmes Connus

#### Erreur : "Rule model_id not found"

**Cause** : Modèle référencé dans `ir.rule.xml` n'existe pas

**Solution** :
```bash
# Vérifier que tous les modèles existent
docker exec -it odoo-backend-odoo-1 python3 << 'EOF'
import odoo
from odoo import registry

db_name = 'quelyos'
with registry(db_name).cursor() as cr:
    env = odoo.api.Environment(cr, 1, {})
    models = [
        'product.template',
        'sale.order',
        'quelyos.product.review',
        'quelyos.wishlist',
        # ... tous les modèles dans ir.rule.xml
    ]
    for model_name in models:
        try:
            model = env[model_name]
            print(f"✅ {model_name} existe")
        except KeyError:
            print(f"❌ {model_name} N'EXISTE PAS")
EOF
```

#### Performance Dégradée Après Upgrade

**Cause** : Les règles `ir.rule` ajoutent des clauses WHERE aux queries SQL

**Solution** :
```bash
# Vérifier les indexes sur company_id et tenant_id
docker exec -it odoo-backend-db-1 psql -U odoo -d quelyos << 'SQL'
-- Vérifier indexes sur product_template
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename = 'product_template'
AND indexdef LIKE '%company_id%';

-- Si pas d'index, créer :
CREATE INDEX IF NOT EXISTS product_template_company_id_idx
ON product_template(company_id);
SQL
```

---

**Document créé** : 2026-01-29 23:35
**Auteur** : Claude Code (Quelyos DevOps)
**Version** : 1.0
