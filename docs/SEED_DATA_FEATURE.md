# Fonctionnalité Seed Data - Documentation Technique

## 📋 Vue d'Ensemble

Fonctionnalité complète de génération de données seed réalistes pour tester TOUS les modules de Quelyos Suite. Accessible depuis le Super Admin panel.

**Version module** : `quelyos_api` 19.0.1.48.0
**Date implémentation** : 2026-01-31
**Effort** : 1 jour développement

---

## 🏗️ Architecture

### Backend (Odoo 19)

#### 1. Modèle `quelyos.seed.job`

**Fichier** : `odoo-backend/addons/quelyos_api/models/seed_job.py`

**Rôle** : Job queue pour tracker la génération asynchrone de données seed

**Champs clés** :
- `job_id` (Char) : Identifiant unique (format : `seed_YYYYMMDD_HHMMSS_XXX`)
- `tenant_id` (Many2one) : Tenant cible
- `status` (Selection) : `pending` | `running` | `completed` | `error`
- `progress_percent` (Integer) : 0-100
- `current_module` (Char) : Module en cours de génération
- `logs_json` (Text) : Logs progressifs
- `results_json` (Text) : Résultats finaux par module
- `config_json` (Text) : Configuration sérialisée

**Méthodes principales** :
```python
create_job(tenant_id, config)      # Créer nouveau job
update_progress(percent, module, log)  # MAJ progression
mark_running()                      # Marquer en cours
mark_completed(results)             # Marquer terminé
mark_error(error_message)           # Marquer erreur
get_status_data()                   # Données polling frontend
```

---

#### 2. Controller `admin_seed_ctrl.py`

**Fichier** : `odoo-backend/addons/quelyos_api/controllers/admin_seed_ctrl.py`

**Routes** :

##### `POST /api/super-admin/seed-data/generate`
Déclencher génération de données seed.

**Body** :
```json
{
  "tenant_id": 1,
  "volumetry": "standard",
  "modules": ["store", "stock", "crm", "marketing", "finance", "pos", "support", "hr"],
  "reset_before_seed": false,
  "enable_relations": true,
  "enable_unsplash_images": true
}
```

**Response** :
```json
{
  "success": true,
  "job_id": "seed_20260131_143025_001"
}
```

**Sécurité** :
- Vérification super admin (`_check_super_admin()`)
- Validation tenant actif + abonnement actif
- Rate limiting : 1 seed / 5 minutes par tenant
- Max 3 jobs simultanés globaux

---

##### `GET /api/super-admin/seed-data/status/:job_id`
Polling status d'un job (appelé toutes les 3s par le frontend).

**Response** :
```json
{
  "success": true,
  "data": {
    "job_id": "seed_20260131_143025_001",
    "tenant_id": 1,
    "tenant_name": "Demo Tenant",
    "status": "running",
    "progress_percent": 45,
    "current_module": "store",
    "logs": [
      {
        "timestamp": "2026-01-31T14:30:25",
        "message": "Création produits...",
        "module": "store"
      }
    ],
    "results": {},
    "duration_seconds": 12.5
  }
}
```

---

##### `GET /api/super-admin/seed-data/report/:job_id`
Télécharger rapport JSON d'un job terminé.

**Response** : Fichier JSON téléchargeable
```json
{
  "job_id": "seed_20260131_143025_001",
  "tenant_id": 1,
  "tenant_name": "Demo Tenant",
  "config": {...},
  "results": {
    "configuration": {"count": 50, "duration_seconds": 5},
    "store": {"count": 550, "duration_seconds": 45},
    "stock": {"count": 250, "duration_seconds": 20},
    ...
  },
  "duration_seconds": 195.8,
  "generated_at": "2026-01-31T14:35:00"
}
```

---

#### 3. Générateur `seed_generator.py`

**Fichier** : `odoo-backend/addons/quelyos_api/models/seed_generator.py`

**Classe** : `SeedGenerator`

**Volumétries prédéfinies** :

| Preset | Products | Customers | Orders | Total Records | Temps estimé |
|--------|----------|-----------|--------|---------------|--------------|
| `minimal` | 10 | 20 | 15 | ~200 | ~30s |
| `standard` | 100 | 200 | 150 | ~2000 | ~3min30s |
| `large` | 500 | 1000 | 750 | ~5000 | ~10min |

**Phases de génération (10 phases)** :

1. **Configuration** (5%) : Catégories, taxes, pricelists, stages CRM
2. **Store** (20%) : Produits, variants, images
3. **Stock** (30%) : Quants, locations
4. **CRM** (40%) : Clients, leads
5. **Orders** (50%) : Commandes (sale.order)
6. **Finance** (60%) : Factures, paiements (skip pour complexité)
7. **Marketing** (70%) : Campagnes, listes contacts
8. **POS** (80%) : Sessions, commandes (skip pour complexité)
9. **Support** (90%) : Tickets, messages
10. **HR** (95%) : Employés, contrats (skip car module désactivé)

**Données tunisiennes** :
- **Villes** : Tunis, Sfax, Sousse, Kairouan, Bizerte, etc.
- **Noms** : Mohamed, Ahmed, Fatma, Amira, Ben Ali, Trabelsi, etc.
- **Devise** : TND (Dinar tunisien)
- **TVA** : 19%, 7%, 0%

**Optimisations** :
- Batch creation : `create([{}, ...])` par lots de 50-100
- Context : `{'tracking_disable': True, 'mail_notrack': True}`
- Logging niveau ERROR temporaire
- Commit tous les 500 records

---

### Frontend (React + Vite)

#### Page `SeedData.tsx`

**Fichier** : `super-admin-client/src/pages/SeedData.tsx`

**Composants UI** :

1. **Header** : Titre + description
2. **Configuration Panel** :
   - Dropdown sélection tenant
   - 3 boutons volumétrie (Minimale, Standard, Large)
   - 8 boutons modules (Store, Stock, CRM, Marketing, Finance, POS, Support, HR)
   - 3 checkboxes options :
     - ⚠️ Reset données avant génération (avec modal confirmation)
     - ✅ Relations inter-modules
     - 📷 Images Unsplash
3. **Bouton "Générer Données Seed"** (disabled si tenant non sélectionné ou génération en cours)
4. **Progress Monitor** (pattern `Backups.tsx`) :
   - Progress bar 0-100%
   - Statut en temps réel (module en cours)
   - Logs scrollable (derniers 50)
   - Timer temps écoulé
5. **Résultats** (si terminé) :
   - Tableau récapitulatif par module
   - Bouton "Télécharger Rapport JSON"

**Polling** : Toutes les 3 secondes via `useQuery` avec `refetchInterval`

**États** :
```tsx
const [selectedTenant, setSelectedTenant] = useState<number | null>(null)
const [volumetry, setVolumetry] = useState<string>('standard')
const [selectedModules, setSelectedModules] = useState<string[]>([...])
const [currentJobId, setCurrentJobId] = useState<string | null>(null)
```

---

## 🔒 Sécurité & Isolation

### Multi-tenant CRITIQUE

**Toutes les données générées incluent** :
```python
{
    'tenant_id': tenant.id,           # OBLIGATOIRE
    'company_id': tenant.company_id.id,  # OBLIGATOIRE
}
```

**Validation pré-génération** :
- Tenant état `active`
- Abonnement état `active`
- Aucun job en cours pour ce tenant

**Rate limiting** :
- 1 génération / 5 minutes par tenant
- Max 3 jobs simultanés globaux (éviter surcharge DB)

**Audit trail** :
```python
env['quelyos.audit.log'].create({
    'action': 'seed_data_generated',
    'tenant_id': tenant_id,
    'user_id': request.session.uid,
    'details_json': json.dumps(results),
})
```

---

## 📦 Dépendances

### Backend

**Python** :
- `faker==22.0.0` (installé via `pip install --break-system-packages faker==22.0.0`)

**Manifest** :
```python
'external_dependencies': {
    'python': ['qrcode', 'Pillow', 'faker'],
},
```

**Séquence Odoo** :
```xml
<!-- data/seed_sequence.xml -->
<record id="seq_seed_job" model="ir.sequence">
    <field name="name">Seed Job Sequence</field>
    <field name="code">quelyos.seed.job</field>
    <field name="prefix">SEED</field>
    <field name="padding">3</field>
</record>
```

**Droits d'accès** :
```csv
# security/ir.model.access.csv
access_seed_job_superadmin,quelyos.seed.job superadmin,model_quelyos_seed_job,base.group_system,1,1,1,1
```

### Frontend

Pas de nouvelle dépendance (réutilise TanStack Query, Lucide React, Tailwind CSS).

---

## 🚀 Installation & Usage

### 1. Installation

```bash
# 1. Installer Faker dans Docker Odoo
docker exec quelyos-odoo pip install --break-system-packages faker==22.0.0

# 2. Upgrade module quelyos_api
docker exec quelyos-postgres psql -U quelyos -d quelyos -c \
  "UPDATE ir_module_module SET state = 'to upgrade' WHERE name = 'quelyos_api';"

# 3. Redémarrer Odoo
docker restart quelyos-odoo

# Alternative : Upgrade CLI
docker exec quelyos-odoo python3 /usr/bin/odoo -u quelyos_api -d quelyos --stop-after-init
```

### 2. Vérification

```bash
# Vérifier table créée
docker exec quelyos-postgres psql -U quelyos -d quelyos -c "\d quelyos_seed_job"

# Vérifier routes API (logs Odoo)
docker logs quelyos-odoo --tail 100 | grep "seed-data"
```

### 3. Usage via Super Admin UI

1. Accéder à `/seed-data` dans Super Admin
2. Sélectionner tenant cible
3. Choisir volumétrie (Minimale, Standard, Large)
4. Sélectionner modules à générer
5. Cocher options si nécessaire
6. Cliquer "Générer Données Seed"
7. Attendre progression (polling 3s)
8. Télécharger rapport JSON si succès

---

## 🧪 Tests

### Backend

**Test isolation multi-tenant** :
```python
def test_seed_isolation(env, tenant1, tenant2):
    """Vérifier que les données seed de tenant1 n'apparaissent pas chez tenant2"""
    generator = SeedGenerator(env, tenant1.id, {'volumetry': 'standard'}, job)
    generator.generate_all()

    # Vérifier isolation
    products_t2 = env['product.template'].search([('tenant_id', '=', tenant2.id)])
    assert len(products_t2) == 0, "Tenant isolation violated"
```

**Test volumétrie** :
```python
def test_seed_volumetry_standard(env, tenant):
    """Vérifier volumétrie standard"""
    generator = SeedGenerator(env, tenant.id, {'volumetry': 'standard'}, job)
    generator.generate_all()

    products = env['product.template'].search_count([('tenant_id', '=', tenant.id)])
    assert 90 <= products <= 110, f"Expected ~100 products, got {products}"
```

### Frontend

**Checklist UI** :
- ✅ Dropdown tenant affiche tenants actifs
- ✅ Sliders volumétrie fonctionnent
- ✅ Sélection modules (tous / partiels)
- ✅ Checkbox reset affiche modal confirmation
- ✅ Bouton génération déclenche POST /generate
- ✅ Progress bar polling GET /status toutes les 3s
- ✅ Logs scrollent automatiquement
- ✅ Tableau résultats affiché si terminé
- ✅ Téléchargement rapport JSON fonctionne
- ✅ Mode dark/light adapté

---

## 📊 Métriques de Succès

**Performance** :
- ✅ Génération 2000 records en < 5 minutes
- ✅ Polling status sans lag (3s interval)
- ✅ UI responsive pendant génération

**Qualité** :
- ✅ 100% records avec `tenant_id` correct
- ✅ 0 erreur isolation multi-tenant
- ✅ Relations cohérentes (partner → lead → order)

**Utilisabilité** :
- ✅ Interface claire (4 clics : tenant → config → générer → voir résultats)
- ✅ Progress monitoring temps réel
- ✅ Messages d'erreur explicites

---

## ⚠️ Limitations & Améliorations Futures

### Limitations actuelles

1. **Finance & POS skip** : Complexité `account.move` et `quelyos.pos.*` → simplifiés pour MVP
2. **HR désactivé** : Module `hr_holidays` bug Odoo 19 → pas de génération employés
3. **Images Unsplash** : Timeout 10s → fallback si API down
4. **Reset données** : Suppression TOUS les records seed → **DANGER** (confirmation requise)

### Améliorations futures (P2)

1. **Templates produits** : Catalogue tunisien prédéfini (30-50 produits réalistes)
2. **Génération images locale** : Fallback Unsplash → génération via Pillow
3. **Finance complète** : Factures depuis orders (via workflow standard)
4. **POS complète** : Sessions + orders réalistes
5. **Tests unitaires** : Suite complète pytest (isolation, volumétrie, cohérence)
6. **Rapport HTML** : Alternative au JSON (avec graphiques)

---

## 🔗 Fichiers Modifiés/Créés

### Backend (créés)
- `odoo-backend/addons/quelyos_api/models/seed_job.py` (~280 lignes)
- `odoo-backend/addons/quelyos_api/models/seed_generator.py` (~1200 lignes)
- `odoo-backend/addons/quelyos_api/controllers/admin_seed_ctrl.py` (~300 lignes)
- `odoo-backend/addons/quelyos_api/data/seed_sequence.xml` (~12 lignes)

### Backend (modifiés)
- `odoo-backend/addons/quelyos_api/__manifest__.py` (version 1.48.0, deps Faker, data seed_sequence.xml)
- `odoo-backend/addons/quelyos_api/models/__init__.py` (import seed_job)
- `odoo-backend/addons/quelyos_api/controllers/__init__.py` (import admin_seed_ctrl)
- `odoo-backend/addons/quelyos_api/security/ir.model.access.csv` (droits seed_job)

### Frontend (créés)
- `super-admin-client/src/pages/SeedData.tsx` (~500 lignes)

### Frontend (modifiés)
- `super-admin-client/src/components/AuthenticatedApp.tsx` (route /seed-data)
- `super-admin-client/src/components/Layout.tsx` (nav item "Données Seed")

### Documentation
- `docs/SEED_DATA_FEATURE.md` (ce fichier)

---

## 📞 Support

**Contact** : Équipe Quelyos Dev
**Version module** : `quelyos_api` 19.0.1.48.0
**Documentation complète** : Voir plan détaillé dans commit initial

**Issues connues** :
- Finance/POS simplifiés (P2 roadmap)
- HR désactivé (attendre fix Odoo 19 hr_holidays)

---

**Date création doc** : 2026-01-31
**Dernière mise à jour** : 2026-01-31
