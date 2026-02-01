# 🚀 Quelyos Core - Installation Automatique

## 🎯 Objectif

Installer automatiquement **toute la suite Quelyos** lors de la création d'une nouvelle base de données Odoo 19, sans intervention manuelle.

## 🏗️ Architecture

```
Nouvelle DB Odoo 19
    ↓ (auto_install=True)
quelyos_core (orchestrateur)
    ↓ (depends=['quelyos_api'])
quelyos_api (suite complète)
    ↓ (depends=[...])
14 modules Odoo Community + 2 modules OCA
```

## 📦 Module quelyos_core

### Localisation
`odoo-backend/addons/quelyos_core/`

### Rôle
- **Orchestrateur minimal** : Aucune fonctionnalité métier propre
- **Déclencheur automatique** : auto_install=True (seul module autorisé)
- **Configuration système** : Désactive tours Odoo, active modules optionnels

### __manifest__.py

```python
{
    'name': 'Quelyos Core',
    'version': '19.0.1.0.0',
    'category': 'Quelyos/Core',
    'depends': [
        'quelyos_api',  # Déclenche installation suite complète
    ],
    'data': [
        'data/installer_config_data.xml',  # Config modules optionnels
        'data/config_data.xml',
        'data/module_category_data.xml',
    ],
    'auto_install': True,  # ✅ INSTALLATION AUTOMATIQUE
    'application': False,  # Pas une application visible
}
```

### Fichiers Data

#### 1. `data/installer_config_data.xml`

Configure les modules optionnels à installer automatiquement :

```xml
<!-- Module quelyos_stock_advanced : Inventaire avancé (ACTIVÉ par défaut) -->
<function model="ir.config_parameter" name="set_param">
    <value>quelyos.install_stock_advanced</value>
    <value>True</value>
</function>

<!-- Module quelyos_finance : Gestion trésorerie et budgets (ACTIVÉ par défaut) -->
<function model="ir.config_parameter" name="set_param">
    <value>quelyos.install_finance</value>
    <value>True</value>
</function>

<!-- Module quelyos_sms_tn : Notifications SMS Tunisie (ACTIVÉ par défaut) -->
<function model="ir.config_parameter" name="set_param">
    <value>quelyos.install_sms_tn</value>
    <value>True</value>
</function>

<!-- Désactiver le tour automatique du configurateur website d'Odoo -->
<function model="ir.config_parameter" name="set_param">
    <value>website_generator.done</value>
    <value>True</value>
</function>

<!-- Désactiver tous les tours web automatiques -->
<function model="ir.config_parameter" name="set_param">
    <value>web_tour.disable_tours</value>
    <value>True</value>
</function>
```

**Raison** : Quelyos utilise ses propres frontends (vitrine-client, dashboard-client), les tours Odoo doivent être désactivés pour éviter les popups intrusifs.

#### 2. `data/config_data.xml`

Configuration système additionnelle (à documenter si nécessaire).

#### 3. `data/module_category_data.xml`

Définit les catégories de modules Quelyos dans le menu Apps Odoo.

## 🔒 Conformité ODOO_ISOLATION_RULES.md

✅ **Seul module autorisé** avec `auto_install=True`

**Règle** : Aucun autre module Quelyos ne peut avoir `auto_install=True` (violation isolation Odoo).

**Exception** : `quelyos_core` car :
- Module orchestrateur technique
- Aucune fonctionnalité métier
- Ne modifie aucun comportement Odoo core
- Installation/désinstallation propre

## 📊 Workflow Installation

### 1. Création Base de Données

```bash
# Via interface Odoo
http://localhost:8069/web/database/manager

# Ou via CLI
docker exec quelyos-odoo odoo-bin -d quelyos_fresh --db_host=db --db_user=odoo --db_password=odoo --stop-after-init
```

### 2. Installation Automatique quelyos_core

**Automatique** : Odoo détecte `auto_install=True` et installe quelyos_core immédiatement.

### 3. Installation quelyos_api par Dépendance

**Automatique** : `depends=['quelyos_api']` déclenche l'installation de quelyos_api.

### 4. Installation Modules Odoo/OCA

**Automatique** : `quelyos_api` dépend de 14 modules Odoo Community + 2 OCA, tous installés automatiquement.

### 5. Exécution post_init_hook

**Automatique** : `quelyos_api/hooks.py` configure :
- Utilisateur admin → Associé au tenant par défaut
- Groupe Access Rights → Ajouté à admin
- Plans tarifaires → 3 plans (Starter, Pro, Enterprise)
- Config Brevo → Créée avec clé API activée
- Config Chatbot Groq → Créée avec clé API chiffrée activée

### 6. Chargement Data quelyos_core

**Automatique** : Désactivation tours Odoo, activation modules optionnels.

## ⏱️ Temps Total

**~90 secondes** pour une installation complète sans aucune intervention manuelle.

## 🧪 Test Installation Automatique

### Test 1 : Nouvelle DB vierge

```bash
# Créer DB depuis interface
http://localhost:8069/web/database/manager
# Nom DB : test_auto
# Login : admin
# Password : admin

# Attendre 90s

# Vérifier quelyos_core installé
docker exec quelyos-postgres psql -U odoo -d test_auto -c "
SELECT name, state FROM ir_module_module 
WHERE name IN ('quelyos_core', 'quelyos_api')
ORDER BY name;
"

# Résultat attendu :
#     name      |   state   
# --------------+-----------
#  quelyos_api  | installed
#  quelyos_core | installed
```

### Test 2 : Vérifier Configuration Auto

```bash
# Tours Odoo désactivés
docker exec quelyos-postgres psql -U odoo -d test_auto -c "
SELECT key, value FROM ir_config_parameter
WHERE key IN ('website_generator.done', 'web_tour.disable_tours')
ORDER BY key;
"

# Résultat attendu :
#           key            | value
# -------------------------+-------
#  web_tour.disable_tours  | True
#  website_generator.done  | True
```

### Test 3 : Vérifier Configs Services

```bash
# Brevo
docker exec quelyos-postgres psql -U odoo -d test_auto -c "
SELECT provider, is_active FROM quelyos_email_config WHERE provider = 'brevo';
"

# Résultat attendu :
#  provider | is_active
# ----------+-----------
#  brevo    | t

# Groq
docker exec quelyos-postgres psql -U odoo -d test_auto -c "
SELECT provider, is_enabled FROM quelyos_ai_config WHERE provider = 'groq';
"

# Résultat attendu :
#  provider | is_enabled
# ----------+------------
#  groq     | t
```

## 🚫 Désactivation Installation Automatique

**Cas d'usage** : Installation Odoo standard sans Quelyos (rare).

### Option 1 : Supprimer quelyos_core

```bash
rm -rf odoo-backend/addons/quelyos_core/
docker restart quelyos-odoo
```

### Option 2 : auto_install=False

```python
# odoo-backend/addons/quelyos_core/__manifest__.py
'auto_install': False,  # Désactivé
```

Puis redémarrer Odoo.

## 📝 Modification Configuration

### Désactiver un Module Optionnel

**Via interface Odoo** :
1. Paramètres → Technique → Paramètres → Paramètres système
2. Rechercher : `quelyos.install_stock_advanced`
3. Modifier valeur : `False`

**Via SQL** :

```bash
docker exec quelyos-postgres psql -U odoo -d quelyos -c "
UPDATE ir_config_parameter
SET value = 'False'
WHERE key = 'quelyos.install_stock_advanced';
"
```

### Modules Configurables

| Paramètre | Module | Par Défaut |
|-----------|--------|-----------|
| `quelyos.install_stock_advanced` | Inventaire avancé | True |
| `quelyos.install_finance` | Trésorerie/budgets | True |
| `quelyos.install_sms_tn` | SMS Tunisie | True |

## 🎉 Résultat Final

### Après création DB (auto)

- ✅ quelyos_core : installé
- ✅ quelyos_api : installé
- ✅ 14 modules Odoo + 2 OCA : installés
- ✅ Admin configuré (company + Access Rights)
- ✅ 3 plans tarifaires créés
- ✅ Brevo activé avec clé API
- ✅ Groq activé avec clé API chiffrée
- ✅ Tours Odoo désactivés
- ✅ Dashboard : 9 modules accessibles

**Temps** : ~2 minutes sans intervention manuelle

**Login** : http://localhost:5175
- User : admin
- Pass : admin

## 📚 Références

- `.claude/ODOO_ISOLATION_RULES.md` : Règles isolation modules Quelyos
- `.claude/HOOK_FIX_NEEDED.md` : Corrections hooks installation
- `.claude/READY_FOR_FRESH_INSTALL.md` : État prêt pour installation
- `odoo-backend/addons/quelyos_core/__manifest__.py` : Manifest orchestrateur
- `odoo-backend/addons/quelyos_api/hooks.py` : Hooks configuration automatique
