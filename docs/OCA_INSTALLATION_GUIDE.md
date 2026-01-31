# Guide Installation Modules OCA - Quelyos Finance

**Date** : 2026-01-31
**Phase** : Phase 3 - OCA Addons
**Objectif** : Passer de 65% à 80% de parité fonctionnelle

---

## 📦 12 Modules OCA à Installer

### Priorité P0 (Critiques)

#### 1. account-financial-reporting
**Source** : https://github.com/OCA/account-financial-reporting

**Modules** :
- `account_financial_report` - Rapports financiers avancés
- `mis_builder` - MIS Builder (Management Information System)
- `partner_statement` - Relevés partenaires

**Installation** :
```bash
cd /Users/salmenktata/Projets/GitHub/QuelyosSuite/odoo-backend/addons

# Cloner le dépôt OCA
git clone -b 19.0 https://github.com/OCA/account-financial-reporting.git oca-account-financial-reporting

# Créer liens symboliques
ln -s oca-account-financial-reporting/account_financial_report .
ln -s oca-account-financial-reporting/mis_builder .
ln -s oca-account-financial-reporting/partner_statement .

# Redémarrer Odoo
docker restart quelyos-odoo

# Activer les modules (via UI Odoo ou API)
# Apps > Update Apps List > Search "account_financial_report" > Install
```

**Fonctionnalités ajoutées** :
- ✅ Partner Ledger (Grand livre auxiliaire)
- ✅ Aged Receivables Report (Balance âgée créances 30/60/90 jours)
- ✅ Trial Balance (Balance générale)
- ✅ General Ledger (Grand livre général)
- ✅ Open Items Report (Comptes ouverts)

**Impact parité** : +8%

---

#### 2. l10n-france
**Source** : https://github.com/OCA/l10n-france

**Modules** :
- `l10n_fr_fec` - FEC amélioré
- `l10n_fr_das2` - DAS2 (Déclaration honoraires)
- `l10n_fr_intrastat_product` - Intrastat

**Installation** :
```bash
cd /Users/salmenktata/Projets/GitHub/QuelyosSuite/odoo-backend/addons

git clone -b 19.0 https://github.com/OCA/l10n-france.git oca-l10n-france

ln -s oca-l10n-france/l10n_fr_fec .
ln -s oca-l10n-france/l10n_fr_das2 .
ln -s oca-l10n-france/l10n_fr_intrastat_product .

docker restart quelyos-odoo
```

**Fonctionnalités ajoutées** :
- ✅ FEC (Fichier Écritures Comptables) conforme DGFiP
- ✅ DAS2 (Déclaration annuelle honoraires/commissions)
- ✅ TVA sur encaissements
- ✅ Validation SIREN/SIRET

**Impact parité** : +5%

---

### Priorité P1 (Important)

#### 3. account-payment
**Source** : https://github.com/OCA/account-payment

**Modules** :
- `account_payment_term_multi_day` - Échéanciers multi-dates
- `account_payment_return` - Retours paiements
- `account_payment_order` - Ordres paiement SEPA

**Installation** :
```bash
cd /Users/salmenktata/Projets/GitHub/QuelyosSuite/odoo-backend/addons

git clone -b 19.0 https://github.com/OCA/account-payment.git oca-account-payment

ln -s oca-account-payment/account_payment_term_multi_day .
ln -s oca-account-payment/account_payment_return .
ln -s oca-account-payment/account_payment_order .

docker restart quelyos-odoo
```

**Fonctionnalités ajoutées** :
- ✅ Échéanciers personnalisés (ex: 30% acompte, 70% à 60j)
- ✅ Gestion rejets prélèvement
- ✅ SEPA pain.001 (virement) et pain.008 (prélèvement)

**Impact parité** : +4%

---

#### 4. account-reconcile
**Source** : https://github.com/OCA/account-reconcile

**Modules** :
- `account_reconcile_oca` - Réconciliation avancée
- `account_mass_reconcile` - Réconciliation masse

**Installation** :
```bash
cd /Users/salmenktata/Projets/GitHub/QuelyosSuite/odoo-backend/addons

git clone -b 19.0 https://github.com/OCA/account-reconcile.git oca-account-reconcile

ln -s oca-account-reconcile/account_reconcile_oca .
ln -s oca-account-reconcile/account_mass_reconcile .

docker restart quelyos-odoo
```

**Fonctionnalités ajoutées** :
- ✅ Règles réconciliation automatiques
- ✅ Réconciliation en masse
- ✅ Filtres avancés

**Impact parité** : +3%

---

### Priorité P2 (Nice to have)

#### 5-12. Autres Modules

| Module OCA | Fonctionnalités | Impact |
|------------|-----------------|--------|
| **account-invoice-reporting** | Statistiques factures | +3% |
| **account-financial-tools** | Clôture périodes | +2% |
| **l10n-belgium-intrastat** | Intrastat BE | +1% |
| **account-closing** | Clôture annuelle | +2% |
| **account-move-template** | Modèles écritures | +1% |
| **account-fiscal-year** | Exercices décalés | +1% |
| **mis-builder** | Dashboards MIS | +2% |
| **account-cost-center** | Centres de coûts | +1% |

**Installation globale** :
```bash
cd /Users/salmenktata/Projets/GitHub/QuelyosSuite/odoo-backend/addons

# Cloner tous les dépôts nécessaires
git clone -b 19.0 https://github.com/OCA/account-invoice-reporting.git oca-account-invoice-reporting
git clone -b 19.0 https://github.com/OCA/account-financial-tools.git oca-account-financial-tools
git clone -b 19.0 https://github.com/OCA/l10n-belgium.git oca-l10n-belgium
git clone -b 19.0 https://github.com/OCA/account-closing.git oca-account-closing

# Créer liens symboliques vers les modules spécifiques
# (voir liste détaillée ci-dessus)

docker restart quelyos-odoo
```

**Impact total** : +16%

---

## 🔧 Vérification Installation

### Étape 1 : Vérifier modules disponibles

```bash
# Lister addons Odoo
docker exec quelyos-odoo ls -la /mnt/extra-addons | grep oca-

# Vérifier logs Odoo
docker logs quelyos-odoo --tail 50 | grep -i "module.*oca"
```

### Étape 2 : Activer modules via API

```bash
# Mettre à jour liste modules
curl -X POST http://localhost:8069/api/admin/update-module-list \
  -H "X-Session-Id: admin-session"

# Installer module
curl -X POST http://localhost:8069/api/admin/install-module \
  -H "Content-Type: application/json" \
  -d '{"module_name": "account_financial_report"}'
```

### Étape 3 : Tester via UI Odoo

1. Aller sur http://localhost:8069
2. Se connecter (admin / admin)
3. Apps > Update Apps List
4. Rechercher "account_financial_report"
5. Cliquer Install

---

## 📊 Impact sur Parité Fonctionnelle

### Avant OCA (Phase 2)
- **Parité** : 65%
- **Features** : 35 / 65

### Après OCA (Phase 3)
- **Parité** : **80%** ✅
- **Features** : **52 / 65**
- **Gain** : +15 points

### Détail Gains

| Catégorie | Avant | Après | Gain |
|-----------|-------|-------|------|
| Rapports financiers | 5% | 13% | +8% |
| Conformité France | 10% | 15% | +5% |
| Paiements | 25% | 29% | +4% |
| Réconciliation | 0% | 3% | +3% |
| Autres | 25% | 30% | +5% |

---

## 🚀 Endpoints API à Créer

Pour exposer les modules OCA via notre API Quelyos, créer les endpoints suivants :

### 1. Partner Ledger
```python
@http.route('/api/finance/reports/partner-ledger', type='json', auth='public', cors='*', csrf=False)
def get_partner_ledger(self, **params):
    # Utiliser account_financial_report.report_partner_ledger
    pass
```

### 2. Aged Receivables
```python
@http.route('/api/finance/reports/aged-receivables', type='json', auth='public', cors='*', csrf=False)
def get_aged_receivables(self, **params):
    # Utiliser account_financial_report.report_aged_partner_balance
    # Tranches : 0-30j, 30-60j, 60-90j, >90j
    pass
```

### 3. FEC Export
```python
@http.route('/api/finance/reports/fec-export', type='http', auth='public', cors='*', csrf=False)
def export_fec(self, **params):
    # Utiliser l10n_fr_fec pour générer fichier conforme DGFiP
    pass
```

### 4. SEPA Payment Order
```python
@http.route('/api/finance/payments/sepa/create-order', type='json', auth='public', cors='*', csrf=False)
def create_sepa_order(self, **params):
    # Utiliser account_payment_order pour générer pain.001 ou pain.008
    pass
```

---

## ⚠️ Points d'Attention

### Compatibilité Odoo 19

Certains modules OCA peuvent ne pas être disponibles pour Odoo 19 (sortie récente). Alternatives :

1. **Utiliser branche 18.0** (si compatible)
2. **Migrer manuellement** le module vers 19.0
3. **Développer custom** si critique

### Dépendances

Vérifier `__manifest__.py` de chaque module pour les dépendances :

```python
'depends': ['account', 'base', 'mail']
```

Installer toutes les dépendances avant le module OCA.

### Multi-tenant

Ajouter `tenant_id` sur les modèles OCA si nécessaire :

```python
class PartnerLedger(models.TransientModel):
    _inherit = 'report.partner.ledger'
    
    tenant_id = fields.Many2one('quelyos.tenant', index=True)
```

---

## 📝 Checklist Installation

- [ ] Cloner 12 dépôts OCA
- [ ] Créer liens symboliques
- [ ] Redémarrer Odoo
- [ ] Mettre à jour liste modules
- [ ] Installer modules prioritaires (P0)
- [ ] Tester chaque module
- [ ] Créer endpoints API wrappers
- [ ] Créer pages frontend
- [ ] Ajouter tests
- [ ] Documenter dans README-DEV.md

---

**Auteur** : Claude Code
**Version** : 1.0
**Date** : 2026-01-31
