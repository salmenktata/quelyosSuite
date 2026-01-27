# Liste des Modules OCA dans Quelyos - Documentation

## 📋 Vue d'Ensemble

Le module `quelyos_stock_advanced` intègre maintenant une interface complète dans Odoo pour lister et gérer les modules OCA utilisés.

## 🎯 Fonctionnalités Ajoutées

### 1. Dashboard OCA dans Menu Stock

**Accès** : Menu Stock → 📊 Dashboard OCA

**Fonctionnalités** :
- Vue d'ensemble des modules OCA intégrés
- Documentation des endpoints API REST
- Liste des pages React frontend
- Détails des adaptations Odoo 19.0
- Liens vers documentation complète

### 2. Liste des Modules OCA

**Accès** : Menu Stock → Modules OCA

**Fonctionnalités** :
- Liste complète des 4 modules OCA
- État d'installation (installé/non installé)
- Version de chaque module
- Auteur et lien vers repository OCA

**Vue détails** : Cliquer sur un module pour voir :
- Description complète
- Fonctionnalités incluses
- Notes d'adaptation Odoo 19.0
- Lien vers site web OCA

### 3. Wizard Vue d'Ensemble

**Accès** : Programmable via code ou bouton action

**Fonctionnalités** :
- Statistiques d'installation (Total, Installés, Taux %)
- Vue condensée de tous les modules
- Bouton "Voir Détails" pour accéder à la liste complète

## 🏗️ Architecture Technique

### Modèles Python

#### 1. `quelyos.oca.module.info` (Transient)
Modèle transient pour afficher les informations sur les modules OCA.

**Fichier** : `models/oca_module_info.py`

**Champs** :
- `name` - Nom technique du module
- `display_name` - Nom affiché
- `version` - Version installée
- `state` - État (installed, uninstalled, etc.)
- `summary` - Description et fonctionnalités
- `author` - Auteur (OCA)
- `website` - Lien repository
- `adaptation_notes` - Notes adaptations Odoo 19.0

**Méthodes** :
- `get_oca_modules_info()` - Récupère infos des 4 modules OCA
- `get_summary_stats()` - Calcule statistiques installation

#### 2. `quelyos.oca.modules.wizard` (Transient)
Wizard pour vue d'ensemble avec statistiques.

**Fichier** : `wizard/oca_modules_wizard.py`

**Champs** :
- `module_ids` - Liste des modules (Many2many)
- `total_modules` - Total modules (computed)
- `installed_modules` - Nombre installés (computed)
- `uninstalled_modules` - Nombre non installés (computed)
- `installation_rate` - Taux installation % (computed)

**Méthodes** :
- `default_get()` - Pré-remplit avec infos modules
- `action_view_modules()` - Ouvre vue liste détaillée

### Vues XML

#### 1. Dashboard OCA (`oca_dashboard_views.xml`)
- Vue form complète avec tabs
- Tab "Modules Installés" - Liste avec API endpoints
- Tab "API REST" - Documentation endpoints
- Tab "Frontend React" - Pages dashboard
- Tab "Adaptations Odoo 19.0" - Détails patchs
- Tab "Documentation" - Liens ressources

**Menu** : Stock → 📊 Dashboard OCA (séquence 99)

#### 2. Liste Modules (`oca_module_info_views.xml`)
- Vue tree pour lister modules
- Vue form pour détails module
- Décoration couleur selon état

**Menu** : Stock → Modules OCA (séquence 100)

#### 3. Wizard (`oca_modules_wizard_views.xml`)
- Vue form avec statistiques
- Liste des modules embarquée
- Footer avec boutons actions

### Sécurité

**Fichier** : `security/ir.model.access.csv`

**Droits d'accès** :
- `base.group_user` - Lecture seule sur tous les modèles
- `stock.group_stock_manager` - Lecture seule (pas de création/modification)

Les modèles sont en lecture seule car transients générés dynamiquement.

## 📊 Informations Affichées

### Module stock_change_qty_reason

**Version** : 19.0.1.0.0

**Fonctionnalités** :
- Suivi des raisons lors des ajustements
- Historique des modifications avec justifications
- API REST pour frontend

**Endpoints API** :
- GET `/api/stock/change-reasons`
- POST `/api/stock/adjust-with-reason`

**Adaptation Odoo 19.0** :
- Fichier : `security/stock_security.xml`
- Problème : `category_id` supprimé de `res.groups`
- Solution : Suppression du champ pour groupes cachés

### Module stock_inventory

**Version** : 19.0.1.1.2

**Fonctionnalités** :
- Inventaires groupés (restauré depuis Odoo 14)
- Comptage simultané de plusieurs produits
- Workflow inventaire optimisé

**Endpoints API** :
- GET `/api/stock/inventories-oca`

**Adaptation Odoo 19.0** :
- Aucune modification nécessaire ✓

### Module stock_location_lockdown

**Version** : 19.0.1.0.0

**Fonctionnalités** :
- Blocage emplacements pendant inventaire
- Prévention mouvements concurrents
- API REST verrouillage/déverrouillage

**Endpoints API** :
- GET `/api/stock/location-locks`
- POST `/api/stock/location/<id>/lock`

**Adaptation Odoo 19.0** :
- Aucune modification nécessaire ✓

### Module stock_demand_estimate

**Version** : 19.0.1.1.0

**Fonctionnalités** :
- Prévisions demande par produit/emplacement
- Planification approvisionnements
- Analyses tendances

**Endpoints API** :
- Dashboard et prévisions (à venir)

**Adaptation Odoo 19.0** :
- Fichier : `views/stock_demand_estimate_view.xml`
- Problème : Attribut `expand` supprimé de `<group>` dans search views
- Solution : Utilisation de `<separator>` + `<group>` sans expand

## 🚀 Utilisation

### Accéder au Dashboard OCA

1. Se connecter à Odoo : http://localhost:8069
2. Aller dans le module **Stock**
3. Cliquer sur **📊 Dashboard OCA** dans le menu

**Ou directement** : http://localhost:8069/web#action=quelyos_stock_advanced.action_quelyos_stock_advanced_dashboard

### Voir la Liste des Modules

1. Se connecter à Odoo : http://localhost:8069
2. Aller dans le module **Stock**
3. Cliquer sur **Modules OCA** dans le menu

**Ou directement** : http://localhost:8069/web#action=quelyos_stock_advanced.action_oca_module_info

### Vérifier les Statistiques

Les statistiques sont calculées dynamiquement :
- **Total** : 4 modules OCA
- **Installés** : Nombre de modules en état "installed"
- **Non installés** : Nombre de modules en état "uninstalled"
- **Taux installation** : Pourcentage (Installés / Total * 100)

## 📝 Exemple d'Utilisation Programmation

### Récupérer les infos modules OCA

```python
# Dans un controller ou modèle
OCAInfo = self.env['quelyos.oca.module.info']

# Obtenir infos de tous les modules
modules = OCAInfo.get_oca_modules_info()

# modules est une liste de dictionnaires
for module in modules:
    print(f"{module['name']} - {module['state']}")
```

### Obtenir statistiques

```python
OCAInfo = self.env['quelyos.oca.module.info']
stats = OCAInfo.get_summary_stats()

print(f"Total: {stats['total']}")
print(f"Installés: {stats['installed']}")
print(f"Taux: {stats['installation_rate']}%")
```

### Ouvrir le wizard programmatiquement

```python
# Créer et ouvrir le wizard
wizard = self.env['quelyos.oca.modules.wizard'].create({})

return {
    'type': 'ir.actions.act_window',
    'name': 'Modules OCA',
    'res_model': 'quelyos.oca.modules.wizard',
    'res_id': wizard.id,
    'view_mode': 'form',
    'target': 'new',
}
```

## 🔧 Extension Future

### Ajouter un Nouveau Module OCA

Pour ajouter un 5ème module OCA à la liste :

1. **Éditer** `models/oca_module_info.py`
2. **Ajouter** dans la liste `oca_modules` de `get_oca_modules_info()` :

```python
{
    'name': 'nouveau_module_oca',
    'expected_version': '19.0.1.0.0',
    'description': 'Description du module',
    'features': [
        'Fonctionnalité 1',
        'Fonctionnalité 2',
    ],
    'adaptation': 'Notes adaptation Odoo 19.0'
},
```

3. **Redémarrer** Odoo
4. Le nouveau module apparaîtra automatiquement dans les vues

### Personnaliser les Vues

Les vues peuvent être héritées ou étendues :

```xml
<record id="view_oca_module_info_tree_custom" model="ir.ui.view">
    <field name="name">quelyos.oca.module.info.tree.custom</field>
    <field name="model">quelyos.oca.module.info</field>
    <field name="inherit_id" ref="quelyos_stock_advanced.view_oca_module_info_tree"/>
    <field name="arch" type="xml">
        <xpath expr="//field[@name='version']" position="after">
            <field name="adaptation_notes"/>
        </xpath>
    </field>
</record>
```

## 📚 Références

- **Code Source** : `odoo-backend/addons/quelyos_stock_advanced/`
- **Documentation Module** : `odoo-backend/addons/quelyos_stock_advanced/README.md`
- **Guide Installation** : `docs/QUELYOS_STOCK_ADVANCED.md`
- **Patchs OCA** : `docs/OCA_PATCHES_19.md`
- **Repository OCA** : https://github.com/OCA/stock-logistics-warehouse

---

**Version** : 19.0.1.0.0
**Dernière Mise à Jour** : 27 Janvier 2026
**Auteur** : Quelyos Development Team
