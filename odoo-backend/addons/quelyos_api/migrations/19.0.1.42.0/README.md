# Migration 19.0.1.42.0 - Préfixes Champs Product

**Date** : 2026-01-31  
**Type** : Refactoring (isolation Odoo)  
**Breaking Change** : Non (backward-compatible)

## Résumé

Migration progressive des champs `product.product` et `product.template` sans préfixe → `x_*` pour éviter collisions futures avec Odoo.

## Champs Migrés

### product.product
- `qty_available_unreserved` → `x_qty_available_unreserved`
- `qty_reserved_manual` → `x_qty_reserved_manual`  
- `qty_available_after_manual_reservations` → `x_qty_available_after_manual_reservations`
- `qty_sold_365` → `x_qty_sold_365`
- `stock_turnover_365` → `x_stock_turnover_365`
- `days_of_stock` → `x_days_of_stock`

### product.template
- `qty_available_unreserved` → `x_qty_available_unreserved`

## Compatibilité

✅ **Pas de migration SQL nécessaire** (computed fields non-stockés)  
✅ **Alias backward-compatible** créés pour tous les champs  
✅ **Endpoints API** continuent de fonctionner sans modification  
✅ **Aucune régression** attendue

## Dépréciation

Les anciens noms de champs sont **DEPRECATED** et seront supprimés en **Q4 2026** (version 20.0.x.x.x).

## Tests

```bash
# Installation fraîche
docker exec odoo-backend odoo-bin -d test_db -i quelyos_api --stop-after-init

# Upgrade module
docker exec odoo-backend odoo-bin -d quelyos_db -u quelyos_api --stop-after-init

# Vérifier isolation
./scripts/check-odoo-isolation.sh
```

## Voir aussi

- `.claude/MIGRATION_FIELDS_PREFIX.md` (plan complet)
- `.claude/ODOO_ISOLATION_RULES.md` (règles)
