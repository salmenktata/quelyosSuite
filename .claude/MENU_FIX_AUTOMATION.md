# Automatisation - Correction Menus Odoo Settings & Apps

## Problème résolu
Les menus "Settings" et "Apps" n'étaient pas visibles dans l'interface Odoo 19, même pour l'administrateur.

## Solution mise en place - 3 niveaux d'automatisation ✅

### Niveau 1 : Module Odoo (Permanent)
**Fichier** : `odoo-backend/addons/quelyos_core/__init__.py`

Fonction `_fix_menu_visibility()` ajoutée au `post_init_hook` :
- ✅ Corrige automatiquement les séquences des menus (Settings=1, Apps=2)
- ✅ Ajoute les groupes requis à l'admin (Access Rights, Technical Features)
- ✅ S'exécute à chaque installation/upgrade du module quelyos_core
- ✅ Idempotent : peut être exécuté plusieurs fois sans problème

### Niveau 2 : Script de démarrage (Automatique)
**Fichier** : `scripts/dev-start.sh`

Fonction `fix_odoo_menus()` ajoutée à `start_backend()` :
- ✅ S'exécute automatiquement à chaque `./scripts/dev-start.sh all|backend`
- ✅ Applique les corrections même si le backend est déjà démarré
- ✅ Gère les cas où la DB n'existe pas encore (ignore silencieusement)
- ✅ Ajoute les groupes et corrige les séquences en une seule opération

### Niveau 3 : Script manuel (Fallback)
**Fichier** : `scripts/fix-odoo-menus.sh`

Script standalone pour correction manuelle :
```bash
./scripts/fix-odoo-menus.sh
docker restart quelyos-odoo
```

## Quand les corrections s'appliquent

| Scénario | Automatique ? | Méthode |
|----------|---------------|---------|
| Démarrage via dev-start.sh | ✅ OUI | Script de démarrage |
| Installation quelyos_core | ✅ OUI | post_init_hook |
| Upgrade quelyos_core | ✅ OUI | post_init_hook |
| Après restauration DB | ⚠️ MANUEL | `fix-odoo-menus.sh` puis restart |
| Après update Odoo majeure | ⚠️ MANUEL | `fix-odoo-menus.sh` puis restart |

## Technique

### Corrections appliquées
1. **Séquences des menus**
   ```sql
   UPDATE ir_ui_menu SET sequence = 1 WHERE id = 1;  -- Settings
   UPDATE ir_ui_menu SET sequence = 2 WHERE id = 15; -- Apps
   ```

2. **Groupes utilisateur admin (uid=2)**
   ```sql
   -- Groupe "Access Rights" (id=2)
   INSERT INTO res_groups_users_rel (gid, uid) VALUES (2, 2) ON CONFLICT DO NOTHING;

   -- Groupe "Technical Features" (id=7)
   INSERT INTO res_groups_users_rel (gid, uid) VALUES (7, 2) ON CONFLICT DO NOTHING;
   ```

### Pourquoi ces valeurs ?
- **Séquences originales** : Settings=550, Apps=500 (fin de liste, invisible)
- **Séquences corrigées** : Settings=1, Apps=2 (début de liste, toujours visible)
- **Groupes requis** :
  - Access Rights : nécessaire pour voir le menu Settings
  - Technical Features : nécessaire pour le mode développeur
  - Role / Administrator : déjà présent par défaut

## Tests
```bash
# 1. Tester le script de démarrage
./scripts/dev-start.sh backend

# 2. Vérifier que les menus sont visibles
# Accéder à http://localhost:8069
# Se connecter avec admin
# Vérifier que Settings et Apps sont en haut de la liste

# 3. Tester le script manuel
./scripts/fix-odoo-menus.sh
docker restart quelyos-odoo
```

## Documentation
- **Guide utilisateur** : `docs/FIXES.md`
- **Scripts** : `scripts/fix-odoo-menus.sh`, `scripts/dev-start.sh`
- **Code** : `odoo-backend/addons/quelyos_core/__init__.py`

## Date de mise en place
2026-01-29
