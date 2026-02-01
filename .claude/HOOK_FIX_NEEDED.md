# 🔧 Fix Requis pour post_init_hook

## 🐛 Problème Identifié

Le `post_init_hook` dans `hooks.py` s'exécute MAIS ne persiste PAS les modifications car il utilise **SQL direct** au lieu de **l'ORM Odoo**.

### Symptômes Observés

```bash
# Le hook s'exécute
2026-02-01 16:28:55,249 🚀 QUELYOS SUITE - Installation Automatique
2026-02-01 16:29:11,775 ⚙️ QUELYOS SUITE - Configuration Post-Installation

# Module installé
quelyos_api | installed | 19.0.1.68.0

# Plans tarifaires créés (via XML) ✅
Starter, Pro, Enterprise

# MAIS les configs ne sont PAS créées ❌
- Admin: company_id non mis à jour
- Access Rights: groupe non ajouté
- Brevo: non créé
- Groq: non créé
```

## 🔍 Cause Racine

### Code Problématique (lignes 145-205)

```python
# ❌ PROBLÈME: SQL direct ne commit PAS dans les hooks Odoo
env.cr.execute("""
    UPDATE res_users
    SET company_id = %s
    WHERE login = 'admin'
""", (tenant_company_id,))

env.cr.execute("""
    INSERT INTO res_groups_users_rel (gid, uid)
    SELECT g.id, u.id...
""")
```

**Pourquoi ça ne fonctionne pas** :
- En Odoo, les hooks s'exécutent dans une transaction
- Les modifications SQL directes via `env.cr.execute()` ne sont PAS committées automatiquement
- Odoo commit seulement les opérations **ORM** (`create()`, `write()`, etc.)
- Ajouter `env.cr.commit()` dans un hook peut causer des **deadlocks**

## ✅ Solution : Utiliser L'ORM

### Code Corrigé (à appliquer)

```python
# 3. Configurer l'utilisateur admin par défaut
_logger.info("\n🔧 Configuration utilisateur admin...")

# ✅ SOLUTION: Utiliser l'ORM Odoo
Tenant = env['quelyos.tenant']
tenant = Tenant.search([('name', 'like', '%Admin%')], order='id', limit=1)

if tenant:
    User = env['res.users']
    admin = User.search([('login', '=', 'admin')], limit=1)

    if admin:
        # ORM write() commit automatiquement
        admin.write({
            'company_id': tenant.company_id.id,
            'company_ids': [(6, 0, [tenant.company_id.id])]
        })
        _logger.info(f"   ✓ Utilisateur admin associé au tenant '{tenant.name}'")

        # Ajouter groupe Access Rights via ORM
        Group = env['res.groups']
        access_group = Group.search([('name', 'like', '%Access Rights%')], limit=1)

        if access_group and access_group not in admin.groups_id:
            admin.write({'groups_id': [(4, access_group.id)]})
            _logger.info("   ✓ Groupe 'Access Rights' ajouté")
```

## 📝 Fichiers à Modifier

### 1. odoo-backend/addons/quelyos_api/hooks.py

**Lignes à remplacer** : 141-205

**Remplacer par** : Code ORM ci-dessus

**Version** : Incrémenter à `19.0.1.69.0`

### 2. odoo-backend/addons/quelyos_api/__manifest__.py

```python
'version': '19.0.1.69.0',  # Anciennement 19.0.1.68.0
```

## 🧪 Test de Validation

Après modification, tester avec `/fresh-install` :

```bash
# 1. Installation
docker-compose down -v
docker-compose up -d db redis
sleep 10
docker-compose up -d odoo
sleep 25
docker exec quelyos-odoo odoo -d quelyos -i quelyos_api --db_host=db --db_user=odoo --db_password=odoo --stop-after-init

# 2. Vérification Admin
docker exec quelyos-db psql -U odoo -d quelyos -c "
SELECT u.login, u.company_id, COUNT(g.id) as has_access_rights
FROM res_users u
LEFT JOIN res_groups_users_rel r ON u.id = r.uid
LEFT JOIN res_groups g ON r.gid = g.id AND g.name::text LIKE '%Access Rights%'
WHERE u.login = 'admin'
GROUP BY u.login, u.company_id;
"

# Attendu:
#  login | company_id | has_access_rights
# -------+------------+-------------------
#  admin |          2 |                 1

# 3. Vérification Brevo
docker exec quelyos-db psql -U odoo -d quelyos -c "
SELECT provider, is_active FROM quelyos_email_config WHERE provider = 'brevo';
"

# Attendu:
#  provider | is_active
# ----------+-----------
#  brevo    | t

# 4. Vérification Groq
docker exec quelyos-db psql -U odoo -d quelyos -c "
SELECT provider, is_enabled FROM quelyos_ai_config WHERE provider = 'groq';
"

# Attendu:
#  provider | is_enabled
# ----------+------------
#  groq     | t
```

## 📊 Impact

**Avant** (v19.0.1.68.0) :
- ❌ Hook s'exécute mais ne persiste rien
- ❌ Configuration manuelle SQL requise après installation
- ⏱️ Temps : 2 min install + 5 min config manuelle = 7 min

**Après** (v19.0.1.69.0) :
- ✅ Hook persiste tout automatiquement via ORM
- ✅ Zéro configuration manuelle
- ⏱️ Temps : 2 min install = 2 min

## 🚀 Prochaine Étape

1. Appliquer le fix ORM dans `hooks.py`
2. Incrémenter version à `19.0.1.69.0`
3. Tester avec `/fresh-install`
4. Documenter dans `.claude/FRESH_INSTALL_OPTIMIZATION.md`
5. Commit avec message : `fix(hooks): utiliser ORM au lieu de SQL direct pour persistence`

## 📚 Référence Odoo

- [Documentation Hooks Odoo](https://www.odoo.com/documentation/19.0/developer/reference/backend/module.html#hooks)
- **Règle** : Toujours utiliser l'ORM dans les hooks, jamais `env.cr.execute()` pour les écritures
- **Exception** : SQL `SELECT` est OK, mais `INSERT/UPDATE/DELETE` doivent utiliser l'ORM
