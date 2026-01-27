# Guide d'Intégration Addons OCA

> **OCA** : Odoo Community Association - Organisation à but non lucratif maintenant des modules Odoo open source de qualité.

Ce guide explique comment intégrer des addons OCA (gratuits, licence AGPL-3.0) dans Quelyos Suite pour enrichir rapidement les fonctionnalités.

---

## 🎯 Pourquoi Utiliser les Addons OCA ?

✅ **Code mature** : Testé par des milliers d'utilisateurs
✅ **Gratuit** : Licence AGPL-3.0 (compatible avec notre stack)
✅ **Maintenus** : Communauté active de contributeurs
✅ **Gain de temps** : ~2-3 mois de développement économisés
✅ **Standards** : Respect des conventions Odoo

---

## 📋 Prérequis

- Odoo 19 Community installé et fonctionnel
- Accès shell au serveur Odoo
- Droits d'écriture dans `odoo-backend/addons/`
- Git installé

---

## 🔍 Trouver des Addons OCA

### 1. OCA Shop (Interface Web)
- **URL** : https://odoo-community.org/shop
- Recherche par catégorie (Stock, CRM, Accounting, etc.)
- Filtrage par version Odoo

### 2. GitHub OCA (Code Source)
Repositories principaux pour Quelyos Suite :

| Repository | Domaine | URL |
|------------|---------|-----|
| `stock-logistics-warehouse` | Gestion stock/entrepôts | https://github.com/OCA/stock-logistics-warehouse |
| `stock-logistics-barcode` | Barcode scanning | https://github.com/OCA/stock-logistics-barcode |
| `stock-logistics-workflow` | Workflows stock | https://github.com/OCA/stock-logistics-workflow |
| `sale-workflow` | Processus ventes | https://github.com/OCA/sale-workflow |
| `purchase-workflow` | Processus achats | https://github.com/OCA/purchase-workflow |
| `account-financial-tools` | Outils comptables | https://github.com/OCA/account-financial-tools |
| `web` | Interface web | https://github.com/OCA/web |
| `server-tools` | Outils serveur | https://github.com/OCA/server-tools |

### 3. Vérifier la Compatibilité

Toujours vérifier :
- ✅ Version Odoo supportée (chercher branche `19.0` ou `18.0`)
- ✅ Dernière activité GitHub (commits récents)
- ✅ Issues ouvertes vs fermées
- ✅ Documentation disponible (README.md)

---

## 📦 Installation d'un Addon OCA

### Méthode 1 : Installation Manuelle (Recommandée)

#### Étape 1 : Cloner le Repository OCA

```bash
cd /tmp
git clone https://github.com/OCA/stock-logistics-warehouse.git
cd stock-logistics-warehouse

# Vérifier les branches disponibles
git branch -r

# Checkout la version Odoo 19 (ou 18 si 19 non dispo)
git checkout 19.0
# Si 19.0 n'existe pas, utiliser 18.0 et tester
```

#### Étape 2 : Copier l'Addon dans Odoo

```bash
# Depuis /tmp/stock-logistics-warehouse/
# Exemple : installer stock_cycle_count

# Copier le module
cp -r stock_cycle_count ~/Projets/GitHub/QuelyosSuite/odoo-backend/addons/

# Vérifier la copie
ls ~/Projets/GitHub/QuelyosSuite/odoo-backend/addons/stock_cycle_count
# Doit contenir : __manifest__.py, models/, views/, etc.
```

#### Étape 3 : Vérifier les Dépendances

```bash
# Lire le __manifest__.py pour voir les dépendances
cat odoo-backend/addons/stock_cycle_count/__manifest__.py | grep "depends"

# Exemple de sortie :
# 'depends': ['stock', 'stock_inventory']

# Si dépendances OCA manquantes, les installer aussi
```

#### Étape 4 : Upgrade le Module Odoo

```bash
cd ~/Projets/GitHub/QuelyosSuite/odoo-backend

# Redémarrer Odoo en mode upgrade
docker-compose restart

# Activer le mode développement (optionnel mais recommandé)
# Odoo détectera automatiquement les nouveaux modules

# Option 1 : Via interface Odoo
# 1. Aller sur http://localhost:8069
# 2. Apps > Update Apps List
# 3. Rechercher "stock_cycle_count"
# 4. Installer

# Option 2 : Via CLI (plus rapide)
docker-compose exec odoo odoo-bin -c /etc/odoo/odoo.conf \
  -d odoo_db \
  -i stock_cycle_count \
  --stop-after-init

# Redémarrer Odoo
docker-compose restart
```

#### Étape 5 : Vérifier l'Installation

```bash
# Vérifier logs Odoo
docker-compose logs -f odoo | grep stock_cycle_count

# Vérifier dans l'interface Odoo
# Apps > Installed > Rechercher "stock_cycle_count"
# Doit apparaître comme installé
```

---

### Méthode 2 : Installation via Git Submodule (Pour Gestion Long Terme)

Si vous voulez suivre les mises à jour OCA facilement :

```bash
cd ~/Projets/GitHub/QuelyosSuite

# Ajouter le repo OCA comme submodule
git submodule add https://github.com/OCA/stock-logistics-warehouse.git \
  odoo-backend/oca/stock-logistics-warehouse

# Créer des symlinks vers les modules voulus
cd odoo-backend/addons/
ln -s ../oca/stock-logistics-warehouse/stock_cycle_count .
ln -s ../oca/stock-logistics-warehouse/stock_inventory_lockdown .

# Upgrade modules (même procédure qu'avant)
```

**Avantages** :
- Facile de mettre à jour (git submodule update)
- Suivi des versions OCA
- Historique Git propre

**Inconvénients** :
- Complexité Git submodules
- Tous les modules du repo clonés (même non utilisés)

---

## 🔧 Configuration Post-Installation

### 1. Vérifier les Permissions

```bash
# Les modules OCA doivent être lisibles par l'utilisateur Odoo
sudo chown -R odoo:odoo odoo-backend/addons/stock_cycle_count
sudo chmod -R 755 odoo-backend/addons/stock_cycle_count
```

### 2. Configurer le Module

Certains modules OCA nécessitent une configuration :

1. **Via interface Odoo** :
   - Aller dans Settings > Technical > Parameters > System Parameters
   - Configurer les paramètres spécifiques au module

2. **Via configuration Odoo** :
   ```ini
   # odoo-backend/config/odoo.conf
   [options]
   addons_path = /opt/odoo/addons,/opt/odoo/custom/addons
   # Ajouter chemin vers modules OCA si nécessaire
   ```

### 3. Tester le Module

```bash
# Lancer les tests du module (si disponibles)
docker-compose exec odoo odoo-bin -c /etc/odoo/odoo.conf \
  -d odoo_test_db \
  -i stock_cycle_count \
  --test-enable \
  --stop-after-init
```

---

## 🎨 Créer une UI Quelyos pour un Addon OCA

Une fois l'addon OCA installé côté backend, créer une UI moderne dans le backoffice.

### Exemple : UI pour `stock_cycle_count`

#### 1. Créer la Page React

```bash
# Créer le fichier
touch dashboard-client/src/pages/stock/CycleCount.tsx
```

```tsx
// dashboard-client/src/pages/stock/CycleCount.tsx
import { useState } from 'react'
import { Layout } from '../../components/Layout'
import { Button, Badge } from '../../components/common'
import { useStockCycleCounts } from '../../hooks/useStock'

export default function CycleCount() {
  const { data, isLoading } = useStockCycleCounts()

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Comptages Cycliques</h1>

        {/* Liste des cycle counts */}
        <div className="bg-white rounded-lg shadow">
          {/* Contenu */}
        </div>
      </div>
    </Layout>
  )
}
```

#### 2. Créer le Hook React Query

```typescript
// dashboard-client/src/hooks/useStock.ts
export const useStockCycleCounts = (params?: { limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: ['stock-cycle-counts', params],
    queryFn: () => api.getStockCycleCounts(params),
  })
}
```

#### 3. Ajouter l'Endpoint API

```typescript
// dashboard-client/src/lib/api.ts
async getStockCycleCounts(params?: { limit?: number; offset?: number }) {
  return this.request<PaginatedResponse<CycleCount>>(
    '/api/ecommerce/stock/cycle-counts',
    params
  )
}
```

#### 4. Créer le Controller Odoo (si nécessaire)

Si l'addon OCA n'expose pas d'API REST, créer un endpoint :

```python
# odoo-backend/addons/quelyos_api/controllers/stock.py
@http.route('/api/ecommerce/stock/cycle-counts', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
def get_cycle_counts(self, **kwargs):
    """Liste des comptages cycliques (module OCA stock_cycle_count)"""
    params = self._get_params()
    limit = params.get('limit', 20)
    offset = params.get('offset', 0)

    # Utiliser le modèle OCA
    CycleCount = request.env['stock.cycle.count'].sudo()

    counts = CycleCount.search([], limit=limit, offset=offset, order='date_deadline desc')
    total = CycleCount.search_count([])

    return {
        'success': True,
        'data': {
            'counts': [{
                'id': c.id,
                'name': c.name,
                'date_deadline': c.date_deadline.isoformat() if c.date_deadline else None,
                'state': c.state,
                'location_id': c.location_id.id,
                'location_name': c.location_id.name,
            } for c in counts],
            'total': total,
            'limit': limit,
            'offset': offset,
        }
    }
```

#### 5. Ajouter la Route dans le Menu

```tsx
// dashboard-client/src/App.tsx
<Route path="/stock/cycle-count" element={<CycleCount />} />
```

---

## 📊 Exemple Complet : Intégrer `stock_cycle_count`

### Installation Complète Pas à Pas

```bash
# 1. Cloner le repo OCA
cd /tmp
git clone https://github.com/OCA/stock-logistics-warehouse.git
cd stock-logistics-warehouse
git checkout 19.0  # ou 18.0 si 19.0 n'existe pas

# 2. Copier le module
cp -r stock_cycle_count ~/Projets/GitHub/QuelyosSuite/odoo-backend/addons/

# 3. Vérifier dépendances
cat ~/Projets/GitHub/QuelyosSuite/odoo-backend/addons/stock_cycle_count/__manifest__.py

# 4. Installer dépendances manquantes (si nécessaire)
# Exemple : stock_inventory_lockdown est requis
cp -r stock_inventory_lockdown ~/Projets/GitHub/QuelyosSuite/odoo-backend/addons/

# 5. Redémarrer Odoo
cd ~/Projets/GitHub/QuelyosSuite/odoo-backend
docker-compose restart

# 6. Installer les modules
docker-compose exec odoo odoo-bin -c /etc/odoo/odoo.conf \
  -d odoo_db \
  -i stock_inventory_lockdown,stock_cycle_count \
  --stop-after-init

# 7. Redémarrer à nouveau
docker-compose restart

# 8. Vérifier installation
docker-compose logs odoo | grep "stock_cycle_count"
# Doit voir : "Module stock_cycle_count installed"

# 9. Créer l'UI Quelyos (voir section précédente)
```

---

## 🚨 Troubleshooting

### Problème : Module non détecté

**Solution** :
```bash
# 1. Vérifier que __manifest__.py existe
ls odoo-backend/addons/stock_cycle_count/__manifest__.py

# 2. Vérifier les permissions
sudo chown -R odoo:odoo odoo-backend/addons/stock_cycle_count

# 3. Forcer mise à jour liste modules
docker-compose exec odoo odoo-bin -c /etc/odoo/odoo.conf \
  -d odoo_db \
  --update-module-list \
  --stop-after-init
```

### Problème : Dépendances manquantes

**Erreur** :
```
ImportError: No module named 'stock_inventory_lockdown'
```

**Solution** :
```bash
# Installer la dépendance manquante
cp -r /tmp/stock-logistics-warehouse/stock_inventory_lockdown \
  odoo-backend/addons/

# Réinstaller
docker-compose exec odoo odoo-bin -c /etc/odoo/odoo.conf \
  -d odoo_db \
  -i stock_inventory_lockdown \
  --stop-after-init
```

### Problème : Incompatibilité Version

**Erreur** :
```
Module stock_cycle_count requires Odoo 16.0 but running 19.0
```

**Solution** :
1. Chercher une version compatible sur GitHub (branches)
2. Vérifier les forks communautaires (recherche GitHub)
3. Adapter le code manuellement (last resort)

---

## 📚 Ressources

### Documentation OCA
- **Site officiel** : https://odoo-community.org
- **GitHub** : https://github.com/OCA
- **Contribution guide** : https://odoo-community.org/page/Contribute
- **Guidelines** : https://github.com/OCA/maintainer-tools/blob/master/CONTRIBUTING.md

### Repositories OCA Utiles pour Quelyos Suite
- Stock : https://github.com/OCA/stock-logistics-warehouse
- Ventes : https://github.com/OCA/sale-workflow
- Achats : https://github.com/OCA/purchase-workflow
- Comptabilité : https://github.com/OCA/account-financial-tools
- E-commerce : https://github.com/OCA/e-commerce
- CRM : https://github.com/OCA/crm

### Issues Trackers
- **Issue #52** : Intégration addons OCA Stock (8 modules identifiés)

---

## ✅ Checklist Installation Addon OCA

- [ ] Vérifier compatibilité version Odoo
- [ ] Cloner repository OCA
- [ ] Checkout branche correcte (19.0 ou 18.0)
- [ ] Copier module dans `odoo-backend/addons/`
- [ ] Vérifier dépendances dans `__manifest__.py`
- [ ] Installer dépendances manquantes
- [ ] Redémarrer Odoo
- [ ] Installer module via CLI ou interface
- [ ] Vérifier logs (pas d'erreurs)
- [ ] Tester fonctionnalités de base
- [ ] Créer UI Quelyos moderne (dashboard-client)
- [ ] Créer endpoints API si nécessaire
- [ ] Ajouter route dans menu
- [ ] Tester end-to-end
- [ ] Documenter dans README.md

---

## 🎯 Prochaines Étapes

1. **Installer les 4 Quick Wins** : stock_cycle_count, stock_inventory_lockdown, stock_inventory_cost_info, stock_available_unreserved
2. **Créer UIs Quelyos modernes** pour chaque module
3. **Réimplémenter stock_barcodes** avec PWA mobile React
4. **Documenter retours d'expérience** dans LOGME.md

---

**Dernière mise à jour** : 2026-01-27
**Audit source** : `/parity stock`
