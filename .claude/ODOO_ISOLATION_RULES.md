# ⚠️ RÈGLES D'ISOLATION ODOO - PRIORITÉ MAXIMALE

**PRINCIPE ABSOLU** : Les modules Quelyos (couche Quelyos) ne doivent JAMAIS provoquer de conflit, modification destructive ou erreur avec les modules de base Odoo 19.

**Objectif** : Garantir compatibilité, maintenabilité et upgrades Odoo sans régression.

---

## 🔒 RÈGLES STRICTES D'HÉRITAGE

### ✅ AUTORISÉ - Extension non-destructive
```python
class ProductTemplate(models.Model):
    _inherit = 'product.template'

    # ✅ Ajout de champs personnalisés (préfixe x_ recommandé)
    x_is_featured = fields.Boolean(string='Produit vedette')
    tenant_id = fields.Many2one('quelyos.tenant', ondelete='cascade')

    # ✅ Computed fields basés sur champs existants
    @api.depends('product_variant_ids.qty_available')
    def _compute_custom_metric(self):
        for record in self:
            record.custom_metric = sum(...)
```

### ❌ INTERDIT - Modification comportement core
```python
class ProductTemplate(models.Model):
    _inherit = 'product.template'

    # ❌ JAMAIS override write/create sans super()
    def write(self, vals):
        # Logique custom qui ignore super()
        return True  # ❌ INTERDIT

    # ❌ JAMAIS modifier valeurs par défaut core Odoo
    list_price = fields.Float(default=100.0)  # ❌ Change le défaut Odoo

    # ❌ JAMAIS modifier required/readonly des champs core
    name = fields.Char(required=False)  # ❌ Odoo dit required=True
```

---

## 📋 CHECKLIST AVANT MODIFICATION MODÈLE

Avant d'ajouter/modifier un héritage `_inherit`, vérifier :

- [ ] **Le champ ajouté a un préfixe** (`x_`, `tenant_`, `quelyos_`)
- [ ] **Pas de modification champs core Odoo** (name, active, company_id, etc.)
- [ ] **Si override CRUD, TOUJOURS appeler super()**
- [ ] **Pas de `auto_install=True`** (sauf quelyos_core orchestrateur)
- [ ] **Dépendances = Core Odoo 19 uniquement** (pas d'OCA sauf exception documentée)
- [ ] **SQL direct = INTERDIT** (utiliser ORM Odoo)
- [ ] **Vérifier compatibilité avec modules Odoo installés**

---

## 🛡️ PATTERNS SÉCURISÉS

### Override avec super() OBLIGATOIRE
```python
@api.model
def create(self, vals):
    # ✅ Logique pré-traitement
    if 'tenant_id' not in vals:
        vals['tenant_id'] = self.env.context.get('tenant_id')

    # ✅ TOUJOURS appeler super()
    record = super(SaleOrder, self).create(vals)

    # ✅ Logique post-traitement
    record._trigger_custom_webhook()

    return record
```

### Computed fields isolés
```python
# ✅ Computed field qui n'affecte PAS le comportement core
qty_available_unreserved = fields.Float(
    compute='_compute_qty_available_unreserved',
    store=False,  # Pas de colonne SQL si pas nécessaire
    help='Stock disponible hors réservations manuelles'
)

@api.depends('qty_available', 'reservation_ids.quantity')
def _compute_qty_available_unreserved(self):
    for record in self:
        reserved = sum(record.reservation_ids.mapped('quantity'))
        record.qty_available_unreserved = record.qty_available - reserved
```

### Constraints additifs uniquement
```python
# ✅ Ajouter contraintes Quelyos (n'affecte pas core)
@api.constrains('tenant_id', 'partner_id')
def _check_tenant_partner(self):
    for record in self:
        if record.tenant_id and record.partner_id:
            if record.partner_id.tenant_id != record.tenant_id:
                raise ValidationError("Partner must belong to same tenant")
```

---

## 🚫 ANTI-PATTERNS À ÉVITER

### ❌ Modification champs core sans super()
```python
# ❌ INTERDIT
def write(self, vals):
    if 'name' in vals:
        vals['name'] = vals['name'].upper()  # Modifie comportement Odoo
        self.env.cr.execute("UPDATE ...")  # SQL direct
    return models.Model.write(self, vals)  # Pas de super()
```

### ❌ Dépendances OCA non documentées
```python
# ❌ INTERDIT (sauf exception documentée dans __manifest__.py)
'depends': [
    'base',
    'sale_management',
    'stock_warehouse_calendar',  # ❌ OCA non documenté
]
```

### ❌ auto_install=True sur modules métier
```python
# ❌ INTERDIT (sauf quelyos_core orchestrateur)
{
    'name': 'Quelyos Marketing',
    'auto_install': True,  # ❌ Force installation = conflit potentiel
}
```

---

## 🔍 VÉRIFICATIONS POST-DÉVELOPPEMENT

### Commandes de vérification

```bash
# 1. Vérifier qu'il n'y a pas de SQL direct
grep -r "\.cr\.execute" odoo-backend/addons/quelyos_*/models/*.py

# 2. Vérifier que tous les override CRUD appellent super()
grep -A 10 "def write\|def create\|def unlink" odoo-backend/addons/quelyos_*/models/*.py | grep -L "super("

# 3. Vérifier dépendances OCA
grep -r "'depends':" odoo-backend/addons/quelyos_*/__manifest__.py

# 4. Tester installation module seul (sans conflits)
docker exec odoo-backend odoo-bin -d test_db -i quelyos_api --stop-after-init --test-enable

# 5. Tester upgrade Odoo (simuler passage 19.0 → 19.1)
# Vérifier que les modules Quelyos ne bloquent pas l'upgrade
```

### Tests d'isolation

1. **Installer module Quelyos seul** → Doit fonctionner sans erreur
2. **Désinstaller module Quelyos** → Odoo core doit rester fonctionnel
3. **Upgrade Odoo 19.0 → 19.1** → Modules Quelyos doivent suivre sans régression
4. **Installer module Odoo standard APRÈS Quelyos** → Pas de conflit (ex: hr, project)

---

## 📝 DOCUMENTATION OBLIGATOIRE

### Dans __manifest__.py
```python
{
    'name': 'Quelyos API',
    'version': '19.0.1.41.0',
    'depends': [
        'base',
        'sale_management',
        # OCA Stock modules (exception documentée)
        # RAISON : Odoo 19 ne fournit pas stock.inventory natif
        # ALTERNATIVE : Migrer vers quelyos_stock_advanced (roadmap Q2 2026)
        'stock_inventory',  # OCA
        'stock_warehouse_calendar',  # OCA
    ],
    'description': """
        Héritages modèles core Odoo :
        - product.template : Ajout champs marketing (x_is_featured, x_is_new)
        - sale.order : Ajout tenant_id, recovery_token (multi-tenant)
        - res.partner : Ajout tenant_id (multi-tenant)

        GARANTIE : Aucune modification comportement core. Tous les overrides
        appellent super(). Désinstallation propre sans perte de données core.
    """,
}
```

---

## 🔄 MIGRATION OCA → QUELYOS (Roadmap)

**Objectif** : Éliminer dépendances OCA pour isolation totale.

### État actuel (quelyos_api)
```python
# ❌ Dépendances OCA temporaires
'stock_inventory',           # OCA - Inventaire physique
'stock_warehouse_calendar',  # OCA - Calendrier entrepôt
'stock_inventory_lockdown',  # OCA - Verrouillage inventaire
```

### Plan migration
- **Q2 2026** : Migrer fonctionnalités vers `quelyos_stock_advanced`
- **Q3 2026** : Supprimer dépendances OCA de `quelyos_api`
- **Q4 2026** : Isolation 100% (Core Odoo 19 uniquement)

---

## ⚡ RÈGLE D'OR

> **Si un module Quelyos casse une fonctionnalité Odoo standard, c'est un BUG CRITIQUE P0.**

**Avant chaque commit** :
1. Vérifier héritages (checklist ci-dessus)
2. Tester installation/désinstallation propre
3. Vérifier logs Odoo (pas de WARNING lié aux modules Quelyos)
4. Documenter toute exception (dépendance OCA, override complexe)

**En cas de doute** : Créer un nouveau modèle Quelyos au lieu d'hériter un modèle core.

---

## 🔍 AUDIT ACTUEL (2026-01-31)

### Héritages détectés
- **30+ modèles core hérités** : product.template, sale.order, res.partner, stock.quant, etc.
- **35 overrides** de méthodes CRUD (write, create, unlink)
- **3 dépendances OCA** dans quelyos_api

### Risques identifiés
1. **Dépendances OCA** : Migration vers quelyos_stock_advanced requise
2. **Overrides CRUD** : Vérifier que tous appellent super()
3. **Champs sans préfixe** : Certains champs ajoutés manquent de préfixe x_

### Actions recommandées
- [ ] Audit complet des overrides CRUD (vérifier super())
- [ ] Renommer champs sans préfixe → `x_*`
- [ ] Documenter exceptions dans __manifest__.py
- [ ] Plan migration OCA → Quelyos natif
