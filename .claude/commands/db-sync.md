# Commande /db-sync - Vérification Synchronisation DB Odoo

## Description

Vérifie la synchronisation entre les modèles Python Odoo et le schéma de base de données PostgreSQL, détecte les champs manquants, les migrations pendantes, et les incohérences de données. Complémentaire au workflow upgrade module Odoo.

## Usage

```bash
/db-sync [module]          # Vérifie module spécifique (ex: quelyos_api)
/db-sync                   # Vérifie tous les modules custom
```

## Workflow

### 1. Phase 1 - Vérification État Modules Odoo

#### 1.1. Lister Modules Custom

```bash
cd odoo-backend
docker-compose exec odoo odoo shell -d quelyos << 'EOF'
modules = env['ir.module.module'].search([('state', '!=', 'uninstalled')])
for module in modules:
    if not module.name.startswith(('base', 'web', 'mail', 'portal')):
        print(f"{module.name} | {module.state} | {module.latest_version}")
EOF
```

**Output attendu :**
```
quelyos_api | installed | 19.0.1.0.5
autre_module_custom | installed | 1.0.0
```

#### 1.2. Détecter Modules à Upgrader

```bash
docker-compose exec odoo odoo shell -d quelyos << 'EOF'
to_upgrade = env['ir.module.module'].search([('state', '=', 'to upgrade')])
if to_upgrade:
    print("Modules to upgrade:")
    for mod in to_upgrade:
        print(f"  - {mod.name} ({mod.installed_version} → {mod.latest_version})")
else:
    print("No modules to upgrade")
EOF
```

**Si modules `to upgrade` détectés → P0 (BLOQUANT)**

```
🚨 BLOCAGE - Modules à upgrader détectés

Modules :
- quelyos_api (19.0.1.0.4 → 19.0.1.0.5)

Ces modules ont été modifiés mais pas upgradés.
La DB n'est PAS synchronisée avec le code Python.

Actions requises :
1. cd odoo-backend && ./upgrade.sh quelyos_api
2. Relancer /db-sync pour validation
```

### 2. Phase 2 - Vérification Champs Modèles vs DB

**Pour chaque module custom, lister modèles et champs Python :**

#### 2.1. Parser Modèles Python

**Scanner fichiers models/ du module :**

```bash
cd odoo-odoo-backend/addons/quelyos_api/models
grep -r "class.*models\\.Model" *.py
```

**Output :**
```
product.py:class ProductTemplate(models.Model):
product.py:    _inherit = 'product.template'
stock_quant.py:class StockQuant(models.Model):
stock_quant.py:    _inherit = 'stock.quant'
```

**Pour chaque modèle, extraire champs :**

```bash
# Exemple : product.template
grep -A 1 "fields\\..*(" odoo-odoo-backend/addons/quelyos_api/models/product.py | \
  grep -v "^--$" | \
  sed 's/.*fields\.\(.*\)(/\1/' | \
  cut -d'(' -f1
```

**Output (exemple) :**
```
low_stock_threshold = Float
discount_enabled = Boolean
custom_description = Text
```

#### 2.2. Vérifier Champs en DB

**Pour chaque champ, vérifier existence dans PostgreSQL :**

```bash
# Exemple : Vérifier champ low_stock_threshold dans product_template
docker-compose exec db psql -U odoo -d quelyos -c \
  "SELECT column_name, data_type FROM information_schema.columns
   WHERE table_name = 'product_template' AND column_name = 'low_stock_threshold';"
```

**Si aucune ligne retournée → Champ manquant en DB (P0)**

#### 2.3. Utiliser Script check_fields.sh

**Le projet dispose déjà du script `odoo-odoo-backend/check_fields.sh` :**

```bash
cd odoo-backend
./check_fields.sh addons/quelyos_api/models/product.py product_template
```

**Output attendu :**
```
Checking fields in addons/quelyos_api/models/product.py for table product_template...

✅ low_stock_threshold - EXISTS in DB (double precision)
✅ discount_enabled - EXISTS in DB (boolean)
❌ custom_description - MISSING in DB

Summary: 2/3 fields exist in database
```

**Si champs manquants → P0 (BLOQUANT)**

### 3. Phase 3 - Détection Incohérences Types

**Vérifier cohérence types Python ↔ PostgreSQL :**

| Type Python (Odoo) | Type PostgreSQL Attendu |
|-------------------|-------------------------|
| `fields.Char()` | `character varying` |
| `fields.Text()` | `text` |
| `fields.Integer()` | `integer` |
| `fields.Float()` | `double precision` ou `numeric` |
| `fields.Boolean()` | `boolean` |
| `fields.Date()` | `date` |
| `fields.Datetime()` | `timestamp without time zone` |
| `fields.Many2one()` | `integer` (foreign key) |
| `fields.Selection()` | `character varying` |
| `fields.Binary()` | `bytea` |

**Exemple détection incohérence :**

```sql
-- Champ défini comme Float en Python
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'product_template' AND column_name = 'price';

-- Si data_type = 'integer' au lieu de 'double precision' → P1 (incohérence)
```

### 4. Phase 4 - Vérification Contraintes DB

#### 4.1. Contraintes NOT NULL

**Lister champs Python avec `required=True` :**

```bash
grep -r "required=True" odoo-odoo-backend/addons/quelyos_api/models/*.py -B 1
```

**Vérifier contrainte NOT NULL en DB :**

```sql
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'product_template'
  AND column_name IN ('name', 'type', 'categ_id');
```

**Si `is_nullable = 'YES'` alors que `required=True` → P1 (incohérence)**

#### 4.2. Contraintes SQL (_sql_constraints)

**Parser contraintes SQL dans modèles :**

```bash
grep -A 5 "_sql_constraints" odoo-odoo-backend/addons/quelyos_api/models/*.py
```

**Exemple :**
```python
_sql_constraints = [
    ('unique_sku', 'UNIQUE(default_code)', 'SKU must be unique'),
]
```

**Vérifier contrainte existe en DB :**

```sql
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'product_template'::regclass
  AND conname = 'unique_sku';
```

**Si aucune ligne → Contrainte manquante (P1)**

### 5. Phase 5 - Vérification Relations (Foreign Keys)

**Lister champs Many2one, One2many, Many2many :**

```bash
grep -rE "fields\\.Many2one|fields\\.One2many|fields\\.Many2many" \
  odoo-odoo-backend/addons/quelyos_api/models/*.py
```

**Exemple :**
```python
categ_id = fields.Many2one('product.category', string='Category')
```

**Vérifier foreign key en DB :**

```sql
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'product_template'
  AND kcu.column_name = 'categ_id';
```

**Si aucune ligne ET champ critique → P1 (foreign key manquante)**

### 6. Phase 6 - Vérification Indexes

**Performance : Vérifier que champs fréquemment recherchés ont des indexes :**

#### 6.1. Lister Champs avec index=True

```bash
grep -r "index=True" odoo-odoo-backend/addons/quelyos_api/models/*.py -B 1
```

#### 6.2. Vérifier Indexes en DB

```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'product_template';
```

**Si champ avec `index=True` SANS index DB → P2 (performance dégradée)**

### 7. Phase 7 - Détection Données Incohérentes

#### 7.1. Valeurs NULL sur Champs Required

```sql
SELECT COUNT(*) as null_count
FROM product_template
WHERE name IS NULL;  -- name est required=True
```

**Si `null_count > 0` → P0 (données corrompues)**

#### 7.2. Foreign Keys Orphelines

```sql
-- Vérifier produits référençant catégorie inexistante
SELECT COUNT(*) as orphan_count
FROM product_template pt
LEFT JOIN product_category pc ON pt.categ_id = pc.id
WHERE pt.categ_id IS NOT NULL AND pc.id IS NULL;
```

**Si `orphan_count > 0` → P1 (intégrité référentielle brisée)**

#### 7.3. Doublons sur Contraintes Uniques

```sql
-- Vérifier doublons SKU (si contrainte unique)
SELECT default_code, COUNT(*) as count
FROM product_template
WHERE default_code IS NOT NULL
GROUP BY default_code
HAVING COUNT(*) > 1;
```

**Si doublons → P0 (contrainte violée)**

### 8. Phase 8 - Vérification Champs Computed

**Lister champs computed (`compute=`) :**

```bash
grep -r "compute=" odoo-odoo-backend/addons/quelyos_api/models/*.py -B 2
```

**Exemple :**
```python
total_available = fields.Float(
    compute='_compute_total_available',
    store=True  # ← Stocké en DB
)
```

**Si `store=True`, vérifier champ existe en DB.**

**Si `store=False` (par défaut), champ NE DOIT PAS exister en DB :**

```sql
-- Ce champ ne devrait PAS exister si store=False
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'product_template'
  AND column_name = 'virtual_available_computed';
```

**Si existe alors que `store=False` → P2 (colonne inutile en DB)**

### 9. Génération Rapport Synchronisation

**Format Markdown :**

```markdown
# 🔄 Rapport de Synchronisation DB - [Date]

## 📊 Résumé Exécutif

| Module | Modèles | Champs Python | Champs DB | Sync | Status |
|--------|---------|---------------|-----------|------|--------|
| quelyos_api | 3 | 28 | 26 | 92.8% | 🔴 CRITIQUE |

**🚨 STATUT : DÉSYNCHRONISÉ (2 champs manquants, 1 module à upgrader)**

---

## 📦 État Modules

### Modules Installés

| Module | État | Version Installée | Version Manifest | Action |
|--------|------|-------------------|------------------|--------|
| quelyos_api | installed | 19.0.1.0.4 | 19.0.1.0.5 | 🔴 UPGRADE REQUIS |
| autre_module | installed | 1.0.0 | 1.0.0 | ✅ OK |

**P0 - CRITIQUE (1) :**

#### 1. Module quelyos_api désynchronisé

**Problème** :
- Version installée : 19.0.1.0.4
- Version manifest : 19.0.1.0.5
- État : `installed` (devrait être `to upgrade`)

**Impact** :
- Champs ajoutés dans v19.0.1.0.5 absents en DB
- Risque erreurs runtime (AttributeError)

**Solution** :
```bash
cd odoo-backend
./upgrade.sh quelyos_api
```

---

## 🗂️ Modèles et Champs

### quelyos_api - product.template

**Table DB** : `product_template`

| Champ Python | Type Python | Champ DB | Type DB | Status |
|--------------|-------------|----------|---------|--------|
| low_stock_threshold | Float | low_stock_threshold | double precision | ✅ OK |
| discount_enabled | Boolean | discount_enabled | boolean | ✅ OK |
| custom_description | Text | - | - | 🔴 MANQUANT |
| featured | Boolean | featured | boolean | ✅ OK |

**Synchronisation : 75% (3/4 champs OK)**

**P0 - CRITIQUE (1) :**

#### 2. Champ custom_description manquant en DB

**Problème** :
- Défini dans `models/product.py:45`
- Absent de la table `product_template`

**Cause probable** :
- Champ ajouté mais module non upgradé
- OU erreur lors du dernier upgrade (vérifier logs Odoo)

**Impact** :
- Accès à `product.custom_description` → AttributeError
- API retourne erreur 500 si champ utilisé

**Solution** :
```bash
cd odoo-backend
./upgrade.sh quelyos_api
./check_fields.sh addons/quelyos_api/models/product.py product_template
```

---

### quelyos_api - stock.quant

**Table DB** : `stock_quant`

| Champ Python | Type Python | Champ DB | Type DB | Status |
|--------------|-------------|----------|---------|--------|
| reserved_quantity | Float | reserved_quantity | double precision | ✅ OK |

**Synchronisation : 100% (1/1 champs OK)**

✅ Aucune incohérence détectée

---

## ⚠️ Incohérences Types

**P1 - IMPORTANT (1) :**

#### 3. Type incohérent : product.price

**Problème** :
- Type Python : `fields.Float()`
- Type DB : `integer`

**Impact** :
- Perte de précision (prix arrondis)
- Calculs incorrects (ex: prix 19.99 → 19)

**Solution** :
```sql
-- Migration manuelle
ALTER TABLE product_template
ALTER COLUMN price TYPE double precision USING price::double precision;
```

**⚠️ ATTENTION : Backup DB avant migration**

---

## 🔗 Contraintes et Relations

### Contraintes NOT NULL

| Champ | Required Python | NOT NULL DB | Status |
|-------|-----------------|-------------|--------|
| product.name | True | YES | ✅ OK |
| product.type | True | YES | ✅ OK |
| product.categ_id | True | YES | ✅ OK |

✅ Aucune incohérence

### Contraintes SQL (_sql_constraints)

| Contrainte Python | Contrainte DB | Status |
|-------------------|---------------|--------|
| unique_sku (UNIQUE default_code) | product_template_unique_sku | ✅ OK |

✅ Aucune contrainte manquante

### Foreign Keys

| Relation Python | Foreign Key DB | Status |
|-----------------|----------------|--------|
| categ_id → product.category | product_template_categ_id_fkey | ✅ OK |
| company_id → res.company | product_template_company_id_fkey | ✅ OK |

✅ Aucune foreign key manquante

### Indexes

| Champ | index=True | Index DB | Status |
|-------|------------|----------|--------|
| default_code | True | product_template_default_code_idx | ✅ OK |
| name | True | product_template_name_idx | ✅ OK |
| active | False | - | ✅ OK |

✅ Aucun index manquant

---

## 🗄️ Intégrité Données

### Valeurs NULL sur Champs Required

```sql
SELECT COUNT(*) FROM product_template WHERE name IS NULL;
-- Résultat : 0 ✅
```

✅ Aucune valeur NULL sur champs required

### Foreign Keys Orphelines

```sql
SELECT COUNT(*) FROM product_template pt
LEFT JOIN product_category pc ON pt.categ_id = pc.id
WHERE pt.categ_id IS NOT NULL AND pc.id IS NULL;
-- Résultat : 0 ✅
```

✅ Aucune foreign key orpheline

### Doublons Contraintes Uniques

```sql
SELECT default_code, COUNT(*) as count
FROM product_template
WHERE default_code IS NOT NULL
GROUP BY default_code
HAVING COUNT(*) > 1;
-- Résultat : 0 lignes ✅
```

✅ Aucun doublon sur contraintes uniques

---

## 📈 Statistiques Globales

### Par Module

| Module | Modèles | Champs Total | Sync | Manquants | Incohérents |
|--------|---------|--------------|------|-----------|-------------|
| quelyos_api | 3 | 28 | 92.8% | 2 | 1 |

### Par Type d'Incohérence

| Type | Count | Priorité |
|------|-------|----------|
| Modules à upgrader | 1 | P0 |
| Champs manquants | 2 | P0 |
| Types incohérents | 1 | P1 |
| Contraintes manquantes | 0 | - |
| Données corrompues | 0 | - |
| **TOTAL** | **4** | **2 P0, 1 P1** |

---

## 🎯 Plan d'Action Priorisé

### Immédiat (BLOQUANT)

1. ✅ **P0-1** : Upgrader module quelyos_api (v19.0.1.0.4 → v19.0.1.0.5)
   ```bash
   cd odoo-backend && ./upgrade.sh quelyos_api
   ```

2. ✅ **P0-2** : Ajouter champ manquant `custom_description`
   - L'upgrade du module devrait créer le champ automatiquement
   - Sinon, vérifier logs Odoo : `docker-compose logs odoo | grep ERROR`

### Court Terme (avant release)

3. ✅ **P1-3** : Corriger type incohérent `product.price` (integer → double precision)
   ```sql
   -- Backup DB d'abord !
   ALTER TABLE product_template
   ALTER COLUMN price TYPE double precision USING price::double precision;
   ```

### Validation

4. ✅ Relancer `/db-sync` pour vérifier 100% synchronisation

---

## ✅ Checklist Validation

- [ ] Tous modules custom à jour (0 `to upgrade`)
- [ ] 100% champs Python existent en DB
- [ ] 0 incohérences types (Python ↔ PostgreSQL)
- [ ] 0 contraintes manquantes
- [ ] 0 données corrompues (NULL, orphelins, doublons)

**🚨 STATUT : NON VALIDÉ (2/5 critères OK)**

Après corrections, le statut devrait être :
**✅ STATUT : VALIDÉ (5/5 critères OK)**

---

## 📝 Notes

- **Toujours** créer backup DB avant migrations manuelles
- **Toujours** upgrader module après modification modèles
- **Automatiser** cette vérification en CI/CD (pre-commit hook)
- **Documenter** migrations custom dans `odoo-odoo-backend/migrations/`
```

### 10. Actions Automatisables (Bonus)

**Si patterns simples détectés, proposer fixes automatiques :**

**Exemple : Module à upgrader**
```
Voulez-vous upgrader automatiquement le module quelyos_api ?

Options :
1. Oui, upgrader maintenant (Recommandé)
2. Non, je vais le faire manuellement
```

**Si Oui :**
```bash
cd odoo-backend && ./upgrade.sh quelyos_api && ./check_fields.sh addons/quelyos_api/models/product.py product_template
```

## Métriques de Succès

**Cette commande est un succès si :**

1. ✅ État de tous modules custom vérifié (installed, to upgrade, to install)
2. ✅ Tous champs Python comparés avec colonnes DB (% sync calculé)
3. ✅ Incohérences types détectées (Python vs PostgreSQL)
4. ✅ Contraintes vérifiées (NOT NULL, UNIQUE, FK, indexes)
5. ✅ Intégrité données vérifiée (NULL, orphelins, doublons)
6. ✅ Rapport généré avec plan d'action priorisé (P0/P1/P2)

## Notes Importantes

- **Complémentaire** au workflow upgrade module (ne le remplace pas)
- **Toujours** exécuter après modification modèles Python
- **Toujours** exécuter avant déploiement production (via `/deploy`)
- **Automatiser** en pre-commit hook (bloquer commit si désynchronisé)

## Exemples d'Utilisation

```bash
# Après modification modèle
# (Ex: ajout champ low_stock_threshold dans product.py)
/db-sync quelyos_api       # Vérifie sync module quelyos_api

# Avant commit
/db-sync                   # Vérifie tous modules custom

# Debug erreur "field does not exist"
/db-sync quelyos_api       # Identifier champ manquant

# Avant déploiement production
/db-sync                   # Validation 100% sync (via /deploy)
```

## Intégration avec Workflow Odoo

**Cette commande s'intègre au workflow existant :**

1. **Modifier modèle** : Ajouter champ dans `models/*.py`
2. **Incrémenter version** : Modifier `__manifest__.py`
3. **Vérifier sync** : `/db-sync quelyos_api` → Détecte champ manquant
4. **Upgrader module** : `./upgrade.sh quelyos_api`
5. **Valider sync** : `/db-sync quelyos_api` → 100% sync ✅
6. **Committer** : Git commit (hook pre-commit valide sync automatiquement)

## Scripts Réutilisables

**Le projet dispose déjà de :**
- `odoo-odoo-backend/upgrade.sh` : Upgrade module + redémarrage + santé
- `odoo-odoo-backend/check_fields.sh` : Vérification champs modèle vs DB

**Cette commande les orchestre intelligemment.**
