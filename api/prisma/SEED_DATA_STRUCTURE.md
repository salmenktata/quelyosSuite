# Structure des Données Démo - Seed Figé

## 📋 Vue d'ensemble

Toutes les données du seed sont **figées** (identiques à chaque exécution) et **complètes** (tous les champs de formulaire remplis).

## 🏗️ Ordre logique d'insertion

1. **Company** (existante, marquée `isDemo=true`)
2. **User** (admin de la company)
3. **CompanySettings** (TVA activée, mode HT, taux 20%)
4. **Categories** (15 catégories avec descriptions)
5. **Accounts** (5 comptes avec tous les détails)
6. **Portfolios** (3 portefeuilles avec descriptions longues)
7. **AccountPortfolio** (associations comptes-portefeuilles)
8. **Budgets** (5 budgets prévisionnels)
9. **Transactions** (48 transactions avec TVA calculée)

---

## 📂 Catégories (15)

### Revenus (5)
| Nom | Description |
|-----|-------------|
| Ventes Produits | Ventes de produits physiques ou numériques |
| Prestations de Services | Services professionnels facturés aux clients |
| Abonnements | Revenus récurrents mensuels ou annuels |
| Consulting | Missions de conseil et audit |
| Licences & Royalties | Ventes de licences logicielles et droits d'usage |

### Dépenses (10)
| Nom | Description |
|-----|-------------|
| Salaires & Charges | Salaires nets + charges sociales patronales |
| Loyer & Charges Locatives | Loyer bureaux, charges copropriété, entretien |
| Marketing & Publicité | Campagnes publicitaires online/offline |
| Informatique & Logiciels | Abonnements SaaS, licences, cloud computing |
| Fournitures & Matériel | Matériel bureau, équipement informatique |
| Déplacements & Transport | Frais déplacements professionnels, carburant |
| Télécommunications | Téléphonie mobile, internet, fibre optique |
| Assurances | RC Pro, cyber-risques, multirisque professionnelle |
| Frais Bancaires | Commissions, frais tenue compte, cartes bancaires |
| Formation & Développement | Formations professionnelles, conférences, certifications |

---

## 💳 Comptes Bancaires (5)

| Nom | Type | Balance | Institution | Notes | Shared |
|-----|------|---------|-------------|-------|--------|
| Compte Courant Principal | banque | 375 000 TND | Banque de Tunisie | Compte principal - RIB: TN59... | Non |
| Compte Épargne Professionnelle | banque | 255 000 TND | Attijari Bank | Compte épargne rémunéré 2.5% | Non |
| Compte PayPal Business | banque | 37 500 TND | PayPal | Paiements clients internationaux | Oui |
| Caisse Espèces Bureau | cash | 3 600 TND | - | Petite caisse dépenses quotidiennes | Non |
| Compte Stripe Paiements | banque | 26 100 TND | Stripe | Plateforme paiements SaaS | Oui |

**Total: 697 200 TND**

---

## 📊 Portefeuilles (3)

### 1. Opérations France
- **Description complète**: Gestion des comptes bancaires traditionnels et flux de trésorerie principaux liés aux opérations françaises. Inclut le compte courant principal et la caisse espèces.
- **Comptes associés**: Compte Courant Principal, Caisse Espèces Bureau

### 2. Digital & E-commerce
- **Description complète**: Plateforme de paiements en ligne, abonnements SaaS et revenus digitaux. Regroupe PayPal et Stripe pour suivi des transactions e-commerce.
- **Comptes associés**: Compte PayPal Business, Compte Stripe Paiements

### 3. Épargne & Réserves
- **Description complète**: Fonds de réserve et comptes épargne rémunérés. Sécurisation de la trésorerie à moyen terme avec taux d'intérêt de 2.5% annuel.
- **Comptes associés**: Compte Épargne Professionnelle

---

## 💰 Budgets (5)

| Nom | Description | Montant cible | Période |
|-----|-------------|---------------|---------|
| Budget Marketing Digital Q4 2025 | Campagnes Google Ads, Facebook/Instagram, LinkedIn | 15 000 TND | Trimestriel |
| Budget Infrastructure IT 2025 | Serveurs cloud AWS, licences Microsoft 365 | 48 000 TND | Annuel |
| Budget Formation Équipe T4 2025 | Formations techniques, certifications | 8 000 TND | Trimestriel |
| Budget Déplacements Pro 2025 | Missions clients, salons professionnels | 12 000 TND | Annuel |
| Budget Recrutement Q1 2026 | Onboarding, équipement, formation initiale | 25 000 TND | Trimestriel |

---

## 💸 Transactions (48)

### Répartition
- **Revenus**: 15 transactions (12 confirmées + 3 planifiées)
- **Dépenses**: 33 transactions (29 confirmées + 4 planifiées)
- **Période**: Juin 2025 → Janvier 2026

### Champs remplis pour chaque transaction

#### Transactions CONFIRMÉES
- ✅ `description`: Libellé détaillé et unique
- ✅ `amount`: Montant TTC
- ✅ `amountHT`: Montant hors taxe (calculé)
- ✅ `amountTTC`: Montant toutes taxes comprises (calculé)
- ✅ `vatRate`: Taux de TVA (20% ou 0%)
- ✅ `vatMode`: 'HT' (hors taxe)
- ✅ `type`: 'credit' ou 'debit'
- ✅ `status`: 'CONFIRMED'
- ✅ `occurredAt`: Date effective précise (ex: 2025-06-15T10:30:00)
- ✅ `scheduledFor`: `null` (car déjà effectuée)
- ✅ `categoryId`: Lien vers catégorie appropriée
- ✅ `accountId`: Lien vers compte bancaire

#### Transactions PLANIFIÉES
- ✅ `description`: Libellé détaillé
- ✅ Tous les champs de montant/TVA
- ✅ `status`: 'PLANNED'
- ✅ `occurredAt`: Date de création
- ✅ `scheduledFor`: **Date planifiée future** (ex: 2025-12-15T10:00:00)
- ✅ Catégorie et compte associés

### Exemples de transactions

#### Revenu confirmé
```json
{
  "description": "Vente Licence Entreprise Premium - ACME Corp",
  "amount": 14400,
  "amountHT": 12000,
  "amountTTC": 14400,
  "vatRate": 20,
  "vatMode": "HT",
  "type": "credit",
  "status": "CONFIRMED",
  "occurredAt": "2025-06-15T10:30:00",
  "scheduledFor": null,
  "categoryId": "<Licences & Royalties>",
  "accountId": "<Compte Courant Principal>"
}
```

#### Dépense planifiée
```json
{
  "description": "Salaires & Charges Sociales - Décembre 2025",
  "amount": 14500,
  "amountHT": 14500,
  "amountTTC": 14500,
  "vatRate": 0,
  "vatMode": "HT",
  "type": "debit",
  "status": "PLANNED",
  "occurredAt": "2025-12-01T00:00:00",
  "scheduledFor": "2025-12-31T18:00:00",
  "categoryId": "<Salaires & Charges>",
  "accountId": "<Compte Courant Principal>"
}
```

---

## 🔐 Identifiants

- **Email**: demo@quelyos.test
- **Password**: changeme
- **Role**: ADMIN
- **Company**: Quelyos Demo SAS (ID: 19)

---

## ✨ Caractéristiques

1. **Données figées**: Identiques à chaque exécution du seed
2. **Données complètes**: Tous les champs de formulaire remplis
3. **Données cohérentes**: 
   - TVA calculée correctement (20% pour ventes, 0% pour salaires/assurances)
   - Dates réalistes et chronologiques
   - Montants variés et réalistes en TND
   - Descriptions détaillées et uniques
   - Associations logiques compte-portefeuille

4. **Ordre d'insertion respecté**: Dépendances FK gérées correctement

---

## 🚀 Utilisation

```bash
# Nettoyer + recréer les données
DEMO_COMPANY_ID=19 node prisma/clean-demo.js
DEMO_COMPANY_ID=19 node prisma/seed.js
```

Le résultat sera **toujours identique** à chaque exécution.
