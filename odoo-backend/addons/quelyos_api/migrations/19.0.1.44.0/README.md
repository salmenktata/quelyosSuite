# Migration 19.0.1.44.0 - Q2 2026: Modèles RH

**Date** : 2026-01-31  
**Type** : Refactoring (isolation Odoo)  
**Breaking Change** : Non (backward-compatible)

## Résumé

Migration Q2 2026 - Modèles RH (Ressources Humaines).  
Renommage champs sans préfixe → `x_*` pour isolation Odoo.

## Champs Migrés

### hr.employee (10 champs)
- employee_number, first_name, last_name, cnss_number, cin_number
- employee_state, bank_name, bank_account_number, seniority, hire_date

### hr.attendance (12 champs)
- overtime, check_in_mode, check_out_mode
- check_in_latitude/longitude, check_out_latitude/longitude
- attendance_state, anomaly_reason, validated_by, validated_date, notes

### hr.leave (3 champs)
- reference, refuse_reason, refused_date

### hr.leave.type (3 champs)
- code, max_consecutive_days, min_notice_days

### hr.leave.allocation (1 champ)
- reference

### hr.department (1 champ)
- code

### hr.job (1 champ)
- code

**Total Q2** : 31 champs

## Compatibilité

✅ Migration SQL automatique  
✅ Backward-compatible via références directes  
✅ Endpoints API continuent de fonctionner  

## Dépréciation

Anciens noms supprimés en Q4 2026.

## Tests

```bash
docker exec odoo-backend odoo-bin -d quelyos_db -u quelyos_api --stop-after-init
./scripts/check-odoo-isolation.sh
```
