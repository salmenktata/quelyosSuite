# 📋 Plan Migration Progressive - Préfixes Champs Odoo

**Stratégie** : Migration progressive au fur et à mesure des modifications, avec **compatibilité ascendante** garantie.

---

## 🎯 Objectif

Renommer progressivement les 552 champs sans préfixe → `x_nom_champ` pour éviter collisions futures avec Odoo.

---

## 📊 Inventaire Champs à Migrer

### Priorité P1 - Modèles fréquents (à migrer en premier)
| Modèle | Champs sans préfixe | Fichier |
|--------|---------------------|---------|
| product.template | qty_available_unreserved | product_template.py |
| product.product | qty_available_unreserved, qty_reserved_manual, qty_available_after_manual_reservations | product_product.py |
| sale.order | recovery_token, recovery_email_sent_date, can_fulfill_now, expected_fulfillment_date, missing_stock_details, fulfillment_priority | sale_order.py |
| stock.quant | currency_id, adjustment_cost, low_stock_threshold | stock_quant.py |

### Priorité P2 - Modèles RH
| Modèle | Champs sans préfixe | Fichier |
|--------|---------------------|---------|
| hr.employee | employee_number, first_name, last_name | hr_employee.py |
| hr.attendance | overtime, check_in_mode, check_out_mode | hr_attendance.py |
| hr.leave | reference, refuse_reason, refused_date | hr_leave.py |
| hr.leave.type | code, max_consecutive_days, min_notice_days | hr_leave_type.py |

### Priorité P3 - Autres modèles
| Modèle | Champs sans préfixe | Fichier |
|--------|---------------------|---------|
| payment.provider | code, flouci_app_token, flouci_app_secret | payment_provider.py |
| payment.transaction | provider_payment_id, provider_request_payload, provider_response_payload | payment_transaction.py |
| stock.location | is_locked, lock_reason, locked_by_id | stock_location.py |

---

## 🔧 Pattern Migration avec Alias

### Exemple 1 : Champ simple avec computed alias
```python
class ProductProduct(models.Model):
    _inherit = 'product.product'
    
    # ✅ NOUVEAU champ avec préfixe (stockage SQL)
    x_qty_reserved_manual = fields.Float(
        string='Quantité réservée manuellement',
        default=0.0,
        help='Stock réservé manuellement (hors commandes)'
    )
    
    # ⚠️ ALIAS pour compatibilité backend (deprecated, sera supprimé Q3 2026)
    qty_reserved_manual = fields.Float(
        string='[DEPRECATED] Quantité réservée',
        compute='_compute_qty_reserved_manual_alias',
        inverse='_inverse_qty_reserved_manual_alias',
        store=False,
        help='DEPRECATED: Utiliser x_qty_reserved_manual'
    )
    
    def _compute_qty_reserved_manual_alias(self):
        """Alias backward-compatible (lecture)"""
        for record in self:
            record.qty_reserved_manual = record.x_qty_reserved_manual
    
    def _inverse_qty_reserved_manual_alias(self):
        """Alias backward-compatible (écriture)"""
        for record in self:
            record.x_qty_reserved_manual = record.qty_reserved_manual
```

### Exemple 2 : Migration avec script SQL
```python
# Dans migrations/19.0.X.Y.Z/post-migrate.py

def migrate(cr, version):
    """
    Migration progressive : Renommer qty_reserved_manual → x_qty_reserved_manual
    """
    # 1. Vérifier si colonne existe déjà
    cr.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='product_product' 
        AND column_name='x_qty_reserved_manual'
    """)
    
    if not cr.fetchone():
        # 2. Renommer colonne SQL (rapide, pas de perte données)
        cr.execute("""
            ALTER TABLE product_product 
            RENAME COLUMN qty_reserved_manual TO x_qty_reserved_manual
        """)
        
        # 3. Mettre à jour métadonnées Odoo
        cr.execute("""
            UPDATE ir_model_fields 
            SET name='x_qty_reserved_manual' 
            WHERE model='product.product' 
            AND name='qty_reserved_manual'
        """)
```

---

## 📅 Roadmap Migration

### Phase 1 (Q1 2026) - Modèles Stock/Ventes
- [ ] product.product (3 champs)
- [ ] product.template (1 champ)
- [ ] sale.order (6 champs)
- [ ] stock.quant (3 champs)
- [ ] stock.location (3 champs)

**Actions** :
1. Créer migration `19.0.1.42.0`
2. Renommer colonnes SQL
3. Ajouter alias computed fields
4. Tester endpoints API (pas de régression)
5. Upgrade module

### Phase 2 (Q2 2026) - Modèles RH
- [ ] hr.employee (3 champs)
- [ ] hr.attendance (3 champs)
- [ ] hr.leave (3 champs)
- [ ] hr.leave.type (3 champs)

### Phase 3 (Q3 2026) - Paiements & Autres
- [ ] payment.provider (3 champs)
- [ ] payment.transaction (3 champs)
- [ ] Tous modèles restants

### Phase 4 (Q4 2026) - Nettoyage
- [ ] Supprimer tous les alias computed
- [ ] Documentation migration complète

---

## 🛠️ Workflow Migration Standard

### Étape 1 : Préparation
```bash
# 1. Identifier champs à migrer dans un modèle
grep -E "^\s+[a-z_]+\s*=\s*fields\." odoo-backend/addons/quelyos_api/models/product_product.py | \
  grep -v "x_\|tenant_id\|_compute"

# 2. Créer branche migration
git checkout -b migration/product-product-fields-prefix
```

### Étape 2 : Modification Code
```python
# 1. Renommer champ dans models/*.py
# AVANT
qty_reserved_manual = fields.Float()

# APRÈS
x_qty_reserved_manual = fields.Float()

# 2. Ajouter alias (optionnel, si API backend utilisé)
qty_reserved_manual = fields.Float(
    compute='_compute_qty_reserved_manual_alias',
    inverse='_inverse_qty_reserved_manual_alias',
    store=False
)
```

### Étape 3 : Migration SQL
```bash
# 1. Créer dossier migration
mkdir -p odoo-backend/addons/quelyos_api/migrations/19.0.1.42.0

# 2. Créer script post-migrate.py (voir exemple ci-dessus)
```

### Étape 4 : Tests
```bash
# 1. Tester upgrade
docker exec odoo-backend odoo-bin -d quelyos_db -u quelyos_api --stop-after-init

# 2. Vérifier logs (pas d'erreur)
docker logs odoo-backend | grep -i error

# 3. Tester endpoints API
curl http://localhost:8069/api/products/1
```

### Étape 5 : Commit
```bash
# Incrémenter version __manifest__.py
# 19.0.1.41.0 → 19.0.1.42.0

git add .
git commit -m "refactor(odoo): migration product.product fields → x_ prefix

- Renommer qty_reserved_manual → x_qty_reserved_manual
- Renommer qty_available_unreserved → x_qty_available_unreserved
- Ajout alias backward-compatible (deprecated Q4 2026)
- Migration SQL automatique

Refs: .claude/MIGRATION_FIELDS_PREFIX.md"
```

---

## 🔍 Vérification Post-Migration

### Tests obligatoires
```bash
# 1. Installation fraîche (nouveau tenant)
docker exec odoo-backend odoo-bin -d test_fresh -i quelyos_api --stop-after-init

# 2. Upgrade existant (tenant avec données)
docker exec odoo-backend odoo-bin -d quelyos_db -u quelyos_api --stop-after-init

# 3. Vérifier structure SQL
docker exec -it postgres psql -U odoo -d quelyos_db -c "\d product_product" | grep x_qty
```

### Checklist
- [ ] Upgrade sans erreur
- [ ] Colonnes SQL renommées
- [ ] API backend fonctionne (si alias présent)
- [ ] Dashboard client fonctionne
- [ ] Aucune régression frontend

---

## 📝 Tracking Migration

| Date | Modèle | Champs migrés | Version | Status |
|------|--------|---------------|---------|--------|
| 2026-01-31 | - | - | 19.0.1.41.0 | ⏳ Planification |
| - | product.product | qty_reserved_manual → x_qty_reserved_manual | 19.0.1.42.0 | ⏸️ À faire |
| - | product.product | qty_available_unreserved → x_qty_available_unreserved | 19.0.1.42.0 | ⏸️ À faire |
| - | sale.order | recovery_token → x_recovery_token | 19.0.1.43.0 | ⏸️ À faire |

---

## ⚠️ Précautions

### NE PAS migrer
- ❌ Champs `tenant_id` (déjà bon préfixe)
- ❌ Champs computed uniquement (pas stockés SQL)
- ❌ Champs dans modèles `_name = 'quelyos.*'` (nouveaux modèles)

### Cas particuliers
| Champ | Action | Raison |
|-------|--------|--------|
| `name` dans modèles hérités | ⚠️ NE PAS migrer | Champ Odoo core (override) |
| `active` | ⚠️ NE PAS migrer | Champ Odoo core |
| `sequence` | ⚠️ NE PAS migrer | Champ Odoo core standard |

---

## 🎯 Bénéfices Attendus

✅ **Isolation parfaite** : Aucun risque collision avec Odoo 19.1+  
✅ **Maintenabilité** : Code conforme standards Odoo  
✅ **Upgrades faciles** : Pas de conflit lors mises à jour Odoo  
✅ **Documentation claire** : Préfixe `x_` = extension Quelyos  

---

## 📖 Voir aussi
- `.claude/ODOO_ISOLATION_RULES.md`
- `scripts/check-odoo-isolation.sh`
