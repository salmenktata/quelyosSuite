# 🚀 Optimisation /fresh-install - Capitalisation

## 📋 Problèmes Identifiés et Résolus

### 1. Hook post_init_hook Ne S'exécutait Pas

**Problème** :
Le `post_init_hook` dans `hooks.py` échouait silencieusement car il tentait de créer un champ `name` inexistant dans le modèle `quelyos.email.config`.

**Erreur** :
```python
EmailConfig.create({
    'name': 'Brevo (Sendinblue)',  # ❌ Ce champ n'existe PAS !
    'provider': 'brevo',
    ...
})
```

**Solution** (v19.0.1.68.0) :
```python
EmailConfig.create({
    'provider': 'brevo',  # ✅ Champ 'name' retiré
    'is_active': True,
    'api_key': '...',
    ...
})
```

### 2. Différence de Structure entre Modèles

**Découverte** :
- `quelyos.email.config` : **PAS de champ `name`** (seulement `provider`)
- `quelyos.ai.config` : **AVEC champ `name`** (obligatoire)

**Fichiers concernés** :
- `odoo-backend/addons/quelyos_api/models/email_config.py` (ligne 10-60)
- `odoo-backend/addons/quelyos_api/models/ai_config.py` (ligne 21-45)

## ✅ Corrections Appliquées

### hooks.py (v19.0.1.68.0)

**Ligne 231-238** : Création Brevo sans champ `name`
```python
if not existing_brevo:
    # Note: quelyos.email.config n'a pas de champ 'name'
    EmailConfig.create({
        'provider': 'brevo',
        'is_active': True,
        'api_key': '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',
        'email_from': 'noreply@quelyos.com',
        'email_from_name': 'Quelyos',
    })
```

**Ligne 247-256** : Création Groq (inchangé, fonctionne)
```python
AIConfig.create({
    'name': 'Groq AI (Chatbot)',  # ✅ Ce modèle a bien un champ 'name'
    'provider': 'groq',
    'is_enabled': True,
    ...
})
```

## 🔧 Workflow /fresh-install Optimisé

### Étapes Automatisées

1. **Nettoyage** (~5s)
   - Arrêt conteneurs
   - Suppression volumes
   - Nettoyage réseau

2. **Démarrage Services** (~15s)
   - PostgreSQL + Redis : 10s
   - Odoo initial : 5s

3. **Installation Module** (~95s)
   - Installation `quelyos_api` avec `-i`
   - Chargement 96 modules Odoo Community
   - Exécution **automatique** du `post_init_hook`

4. **post_init_hook Automatique** (~2s)
   - ✅ Vérification version Odoo 19
   - ✅ Vérification dépendances Python
   - ✅ Vérification 3 plans tarifaires
   - ✅ Configuration admin (company + Access Rights)
   - ✅ Création config Brevo (activée)
   - ✅ Création config Groq (activée)

5. **Redémarrage** (~10s)
   - Odoo redémarré
   - Services opérationnels

**Temps Total** : ~2 minutes (vs 30+ minutes avant optimisation)

## 📦 Configuration Post-Installation

### Ce Qui Est Créé Automatiquement

#### 1. Plans Tarifaires (3 plans)
```sql
SELECT name, code, price_monthly, is_popular
FROM quelyos_subscription_plan
ORDER BY display_order;

   name     |   code     | price_monthly | is_popular
------------+------------+---------------+------------
 Starter    | starter    |            29 | f
 Pro        | pro        |            79 | t          ⭐
 Enterprise | enterprise |             0 | f
```

#### 2. Utilisateur Admin
```sql
SELECT login, company_id FROM res_users WHERE login = 'admin';

 login | company_id
-------+------------
 admin |          2  (Admin Quelyos)
```

**Groupes** :
- ✅ Access Rights (super-admin)
- ✅ Accès TOUS les 9 modules

#### 3. Configuration Brevo
```sql
SELECT provider, is_active, api_key IS NOT NULL as has_key
FROM quelyos_email_config WHERE provider = 'brevo';

 provider | is_active | has_key
----------+-----------+---------
 brevo    | t         | t       ✅ ACTIVÉ
```

**Détails** :
- API Key : Configurée (production)
- Sender : noreply@quelyos.com
- État : Opérationnel immédiatement

#### 4. Configuration Groq (Chatbot IA)
```sql
SELECT provider, is_enabled, api_key_encrypted IS NOT NULL as has_key
FROM quelyos_ai_config WHERE provider = 'groq';

 provider | is_enabled | has_key
----------+------------+---------
 groq     | t          | t       ✅ ACTIVÉ
```

**Détails** :
- Modèle : llama-3.1-70b-versatile
- API Key : Configurée et **chiffrée** avec Fernet
- Max tokens : 800
- Temperature : 0.7
- État : Opérationnel immédiatement

## 🎯 Résultat Final

### Après `/fresh-install`

```bash
# Installation
docker-compose up -d  # ~2 minutes

# Vérification
curl http://localhost:8069/api/health
# {"status":"ok","timestamp":"..."}
```

**Dashboard (http://localhost:5175)** :
- Login : `admin`
- Password : `admin`
- Modules : **9 modules accessibles** immédiatement
- Services : Brevo + Groq opérationnels

### Aucune Action Manuelle Requise

❌ **Avant** (session précédente) :
- Installation manuelle modules OCA
- Configuration manuelle admin
- Ajout manuel groupe Access Rights
- Création manuelle configs Brevo/Groq
- ⏱️ Temps : 30+ minutes

✅ **Après** (optimisé) :
- Tout automatique via `post_init_hook`
- Zéro intervention manuelle
- ⏱️ Temps : ~2 minutes

## 📝 Checklist Pré-Commit

Avant de committer des modifications aux hooks :

- [ ] Vérifier que tous les champs existent dans le modèle Odoo
- [ ] Tester avec `docker exec quelyos-odoo python3 -c "import odoo; ..."`
- [ ] Incrémenter version dans `__manifest__.py`
- [ ] Documenter dans `.claude/AUTO_CONFIGURATION.md`
- [ ] Tester avec `/fresh-install` complet

## 🔍 Debug si Hook Échoue

### Vérifier Logs Installation
```bash
docker logs quelyos-odoo 2>&1 | grep -A 20 "QUELYOS SUITE"
```

### Vérifier Structure Modèle
```bash
docker exec quelyos-db psql -U odoo -d quelyos -c "\d quelyos_email_config"
docker exec quelyos-db psql -U odoo -d quelyos -c "\d quelyos_ai_config"
```

### Tester Création Manuelle (Si Hook Échoue)
```python
# Via shell Odoo
env['quelyos.email.config'].create({
    'provider': 'brevo',
    'is_active': True,
    'api_key': '...',
})
```

## 📚 Documentation Mise à Jour

- ✅ `.claude/AUTO_CONFIGURATION.md` - Configuration automatique
- ✅ `.claude/READY_FOR_FRESH_INSTALL.md` - Récapitulatif prêt
- ✅ `.claude/FRESH_INSTALL_OPTIMIZATION.md` - Ce fichier
- ✅ `hooks.py` v19.0.1.68.0 - Hook corrigé

## 🎉 Prochaine Utilisation

```bash
# Commande simple
/fresh-install

# Résultat attendu
✅ Installation terminée en ~2 minutes
✅ Admin configuré avec Access Rights
✅ 3 plans tarifaires disponibles
✅ Brevo ACTIVÉ avec clé API
✅ Groq ACTIVÉ avec clé API chiffrée
✅ Dashboard prêt : http://localhost:5175
```

**Tenant par défaut** : Admin Quelyos (conservé)

**Modifications futures** : Modifier `data/default_admin_tenant.xml` pour changer le nom/domaine du tenant par défaut.
