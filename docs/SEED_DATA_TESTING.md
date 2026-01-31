# Tests Fonctionnalité Seed Data

## 📋 Checklist Tests Manuels

### 1. Tests Backend API

#### Test 1.1 : Génération Standard Réussie

```bash
# POST /api/super-admin/seed-data/generate
curl -X POST http://localhost:8069/api/super-admin/seed-data/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=YOUR_SESSION_ID" \
  -d '{
    "tenant_id": 1,
    "volumetry": "standard",
    "modules": ["store", "stock", "crm", "marketing", "support"],
    "reset_before_seed": false,
    "enable_relations": true,
    "enable_unsplash_images": false
  }'

# Expected Response:
# {
#   "success": true,
#   "job_id": "seed_20260131_143025_SEED001"
# }
```

**Vérifications** :
- ✅ Response 200
- ✅ `job_id` retourné
- ✅ Job créé dans DB : `SELECT * FROM quelyos_seed_job WHERE job_id = 'seed_20260131_143025_SEED001';`

---

#### Test 1.2 : Polling Status

```bash
# GET /api/super-admin/seed-data/status/:job_id
JOB_ID="seed_20260131_143025_SEED001"

curl -X GET "http://localhost:8069/api/super-admin/seed-data/status/${JOB_ID}" \
  -H "Cookie: session_id=YOUR_SESSION_ID"

# Expected Response (running):
# {
#   "success": true,
#   "data": {
#     "job_id": "seed_20260131_143025_SEED001",
#     "status": "running",
#     "progress_percent": 45,
#     "current_module": "store",
#     "logs": [...]
#   }
# }
```

**Vérifications** :
- ✅ Status evolue : `pending` → `running` → `completed`
- ✅ `progress_percent` augmente : 0 → 100
- ✅ `logs` se remplissent progressivement
- ✅ `current_module` change : configuration → store → stock → crm...

---

#### Test 1.3 : Téléchargement Rapport

```bash
# GET /api/super-admin/seed-data/report/:job_id
JOB_ID="seed_20260131_143025_SEED001"

curl -X GET "http://localhost:8069/api/super-admin/seed-data/report/${JOB_ID}" \
  -H "Cookie: session_id=YOUR_SESSION_ID" \
  -o seed_report.json

cat seed_report.json | jq .
```

**Vérifications** :
- ✅ Fichier JSON téléchargé
- ✅ Contient `results` avec tous les modules
- ✅ Contient `duration_seconds`
- ✅ Format valide JSON

---

#### Test 1.4 : Isolation Multi-Tenant

```sql
-- Générer seed pour tenant 1
-- Puis vérifier que tenant 2 n'a AUCUN record

-- Vérifier produits tenant 1
SELECT COUNT(*) FROM product_template WHERE tenant_id = 1;
-- Expected: ~100 (si volumetry=standard)

-- Vérifier isolation tenant 2
SELECT COUNT(*) FROM product_template WHERE tenant_id = 2;
-- Expected: 0 (ou nombre initial avant seed tenant 1)

-- Vérifier isolation clients
SELECT COUNT(*) FROM res_partner WHERE tenant_id = 1 AND customer_rank > 0;
-- Expected: ~200

SELECT COUNT(*) FROM res_partner WHERE tenant_id = 2 AND customer_rank > 0;
-- Expected: 0 (ou nombre initial)
```

**Vérifications** :
- ✅ TOUS les records créés ont `tenant_id = 1`
- ✅ AUCUN record de tenant 1 n'apparaît dans tenant 2
- ✅ Relations cohérentes : `sale.order.partner_id.tenant_id = sale.order.tenant_id`

---

#### Test 1.5 : Rate Limiting

```bash
# Générer 2 fois de suite pour le même tenant
curl -X POST http://localhost:8069/api/super-admin/seed-data/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=YOUR_SESSION_ID" \
  -d '{"tenant_id": 1, "volumetry": "minimal", "modules": ["store"]}'

# Puis immédiatement (< 5 minutes après)
curl -X POST http://localhost:8069/api/super-admin/seed-data/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=YOUR_SESSION_ID" \
  -d '{"tenant_id": 1, "volumetry": "minimal", "modules": ["store"]}'

# Expected Response 2nd call:
# {
#   "success": false,
#   "error": "Veuillez attendre XXs avant de relancer une génération"
# }
```

**Vérifications** :
- ✅ 1ère génération OK
- ✅ 2ème génération bloquée (< 5min)
- ✅ Response 429 (Too Many Requests)

---

### 2. Tests Frontend UI

#### Test 2.1 : Page Load

1. Accéder à `http://localhost:9000/seed-data`
2. Vérifier affichage :
   - ✅ Header "Données Seed" visible
   - ✅ Dropdown tenant rempli avec tenants actifs
   - ✅ 3 boutons volumétrie (Minimale, Standard, Large)
   - ✅ 8 boutons modules affichés
   - ✅ 3 checkboxes options visibles
   - ✅ Bouton "Générer Données Seed" (disabled si tenant non sélectionné)

---

#### Test 2.2 : Génération Standard

1. Sélectionner tenant dans dropdown
2. Cliquer "Standard" (volumétrie)
3. Garder tous modules cochés
4. Décocher "Supprimer données existantes"
5. Cocher "Relations inter-modules"
6. Décocher "Images Unsplash" (plus rapide pour test)
7. Cliquer "Générer Données Seed"

**Vérifications** :
- ✅ Bouton devient "Génération en cours..." avec spinner
- ✅ Progress bar apparaît (0%)
- ✅ Progress bar augmente progressivement
- ✅ Statut affiche "En cours: configuration" puis "En cours: store" etc.
- ✅ Logs s'affichent et scrollent automatiquement
- ✅ Timer temps écoulé s'incrémente
- ✅ Après ~3min, statut devient "Terminé avec succès !"
- ✅ Tableau résultats affiché avec modules + counts + durées
- ✅ Bouton "Télécharger Rapport JSON" apparaît

---

#### Test 2.3 : Reset avec Confirmation

1. Sélectionner tenant
2. Cocher "Supprimer données existantes avant génération"
3. Cliquer "Générer Données Seed"

**Vérifications** :
- ✅ Modal confirmation s'affiche avec message ⚠️ DANGER
- ✅ 2 boutons : "Annuler" et "Supprimer et Générer"
- ✅ Si clic "Annuler" → modal ferme, pas de génération
- ✅ Si clic "Supprimer et Générer" → modal ferme, génération lance
- ✅ Logs affichent "⚠️ Suppression données existantes..."

---

#### Test 2.4 : Sélection Modules Partiels

1. Sélectionner tenant
2. Décocher tous modules sauf "Store" et "CRM"
3. Cliquer "Générer"

**Vérifications** :
- ✅ Génération lance uniquement Store + CRM
- ✅ Logs mentionnent uniquement "store" et "crm"
- ✅ Tableau résultats contient uniquement "configuration", "store", "crm"
- ✅ Durée totale réduite (~1min au lieu de 3min)

---

#### Test 2.5 : Téléchargement Rapport

1. Après génération terminée
2. Cliquer "Télécharger Rapport JSON"

**Vérifications** :
- ✅ Fichier `seed_report_JOBID.json` téléchargé
- ✅ Fichier JSON valide (ouvre dans éditeur JSON)
- ✅ Contient tous les champs attendus

---

#### Test 2.6 : Mode Dark/Light

1. Basculer entre mode clair et mode sombre (bouton sidebar)
2. Vérifier page Seed Data

**Vérifications** :
- ✅ Background adapté (blanc → gris foncé)
- ✅ Textes lisibles (dark text → light text)
- ✅ Boutons bordures visibles dans les 2 modes
- ✅ Progress bar visible
- ✅ Tableau résultats lisible

---

#### Test 2.7 : Erreurs Gestion

1. Sélectionner tenant inexistant (hack URL)
2. Cliquer "Générer"

**Vérifications** :
- ✅ Toast erreur affiché
- ✅ Génération n'a pas démarré
- ✅ Message clair "Tenant introuvable"

---

### 3. Tests Volumétrie

#### Test 3.1 : Volumétrie Minimale

```sql
-- Après génération volumetry=minimal
SELECT
    (SELECT COUNT(*) FROM product_template WHERE tenant_id = 1) as products,
    (SELECT COUNT(*) FROM res_partner WHERE tenant_id = 1 AND customer_rank > 0) as customers,
    (SELECT COUNT(*) FROM sale_order WHERE tenant_id = 1) as orders;

-- Expected:
-- products: ~10
-- customers: ~20
-- orders: ~15
-- Total: ~200 records
```

---

#### Test 3.2 : Volumétrie Standard

```sql
-- Après génération volumetry=standard
SELECT
    (SELECT COUNT(*) FROM product_template WHERE tenant_id = 1) as products,
    (SELECT COUNT(*) FROM res_partner WHERE tenant_id = 1 AND customer_rank > 0) as customers,
    (SELECT COUNT(*) FROM sale_order WHERE tenant_id = 1) as orders;

-- Expected:
-- products: ~100
-- customers: ~200
-- orders: ~150
-- Total: ~2000 records
```

---

#### Test 3.3 : Volumétrie Large

```sql
-- Après génération volumetry=large
SELECT
    (SELECT COUNT(*) FROM product_template WHERE tenant_id = 1) as products,
    (SELECT COUNT(*) FROM res_partner WHERE tenant_id = 1 AND customer_rank > 0) as customers,
    (SELECT COUNT(*) FROM sale_order WHERE tenant_id = 1) as orders;

-- Expected:
-- products: ~500
-- customers: ~1000
-- orders: ~750
-- Total: ~5000 records
```

---

### 4. Tests Relations Inter-Modules

#### Test 4.1 : Relations Cohérentes

```sql
-- Vérifier que tous les orders ont un partner du même tenant
SELECT COUNT(*)
FROM sale_order so
LEFT JOIN res_partner p ON so.partner_id = p.id
WHERE so.tenant_id = 1 AND (p.tenant_id != 1 OR p.tenant_id IS NULL);

-- Expected: 0 (aucun order avec partner d'un autre tenant)

-- Vérifier que tous les order lines ont un product du même tenant
SELECT COUNT(*)
FROM sale_order_line sol
LEFT JOIN sale_order so ON sol.order_id = so.id
LEFT JOIN product_product pp ON sol.product_id = pp.id
LEFT JOIN product_template pt ON pp.product_tmpl_id = pt.id
WHERE so.tenant_id = 1 AND (pt.tenant_id != 1 OR pt.tenant_id IS NULL);

-- Expected: 0 (aucun order line avec product d'un autre tenant)
```

**Vérifications** :
- ✅ sale.order.partner_id → même tenant_id
- ✅ sale.order.line.product_id → même tenant_id
- ✅ crm.lead.partner_id → même tenant_id (si lead a partner)

---

### 5. Tests Performance

#### Test 5.1 : Durée Génération Standard

1. Générer volumetry=standard, tous modules
2. Noter temps écoulé affiché dans UI

**Vérifications** :
- ✅ Durée totale < 5 minutes
- ✅ Durée moyenne : ~3min30s

---

#### Test 5.2 : Polling Sans Lag

1. Pendant génération, ouvrir DevTools Network
2. Filtrer requêtes GET /status

**Vérifications** :
- ✅ Requête GET /status toutes les 3 secondes (précis)
- ✅ Temps réponse < 500ms
- ✅ Pas de lag UI (interface reste fluide)

---

### 6. Tests Sécurité

#### Test 6.1 : Vérification Super Admin

1. Se connecter avec user NON super admin
2. Tenter POST /api/super-admin/seed-data/generate

**Vérifications** :
- ✅ Response 403 Forbidden
- ✅ Message "Accès super admin requis"

---

#### Test 6.2 : Tenant Inactif

```sql
-- Désactiver tenant
UPDATE quelyos_tenant SET state = 'suspended' WHERE id = 1;
```

1. Tenter génération pour tenant 1

**Vérifications** :
- ✅ Response 400 Bad Request
- ✅ Message "Tenant non actif"

---

## 📊 Rapport Tests

### Template Rapport

```markdown
# Rapport Tests Seed Data - [DATE]

## Environnement
- Odoo version : 19.0
- Module version : quelyos_api 19.0.1.48.0
- Frontend : Super Admin v1.0.0
- DB : PostgreSQL 16

## Tests Backend (7/7 ✅)
- [x] Génération standard réussie
- [x] Polling status
- [x] Téléchargement rapport
- [x] Isolation multi-tenant
- [x] Rate limiting
- [x] Volumétrie minimale
- [x] Volumétrie large

## Tests Frontend (7/7 ✅)
- [x] Page load
- [x] Génération standard
- [x] Reset avec confirmation
- [x] Sélection modules partiels
- [x] Téléchargement rapport
- [x] Mode dark/light
- [x] Gestion erreurs

## Tests Volumétrie (3/3 ✅)
- [x] Minimale (~200 records)
- [x] Standard (~2000 records)
- [x] Large (~5000 records)

## Tests Relations (1/1 ✅)
- [x] Relations cohérentes (tenant_id)

## Tests Performance (2/2 ✅)
- [x] Durée génération < 5min
- [x] Polling sans lag

## Tests Sécurité (2/2 ✅)
- [x] Vérification super admin
- [x] Tenant inactif bloqué

## Bugs Identifiés
- Aucun

## Améliorations Futures
- [ ] Finance complète (account.move)
- [ ] POS complète (pos.order)
- [ ] HR (attendre fix hr_holidays)
- [ ] Templates produits tunisiens prédéfinis

## Conclusion
✅ Fonctionnalité prête pour production

---
Testeur : [NOM]
Date : [DATE]
```

---

## 🔍 Debug

### Logs Backend

```bash
# Suivre logs Odoo en temps réel
docker logs quelyos-odoo -f | grep -i "seed"

# Vérifier erreurs
docker logs quelyos-odoo --tail 100 | grep ERROR
```

### Logs Frontend

```javascript
// Ouvrir DevTools Console
// Filtrer par "seed"

// Vérifier requêtes
// Network tab → Filter XHR → /seed-data
```

### Vérifier DB

```sql
-- Jobs en cours
SELECT job_id, status, progress_percent, current_module
FROM quelyos_seed_job
WHERE status IN ('pending', 'running')
ORDER BY create_date DESC;

-- Derniers logs d'un job
SELECT logs_json
FROM quelyos_seed_job
WHERE job_id = 'seed_20260131_143025_SEED001';

-- Résultats d'un job
SELECT results_json
FROM quelyos_seed_job
WHERE job_id = 'seed_20260131_143025_SEED001';

-- Compter records créés
SELECT
    (SELECT COUNT(*) FROM product_template WHERE tenant_id = 1) as products,
    (SELECT COUNT(*) FROM res_partner WHERE tenant_id = 1) as partners,
    (SELECT COUNT(*) FROM sale_order WHERE tenant_id = 1) as orders,
    (SELECT COUNT(*) FROM crm_lead WHERE tenant_id = 1) as leads,
    (SELECT COUNT(*) FROM quelyos_ticket WHERE tenant_id = 1) as tickets;
```

---

**Date création** : 2026-01-31
