# Corrections et Workarounds

## Menu Settings et Apps invisibles dans Odoo 19

### Symptôme
Les menus "Settings" et "Apps" ne sont pas visibles dans la barre de navigation d'Odoo, même pour l'administrateur.

### Cause
Dans Odoo 19, ces menus ont par défaut des séquences très élevées (500 et 550) qui les placent en fin de liste, les rendant invisibles ou difficiles à trouver dans l'interface utilisateur.

### Solution appliquée
1. Ajout des groupes requis à l'utilisateur admin :
   - `Access Rights` (groupe id=2)
   - `Technical Features` (groupe id=7)
   - `Role / Administrator` (groupe id=4)

2. Modification des séquences des menus :
   ```sql
   UPDATE ir_ui_menu SET sequence = 1 WHERE id = 1;  -- Settings
   UPDATE ir_ui_menu SET sequence = 2 WHERE id = 15; -- Apps
   ```

### Script de correction
Un script a été créé pour appliquer cette correction automatiquement :
```bash
./scripts/fix-odoo-menus.sh
```

### Prévention AUTOMATIQUE

Le problème est maintenant corrigé automatiquement à **3 niveaux** :

#### 1. **Module Odoo (quelyos_core)** ✅ Recommandé
Le module `quelyos_core` applique automatiquement les corrections via son `post_init_hook`.
- S'exécute à chaque installation/upgrade du module
- Corrige les séquences des menus (Settings=1, Apps=2)
- Ajoute les groupes requis à l'admin (Access Rights, Technical Features)

```bash
# Pour réappliquer si nécessaire
./scripts/upgrade-odoo.sh quelyos_core
```

#### 2. **Script de démarrage (dev-start.sh)** ✅ Automatique
Le script `dev-start.sh` applique automatiquement les corrections au démarrage du backend.
- S'exécute à chaque `./scripts/dev-start.sh all` ou `./scripts/dev-start.sh backend`
- Idempotent : peut être exécuté plusieurs fois sans problème
- Gère les cas où la DB n'existe pas encore

#### 3. **Script manuel (fix-odoo-menus.sh)**
En dernier recours, un script manuel est disponible :
```bash
./scripts/fix-odoo-menus.sh
docker restart quelyos-odoo
```

### Quand les corrections s'appliquent
- ✅ À chaque démarrage via `dev-start.sh`
- ✅ À chaque installation/upgrade de `quelyos_core`
- ✅ Manuellement via `fix-odoo-menus.sh` si nécessaire

### Date de correction
2026-01-29

### Fichiers modifiés
- `/scripts/dev-start.sh` - Ajout de `fix_odoo_menus()`
- `/scripts/fix-odoo-menus.sh` - Script manuel standalone
- `/odoo-backend/addons/quelyos_core/__init__.py` - Ajout de `_fix_menu_visibility()`

---
