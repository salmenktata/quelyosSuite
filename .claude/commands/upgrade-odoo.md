# Commande /upgrade-odoo - Upgrade Module Odoo

## Description

Commande pour upgrader un module Odoo après modification de modèles, vues ou données. Exécute la mise à jour via Docker et redémarre le serveur Odoo pour appliquer les changements.

## Usage

```bash
/upgrade-odoo [module]     # Upgrade un module spécifique
/upgrade-odoo              # Upgrade quelyos_api par défaut
```

**Exemples** :
- `/upgrade-odoo` - Upgrade du module quelyos_api (défaut)
- `/upgrade-odoo quelyos_api` - Upgrade explicite du module

---

## Quand utiliser cette commande ?

### ⚠️ OBLIGATOIRE après :

1. **Modification de modèles** (`models/*.py`)
   - Ajout/suppression/modification de champs
   - Création de nouveaux modèles
   - Modification de contraintes SQL
   - Ajout de méthodes compute/onchange

2. **Modification de vues** (`views/*.xml`)
   - Création de nouvelles vues (form/tree/kanban/search)
   - Modification de layouts
   - Ajout/suppression de champs dans les vues

3. **Modification de données** (`data/*.xml`)
   - Ajout de séquences (ir.sequence)
   - Création de données initiales (records)
   - Modification de cron jobs (ir.cron)
   - Mise à jour de paramètres système (ir.config_parameter)

4. **Modification de sécurité** (`security/*.csv`)
   - Ajout/modification de règles d'accès (ir.model.access.csv)
   - Modification de record rules (ir.rule)

5. **Modification du manifest** (`__manifest__.py`)
   - Incrémentation de version
   - Ajout/suppression de dépendances
   - Modification de data files

### ❌ PAS nécessaire pour :

- Modification de controllers uniquement (rechargement automatique)
- Modification de méthodes Python sans changement de champs
- Modification de fichiers statiques (CSS, JS, images)

---

## Workflow de la commande

### Étape 1 : Vérification de l'environnement

**1.1. Vérifier que Docker est démarré**

```bash
docker-compose ps
```

**Si conteneurs arrêtés :**
```
⚠️ Conteneurs Docker non démarrés

Veuillez démarrer les conteneurs avant l'upgrade :
  cd backend && docker-compose up -d

Puis relancer : /upgrade-odoo
```

**1.2. Vérifier le module existe**

```bash
ls -d backend/addons/$MODULE
```

**Si module introuvable :**
```
❌ Module '$MODULE' introuvable

Modules disponibles :
  - quelyos_api

Usage : /upgrade-odoo [module]
```

---

### Étape 2 : Sauvegarde préventive (optionnel)

**2.1. Demander si backup DB souhaité**

```typescript
AskUserQuestion({
  questions: [{
    question: "Sauvegarder la base de données avant l'upgrade ?",
    header: "Backup",
    multiSelect: false,
    options: [
      {
        label: "Non, continuer sans backup (Recommandé pour dev)",
        description: "Upgrade immédiat sans sauvegarde"
      },
      {
        label: "Oui, créer un backup avant",
        description: "Sauvegarde PostgreSQL (ajoute ~30s)"
      }
    ]
  }]
})
```

**2.2. Si backup demandé :**

```bash
cd backend
mkdir -p backups
docker-compose exec -T db pg_dump -U odoo -d quelyos | gzip > backups/quelyos_$(date +%Y%m%d_%H%M%S).sql.gz
```

**Afficher confirmation :**
```
✅ Backup créé : backups/quelyos_20260125_114500.sql.gz (12 MB)
```

---

### Étape 3 : Exécution de l'upgrade

**3.1. Exécuter la commande d'upgrade via Docker**

```bash
cd backend
docker-compose run --rm odoo odoo -d quelyos -u $MODULE --stop-after-init --db_host=db --db_user=odoo --db_password=odoo
```

**Variables :**
- `$MODULE` : Nom du module (défaut : `quelyos_api`)

**3.2. Parser les logs pour détecter erreurs**

**Logs à surveiller :**
- ✅ `module $MODULE: creating or updating database tables`
- ✅ `loading $MODULE/.../*.xml`
- ✅ `Module $MODULE loaded in X.XXs`
- ✅ `Registry loaded in X.XXs`
- ❌ `ERROR` / `CRITICAL` / `Traceback`

**Si erreur détectée :**
```
❌ ERREUR PENDANT L'UPGRADE

Erreur détectée :
  File "/mnt/extra-addons/quelyos_api/models/tenant.py", line 45
    SyntaxError: invalid syntax

Actions :
1. Corriger l'erreur dans le fichier
2. Relancer /upgrade-odoo
```

**Si succès :**
```
✅ Module $MODULE upgradé avec succès !

Tables DB : Créées/mises à jour
Vues chargées : X vues
Données chargées : Y records
Temps : X.XXs (YYY queries)
```

---

### Étape 4 : Redémarrage du serveur Odoo

**4.1. Redémarrer le conteneur Odoo**

```bash
cd backend
docker-compose restart odoo
```

**4.2. Attendre que le serveur soit prêt**

```bash
# Attendre max 30s que Odoo soit accessible
timeout 30 bash -c 'until curl -sf http://localhost:8069/web/health > /dev/null; do sleep 1; done'
```

**Si timeout :**
```
⚠️ Le serveur Odoo met du temps à démarrer

Vérifier les logs :
  docker-compose logs -f odoo

Ou consulter le health check :
  curl http://localhost:8069/web/health
```

**Si succès :**
```
✅ Serveur Odoo redémarré et accessible

Health check : http://localhost:8069/web/health
```

---

### Étape 5 : Vérification post-upgrade

**5.1. Vérifier que le module est bien installé**

```bash
docker-compose exec -T odoo odoo shell -d quelyos << 'EOF'
module = env['ir.module.module'].search([('name', '=', '$MODULE')], limit=1)
print(f"Module: {module.name}")
print(f"État: {module.state}")
print(f"Version: {module.installed_version}")
EOF
```

**Afficher résultat :**
```
📊 État du module $MODULE

  Nom : quelyos_api
  État : installed
  Version : 19.0.1.0.17
```

**5.2. Lister warnings détectés**

**Analyser les logs pour warnings courants :**
- ⚠️ `DeprecationWarning` → À corriger avant Odoo 20
- ⚠️ `no translation for language fr_FR` → Ajouter fichiers i18n si nécessaire
- ⚠️ `A <span> with fa class must have title` → Améliorer accessibilité vues

**Afficher warnings si présents :**
```
⚠️ Warnings détectés (non-bloquants)

1. DeprecationWarning (8 occurrences)
   @route(type='json') est obsolète en Odoo 19
   Remplacer par : @route(type='jsonrpc')

   Fichiers concernés :
   - controllers/main.py:48
   - controllers/cms.py:13
   - controllers/checkout.py:13
   ...

2. Accessibility Warning (1 occurrence)
   <span> avec classe FA sans attribut title

   Fichier : views/tenant_views.xml:17

Actions recommandées :
1. Corriger les deprecations (P1)
2. Améliorer accessibilité (P2)
```

---

### Étape 6 : Rapport final

**6.1. Générer résumé de l'upgrade**

```markdown
## ✅ Upgrade Module Terminé

**Module** : quelyos_api
**Version** : 19.0.1.0.17
**Date** : 2026-01-25 11:45:00

### Résultats

- [x] Tables DB créées/mises à jour
- [x] Vues chargées (12 vues XML)
- [x] Données initiales chargées (3 fichiers data/)
- [x] Serveur Odoo redémarré
- [x] Health check OK

### Métriques

- **Temps upgrade** : 0.37s (300 queries)
- **Temps registry** : 1.94s
- **Temps total** : ~15s

### Warnings (2)

⚠️ 8 deprecations `type='json'` → À corriger
⚠️ 1 warning accessibilité vue tenant

### Prochaines étapes

1. Tester les fonctionnalités modifiées
2. Vérifier que les nouveaux modèles sont accessibles
3. Corriger les deprecations (optionnel)
```

---

## Gestion des erreurs courantes

### Erreur : Module déjà à jour

```
Module $MODULE is already up to date
```

**Cause** : Aucun changement détecté (version inchangée)
**Solution** : Incrémenter la version dans `__manifest__.py`

### Erreur : Contrainte SQL violée

```
psycopg2.IntegrityError: duplicate key value violates unique constraint
```

**Cause** : Données existantes incompatibles avec nouvelle contrainte
**Solutions** :
1. Ajouter migration de données avant contrainte
2. Nettoyer les doublons manuellement
3. Modifier la contrainte pour être moins strictive

### Erreur : Champ requis manquant

```
IntegrityError: null value in column "new_field" violates not-null constraint
```

**Cause** : Nouveau champ `required=True` sans valeur par défaut
**Solutions** :
1. Ajouter `default=...` au champ
2. Créer migration de données pour remplir les valeurs

### Erreur : Vue XML invalide

```
ParseError: syntax error, line 15
```

**Cause** : XML malformé (balise non fermée, attribut invalide)
**Solution** : Corriger la syntaxe XML et relancer

### Erreur : Dépendance manquante

```
Module $MODULE depends on module other_module, which is not installed
```

**Cause** : Dépendance dans `__manifest__.py` non installée
**Solutions** :
1. Installer le module dépendant : `docker-compose run --rm odoo odoo -d quelyos -i other_module --stop-after-init`
2. Retirer la dépendance si non nécessaire

---

## Options avancées

### `--force` - Forcer le rechargement complet

```bash
/upgrade-odoo --force
```

**Effet** : Force la relecture de tous les fichiers XML même si non modifiés

**Commande Docker :**
```bash
docker-compose run --rm odoo odoo -d quelyos -u $MODULE --init=quelyos_api --stop-after-init
```

### `--demo` - Charger données de démo

```bash
/upgrade-odoo --demo
```

**Effet** : Charge les données de démo définies dans `demo/*.xml`

**Commande Docker :**
```bash
docker-compose run --rm odoo odoo -d quelyos -u $MODULE --without-demo=false --stop-after-init
```

---

## Intégration avec hooks Git

**Hook pre-commit recommandé** (`.git/hooks/pre-commit`) :

```bash
#!/bin/bash

# Détection modification __manifest__.py
if git diff --cached --name-only | grep -q "__manifest__.py"; then
  echo "⚠️  __manifest__.py modifié"
  echo ""
  echo "RAPPEL : Après commit, exécuter :"
  echo "  /upgrade-odoo"
  echo ""
  echo "Ou manuellement :"
  echo "  cd backend && docker-compose run --rm odoo odoo -d quelyos -u quelyos_api --stop-after-init"
  echo ""
fi

# Détection modification models/
if git diff --cached --name-only | grep -q "models/.*\.py"; then
  echo "⚠️  Modèles Python modifiés"
  echo ""
  echo "RAPPEL : Upgrade module obligatoire après commit !"
  echo "  /upgrade-odoo"
  echo ""
fi
```

---

## Commandes manuelles alternatives

### Upgrade via script shell

```bash
cd backend
./upgrade.sh quelyos_api
```

**Note** : Le script `upgrade.sh` devrait contenir :
```bash
#!/bin/bash
MODULE=${1:-quelyos_api}
docker-compose run --rm odoo odoo -d quelyos -u $MODULE --stop-after-init --db_host=db --db_user=odoo --db_password=odoo
docker-compose restart odoo
```

### Upgrade avec logs verbeux

```bash
docker-compose run --rm odoo odoo -d quelyos -u quelyos_api --stop-after-init --log-level=debug
```

### Upgrade multiple modules

```bash
docker-compose run --rm odoo odoo -d quelyos -u quelyos_api,sale,stock --stop-after-init
```

---

## Métriques de succès

**Cette commande est un succès si :**

1. ✅ Upgrade exécuté sans erreurs critiques
2. ✅ Tables DB créées/mises à jour
3. ✅ Vues et données chargées
4. ✅ Serveur Odoo redémarré et accessible
5. ✅ Module installé avec bonne version
6. ✅ Warnings documentés (si présents)

---

## Objectif final

Simplifier l'upgrade de modules Odoo :
- 🚀 **Commande unique** pour upgrade complet
- 🔍 **Détection automatique** des erreurs
- 📊 **Rapport détaillé** avec warnings
- ⚡ **Redémarrage automatique** du serveur
- 🛡️ **Backup optionnel** pour sécurité

**Un workflow Odoo simple et sécurisé.**
