# Patchs OCA 18.0 → Odoo 19.0

## 📋 Résumé

Les 4 modules OCA Stock (version 18.0) ont été adaptés pour fonctionner avec Odoo 19.0.

**Statut** : ✅ Tous installés avec succès

| Module | Version OCA | État | Patchs Appliqués |
|--------|------------|------|------------------|
| stock_change_qty_reason | 18.0.1.0.0 → 19.0.1.0.0 | ✅ Installed | category_id removed |
| stock_inventory | 18.0.1.1.2 → 19.0.1.1.2 | ✅ Installed | Aucun |
| stock_location_lockdown | 18.0.1.0.0 → 19.0.1.0.0 | ✅ Installed | Aucun |
| stock_demand_estimate | 18.0.1.1.0 → 19.0.1.1.0 | ✅ Installed | expand attribute removed |

## 🔧 Patchs Détaillés

### 1. stock_change_qty_reason

**Fichier** : `security/stock_security.xml`

**Problème** : Le champ `category_id` n'existe plus dans `res.groups` pour Odoo 19.0

**Avant (18.0)** :
```xml
<record id="group_qty_reason_preset" model="res.groups">
    <field name="name">Manage Stock Change Qty Preset Reasons</field>
    <field name="category_id" ref="base.module_category_hidden" />
</record>
```

**Après (19.0)** :
```xml
<!-- Odoo 19.0: Hidden groups no longer need category_id -->
<record id="group_qty_reason_preset" model="res.groups">
    <field name="name">Manage Stock Change Qty Preset Reasons</field>
</record>
```

**Raison** : Dans Odoo 19.0, les groupes cachés (hidden) ne nécessitent plus de `category_id`. Les groupes avec privilèges utilisent maintenant `privilege_id`.

### 2. stock_demand_estimate

**Fichier** : `views/stock_demand_estimate_view.xml`

**Problème** : L'attribut `expand` n'est plus supporté sur l'élément `<group>` dans les vues search

**Avant (18.0)** :
```xml
<separator />
<group expand="0" string="Group By">
    <filter
        string="Product"
        name="groupby_product"
        context="{'group_by':'product_id'}"
    />
    ...
</group>
```

**Après (19.0)** :
```xml
<separator />
<!-- Odoo 19.0: expand attribute removed from group -->
<separator string="Group By" />
<group>
    <filter
        string="Product"
        name="groupby_product"
        context="{'group_by':'product_id'}"
    />
    ...
</group>
```

**Raison** : Odoo 19.0 a simplifié la syntaxe des vues search en supprimant les attributs obsolètes comme `expand` et `string` sur `<group>`.

## 🔍 Changements Odoo 18.0 → 19.0 Identifiés

### 1. res.groups Model Changes

**Ancien modèle (18.0)** :
```xml
<record id="group_xxx" model="res.groups">
    <field name="name">Group Name</field>
    <field name="category_id" ref="base.module_category_xxx"/>
</record>
```

**Nouveau modèle (19.0)** :

Pour les groupes avec privilèges :
```xml
<record model="res.groups.privilege" id="res_groups_privilege_xxx">
    <field name="name">Privilege Name</field>
    <field name="category_id" ref="base.module_category_xxx"/>
</record>

<record id="group_xxx" model="res.groups">
    <field name="name">Group Name</field>
    <field name="privilege_id" ref="res_groups_privilege_xxx"/>
</record>
```

Pour les groupes cachés (hidden) :
```xml
<record id="group_xxx" model="res.groups">
    <field name="name">Group Name</field>
    <!-- Pas de category_id nécessaire -->
</record>
```

### 2. Search View Group Element

**Ancien (18.0)** :
```xml
<group expand="0" string="Group By">
    <filter ... />
</group>
```

**Nouveau (19.0)** :
```xml
<separator string="Group By" />
<group>
    <filter ... />
</group>
```

## 📚 Références

- [Migration Odoo 18 → 19 Guide](https://www.ksolves.com/blog/odoo/how-to-migrate-from-odoo-18-to-odoo-19-step-by-step-guide)
- [Odoo 19 Technical Changes](https://www.cybrosys.com/blog/overview-of-what-developers-need-to-know-in-odoo-19-technical-changes)
- [Odoo 19.0 Official Changelog](https://www.odoo.com/documentation/19.0/developer/reference/backend/orm/changelog.html)

## ✅ Tests d'Installation

```bash
# Vérifier modules installés
docker-compose -f odoo-backend/docker-compose.yml exec -T db psql -U odoo -d quelyos -c \
  "SELECT name, state FROM ir_module_module WHERE name IN ('stock_change_qty_reason', 'stock_inventory', 'stock_location_lockdown', 'stock_demand_estimate') ORDER BY name;"
```

**Résultat Attendu** :
```
          name           |   state
-------------------------+-----------
 stock_change_qty_reason | installed
 stock_demand_estimate   | installed
 stock_inventory         | installed
 stock_location_lockdown | installed
```

## 🛠️ Maintenance Future

### Quand OCA Publiera la Version 19.0 Officielle

1. **Comparer les patchs** : Vérifier si OCA a appliqué des correctifs similaires
2. **Tester la migration** : Installer modules OCA 19.0 officiels dans environnement test
3. **Documenter différences** : Noter si d'autres changements ont été faits
4. **Décider migration** :
   - Si identique → Migrer vers OCA 19.0 officiel
   - Si différent → Évaluer impact et décider

### Surveillance Repository OCA

- **GitHub** : https://github.com/OCA/stock-logistics-warehouse
- **Branches à surveiller** : `19.0`, `main`
- **Notifications** : Configurer watch pour la branche 19.0

## 📝 Notes

- Les patchs sont **minimaux** et **ciblés** : seules les incompatibilités bloquantes ont été corrigées
- Aucune modification de logique métier
- Les modules restent **100% compatibles** avec leur version OCA 18.0 en termes de fonctionnalités
- Les patchs seront **remplacés** par les versions officielles OCA 19.0 dès leur sortie

---

**Dernière Mise à Jour** : 27 Janvier 2026
**Auteur** : Quelyos Development Team
**Odoo Version** : 19.0
**OCA Version Source** : 18.0
