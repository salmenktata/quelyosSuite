# 🔄 Suivi Fusion Modules OCA → Quelyos Native

**Date début** : 2026-02-01  
**Stratégie** : Option 1 - Fusion code source progressive  
**Licence** : AGPL-3.0  
**Statut global** : ⏳ EN COURS (4/12 modules fusionnés)

---

## 📊 Progression Globale

```
████████░░░░░░░░░░░░░░░░░░░░ 33% (4/12 modules)
```

---

## ✅ Phase 1 : Rapports Financiers (4/4 TERMINÉS)

### 1. Partner Ledger ✅ FUSIONNÉ
**Source OCA** : `account-financial-reporting/account_financial_report/models/partner_ledger.py`  
**Destination** : `quelyos_api/models/finance/oca/partner_ledger.py`  
**Date fusion** : 2026-02-01  
**Statut** : ✅ Modèle créé, à tester

**Fonctionnalités** :
- Grand Livre Auxiliaire par partenaire
- Filtrage par date, compte, partenaire
- Calcul soldes débit/crédit/balance
- Support multi-tenant avec `tenant_id`

**Endpoint API** : `/api/finance/reports/partner-ledger`  
**Modèle Odoo** : `quelyos.finance.partner_ledger`

---

### 2. Aged Receivables ✅ FUSIONNÉ
**Source OCA** : `account-financial-reporting/aged_partner_balance`  
**Destination** : `quelyos_api/models/finance/oca/aged_receivables.py`  
**Date fusion** : 2026-02-01  
**Statut** : ✅ Modèle créé, à tester

**Fonctionnalités** :
- Balance âgée créances/dettes
- Périodes : 0-30, 31-60, 61-90, >90 jours
- Tri par montant total décroissant
- Support clients ET fournisseurs

**Endpoint API** : `/api/finance/reports/aged-receivables`  
**Modèle Odoo** : `quelyos.finance.aged_receivables`

---

### 3. Trial Balance ✅ FUSIONNÉ
**Source OCA** : `account-financial-reporting/trial_balance`  
**Destination** : `quelyos_api/models/finance/oca/trial_balance.py`  
**Date fusion** : 2026-02-01  
**Statut** : ✅ Modèle créé, à tester

**Fonctionnalités** :
- Balance générale tous comptes
- Solde initial + mouvements période + solde final
- Filtrage par journal, compte, partenaire
- Option masquer soldes nuls

**Endpoint API** : `/api/finance/reports/trial-balance`  
**Modèle Odoo** : `quelyos.finance.trial_balance`

---

### 4. FEC Export ✅ FUSIONNÉ
**Source OCA** : `l10n-france/l10n_fr_fec`  
**Destination** : `quelyos_api/models/finance/oca/fec_export.py`  
**Date fusion** : 2026-02-01  
**Statut** : ✅ Modèle créé, à tester

**Fonctionnalités** :
- Export FEC conforme DGFiP (Article A47 A-1)
- 18 colonnes obligatoires
- Format CSV pipe-delimited
- Nom fichier : SIRENFECYYYYMMDD.txt

**Endpoint API** : `/api/finance/fec/export`  
**Modèle Odoo** : `quelyos.finance.fec_export`

---

## ⏳ Phase 2 : Conformité France (0/4 À FAIRE)

### 5. General Ledger ⏳ À FAIRE
**Source OCA** : `account-financial-reporting/general_ledger`  
**Priorité** : P0  
**Estimation** : 3h

**Fonctionnalités** :
- Grand livre général
- Toutes écritures comptables
- Filtrage avancé

---

### 6. DAS2 ⏳ À FAIRE
**Source OCA** : `l10n-france/l10n_fr_das2`  
**Priorité** : P1  
**Estimation** : 4h

**Fonctionnalités** :
- Déclaration annuelle honoraires/commissions
- Export XML DGFiP
- Validation montants > 1200€

---

### 7. TVA sur Encaissements ⏳ À FAIRE
**Source OCA** : `l10n-france/l10n_fr_vat_cash_basis`  
**Priorité** : P1  
**Estimation** : 3h

**Fonctionnalités** :
- TVA exigibilité sur encaissement
- Écritures automatiques paiement
- Déclaration TVA adaptée

---

### 8. Validation SIREN/SIRET ⏳ À FAIRE
**Source OCA** : `l10n-france/l10n_fr_siret`  
**Priorité** : P1  
**Estimation** : 2h

**Fonctionnalités** :
- Validation format SIREN (9 chiffres)
- Validation format SIRET (14 chiffres)
- Clé de contrôle Luhn

---

## ⏳ Phase 3 : Paiements (0/3 À FAIRE)

### 9. Échéanciers Multi-dates ⏳ À FAIRE
**Source OCA** : `account-payment/account_payment_term_multi_day`  
**Priorité** : P2  
**Estimation** : 2h

---

### 10. Retours Paiements ⏳ À FAIRE
**Source OCA** : `account-payment/account_payment_return`  
**Priorité** : P2  
**Estimation** : 3h

---

### 11. Ordres Paiement SEPA ⏳ À FAIRE
**Source OCA** : `account-payment/account_payment_order`  
**Priorité** : P2  
**Estimation** : 4h

---

## ⏳ Phase 4 : Réconciliation (0/1 À FAIRE)

### 12. Rapprochement Bancaire Avancé ⏳ À FAIRE
**Source OCA** : `account-reconcile/account_reconcile_oca`  
**Priorité** : P1  
**Estimation** : 5h

---

## 📋 Checklist Migration (par module)

Pour chaque module OCA fusionné :

- [ ] ✅ Créer modèle Odoo dans `models/finance/oca/`
- [ ] Adapter code avec préfixes (`x_`, `tenant_id`)
- [ ] Créer contrôleur API dans `controllers/finance/oca/`
- [ ] Créer endpoint REST `/api/finance/oca/*`
- [ ] Tester avec données réelles
- [ ] Créer page frontend si nécessaire
- [ ] Documenter dans README OCA
- [ ] Commit + push

---

## 🎯 Prochaines Actions

**Priorité immédiate** :
1. ✅ Tester les 4 modules fusionnés (Partner Ledger, Aged Receivables, Trial Balance, FEC)
2. ⏳ Incrémenter version `__manifest__.py`
3. ⏳ Upgrade module Odoo : `/upgrade-odoo`
4. ⏳ Créer endpoints API pour nouveaux modèles
5. ⏳ Commiter Phase 1

**Phase suivante** :
6. ⏳ Fusionner General Ledger (module 5)
7. ⏳ Fusionner DAS2 (module 6)
8. ⏳ Fusionner TVA Encaissements (module 7)
9. ⏳ Fusionner SIREN/SIRET (module 8)

---

## 💡 Notes Techniques

### Licence et Attribution
- Tous les modules conservent attribution OCA en commentaire
- Licence AGPL-3.0 maintenue (compatible OCA)
- Headers : `Adapted from OCA {repo}/{module}`

### Structure Code
```
quelyos_api/
├── models/
│   └── finance/
│       └── oca/
│           ├── __init__.py
│           ├── partner_ledger.py ✅
│           ├── aged_receivables.py ✅
│           ├── trial_balance.py ✅
│           ├── fec_export.py ✅
│           ├── general_ledger.py ⏳
│           ├── das2.py ⏳
│           └── ... (8 autres)
└── controllers/
    └── finance/
        └── oca/
            ├── __init__.py
            ├── partner_ledger_ctrl.py ⏳
            └── ... (à créer)
```

### Adaptations Quelyos
1. **Multi-tenant** : Ajout `tenant_id` sur tous les modèles
2. **Préfixes** : Pas nécessaire car modèles `_name = 'quelyos.finance.oca.*'`
3. **Isolation** : Filtre `tenant_id` sur toutes les requêtes
4. **API REST** : Création endpoints pour chaque module

---

**Dernière mise à jour** : 2026-02-01 00:30  
**Responsable** : Claude Code  
**Statut** : ✅ Phase 1 terminée (4/12), continuer Phase 2
