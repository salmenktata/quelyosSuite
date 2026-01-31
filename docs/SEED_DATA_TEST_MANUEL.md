# Test Manuel - Génération Seed Data Tenant Demo

## 📋 Prérequis

✅ **Tenant préparé** : Admin Quelyos (ID 1)
- Status: `active`
- Domain: `localhost`
- État initial: **0 produits, 0 clients, 0 commandes** (vérifié)

✅ **Module installé** : quelyos_api 19.0.1.48.0
✅ **Faker installé** : faker==22.0.0
✅ **Table créée** : quelyos_seed_job

---

## 🧪 Test Rapide (Volumétrie Minimale)

### 1. Accéder à l'Interface Super Admin

```
URL: http://localhost:9000/seed-data
Login: admin@quelyos.com / admin (ou vos identifiants super admin)
```

### 2. Configuration Test Rapide

**Paramètres recommandés pour premier test** :

- **Tenant** : Admin Quelyos
- **Volumétrie** : **Minimale** (~200 records, ~30 secondes)
- **Modules** :
  - ✅ Store (produits)
  - ✅ CRM (clients, leads)
  - ✅ Support (tickets)
  - ⬜ Stock (décoché pour plus rapide)
  - ⬜ Marketing (décoché pour plus rapide)
  - ⬜ Finance (désactivé)
  - ⬜ POS (désactivé)
  - ⬜ HR (désactivé)
- **Options** :
  - ⬜ Supprimer données existantes : **NON** (pas nécessaire, DB vide)
  - ✅ Générer relations inter-modules : **OUI**
  - ⬜ Générer images Unsplash : **NON** (plus rapide sans)

### 3. Lancer Génération

1. Cliquer sur **"Générer Données Seed"**
2. Observer la progression :
   - Progress bar : 0% → 100%
   - Module en cours : configuration → store → crm → support
   - Logs : Affichage en temps réel
   - Timer : ~30 secondes pour Minimale

### 4. Vérifier Résultats dans l'Interface

**Tableau résultats attendus (Minimale avec Store + CRM + Support)** :

| Module | Records Créés | Durée (s) |
|--------|---------------|-----------|
| configuration | ~50 | ~2s |
| store | ~35 | ~8s |
| crm | ~30 | ~10s |
| support | ~80 | ~5s |
| **TOTAL** | **~195** | **~25s** |

5. **Télécharger Rapport JSON** (bouton en bas)

---

## 🔍 Vérification Manuelle DB (Optionnel)

### Compter les records créés

```bash
docker exec quelyos-postgres psql -U quelyos -d quelyos -c "
SELECT
    'Products' as type, COUNT(*) as count
FROM product_template WHERE tenant_id = 1
UNION ALL
SELECT 'Customers', COUNT(*) FROM res_partner WHERE tenant_id = 1 AND customer_rank > 0
UNION ALL
SELECT 'Orders', COUNT(*) FROM sale_order WHERE tenant_id = 1
UNION ALL
SELECT 'Leads', COUNT(*) FROM crm_lead WHERE tenant_id = 1
UNION ALL
SELECT 'Tickets', COUNT(*) FROM quelyos_ticket WHERE tenant_id = 1;
"
```

**Résultats attendus (Minimale, Store + CRM + Support)** :
```
   type    | count
-----------+-------
 Products  |   10
 Customers |   20
 Orders    |    0   (pas de module orders sélectionné)
 Leads     |   10
 Tickets   |   10
```

### Vérifier isolation tenant

```bash
# Tous les produits doivent avoir tenant_id = 1
docker exec quelyos-postgres psql -U quelyos -d quelyos -c "
SELECT COUNT(*) as wrong_tenant_products
FROM product_template
WHERE tenant_id != 1 OR tenant_id IS NULL;
"
```

**Résultat attendu** : `0` (aucun produit avec mauvais tenant_id)

### Vérifier relations cohérentes

```bash
# Tous les sale.order doivent avoir un partner du même tenant
docker exec quelyos-postgres psql -U quelyos -d quelyos -c "
SELECT COUNT(*) as inconsistent_orders
FROM sale_order so
LEFT JOIN res_partner p ON so.partner_id = p.id
WHERE so.tenant_id = 1
  AND (p.tenant_id != 1 OR p.tenant_id IS NULL);
"
```

**Résultat attendu** : `0` (toutes les relations cohérentes)

---

## 🎯 Test Complet (Volumétrie Standard)

### Configuration Test Standard

**Après succès du test Minimal, tester Standard** :

- **Tenant** : Admin Quelyos
- **Volumétrie** : **Standard** (~2000 records, ~3min30s)
- **Modules** : **TOUS** sélectionnés (sauf HR si désactivé)
- **Options** :
  - ⬜ Supprimer données existantes : **NON** (garder données minimales)
  - ✅ Générer relations inter-modules : **OUI**
  - ✅ Générer images Unsplash : **OUI** (si connexion Internet OK)

### Résultats Attendus (Standard)

| Module | Records Créés | Durée (s) |
|--------|---------------|-----------|
| configuration | ~50 | ~5s |
| store | ~550 | ~45s |
| stock | ~250 | ~20s |
| crm | ~300 | ~35s |
| orders | ~150 | ~30s |
| marketing | ~30 | ~15s |
| support | ~200 | ~20s |
| **TOTAL** | **~1530** | **~170s (~3min)** |

**Notes** :
- Finance : Skip (simplifiée)
- POS : Skip (simplifiée)
- HR : Skip (module désactivé)

---

## 🐛 Troubleshooting

### Erreur "Tenant non actif"

```bash
# Forcer tenant en active
docker exec quelyos-postgres psql -U quelyos -d quelyos -c "
UPDATE quelyos_tenant SET status = 'active' WHERE id = 1;
"
```

### Erreur "Veuillez attendre XXs"

**Cause** : Rate limiting (1 génération/5min par tenant)

**Solution** : Attendre 5 minutes OU modifier directement en DB :

```sql
-- Réinitialiser rate limit (DEV UNIQUEMENT)
-- En production, respecter le rate limiting
```

### Génération bloquée à 0%

1. **Vérifier logs Odoo** :
```bash
docker logs quelyos-odoo --tail 100 | grep -i "seed\|error"
```

2. **Vérifier job en DB** :
```sql
SELECT job_id, status, progress_percent, error_message
FROM quelyos_seed_job
ORDER BY create_date DESC
LIMIT 5;
```

3. **Redémarrer Odoo si nécessaire** :
```bash
docker restart quelyos-odoo
```

### Logs ne s'affichent pas

**Cause** : Polling frontend (3s interval)

**Solution** :
- Rafraîchir la page
- Vérifier console DevTools pour erreurs réseau
- Vérifier que Odoo répond : `curl http://localhost:8069/web/health`

---

## ✅ Checklist Validation Test

### Frontend

- [ ] Page `/seed-data` accessible
- [ ] Dropdown tenant affiche "Admin Quelyos"
- [ ] 3 boutons volumétrie (Minimale, Standard, Large)
- [ ] 8 modules affichés et toggleables
- [ ] Bouton "Générer" actif après sélection tenant
- [ ] Progress bar fonctionne (0% → 100%)
- [ ] Logs s'affichent en temps réel
- [ ] Timer s'incrémente
- [ ] Tableau résultats affiché si succès
- [ ] Bouton "Télécharger Rapport JSON" fonctionne
- [ ] Mode dark/light adapté

### Backend

- [ ] Job créé dans `quelyos_seed_job`
- [ ] Status évolue : `pending` → `running` → `completed`
- [ ] Logs JSON se remplit progressivement
- [ ] Results JSON contient tous modules
- [ ] Aucune erreur dans logs Odoo
- [ ] Tous records ont `tenant_id = 1`
- [ ] Aucun record avec `tenant_id` NULL ou différent

### Isolation

- [ ] Aucun produit avec mauvais tenant_id
- [ ] Aucun client avec mauvais tenant_id
- [ ] Relations cohérentes (order.partner_id.tenant_id == order.tenant_id)

---

## 📊 État Initial vs Final

### AVANT Génération (Minimale)
```
Products  : 0
Customers : 0
Orders    : 0
Leads     : 0
Tickets   : 0
Campaigns : 0
```

### APRÈS Génération (Minimale - Store + CRM + Support)
```
Products  : 10
Customers : 20
Orders    : 15
Leads     : 10
Tickets   : 10
Campaigns : 0
```

### APRÈS Génération (Standard - Tous modules)
```
Products  : 100
Customers : 200
Orders    : 150
Leads     : 100
Tickets   : 50
Campaigns : 20
```

---

## 🚀 Prochaines Étapes

**Après succès tests Minimal + Standard** :

1. **Tester reset données** :
   - Cocher "Supprimer données existantes"
   - Vérifier modal confirmation
   - Vérifier que données sont supprimées puis recréées

2. **Tester volumétrie Large** (optionnel) :
   - ~5000 records en ~10 minutes
   - Vérifier performance

3. **Tester avec Unsplash** :
   - Cocher "Générer images Unsplash"
   - Vérifier URLs images dans `product.template`

---

**Date création** : 2026-01-31
**Tenant testé** : Admin Quelyos (ID 1)
**État initial** : DB vide, tenant actif ✅
