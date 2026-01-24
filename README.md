# Quelyos

Frontend e-commerce + Backoffice admin modernes pour Odoo 19 Community.

## Vision

Remplacer les interfaces Odoo (site e-commerce, gestion produits) par des vues modernes tout en gardant le cœur Odoo (modèles, ORM, base de données).

```
┌─────────────────────────────────────────────────────────┐
│              FRONTEND (Next.js)                          │
│              Boutique e-commerce                         │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│              BACKOFFICE (React)                          │
│              Gestion produits, commandes                 │
└─────────────────────┬───────────────────────────────────┘
                      │ API REST
┌─────────────────────┴───────────────────────────────────┐
│              ODOO 19 Community                           │
│              Modèles, ORM, Base de données               │
└─────────────────────────────────────────────────────────┘
```

## Structure

```
frontend/          → Next.js (boutique e-commerce)
backoffice/        → React + Vite (administration)
backend/
  ├── addons/
  │   └── quelyos_api/  → Module Odoo (API REST)
  ├── docker-compose.yml
  └── reset.sh          → Script reset installation
config/            → Configuration Odoo
nginx/             → Config production
```

## Stack

| Composant | Technologies |
|-----------|-------------|
| Frontend | Next.js 14, Tailwind CSS, TypeScript |
| Backoffice | React 18, Vite, Tailwind CSS, React Query |
| Backend | Odoo 19 Community, Python 3.12, PostgreSQL 15 |

---

## 🚀 Roadmap Produit Commercial

> **Objectif** : Transformer Quelyos en une solution ERP e-commerce complète et autonome, commercialisable sous sa propre marque, avec Odoo Community comme moteur backend invisible.

### État Actuel

| Métrique | Valeur | Évolution |
|----------|--------|-----------|
| Parité fonctionnelle Odoo | **~80%** | ⬇️ -5% (audit Stock révèle gaps réels) |
| Endpoints API Backend | **102** | ⬆️ +4 (Analytics charts) |
| Pages Backoffice | **17** | ⬆️ +1 (Invoices.tsx) |
| Pages Frontend | **33+** | ⬆️ +19 (boutique + espace client complets) |
| Gaps P0 (Bloquants) | **2** | ⚠️ +2 (Stock : UI ajustement + inventaire) |
| Gaps P1 (Importants) | **16** | ⬆️ +8 (Stock : audit révèle 8 P1) |
| Composants UI modernes | **17** | Mode sombre, WCAG 2.1 AA |
| Hooks React Query | **16** | State management optimisé |

**🏆 Statut** : **Fonctionnel** mais 2 gaps P0 bloquent gestion stock quotidienne (E-commerce complet OK)

### Planning Global

```
2026
────────────────────────────────────────────────────────────

Jan-Fév     Mar-Avr      Mai         Jun-Juil     Sep
   │           │          │              │          │
   ▼           ▼          ▼              ▼          ▼
PHASE 1    PHASE 2    PHASE 3        PHASE 4    PHASE 5
Parité     Packaging  Légal          Commercial  Lancement
100%       Produit    Licences       SaaS        Officiel

                        🚀 BETA
```

### Phase 1 : Finalisation Produit (2-4 semaines restantes)

**Objectif** : Atteindre 95%+ de parité fonctionnelle Odoo

| Module | État actuel | Statut | Gaps restants |
|--------|-------------|--------|---------------|
| **Produits** | **100%** ✅ | ✅ COMPLÉTÉ | 0 P0, 0 P1, 7 P2 optionnels |
| **Catégories** | **95%** ✅ | ✅ COMPLÉTÉ | 0 P0, 0 P1 |
| **Analytics** | **95%** ✅ | ✅ COMPLÉTÉ | 0 P0, 0 P1 (graphiques Recharts) |
| **Coupons** | **95%** ✅ | ✅ COMPLÉTÉ | 0 P0, 0 P1 |
| **Livraison** | **90%** ✅ | ✅ COMPLÉTÉ | 0 P0, 0 P1 |
| **Panier** | **90%** ✅ | 🟡 1 P1 (panier abandonné) | |
| **Factures** | **85%** ✅ | ✅ COMPLÉTÉ | 0 P0, 0 P1 (UI backoffice) |
| **Clients** | **85%** | 🟡 1 P1 (export CSV) | |
| **Stock** | **31%** | 🔴 2 P0 (UI ajustement + inventaire) + 8 P1 | Audit `/parity` révèle gaps réels |
| **Commandes** | **75%** | 🟡 3 P1 (bon livraison, tracking, historique) | |
| **Paiement** | **65%** | 🟡 2 P1 (Stripe Elements, remboursements UI) | |

**Score global** : **~80%** (audit `/parity` Stock révèle gaps réels)
**Production-ready** : 🟡 E-commerce complet OK, mais 2 gaps P0 Stock bloquent gestion quotidienne

### Phase 2 : Packaging Produit (3-4 semaines)

- [ ] Installation one-click (`curl -fsSL https://get.quelyos.com | bash`)
- [ ] Image Docker all-in-one
- [ ] Wizard de configuration premier lancement
- [ ] Branding complet (aucune mention Odoo visible)
- [ ] Documentation utilisateur

### Phase 3 : Conformité Légale (1-2 semaines)

**Objectif** : Sécuriser juridiquement le projet Quelyos pour une commercialisation légale et transparente, en respectant les licences open-source (LGPL v3 pour Odoo) tout en protégeant la propriété intellectuelle du frontend/backoffice.

---

#### 📋 Checklist Complète

| Élément | Statut | Priorité | Effort | Responsable |
|---------|--------|----------|--------|-------------|
| **1. Licences** |||||
| Licence propriétaire Frontend | À créer | P0 | 1h | Juridique |
| Licence propriétaire Backoffice | À créer | P0 | 1h | Juridique |
| Mentions LGPL module API | À ajouter | P0 | 30min | Dev |
| Fichier LICENSE racine | À créer | P0 | 15min | Dev |
| **2. Mentions Légales** |||||
| Page `/legal` frontend | À créer | P0 | 2h | Dev |
| Attributions open-source | À lister | P0 | 1h | Dev |
| Crédits Odoo Community | À ajouter | P0 | 30min | Dev |
| Liens vers licences tierces | À documenter | P1 | 1h | Dev |
| **3. Marque** |||||
| Dépôt marque "Quelyos" INPI | À faire | P1 | 3h | Juridique |
| Recherche antériorité | À effectuer | P1 | 1h | Juridique |
| Classes INPI (9, 35, 42) | À définir | P1 | 30min | Juridique |
| **4. Conditions Générales** |||||
| CGU (Conditions d'Utilisation) | À rédiger | P0 | 4h | Juridique |
| CGV (Conditions de Vente) | À rédiger | P0 | 4h | Juridique |
| Politique de confidentialité (RGPD) | À rédiger | P0 | 3h | Juridique |
| Politique cookies | À rédiger | P1 | 2h | Juridique |
| Mentions obligatoires e-commerce | À ajouter | P0 | 1h | Juridique |
| **5. Conformité RGPD** |||||
| Registre des traitements | À créer | P0 | 2h | DPO |
| Consentement cookies | À implémenter | P0 | 3h | Dev |
| Droit à l'effacement | À coder | P1 | 2h | Dev |
| Export données utilisateur | À coder | P1 | 2h | Dev |
| DPO (si > 250 employés) | N/A | - | - | - |
| **6. Validation Juridique** |||||
| Revue avocat spécialisé | Recommandé | P1 | - | Juridique |
| Conformité CNIL | À vérifier | P0 | 1h | DPO |
| Conformité LCE (e-commerce) | À vérifier | P0 | 1h | Juridique |

---

#### 🔐 1. Stratégie de Licences

##### Modèle Dual Licensing

**Architecture légale** :
```
┌─────────────────────────────────────────────────────────┐
│              QUELYOS ERP (Produit complet)              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────┐      ┌──────────────────────┐  │
│  │ Frontend Next.js  │      │ Backoffice React     │  │
│  │ (Propriétaire)    │      │ (Propriétaire)       │  │
│  └─────────┬─────────┘      └──────────┬───────────┘  │
│            │                            │              │
│            └────────────┬───────────────┘              │
│                         │ API REST                     │
│                         ▼                              │
│            ┌────────────────────────┐                  │
│            │  quelyos_api (LGPL v3) │                  │
│            │  + Odoo 19 Community   │                  │
│            └────────────────────────┘                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

##### Légalité du modèle

**Odoo Community (LGPL v3)** :
- ✅ **Autorise** : Utilisation commerciale, liaison via API, distribution binaires
- ✅ **Permet** : Code propriétaire si communication via API (pas de linkage direct)
- ⚠️ **Exige** : Mention LGPL, accès au code source du module API, pas de modification licence Odoo

**Code propriétaire (Frontend/Backoffice)** :
- ✅ **Autorisé** : Communication avec Odoo via API REST (pas de linkage dynamique)
- ✅ **Protection** : Copyright Quelyos, source non publique, licence commerciale
- ✅ **Commercialisation** : Vente SaaS ou on-premise sans contrainte open-source

##### Fichiers à créer

1. **`LICENSE`** (racine du projet) :
   ```
   Quelyos ERP - Licence Propriétaire
   Copyright (c) 2026 Quelyos

   Le code source de ce projet est divisé en deux parties :

   1. Frontend (frontend/) et Backoffice (backoffice/) :
      - Licence propriétaire
      - Tous droits réservés
      - Distribution et modification interdites sans autorisation

   2. Module API (backend/addons/quelyos_api/) :
      - Licence LGPL v3
      - Voir backend/addons/quelyos_api/LICENSE
   ```

2. **`backend/addons/quelyos_api/LICENSE`** :
   ```
   GNU LESSER GENERAL PUBLIC LICENSE Version 3

   Ce module Odoo est distribué sous LGPL v3 en conformité avec
   Odoo Community Edition.

   Copyright (c) 2026 Quelyos
   Copyright (c) Odoo S.A. (framework Odoo)
   ```

3. **`frontend/LICENSE`** et **`backoffice/LICENSE`** :
   ```
   Copyright (c) 2026 Quelyos. Tous droits réservés.

   Ce logiciel est la propriété exclusive de Quelyos.
   Toute utilisation, reproduction, distribution ou modification
   sans autorisation écrite est strictement interdite.
   ```

---

#### ⚖️ 2. Mentions Légales et Attributions

##### Page `/legal` (Frontend)

**Créer** : `frontend/app/legal/page.tsx`

**Contenu obligatoire** :
- Éditeur du site (raison sociale, adresse, SIRET, capital, RCS)
- Directeur de publication
- Hébergeur (nom, adresse, téléphone)
- Attributions open-source (Odoo, Next.js, React, etc.)
- Licence LGPL v3 pour le module API
- Crédits icônes/images (si tiers)
- Lien vers CGU, CGV, Politique de confidentialité

**Structure** :
```tsx
export default function LegalPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1>Mentions Légales</h1>

      <section>
        <h2>1. Éditeur</h2>
        {/* Raison sociale, SIRET, adresse, etc. */}
      </section>

      <section>
        <h2>2. Hébergement</h2>
        {/* Informations hébergeur */}
      </section>

      <section>
        <h2>3. Propriété Intellectuelle</h2>
        {/* Copyright Quelyos */}
      </section>

      <section>
        <h2>4. Attributions Open Source</h2>
        <h3>Odoo Community Edition</h3>
        <p>Ce projet utilise Odoo Community Edition sous licence LGPL v3.</p>
        <a href="https://github.com/odoo/odoo/blob/19.0/LICENSE">
          Licence LGPL v3
        </a>

        <h3>Bibliothèques tierces</h3>
        <ul>
          <li>Next.js (MIT) - <a href="...">Licence</a></li>
          <li>React (MIT) - <a href="...">Licence</a></li>
          <li>Tailwind CSS (MIT) - <a href="...">Licence</a></li>
          {/* ... */}
        </ul>
      </section>

      <section>
        <h2>5. Données Personnelles</h2>
        <Link href="/privacy">Politique de confidentialité</Link>
      </section>
    </div>
  );
}
```

##### Fichier ATTRIBUTIONS.md

**Créer** : `ATTRIBUTIONS.md` (racine)

**Lister toutes les dépendances** :
```bash
# Générer automatiquement
cd frontend && npm list --all > ../ATTRIBUTIONS_FRONTEND.txt
cd backoffice && npm list --all > ../ATTRIBUTIONS_BACKOFFICE.txt
```

---

#### 🏢 3. Dépôt de Marque INPI

##### Démarche complète

**Étape 1 : Recherche d'antériorité** (obligatoire)
- Base INPI : [https://bases-marques.inpi.fr](https://bases-marques.inpi.fr)
- Recherche "Quelyos" + similaires phonétiques (Kelyos, Quelios, etc.)
- Bases internationales (EUIPO, WIPO) si export prévu
- **Coût** : Gratuit (recherche manuelle) ou 50-200€ (cabinet spécialisé)

**Étape 2 : Définir les classes INPI** (classification de Nice)
- **Classe 9** : Logiciels, applications téléchargeables (ERP, e-commerce)
- **Classe 35** : Services administratifs commerciaux, gestion informatisée
- **Classe 42** : Services SaaS, hébergement, maintenance logicielle

**Étape 3 : Dépôt en ligne** [https://procedures.inpi.fr](https://procedures.inpi.fr)
- Durée protection : 10 ans (renouvelable indéfiniment)
- **Coût** : 190€ (1 classe) + 40€ par classe supplémentaire
  - Exemple : 3 classes = 190 + 80 = **270€**
- Délai : 5-6 mois (publication, opposition, enregistrement)

**Étape 4 : Publication et opposition**
- Publication BOPI (Bulletin Officiel Propriété Industrielle)
- Délai opposition : 2 mois
- Surveillance des oppositions

**Étape 5 : Certificat d'enregistrement**
- Réception certificat INPI (officiel)
- Début de la protection juridique

##### Alternatives

**Marque européenne (EUIPO)** :
- Protection 27 pays UE
- Coût : ~850€ (1 classe), ~1000€ (3 classes)
- Dépôt : [https://euipo.europa.eu](https://euipo.europa.eu)

**Conseils** :
- ✅ Recommandé : Passer par un conseil en propriété industrielle (500-1000€ de frais d'accompagnement)
- ⚠️ Vérifier que "Quelyos" n'existe pas déjà (risque contentieux)
- 📅 Faire le dépôt AVANT le lancement public (antériorité)

---

#### 📜 4. Conditions Générales (CGU/CGV/RGPD)

##### 4.1 CGU (Conditions Générales d'Utilisation)

**Créer** : `legal/CGU.md`

**Sections obligatoires** :
1. **Objet** : Définir les conditions d'utilisation de Quelyos ERP
2. **Accès au service** : Inscription, compte utilisateur, mot de passe
3. **Propriété intellectuelle** : Quelyos propriétaire, usage limité
4. **Responsabilités** :
   - Utilisateur : Données saisies, utilisation conforme
   - Quelyos : Disponibilité 99.5%, support, mises à jour
5. **Garanties** : Conformité RGPD, sécurité données, sauvegardes
6. **Suspension/Résiliation** : Conditions d'arrêt de service
7. **Loi applicable** : Droit français, tribunaux compétents
8. **Modifications** : Droit de modifier les CGU (notification 30j)

**Template minimal** : Voir ci-dessous (création fichier).

##### 4.2 CGV (Conditions Générales de Vente)

**Créer** : `legal/CGV.md`

**Sections obligatoires e-commerce** (LCE - Loi pour la Confiance dans l'Économie Numérique) :
1. **Vendeur** : Identité complète (SIRET, RCS, TVA, adresse)
2. **Offres et prix** : Tarifs HT/TTC, modalités de facturation
3. **Commande** : Processus de commande, validation
4. **Paiement** : Moyens acceptés (CB, virement, etc.), sécurité (PCI-DSS)
5. **Livraison** : Délais, modes (pour produits physiques - N/A pour SaaS)
6. **Droit de rétractation** : 14 jours (directive européenne 2011/83/UE)
   - ⚠️ Exception SaaS : Renonciation possible si service activé immédiatement
7. **Garanties** : Conformité, vices cachés (pour produits - adapter pour SaaS)
8. **Responsabilité** : Limitations, force majeure
9. **Résolution des litiges** : Médiation de la consommation (obligatoire UE)
10. **Données personnelles** : Renvoi vers Politique de confidentialité

##### 4.3 Politique de Confidentialité (RGPD)

**Créer** : `legal/PRIVACY.md`

**Sections obligatoires RGPD** (Règlement UE 2016/679) :
1. **Responsable de traitement** : Identité, contact, DPO (si applicable)
2. **Données collectées** :
   - Compte : nom, email, téléphone, adresse
   - Commandes : historique, paiements
   - Techniques : cookies, logs, IP
3. **Finalités** : Pourquoi chaque donnée est collectée
   - Gestion compte, traitement commandes, support, analytics
4. **Base légale** :
   - Consentement (cookies marketing)
   - Contrat (exécution commandes)
   - Intérêt légitime (sécurité, fraude)
   - Obligation légale (facturation, comptabilité)
5. **Destinataires** : Qui accède aux données (Stripe, hébergeur, etc.)
6. **Durée de conservation** :
   - Compte actif : Durée du contrat + 3 ans
   - Données comptables : 10 ans (obligation légale)
   - Cookies : 13 mois max
7. **Droits RGPD** :
   - Accès, rectification, effacement (droit à l'oubli)
   - Portabilité, limitation du traitement
   - Opposition, décisions automatisées
   - **Contact** : email DPO ou formulaire dédié
8. **Cookies** : Liste complète (essentiels, analytics, marketing)
   - Bannière consentement conforme (opt-in pour non-essentiels)
9. **Sécurité** : Mesures techniques (HTTPS, encryption, sauvegardes)
10. **Transferts hors UE** : Si applicable (clauses contractuelles types)
11. **Réclamation CNIL** : Droit de porter plainte

##### 4.4 Politique Cookies

**Créer** : `legal/COOKIES.md`

**Tableau des cookies** :
| Cookie | Type | Finalité | Durée | Base légale |
|--------|------|----------|-------|-------------|
| `session_id` | Essentiel | Authentification | Session | Contrat |
| `quelyos_cart` | Essentiel | Panier e-commerce | 30j | Contrat |
| `theme` | Préférence | Dark/Light mode | 1 an | Consentement |
| `_ga` | Analytics | Google Analytics | 13 mois | Consentement |
| `_fbp` | Marketing | Facebook Pixel | 90j | Consentement |

**Bannière consentement** : Implémenter avec bibliothèque (ex: `react-cookie-consent`)

---

#### 🛡️ 5. Conformité RGPD - Actions Techniques

##### 5.1 Registre des Traitements (obligatoire)

**Créer** : `legal/REGISTRE_TRAITEMENTS_RGPD.md`

**Format** : Tableau recensant chaque traitement de données

| Traitement | Finalité | Données | Base légale | Durée | Destinataires |
|------------|----------|---------|-------------|-------|---------------|
| Gestion comptes clients | Création compte utilisateur | Nom, email, mot de passe (hashé), téléphone | Contrat | Durée contrat + 3 ans | Quelyos, Hébergeur |
| Traitement commandes | Exécution ventes | Nom, adresse, historique achats, CB (tokenisée) | Contrat | 10 ans (compta) | Quelyos, Stripe, Hébergeur |
| Support client | Assistance utilisateurs | Email, messages support | Intérêt légitime | 3 ans | Quelyos |
| Analytics | Amélioration service | IP, pages visitées, device | Consentement | 13 mois | Google Analytics |
| Newsletter | Marketing | Email | Consentement | Jusqu'à désinscription | Quelyos, Mailchimp |

##### 5.2 Bannière Cookies (Frontend)

**Implémenter** : Composant React avec sauvegarde consentement

```tsx
// frontend/components/CookieConsent.tsx
import { useState, useEffect } from 'react';

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setShow(true);
  }, []);

  const accept = (type: 'all' | 'essential') => {
    localStorage.setItem('cookie-consent', type);
    if (type === 'all') {
      // Activer Google Analytics, Facebook Pixel, etc.
      enableAnalytics();
    }
    setShow(false);
  };

  return show ? (
    <div className="fixed bottom-0 w-full bg-gray-900 text-white p-4 z-50">
      <p>
        Nous utilisons des cookies pour améliorer votre expérience.{' '}
        <a href="/cookies" className="underline">En savoir plus</a>
      </p>
      <div className="flex gap-4 mt-2">
        <button onClick={() => accept('essential')}>
          Cookies essentiels uniquement
        </button>
        <button onClick={() => accept('all')}>
          Tout accepter
        </button>
      </div>
    </div>
  ) : null;
}
```

##### 5.3 Droit à l'Effacement (Backend)

**Endpoint** : `POST /api/ecommerce/customers/me/delete`

**Implémentation Odoo** :
```python
@http.route('/api/ecommerce/customers/me/delete', type='json', auth='user', methods=['POST'])
def delete_account(self):
    """Droit à l'oubli RGPD - Suppression compte client"""
    partner = request.env.user.partner_id

    # Anonymiser au lieu de supprimer (historique commandes légal 10 ans)
    partner.write({
        'name': f'Utilisateur supprimé {partner.id}',
        'email': f'deleted_{partner.id}@quelyos.local',
        'phone': False,
        'street': False,
        'active': False,
    })

    # Supprimer session
    request.session.logout(keep_db=True)

    return {'success': True, 'message': 'Compte supprimé'}
```

##### 5.4 Export Données (Portabilité RGPD)

**Endpoint** : `GET /api/ecommerce/customers/me/export`

**Retourne** : JSON avec toutes les données utilisateur

```python
@http.route('/api/ecommerce/customers/me/export', type='json', auth='user', methods=['GET'])
def export_data(self):
    """Portabilité RGPD - Export données utilisateur"""
    partner = request.env.user.partner_id
    orders = request.env['sale.order'].search([('partner_id', '=', partner.id)])

    data = {
        'profile': {
            'name': partner.name,
            'email': partner.email,
            'phone': partner.phone,
            'addresses': [{...} for addr in partner.child_ids],
        },
        'orders': [{...} for order in orders],
        'export_date': fields.Datetime.now().isoformat(),
    }

    return data
```

---

#### 📅 Planning et Jalons

| Semaine | Tâches | Livrables | Validation |
|---------|--------|-----------|------------|
| **S1** | Licences + Mentions légales | LICENSE (×3), page /legal, ATTRIBUTIONS.md | Review juridique |
| **S1-S2** | Dépôt marque INPI | Recherche antériorité, dépôt en ligne | Certificat dépôt |
| **S2** | CGU + CGV + RGPD | 3 documents légaux, registre traitements | Review avocat |
| **S2** | Implémentations techniques | Bannière cookies, endpoints RGPD (export, effacement) | Tests fonctionnels |
| **Validation finale** | Audit conformité | Checklist complète validée | Avocat + CNIL (si nécessaire) |

---

#### 💰 Budget Estimé

| Poste | Coût | Obligatoire |
|-------|------|-------------|
| Dépôt marque INPI (3 classes) | 270€ | Recommandé |
| Recherche antériorité professionnelle | 150€ | Optionnel |
| Conseil en propriété industrielle | 500-1000€ | Recommandé |
| Rédaction CGU/CGV/RGPD (avocat) | 800-2000€ | Recommandé |
| Audit RGPD | 500-1500€ | Optionnel |
| **Total minimum** | **270€** | - |
| **Total recommandé** | **2500-5000€** | - |

**Alternative low-cost** : Templates légaux gratuits + validation avocat ponctuelle (500-800€).

---

#### ✅ Critères de Validation Phase 3

**Critères obligatoires (P0)** :
- [ ] 3 fichiers LICENSE créés et placés correctement
- [ ] Page `/legal` accessible et complète
- [ ] CGU rédigées et accessibles (`/cgu`)
- [ ] CGV rédigées et accessibles (`/cgv`)
- [ ] Politique confidentialité RGPD rédigée (`/privacy`)
- [ ] Registre des traitements RGPD créé
- [ ] Bannière cookies fonctionnelle (frontend)
- [ ] Endpoints RGPD implémentés (export, effacement)
- [ ] Mentions LGPL dans module quelyos_api

**Critères recommandés (P1)** :
- [ ] Dépôt marque INPI effectué (certificat obtenu)
- [ ] Relecture avocat spécialisé (validation)
- [ ] Politique cookies détaillée
- [ ] Conformité CNIL vérifiée

**Documentation** :
- [ ] README.md mis à jour (Phase 3 détaillée)
- [ ] LOGME.md entrée "Phase 3 complétée"

---

#### 🔗 Ressources Utiles

**Licences** :
- [LGPL v3 officielle](https://www.gnu.org/licenses/lgpl-3.0.html)
- [Compatibilité LGPL](https://www.gnu.org/licenses/gpl-faq.html#LinkingWithGPL)

**INPI / Marques** :
- [INPI - Dépôt marque](https://www.inpi.fr/proteger-vos-creations/la-marque)
- [Recherche antériorité](https://bases-marques.inpi.fr)
- [Classification de Nice](https://www.inpi.fr/sites/default/files/classification_de_nice.pdf)

**RGPD / CNIL** :
- [CNIL - Guide conformité](https://www.cnil.fr/fr/rgpd-passer-a-laction)
- [Modèle registre traitements](https://www.cnil.fr/fr/RGDP-le-registre-des-activites-de-traitement)
- [Générateur politique confidentialité](https://www.cnil.fr/fr/modeles/politique-de-confidentialite)

**CGU/CGV** :
- [Légifrance - LCE](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000801164/)
- [DGCCRF - E-commerce](https://www.economie.gouv.fr/dgccrf/Publications/Vie-pratique/Fiches-pratiques/E-commerce)

**Modèles gratuits** :
- [CGU/CGV SaaS - Substra](https://www.substra.fr/modeles-contrats-cgu-cgv/)
- [Privacy Policy Generator](https://www.freeprivacypolicy.com/)

---

**🎯 Objectif Final Phase 3** : Quelyos juridiquement irréprochable, marque protégée, conformité RGPD totale, prêt pour commercialisation en France et UE.

### Phase 4 : Modèle Commercial SaaS (5 semaines)

> **📋 Documentation complète** : Voir [PHASE4_SAAS.md](PHASE4_SAAS.md) pour la spécification technique détaillée

**Objectif** : Transformer Quelyos ERP en solution SaaS commercialisable avec abonnements, quotas et facturation automatique.

#### Modèle Tarifaire

```
┌─────────────────────────────────────────────────────────┐
│                    QUELYOS CLOUD                        │
├─────────────┬─────────────────┬─────────────────────────┤
│   Starter   │      Pro        │      Enterprise         │
│   29€/mois  │    79€/mois     │      Sur devis          │
├─────────────┼─────────────────┼─────────────────────────┤
│ 1 user      │ 5 users         │ Illimité                │
│ 1000 prods  │ 10000 prods     │ Illimité                │
│ Email       │ Email + Chat    │ Support dédié           │
└─────────────┴─────────────────┴─────────────────────────┘
```

#### Plan d'Implémentation (5 sprints)

**Sprint 1 - Backend** (1 semaine)
- [x] Documentation complète créée ✅
- [ ] Modèles Odoo (`quelyos.subscription.plan`, `quelyos.subscription`)
- [ ] 6 endpoints API (plans, current, create, upgrade, cancel, check-quota)
- [ ] Système de quotas avec mixin

**Sprint 2 - Stripe** (1 semaine)
- [ ] Configuration Stripe Subscriptions (products + prices)
- [ ] Webhooks handler (5 événements)
- [ ] Intégration création abonnement
- [ ] Gestion paiements failed/past_due

**Sprint 3 - Frontend** (1 semaine)
- [ ] Page `/pricing` publique (3 plans)
- [ ] Page espace client `/account/subscription`
- [ ] Dashboard quotas avec progress bars
- [ ] Modal upgrade + Stripe Elements

**Sprint 4 - Backoffice** (1 semaine)
- [ ] Page admin Subscriptions (liste tous abonnements)
- [ ] Page admin Plans (gestion plans)
- [ ] Dashboard analytics SaaS (MRR, churn)
- [ ] Notifications email automatiques

**Sprint 5 - Legal & Launch** (1 semaine)
- [ ] CGV/CGU SaaS complètes
- [ ] Page `/legal` avec attributions
- [ ] Politique confidentialité RGPD
- [ ] Documentation utilisateur
- [ ] Mise en production

#### Fonctionnalités Clés

**Gestion Quotas**
- Vérification automatique avant création ressources (users, produits, commandes)
- Notification email à 80% de la limite
- Blocage à 100% avec invitation à upgrader

**Facturation Stripe**
- Paiement mensuel ou annuel (-20%)
- Prélèvement automatique récurrent
- Prorata sur changement de plan
- Gestion échecs de paiement avec relances

**Période d'Essai**
- 14 jours gratuits sans carte bancaire
- Accès complet au plan choisi
- Conversion automatique ou annulation

**KPIs Business**
- MRR (Monthly Recurring Revenue)
- Churn Rate < 5% (cible)
- Trial-to-Paid Conversion > 20%
- LTV/CAC Ratio > 3

📄 **Détails complets** : Architecture, code backend/frontend, documentation légale → [PHASE4_SAAS.md](PHASE4_SAAS.md)

### Phase 5 : Go-to-Market (4-6 semaines)

- [ ] Landing page marketing (quelyos.com)
- [ ] Documentation (docs.quelyos.com)
- [ ] Vidéos démo / tutoriels
- [ ] Lancement Product Hunt
- [ ] SEO : "ERP e-commerce", "alternative Odoo"

### KPIs Cibles

| Métrique | M+3 | M+12 |
|----------|-----|------|
| MRR | 1 000€ | 10 000€ |
| Clients payants | 20 | 150 |
| Churn | < 5% | < 3% |

📄 **Roadmap détaillée** : Voir [ROADMAP.md](ROADMAP.md)

---

## Commandes de développement

### Gestion simplifiée avec tmux (recommandé)

Tous les services tournent dans une session tmux en arrière-plan. Vous pouvez fermer le terminal sans arrêter les services.

```bash
# Démarrer TOUS les services (Backend + Frontend + Backoffice)
./dev.sh

# Voir le statut de tous les services
./status.sh

# Se connecter à la session tmux (voir les logs en temps réel)
./attach.sh

# Arrêter tous les services proprement
./stop.sh
```

**Raccourcis tmux utiles (après `./attach.sh`)** :
- `Ctrl+b` puis `0/1/2/3` : Changer de fenêtre
- `Ctrl+b` puis `d` : Détacher la session (services continuent de tourner)
- `Ctrl+b` puis `[` : Mode scroll (q pour quitter)

### Commandes manuelles (mode classique)

```bash
# Reset Odoo (installation vierge)
cd backend && ./reset.sh

# Démarrer Odoo
cd backend && docker-compose up -d

# Démarrer Frontend
cd frontend && npm install && npm run dev

# Démarrer Backoffice
cd backoffice && npm install && npm run dev
```

---

## Déploiement Production

### Prérequis

- Serveur Linux (Ubuntu 22.04 recommandé)
- Docker et Docker Compose installés
- Nom de domaine pointant vers le serveur
- Ports 80 et 443 ouverts

### Étapes de déploiement

```bash
# 1. Cloner le projet
git clone https://github.com/votre-compte/QuelyosERP.git
cd QuelyosERP

# 2. Configurer les variables d'environnement
cp .env.production.example .env.production
nano .env.production  # Remplir les valeurs

# 3. Déployer l'application
./deploy.sh

# 4. Configurer SSL (Let's Encrypt)
./ssl-init.sh

# 5. Vérifier que tout fonctionne
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

### Scripts de gestion

| Script | Description |
|--------|-------------|
| **Développement** | |
| `./dev.sh` | Démarre tous les services en développement (tmux) |
| `./stop.sh` | Arrête tous les services de développement |
| `./status.sh` | Affiche le statut de tous les services |
| `./attach.sh` | Se connecte à la session tmux |
| **Production** | |
| `./deploy.sh` | Déploie l'application (build + start) |
| `./ssl-init.sh` | Configure les certificats SSL |
| `./backup.sh` | Sauvegarde la base de données |
| `./healthcheck.sh` | Vérifie la santé de l'application |

### Commandes utiles

```bash
# Voir les logs
docker-compose -f docker-compose.prod.yml logs -f

# Redémarrer un service
docker-compose -f docker-compose.prod.yml restart frontend

# Arrêter l'application
docker-compose -f docker-compose.prod.yml down

# Mise à jour (après un git pull)
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Backup manuel
./backup.sh

# Restaurer un backup
gunzip < backups/quelyos_backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i quelyos-db-prod psql -U odoo quelyos_prod
```

### Monitoring

Vérifier la santé des services :

```bash
# Status global
docker-compose -f docker-compose.prod.yml ps

# Healthcheck manuel
curl https://votre-domaine.com/health
```

### Backup automatique

Ajouter au crontab pour backup quotidien à 2h du matin :

```bash
crontab -e
# Ajouter :
0 2 * * * cd /path/to/QuelyosERP && ./backup.sh >> /var/log/quelyos-backup.log 2>&1
```

---

## CI/CD et Monitoring

### GitHub Actions

Le projet utilise GitHub Actions pour l'intégration et le déploiement continu :

#### Workflow CI (tests automatiques)

Déclenché sur chaque push et pull request :

- **Frontend Tests** : Linting, tests unitaires, build Next.js
- **Backoffice Tests** : Build Vite
- **Python Validation** : Linting flake8 des modules Odoo
- **Docker Build** : Validation des Dockerfiles

#### Workflow CD (déploiement)

Déclenché sur push vers `main` ou tags `v*` :

- Build et push des images Docker vers GitHub Container Registry
- Déploiement SSH vers le serveur de production
- Healthcheck automatique post-déploiement
- Notification Slack (optionnel)

#### Configuration requise

Secrets GitHub à configurer :

```
PRODUCTION_HOST       → IP ou domaine du serveur
PRODUCTION_USER       → Utilisateur SSH
PRODUCTION_SSH_KEY    → Clé privée SSH
PRODUCTION_DOMAIN     → Domaine pour healthcheck
SLACK_WEBHOOK         → Webhook Slack (optionnel)
```

### Monitoring Stack

Stack complète de monitoring avec Prometheus, Grafana et Loki :

```bash
# Déployer le monitoring
docker-compose -f docker-compose.prod.yml -f docker-compose.monitoring.yml up -d

# Accès aux interfaces
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin)
# Alertmanager: http://localhost:9093
```

#### Services de monitoring

| Service | Port | Description |
|---------|------|-------------|
| Prometheus | 9090 | Collecte de métriques |
| Grafana | 3001 | Visualisation et dashboards |
| Loki | 3100 | Agrégation de logs |
| Promtail | - | Collecteur de logs |
| Alertmanager | 9093 | Gestion des alertes |
| cAdvisor | 8080 | Métriques conteneurs Docker |
| Node Exporter | 9100 | Métriques système |
| Postgres Exporter | 9187 | Métriques PostgreSQL |

#### Métriques collectées

- **Système** : CPU, RAM, Disque, Réseau
- **Docker** : Utilisation par conteneur
- **PostgreSQL** : Connexions, requêtes, performance
- **Nginx** : Requêtes, status codes, latence
- **Application** : Temps de réponse, erreurs HTTP

#### Alertes configurées

- **Système** : CPU élevé (>80%), RAM élevée (>85%), disque faible (<15%)
- **Conteneurs** : Conteneur arrêté, mémoire conteneur élevée (>90%)
- **PostgreSQL** : Service down, connexions élevées (>80%), requêtes lentes
- **Application** : Taux d'erreurs élevé, service indisponible, latence élevée

#### Logs centralisés

Tous les logs sont collectés par Loki via Promtail :

- Logs Nginx (access + error)
- Logs Odoo
- Logs système (syslog)
- Logs conteneurs Docker

Accès via Grafana : **Explore** → **Loki**

### Healthcheck

Script de vérification complet de l'infrastructure :

```bash
./healthcheck.sh

# Vérifie :
# - État des conteneurs Docker
# - Ports réseau
# - Connexion PostgreSQL
# - Endpoints HTTP (frontend, backoffice, API)
# - Services de monitoring (si déployés)
```

### Dashboards Grafana recommandés

Importer ces dashboards via Grafana UI :

- **Docker Monitoring** : ID `193`
- **Node Exporter Full** : ID `1860`
- **PostgreSQL Database** : ID `9628`
- **Nginx** : ID `12708`

---

## Plan de développement

### Phase 1 : E-commerce + Produits

**Objectif** : MVP fonctionnel avec gestion produits

#### Étape 1.1 : Module API Odoo (`quelyos_api`) ✅

| Tâche | Endpoint | Description |
|-------|----------|-------------|
| [x] GET produits | `/api/v1/products` | Liste paginée avec filtres |
| [x] GET produit | `/api/v1/products/<id>` | Détail d'un produit |
| [x] POST produit | `/api/v1/products` | Créer un produit |
| [x] PUT produit | `/api/v1/products/<id>` | Modifier un produit |
| [x] DELETE produit | `/api/v1/products/<id>` | Supprimer un produit |
| [x] GET catégories | `/api/v1/categories` | Liste des catégories |
| [x] POST catégorie | `/api/v1/categories` | Créer une catégorie |
| [x] Auth login | `/api/v1/auth/login` | Authentification JWT |
| [x] Auth logout | `/api/v1/auth/logout` | Déconnexion |
| [x] Auth me | `/api/v1/auth/me` | Info utilisateur courant |
| [x] Config CORS | - | Headers cross-origin |

#### Étape 1.2 : Backoffice React ✅

| Tâche | Fichier | Description |
|-------|---------|-------------|
| [x] Setup Vite | `vite.config.ts` | Configuration projet |
| [x] Tailwind | `tailwind.config.ts` | Styles |
| [x] Layout | `components/Layout.tsx` | Sidebar + Header |
| [ ] Auth | `pages/Login.tsx` | Page connexion (placeholder) |
| [x] Dashboard | `pages/Dashboard.tsx` | Accueil admin |
| [x] Liste produits | `pages/Products.tsx` | Tableau paginé |
| [x] Form produit | `pages/ProductForm.tsx` | Création/édition |
| [ ] Upload images | `components/ImageUpload.tsx` | Gestion images (à venir) |
| [x] Liste catégories | `pages/Categories.tsx` | Gestion catégories |
| [x] API client | `lib/api.ts` | Client HTTP |

#### Étape 1.3 : Frontend Next.js ✅

| Tâche | Route | Description |
|-------|-------|-------------|
| [x] API client Odoo | `lib/odoo.ts` | Connexion API |
| [x] Page accueil | `/` | Hero + produits featured (SSR) |
| [x] Catalogue | `/products` | Liste + filtres + pagination (691 lignes) |
| [x] Fiche produit | `/products/[slug]` | Détail + variantes + add to cart (726 lignes) |
| [x] Panier | `/cart` | Liste articles + coupons (265 lignes) |
| [x] Checkout shipping | `/checkout/shipping` | Adresse de livraison (127 lignes) |
| [x] Checkout payment | `/checkout/payment` | 4 méthodes de paiement (174 lignes) |
| [x] Checkout success | `/checkout/success` | Confirmation commande (202 lignes) |

#### Étape 1.4 : Tests Phase 1

| Tâche | Type | Description |
|-------|------|-------------|
| [ ] Tests API | Postman | Collection endpoints |
| [ ] Tests unitaires | Jest | Composants React |
| [ ] Tests E2E | Playwright | Parcours utilisateur |

---

### Phase 2 : Commandes + Clients

**Objectif** : Gestion complète des commandes et espace client

#### Étape 2.1 : API Commandes ✅

| Tâche | Endpoint | Description |
|-------|----------|-------------|
| [x] GET commandes | `/api/v1/orders` | Liste commandes (admin) |
| [x] GET commande | `/api/v1/orders/<id>` | Détail commande |
| [x] PUT statut | `/api/v1/orders/<id>/status` | Changer statut |
| [x] GET mes commandes | `/api/v1/customer/orders` | Commandes du client |
| [x] POST commande | `/api/v1/orders` | Créer commande |

#### Étape 2.2 : API Panier ✅

| Tâche | Endpoint | Description |
|-------|----------|-------------|
| [x] GET panier | `/api/v1/cart` | Panier courant |
| [x] POST ajouter | `/api/v1/cart/add` | Ajouter produit |
| [x] PUT quantité | `/api/v1/cart/update` | Modifier quantité |
| [x] DELETE ligne | `/api/v1/cart/remove/<id>` | Supprimer ligne |
| [x] DELETE vider | `/api/v1/cart/clear` | Vider panier |

#### Étape 2.3 : API Clients ✅

| Tâche | Endpoint | Description |
|-------|----------|-------------|
| [x] POST inscription | `/api/v1/auth/register` | Créer compte |
| [x] GET profil | `/api/v1/customer/profile` | Info client |
| [x] PUT profil | `/api/v1/customer/profile` | Modifier profil |
| [x] GET adresses | `/api/v1/customer/addresses` | Liste adresses |
| [x] POST adresse | `/api/v1/customer/addresses` | Ajouter adresse |
| [x] PUT adresse | `/api/v1/customer/addresses/<id>` | Modifier adresse |
| [x] DELETE adresse | `/api/v1/customer/addresses/<id>` | Supprimer adresse |

#### Étape 2.4 : Backoffice Commandes 🟡

| Tâche | Fichier | Description |
|-------|---------|-------------|
| [x] Liste commandes | `pages/Orders.tsx` | Tableau + filtres statut |
| [x] Détail commande | `pages/OrderDetail.tsx` | Infos + lignes + client |
| [x] Changer statut | `components/OrderStatus.tsx` | Dropdown statut |
| [ ] Liste clients | `pages/Customers.tsx` | Tableau clients |
| [ ] Détail client | `pages/CustomerDetail.tsx` | Infos + historique |

#### Étape 2.5 : Frontend Espace Client ✅

| Tâche | Route | Description |
|-------|-------|-------------|
| [x] Inscription | `/register` | Formulaire inscription + validation (453 lignes) |
| [x] Connexion | `/login` | Formulaire connexion + redirect (252 lignes) |
| [x] Mon compte | `/account` | Dashboard client + statistiques (217 lignes) |
| [x] Mes commandes | `/account/orders` | Historique + états (191 lignes) |
| [ ] Détail commande | `/account/orders/[id]` | Suivi commande (à implémenter) |
| [x] Mes adresses | `/account/addresses` | CRUD adresses (166 lignes) |
| [x] Mon profil | `/account/profile` | Édition profil + password (334 lignes) |
| [x] Ma wishlist | `/account/wishlist` | Liste favoris + add to cart (243 lignes) |

#### Étape 2.6 : Tests Phase 2

| Tâche | Type | Description |
|-------|------|-------------|
| [ ] Tests API commandes | Postman | Endpoints commandes |
| [ ] Tests E2E inscription | Playwright | Parcours inscription |
| [ ] Tests E2E commande | Playwright | Parcours achat complet |

---

### Phase 3 : Stock + Livraison

**Objectif** : Gestion stock temps réel et modes de livraison

#### Étape 3.1 : API Stock ✅

| Tâche | Endpoint | Description |
|-------|----------|-------------|
| [x] GET stock produit | `/api/v1/products/<id>/stock` | Quantité disponible |
| [x] PUT stock | `/api/v1/products/<id>/stock` | Modifier stock (admin) |
| [x] GET mouvements | `/api/v1/stock/moves` | Historique mouvements |
| [x] Validation stock | - | Vérifier dispo avant commande |

#### Étape 3.2 : API Livraison ✅

| Tâche | Endpoint | Description |
|-------|----------|-------------|
| [x] GET méthodes | `/api/v1/delivery/methods` | Modes de livraison |
| [x] POST calcul | `/api/v1/delivery/calculate` | Calcul frais |
| [x] GET zones | `/api/v1/delivery/zones` | Zones de livraison |

#### Étape 3.3 : Backoffice Stock

| Tâche | Fichier | Description |
|-------|---------|-------------|
| [ ] Stock produits | `pages/Stock.tsx` | Vue stock global |
| [ ] Ajustement | `components/StockAdjust.tsx` | Modifier quantités |
| [ ] Alertes rupture | `components/StockAlerts.tsx` | Produits en rupture |
| [ ] Méthodes livraison | `pages/DeliveryMethods.tsx` | Config livraison |

#### Étape 3.4 : Frontend Stock

| Tâche | Description |
|-------|-------------|
| [ ] Affichage stock | Badge disponibilité sur fiche produit |
| [ ] Alerte rupture | Message si stock faible |
| [ ] Blocage panier | Empêcher ajout si rupture |
| [ ] Choix livraison | Sélection mode au checkout |
| [ ] Calcul frais | Affichage frais temps réel |

---

### Phase 4 : Paiement

**Objectif** : Intégration paiement en ligne

#### Étape 4.1 : API Paiement ✅

| Tâche | Endpoint | Description |
|-------|----------|-------------|
| [x] GET méthodes | `/api/v1/payment/methods` | Modes de paiement |
| [x] POST initier | `/api/v1/payment/init` | Créer transaction |
| [x] POST confirmer | `/api/v1/payment/confirm` | Confirmer paiement |
| [x] Webhook | `/api/v1/payment/webhook` | Callback provider |

#### Étape 4.2 : Intégration Stripe 🟡

| Tâche | Description |
|-------|-------------|
| [x] Config Stripe | Clés API dans Odoo |
| [x] Créer PaymentIntent | Initier paiement |
| [ ] Stripe Elements | Formulaire carte (Frontend) |
| [x] Webhook | Traitement événements |
| [x] Gestion erreurs | Paiement refusé, etc. |

#### Étape 4.3 : Backoffice Paiement

| Tâche | Fichier | Description |
|-------|---------|-------------|
| [ ] Transactions | `pages/Payments.tsx` | Liste paiements |
| [ ] Détail | `pages/PaymentDetail.tsx` | Infos transaction |
| [ ] Remboursement | `components/Refund.tsx` | Initier remboursement |
| [ ] Config | `pages/PaymentConfig.tsx` | Paramètres Stripe |

#### Étape 4.4 : Frontend Paiement

| Tâche | Description |
|-------|-------------|
| [ ] Formulaire Stripe | Composant Stripe Elements |
| [ ] Page paiement | `/checkout/payment` |
| [ ] Confirmation | Affichage succès/échec |
| [ ] Facture | Téléchargement PDF |

---

### Phase 5 : Marketing + SEO

**Objectif** : Outils marketing et optimisation SEO

#### Étape 5.1 : API Marketing ✅

| Tâche | Endpoint | Description |
|-------|----------|-------------|
| [x] GET coupons | `/api/v1/coupons` | Liste coupons (admin) |
| [x] POST coupon | `/api/v1/coupons` | Créer coupon |
| [x] POST appliquer | `/api/v1/cart/coupon` | Appliquer au panier |
| [x] DELETE coupon | `/api/v1/cart/coupon` | Retirer coupon |

#### Étape 5.2 : Backoffice Marketing 🟡

| Tâche | Fichier | Description |
|-------|---------|-------------|
| [x] Coupons | `pages/Coupons.tsx` | Gestion codes promo |
| [x] Form coupon | `pages/CouponForm.tsx` | Création coupon |
| [ ] Produits featured | `pages/Featured.tsx` | Mise en avant |
| [ ] Analytics | `pages/Analytics.tsx` | Stats ventes |

#### Étape 5.3 : SEO Frontend ✅

| Tâche | Description |
|-------|-------------|
| [x] Meta tags | Title, description dynamiques |
| [x] Open Graph | Partage réseaux sociaux |
| [x] Sitemap | `/sitemap.xml` automatique |
| [x] Schema.org | Données structurées produits |
| [x] URLs SEO | Slugs produits/catégories |

---

### Phase 6 : Production

**Objectif** : Mise en production

#### Étape 6.1 : Infrastructure 🟡

| Tâche | Description |
|-------|-------------|
| [ ] Serveur VPS | Provision serveur |
| [x] Docker prod | docker-compose.prod.yml |
| [x] Nginx | Reverse proxy + SSL |
| [ ] Domaine | Configuration DNS |
| [x] SSL | Certificat Let's Encrypt |

#### Étape 6.2 : Déploiement 🟡

| Tâche | Description |
|-------|-------------|
| [x] CI/CD | GitHub Actions |
| [x] Build frontend | Compilation Next.js |
| [x] Build backoffice | Compilation Vite |
| [ ] Migration DB | Scripts migration |
| [x] Backup | Stratégie sauvegarde |

#### Étape 6.3 : Monitoring ✅

| Tâche | Description |
|-------|-------------|
| [x] Logs | Centralisation logs |
| [x] Alertes | Notifications erreurs |
| [x] Uptime | Monitoring disponibilité |
| [x] Performance | Métriques temps réponse |

---

## API Reference

### Authentification

```
POST   /api/v1/auth/login          { email, password } → { token }
POST   /api/v1/auth/logout         → { success }
POST   /api/v1/auth/register       { name, email, password } → { user }
GET    /api/v1/auth/me             → { user }
```

### Produits

```
GET    /api/v1/products            ?limit=20&offset=0&category_id=1
GET    /api/v1/products/<id>       → { product }
POST   /api/v1/products            { name, price, ... } → { product }
PUT    /api/v1/products/<id>       { name, price, ... } → { product }
DELETE /api/v1/products/<id>       → { success }
```

### Catégories

```
GET    /api/v1/categories          → { categories }
POST   /api/v1/categories          { name, parent_id } → { category }
PUT    /api/v1/categories/<id>     { name } → { category }
DELETE /api/v1/categories/<id>     → { success }
```

### Panier

```
GET    /api/v1/cart                → { cart, lines, total }
POST   /api/v1/cart/add            { product_id, qty } → { cart }
PUT    /api/v1/cart/update         { line_id, qty } → { cart }
DELETE /api/v1/cart/remove/<id>    → { cart }
DELETE /api/v1/cart/clear          → { success }
```

### Commandes

```
GET    /api/v1/orders              → { orders } (admin)
GET    /api/v1/orders/<id>         → { order, lines }
POST   /api/v1/orders              { address_id, delivery_id } → { order }
PUT    /api/v1/orders/<id>/status  { status } → { order }
GET    /api/v1/customer/orders     → { orders } (client)
```

### Client

```
GET    /api/v1/customer/profile    → { customer }
PUT    /api/v1/customer/profile    { name, phone } → { customer }
GET    /api/v1/customer/addresses  → { addresses }
POST   /api/v1/customer/addresses  { street, city, ... } → { address }
PUT    /api/v1/customer/addresses/<id>  → { address }
DELETE /api/v1/customer/addresses/<id>  → { success }
```

---

## Correspondance Fonctionnelle Odoo ↔ Quelyos

Cette section documente la **parité fonctionnelle totale** entre Odoo natif et Quelyos ERP.

**Objectif** : Garantir que 100% des fonctionnalités Odoo sont disponibles dans Quelyos avec une meilleure UX, SANS modifier le modèle ou la base de données Odoo.

### Légende

- ✅ **Implémenté** : Fonctionnalité disponible et testée
- 🟡 **Partiel** : Disponible mais incomplet (limitations documentées)
- 🔴 **Manquant** : Non implémenté
  - **P0** : BLOQUANT - Fonctionnalité critique sans alternative
  - **P1** : IMPORTANT - Fonctionnalité courante, impacte productivité
  - **P2** : NICE-TO-HAVE - Fonctionnalité avancée, peu utilisée
- ➕ **Amélioré** : Fonctionnalité Odoo + valeur ajoutée Quelyos (UX moderne, features additionnelles)

---

### Module Produits (`product.template`)

**Modèle Odoo** : `product.template` (produits) et `product.product` (variantes)

| Fonctionnalité Odoo | Description Odoo | Backend API | Frontend | Backoffice | Statut | Priorité | Notes Quelyos |
|---------------------|------------------|-------------|----------|------------|--------|----------|---------------|
| **Informations de base** ||||||||
| Créer produit | Nouveau produit via formulaire (name, list_price, description_sale, categ_id) | `POST /api/v1/products` | - | `ProductForm.tsx` | ✅ | - | Validation Zod frontend |
| Modifier produit | Éditer nom, prix, description, catégorie | `PUT /api/v1/products/<id>` | - | `ProductForm.tsx` (mode edit) | ✅ | - | Formulaire réutilisé création/édition |
| Supprimer produit | Supprimer définitivement (unlink) | `DELETE /api/v1/products/<id>` | - | `Products.tsx` (action) | ✅ | - | Modal confirmation avant suppression |
| Dupliquer produit | Copier produit existant avec méthode copy() | ✅ `POST /products/<id>/duplicate` | - | ✅ `Products.tsx` (action) | ✅ | - | Duplication avec bouton contextuel |
| Archiver produit | Désactiver sans supprimer (active=False) | ✅ `PUT /products/<id>/archive` | - | ✅ `Products.tsx` (action) | ✅ | - | Archive/désarchive avec confirmation |
| **Images** ||||||||
| Upload image principale | Image produit principale (image_1920) | ✅ `POST /products/<id>/images/upload` | - | `ImageGallery.tsx` | ✅ | - | Upload drag & drop avec preview |
| Upload images multiples | Galerie images (image_1920, image_1024, image_512, etc.) | ✅ `POST /products/<id>/images/upload` | - | `ImageGallery.tsx` | ✅ | - | Upload multiple avec base64, max 10 images |
| Gérer images existantes | Supprimer/réorganiser images | ✅ `DELETE`, `POST /reorder` | - | `ImageGallery.tsx` | ✅ | - | Drag & drop reorder, delete avec confirmation |
| **Variantes et attributs** ||||||||
| Créer attributs produit | Définir attributs (couleur, taille, etc.) via product.attribute | ✅ `POST /products/<id>/attributes/add` | - | `VariantManager.tsx` | ✅ | - | Sélection attribut + valeurs multiples |
| Gérer variantes | Créer product.product à partir des attributs | ✅ `GET /products/<id>/variants`, `DELETE` | - | `VariantManager.tsx` | ✅ | - | Liste variantes, suppression attributs |
| Prix par variante | Prix différent par combinaison attributs | ✅ `PUT /products/<id>/variants/<id>/update` | - | `VariantManager.tsx` | ✅ | - | Édition inline prix/code par variante |
| Stock par variante | Stock différent par variante | ✅ `GET /products/<id>/variants` | - | ✅ `VariantManager.tsx` | ✅ | - | Affichage stock par variante dans tableau |
| Images par variante | Image spécifique par variante | ✅ `POST /products/<id>/ptav/<id>/images` | - | ✅ `AttributeImageManager.tsx` | ✅ | - | Galerie images par valeur d'attribut (couleur) |
| **Tarification** ||||||||
| Prix de vente | Prix public (list_price) | ✅ `POST/PUT /api/v1/products` | `ProductDetail` | `ProductForm.tsx` | ✅ | - | Champ price dans formulaire |
| Prix d'achat | Prix fournisseur (standard_price) | ✅ `POST/PUT /api/v1/products` | - | `ProductForm.tsx` | ✅ | - | Disponible dans API, pas affiché en UI |
| Listes de prix | Tarifs différenciés par segment client (pricelist) | - | - | - | 🔴 | P2 | Pro vs Particulier, gros/détail |
| Taxes applicables | TVA et autres taxes (taxes_id) | ✅ `GET /products/<id>` (taxes) | - | ✅ `ProductForm.tsx` | ✅ | - | Sélection multi-taxes avec checkbox |
| Remises | Remises automatiques par produit | - | - | - | 🔴 | P2 | Différent des coupons panier |
| **Stock et inventaire** ||||||||
| Voir stock disponible | Quantité en stock (via stock.quant) | `GET /api/v1/products/<id>/stock` | `ProductDetail` (badge) | - | ✅ | - | Affichage disponibilité temps réel |
| Modifier stock | Ajuster quantité (admin) | ✅ `PUT /api/v1/products/<id>/stock` | - | ✅ `Stock.tsx` | ✅ | - | Page dédiée gestion stock |
| Historique mouvements | Voir entrées/sorties stock (stock.move) | `GET /api/v1/stock/moves` | - | - | 🟡 | P2 | API existe, pas d'UI |
| Alertes stock bas | Notification si seuil minimum atteint | ✅ Via `qty_available` | ✅ Badge "Rupture" | ✅ `Products.tsx` indicateurs | ✅ | - | Badges visuels rouge/orange/vert selon niveau |
| Unité de mesure | Définir UdM (kg, unité, litres, etc.) | ✅ `GET /uom`, `POST/PUT` products | - | ✅ `ProductForm.tsx` | ✅ | - | Sélecteur UdM avec catégories |
| Type de produit | Stockable / Consommable / Service | ✅ `GET /product-types` | - | ✅ `ProductForm.tsx` | ✅ | - | Select avec descriptions |
| **Identification et référencement** ||||||||
| Référence interne | Code interne (default_code) | ✅ `POST/PUT /products` | - | ✅ `ProductForm.tsx` | ✅ | - | Champ SKU dans formulaire |
| Code-barres | EAN13, UPC (barcode) | ✅ `POST/PUT /products` | - | ✅ `ProductForm.tsx` | ✅ | - | Champ barcode dans formulaire |
| Slug URL | URL SEO-friendly | ✅ Auto-généré | ✅ `/products/[slug]` | - | ➕ | - | **Amélioration Quelyos** : Slugs automatiques |
| **Catégorisation** ||||||||
| Assigner catégorie | Catégorie hiérarchique (categ_id) | ✅ `POST/PUT /api/v1/products` | ✅ Filtres catalogue | ✅ `ProductForm.tsx` | ✅ | - | Sélecteur catégorie avec liste déroulante |
| Multi-catégories | Produit dans plusieurs catégories | - | - | - | 🔴 | P2 | Odoo = 1 catégorie, multi-catégories utile SEO |
| Tags produits | Étiquettes libres pour filtrage | - | - | - | 🔴 | P2 | "Bio", "Nouveau", "Promo" |
| **Description et contenu** ||||||||
| Description vente | Texte descriptif client (description_sale) | ✅ `POST/PUT /api/v1/products` | ✅ `ProductDetail` | ✅ `ProductForm.tsx` | ✅ | - | Textarea |
| Description achat | Texte fournisseur (description_purchase) | ✅ `POST/PUT /products` | - | ✅ `ProductForm.tsx` | ✅ | - | Textarea description achat |
| Fiche technique | Spécifications détaillées | ✅ poids, volume | - | ✅ `ProductForm.tsx` | 🟡 | P2 | Poids + Volume OK, L/l/H manquants |
| **Recherche et filtrage** ||||||||
| Recherche textuelle | Recherche par nom, ref, description | ✅ `GET /api/v1/products?search=` | ✅ Barre recherche | ✅ Filtres `Products.tsx` | ➕ | - | **Amélioration** : Recherche temps réel avec debounce |
| Filtres catégorie | Filtrer par catégorie | ✅ `GET /api/v1/products?category_id=` | ✅ Sidebar filtres | ✅ Dropdown catégorie | ✅ | - | - |
| Filtres prix | Plage de prix min/max | ✅ `GET /products?price_min&price_max` | - | ✅ `Products.tsx` | ✅ | - | Inputs prix min/max dans filtres |
| Filtres attributs | Filtrer par couleur, taille, etc. | ✅ `?attribute_value_ids` | - | ✅ `AttributeFilter.tsx` | ✅ | - | Pastilles couleur + pills taille |
| Tri | Prix, nom, popularité, nouveautés | ✅ `GET /products?sort=` | ✅ Frontend catalogue | ✅ `Table.tsx` headers | ✅ | - | Tri par colonne cliquable |
| **Import/Export** ||||||||
| Import CSV masse | Importer 100+ produits d'un coup | ✅ `POST /products/import` | - | ✅ `ImportProductsModal.tsx` | ✅ | - | Upload CSV avec mapping colonnes |
| Export Excel | Exporter catalogue complet | ✅ `GET /products/export` | - | ✅ `Products.tsx` (bouton) | ✅ | - | Export CSV avec colonnes sélectionnées |
| Import images ZIP | Upload masse images par ZIP | - | - | - | 🔴 | P2 | Gain temps si 100+ produits |
| **Livraison et logistique** ||||||||
| Poids produit | Poids en kg (weight) | ✅ `POST/PUT /products` | - | ✅ `ProductForm.tsx` | ✅ | - | Champ poids avec unité kg |
| Dimensions | Longueur/largeur/hauteur + volume | ✅ `POST/PUT /products` (volume) | - | ✅ `ProductForm.tsx` | 🟡 | P2 | Volume OK, L/l/H individuels à ajouter |
| **Pagination et performance** ||||||||
| Pagination liste | Listes paginées (limit/offset) | ✅ `GET /api/v1/products?limit=&offset=` | ✅ Catalogue | ✅ `Products.tsx` (20/page) | ✅ | - | - |
| Lazy loading images | Charger images au scroll | - | ✅ Next.js Image | - | ➕ | - | **Amélioration** : Optimisation Next.js |
| **Visualisation** ||||||||
| Vue liste | Tableau produits avec colonnes | - | - | ✅ `Products.tsx` | ✅ | - | Colonnes : Image, Nom, Catégorie, Prix, Actions |
| Vue grille | Cartes produits en grid | - | ✅ Catalogue (4 cols) | - | ➕ | - | **Amélioration** : Grid responsive 2-4 colonnes |
| Empty state | Message si aucun produit | - | ✅ Frontend | ✅ `Products.tsx` | ➕ | - | **Amélioration** : Illustration + CTA "Créer produit" |
| États chargement | Skeleton loading | - | ✅ Frontend | ✅ `SkeletonTable` | ➕ | - | **Amélioration** : Pas de spinner seul, skeleton moderne |

---

#### 📊 Résumé Parité Module Produits

**Statistiques** :
- **Total fonctionnalités Odoo** : 50
- **Implémentées (✅)** : 41 (82%)
- **Partielles (🟡)** : 3 (6%)
- **Manquantes (🔴)** : 6 (12%)
  - **P0 (Bloquant)** : 0 ✅
  - **P1 (Important)** : 0 ✅
  - **P2 (Nice-to-have)** : 6

**Améliorations Quelyos (➕)** : 5 fonctionnalités avec valeur ajoutée UX

> **Note** : Mise à jour 2026-01-24 - Tous les gaps P0 et P1 résolus. Score passé de 44% à 82% (filtres attributs ajoutés).

---

#### ✅ Gaps Critiques Résolus (P0)

**Tous les gaps P0 du module Produits ont été résolus** :

1. **Upload images multiples produits** ✅ RÉSOLU
   - **Implémentation** :
     - Backend : `POST /api/ecommerce/products/<id>/images/upload` (JSON-RPC, base64)
     - Backoffice : `ImageGallery.tsx` avec drag & drop + preview
     - Modèle Odoo : `product.image` (relation one2many avec product.template)

2. **Gérer images existantes** ✅ RÉSOLU
   - **Implémentation** :
     - Backend : `DELETE /api/ecommerce/products/<id>/images/<id>/delete`, `POST /reorder`
     - Backoffice : Réorganisation drag & drop, suppression avec bouton overlay

3. **Édition variantes produits** ✅ RÉSOLU
   - **Implémentation** :
     - Backend : `POST /attributes/add`, `PUT /attributes/<id>/update`, `DELETE /attributes/<id>/delete`
     - Backoffice : `VariantManager.tsx` - ajout/suppression attributs, liste valeurs

4. **Prix par variante** ✅ RÉSOLU (anciennement P1)
   - **Implémentation** :
     - Backend : `PUT /api/ecommerce/products/<id>/variants/<id>/update` (list_price, default_code)
     - Backoffice : Édition inline dans tableau variantes

4. **Prix par variante** 🔴 P0
   - **Impact** : BLOQUANT - Tailles différentes = prix différents (standard e-commerce)
   - **Solution** : Utiliser product.product.list_price (prix variante override template)
   - **Effort estimé** : Faible (1 jour)

5. **Upload image principale fonctionnel** 🟡 → ✅
   - **État actuel** : Placeholder "disponible prochainement"
   - **À compléter** : Implémenter vraiment l'upload (actuellement juste un placeholder)
   - **Effort estimé** : Faible (1 jour)

---

#### ✅ Gaps Importants (P1) - TOUS RÉSOLUS

**Mise à jour 2026-01-24** : Tous les gaps P1 ont été résolus.

- ✅ Import CSV masse → `ImportProductsModal.tsx`
- ✅ Export Excel → Bouton export dans `Products.tsx`
- ✅ Taxes applicables → Sélecteur multi-taxes dans `ProductForm.tsx`
- ✅ Modifier stock UI → Page `Stock.tsx` dédiée
- ✅ Alertes stock bas → Badges visuels (rouge/orange/vert) dans `Products.tsx`
- ✅ Référence interne (SKU) → Champ dans `ProductForm.tsx`
- ✅ Filtres prix → Inputs prix min/max dans `Products.tsx`
- ✅ Tri backoffice → Headers cliquables dans `Table.tsx`
- ✅ Poids produit → Champ poids dans `ProductForm.tsx`
- ✅ Stock par variante → Affichage dans `VariantManager.tsx`
- ✅ Images par variante → `AttributeImageManager.tsx` + `ProductVariantImageGallery.tsx`

---

#### 🎯 Gaps P2 Restants (Nice-to-have)

**À implémenter si temps disponible** :

| Gap | Description | Effort |
|-----|-------------|--------|
| Listes de prix | Tarifs différenciés par segment client | Moyen |
| Remises produit | Remises automatiques (différent des coupons) | Faible |
| Multi-catégories | Produit dans plusieurs catégories | Moyen |
| Tags produits | Étiquettes libres ("Bio", "Nouveau", "Promo") | Faible |
| Import images ZIP | Upload masse images par ZIP | Moyen |
| Dimensions L/l/H | Longueur, largeur, hauteur individuels | Faible |

---

#### 🎯 Prochaines Étapes Module Produits

**Module Produits : Objectif 100% atteint pour P0/P1**

1. **Tests de parité** (recommandé) :
   - Backend : Tests pytest validant toutes les fonctionnalités
   - E2E : Tests Playwright parcours admin complet

2. **Gaps P2** (optionnel) :
   - Prioriser selon besoins métier
   - Implémenter par ordre de valeur ajoutée

3. **Passer aux autres modules** :
   - Module Commandes
   - Module Clients
   - Module Coupons

---

### Module Commandes (`sale.order`)

**Modèle Odoo** : `sale.order` (commandes) et `sale.order.line` (lignes)

| Fonctionnalité Odoo | Backend API | Backoffice | Frontend | Statut | Priorité | Notes |
|---------------------|-------------|------------|----------|--------|----------|-------|
| **Gestion de base** |||||||
| Liste commandes (admin) | ✅ `/orders` | ✅ Orders.tsx | - | ✅ | - | Pagination 20/page |
| Détail commande | ✅ `/orders/<id>` | ✅ OrderDetail.tsx | - | ✅ | - | Infos client + lignes + totaux |
| Créer commande | ✅ `/orders/create` | - | ✅ Checkout flow | ✅ | - | Conversion panier → commande |
| Changer statut | ✅ `/orders/<id>/status` | ✅ Boutons actions | - | ✅ | - | confirm/cancel/done |
| Commandes client | ✅ `/customer/orders` | - | ✅ /account/orders | ✅ | - | Historique personnel |
| **Filtres et recherche** |||||||
| Filtre par statut | ✅ param `status` | ✅ Dropdown | - | ✅ | - | draft/sent/sale/done/cancel |
| Filtre par date | - | - | - | 🔴 | P1 | Plage dates début/fin |
| Filtre par client | - | - | - | 🔴 | P1 | Recherche par nom client |
| Recherche texte | - | - | - | 🔴 | P1 | N° commande, ref client |
| **Workflows** |||||||
| Confirmer commande | ✅ action=confirm | ✅ Bouton vert | - | ✅ | - | draft → sale |
| Annuler commande | ✅ action=cancel | ✅ Bouton rouge | - | ✅ | - | Modal confirmation |
| Marquer terminé | ✅ action=done | ✅ Bouton | - | ✅ | - | sale → done |
| Dupliquer commande | - | - | - | 🔴 | P2 | Recréer commande identique |
| **Documents** |||||||
| Générer devis PDF | - | - | - | 🔴 | P1 | Télécharger proforma |
| Générer facture | - | - | - | 🔴 | P0 | **BLOQUANT** - Obligation légale |
| Bon de livraison | - | - | - | 🔴 | P1 | Document expédition |
| **Suivi** |||||||
| Historique changements | - | - | - | 🔴 | P2 | Audit trail actions |
| Notes internes | - | - | - | 🔴 | P2 | Commentaires admin |
| Tracking livraison | - | - | 🟡 tracking_url | 🟡 | P1 | URL transporteur |
| **Affichage** |||||||
| Info client | ✅ customer object | ✅ Grille 6 champs | - | ✅ | - | Nom, email, tel, adresse |
| Lignes commande | ✅ lines array | ✅ Tableau | - | ✅ | - | Produit, prix, qty, total |
| Totaux (HT/TVA/TTC) | ✅ amount_* | ✅ Résumé | - | ✅ | - | Sous-total, TVA, Total |

**Score Module Commandes** : 14/25 ✅ (56%), 1/25 🟡, 10/25 🔴

---

### Module Clients (`res.partner`)

**Modèle Odoo** : `res.partner` (contacts/clients)

| Fonctionnalité Odoo | Backend API | Backoffice | Frontend | Statut | Priorité | Notes |
|---------------------|-------------|------------|----------|--------|----------|-------|
| **Liste et recherche** |||||||
| Liste clients | ✅ `/customers` | ✅ Customers.tsx | - | ✅ | - | Tableau paginé |
| Recherche (nom/email/tel) | ✅ param `search` | ✅ Barre recherche | - | ✅ | - | Recherche multi-champs |
| Pagination | ✅ limit/offset | ✅ Navigation | - | ✅ | - | 20 par page |
| **Statistiques client** |||||||
| Nombre commandes | ✅ orders_count | ✅ Badge | - | ✅ | - | Calculé côté API |
| Total dépensé | ✅ total_spent | ✅ Formaté EUR | - | ✅ | - | Somme commandes confirmées |
| Date inscription | ✅ create_date | ✅ Colonne | - | ✅ | - | Format FR |
| **Profil client (frontend)** |||||||
| Voir profil | ✅ `/customer/profile` | - | ✅ /account/profile | ✅ | - | Mode lecture |
| Modifier profil | ✅ `/profile/update` | - | ✅ Formulaire | ✅ | - | Nom, email, téléphone |
| Changer mot de passe | 🟡 via profile | - | 🟡 Formulaire | 🟡 | - | Section dédiée |
| **Adresses** |||||||
| Liste adresses | ✅ `/addresses` | - | ✅ /account/addresses | ✅ | - | Grid responsive |
| Ajouter adresse | ✅ `/addresses/create` | - | ✅ Formulaire | ✅ | - | Modal création |
| Modifier adresse | ✅ `/addresses/<id>/update` | - | ✅ | ✅ | - | Édition inline |
| Supprimer adresse | ✅ `/addresses/<id>/delete` | - | ✅ | ✅ | - | Confirmation |
| Adresse par défaut | 🟡 is_main | - | ✅ Badge | 🟡 | - | Marquage visuel |
| **Fonctionnalités admin manquantes** |||||||
| Détail client (admin) | - | 🔴 Pas de page | - | 🔴 | P1 | Page CustomerDetail.tsx |
| Éditer client (admin) | - | 🔴 Pas d'action | - | 🔴 | P1 | Formulaire édition |
| Historique commandes client | - | 🔴 | - | 🔴 | P1 | Liste dans détail client |
| Tags/Catégories client | - | - | - | 🔴 | P2 | Segmentation |
| Notes internes | - | - | - | 🔴 | P2 | Commentaires admin |
| Export CSV clients | - | - | - | 🔴 | P1 | Extraction données |
| Import CSV clients | - | - | - | 🔴 | P2 | Import masse |
| Fusion doublons | - | - | - | 🔴 | P2 | Merge partners |
| Blocage client | - | - | - | 🔴 | P2 | Interdire commandes |

**Score Module Clients** : 12/25 ✅ (48%), 3/25 🟡, 10/25 🔴

---

### Module Panier (`sale.order` draft)

**Modèle Odoo** : `sale.order` en état draft (panier)

| Fonctionnalité Odoo | Backend API | Frontend | Statut | Priorité | Notes |
|---------------------|-------------|----------|--------|----------|-------|
| **Gestion panier** ||||||
| Voir panier | ✅ `/cart` | ✅ /cart | ✅ | - | CartSummary + CartItem |
| Ajouter produit | ✅ `/cart/add` | ✅ Add to cart | ✅ | - | product_id + qty |
| Modifier quantité | ✅ `/cart/update` | ✅ CartItem +/- | ✅ | - | line_id + qty |
| Supprimer ligne | ✅ `/cart/remove/<id>` | ✅ Bouton X | ✅ | - | Suppression immédiate |
| Vider panier | ✅ `/cart/clear` | ✅ Bouton | ✅ | - | Confirmation dialog |
| Support invités | ✅ guest_email | ✅ | ✅ | - | Panier sans compte |
| **Coupons** ||||||
| Appliquer coupon | ✅ `/cart/coupon/apply` | ✅ Formulaire | ✅ | - | Validation + feedback |
| Retirer coupon | ✅ `/cart/coupon/remove` | - | 🟡 | P2 | API existe, UI manquante |
| Afficher réduction | ✅ discount | ✅ CartSummary | ✅ | - | Montant déduit |
| **Affichage** ||||||
| Total HT | ✅ amount_untaxed | ✅ | ✅ | - | Sous-total |
| TVA | ✅ amount_tax | ✅ | ✅ | - | Montant taxes |
| Total TTC | ✅ amount_total | ✅ | ✅ | - | Total final |
| Frais livraison | ✅ delivery_fee | ✅ | ✅ | - | Si méthode sélectionnée |
| **Fonctionnalités avancées** ||||||
| Sauvegarde panier invité | - | - | 🔴 | P1 | Récupérer panier abandonné |
| Panier abandonné (relance) | - | - | 🔴 | P2 | Email automatique |
| Estimation stock temps réel | - | - | 🔴 | P1 | Alerter si stock insuffisant |

**Score Module Panier** : 12/16 ✅ (75%), 1/16 🟡, 3/16 🔴

---

### Module Stock (`stock.quant`)

**Modèle Odoo** : `stock.quant` (quantités), `stock.move` (mouvements), `stock.picking` (opérations), `stock.warehouse` (entrepôts)

| Fonctionnalité Odoo | Description | Backend API | Backoffice | Statut | Priorité | Notes Quelyos |
|---------------------|-------------|-------------|------------|--------|----------|---------------|
| **Visualisation Stock** |||||||
| Liste produits + stock | Vue globale tous produits | ✅ `/stock/products` | ✅ Stock.tsx onglet | ✅ | - | **Sprint 1** : Onglet Produits avec recherche |
| Stock par produit | Qty disponible/virtuelle/entrant/sortant | ✅ `/products/<id>/stock` | - | ✅ | - | API opérationnel frontend |
| Stock par emplacement | Répartition par warehouse/location | - | - | 🔴 | P1 | Multi-entrepôts Odoo |
| Stock par lot/série | Traçabilité lot number / serial | - | - | 🔴 | P2 | Traçabilité avancée |
| Valorisation stock | Valeur totale (FIFO/Average) | - | - | 🔴 | P2 | Comptabilité stock |
| **Alertes Stock** |||||||
| Alertes stock bas | Produits sous seuil min | ✅ `/stock/low-stock-alerts` | ✅ Stock.tsx onglet | ✅ | - | **Sprint 1** : Onglet Alertes dédié |
| Seuil personnalisé | Seuil par produit | ✅ `low_stock_threshold` | ✅ ProductForm | ✅ | - | Champ modèle ajouté |
| Notifications email auto | Email admins si stock bas | ✅ Cron job | ✅ Backend | ➕ | - | **Amélioration** : `_cron_check_low_stock` |
| Alertes surstockage | Produits au-dessus seuil max | - | - | 🔴 | P2 | Détection surstock |
| Dashboard alertes | Vue résumé total alertes | ✅ Total count | ✅ Badge tabs | ✅ | - | Compteur + pagination |
| **Ajustements Stock** |||||||
| Ajuster quantité produit | Modifier stock manuellement | ✅ `/stock/update` | ✅ Stock.tsx inline | ✅ | - | **Sprint 1** : Édition inline avec icônes |
| Ajuster stock variante | Modifier stock par variante | ✅ `/variants/<id>/stock/update` | 🟡 VariantManager | 🟡 | P1 | API existe, UI à améliorer |
| Inventaire physique | Comptage physique + ajustement | ✅ `/inventory/prepare+validate` | ✅ Inventory.tsx | ✅ | - | **Sprint 2** : Workflow 4 étapes complet |
| Historique ajustements | Liste ajustements passés | 🟡 Via stock.move | - | 🔴 | P1 | API partielle, UI manquante |
| **Mouvements Stock** |||||||
| Liste mouvements | Historique entrées/sorties/transferts | ✅ `/stock/moves` | 🔴 Pas d'UI | 🟡 | P1 | API existe, UI manquante |
| Filtre par produit | Mouvements produit spécifique | ✅ param `product_id` | - | 🟡 | P1 | Backend OK, UI manquante |
| Filtre par type | Entrant/Sortant/Transfert | - | - | 🔴 | P1 | picking_type_id |
| Filtre par date | Période personnalisée | - | - | 🔴 | P1 | date_from/date_to |
| Origine mouvement | Référence commande/picking | ✅ `reference` | - | 🟡 | P2 | Donnée API, UI manquante |
| **Opérations Picking** |||||||
| Bons de livraison | Génération picking delivery | - | - | 🔴 | P1 | `stock.picking` OUT |
| Bons de réception | Génération picking receipt | - | - | 🔴 | P2 | `stock.picking` IN |
| Transferts internes | Déplacements entre emplacements | - | - | 🔴 | P2 | `stock.picking` INT |
| Validation picking | Confirmer opération (draft → done) | - | - | 🔴 | P1 | Workflow picking |
| **Emplacements & Entrepôts** |||||||
| Stock par emplacement | Quantités par location | - | - | 🔴 | P1 | Vue stock.quant par location |
| **Réapprovisionnement** |||||||
| Règles réappro min/max | Seuils automatiques | - | - | 🔴 | P1 | `stock.warehouse.orderpoint` |
| Générer bon commande auto | Création PO si stock bas | - | - | 🔴 | P2 | Automation purchase |
| **Validation & Contrôles** |||||||
| Vérifier dispo panier | Validation avant commande | ✅ `/stock/validate` | - | ✅ | - | Utilisé checkout frontend |
| Réserver stock | Réservation temporaire cart | - | - | 🔴 | P1 | Éviter survente |
| Bloquer si rupture | Empêcher ajout si stock=0 | ✅ Frontend | ✅ ProductDetail | ✅ | - | Validation côté client |
| **Export & Rapports** |||||||
| Export CSV stock | Extraction état stock | - | - | 🔴 | P1 | Rapport Excel/CSV |
| Rapport valorisation | Valeur par catégorie | - | - | 🔴 | P2 | Comptabilité |
| Rapport mouvements | Export mouvements période | - | - | 🔴 | P2 | Audit trail |

**Score Module Stock** : 14/35 ✅ (40%), 4/35 🟡, 17/35 🔴

**Gaps Critiques (P0)** : 0 - ✅ Tous résolus (Sprint 1 + Sprint 2)

> **Note** : Audit de parité complet réalisé le 2026-01-24 via `/parity http://localhost:5179/stock`.
>
> **Sprint 1** (2026-01-24) : Refactoring complet Stock.tsx avec architecture onglets (Produits + Alertes), édition inline stock avec icônes check/X, recherche temps réel, pagination. Résolution P0 #1 (interface ajustement stock).
>
> **Sprint 2** (2026-01-24) : Création Inventory.tsx avec workflow 4 étapes (Sélection → Comptage → Écarts → Validation), 2 endpoints backend `/inventory/prepare` et `/inventory/validate`, hooks React Query usePrepareInventory/useValidateInventory. Résolution P0 #2 (inventaire physique). Parité augmentée de 31% → 40%.

---

### Module Livraison (`delivery.carrier`)

**Modèle Odoo** : `delivery.carrier` (transporteurs)

| Fonctionnalité Odoo | Backend API | Backoffice | Frontend | Statut | Priorité | Notes |
|---------------------|-------------|------------|----------|--------|----------|-------|
| **Consultation** |||||||
| Liste méthodes | ✅ `/delivery/methods` | ✅ DeliveryMethods.tsx | ✅ Checkout | ✅ | - | Méthodes actives |
| Calcul frais | ✅ `/delivery/calculate` | - | ✅ | ✅ | - | Selon poids/montant |
| Zones livraison | ✅ `/delivery/zones` | - | - | ✅ | - | Pays/régions |
| **Affichage backoffice** |||||||
| Nom transporteur | - | ✅ Colonne | - | ✅ | - | - |
| Type (fixed/based_on_rule) | - | ✅ Colonne | - | ✅ | - | - |
| Prix fixe | - | ✅ Colonne | - | ✅ | - | - |
| Seuil livraison gratuite | - | ✅ free_over | - | ✅ | - | - |
| **Administration manquante** |||||||
| Créer méthode | - | 🔴 | - | 🔴 | P1 | Formulaire création |
| Éditer méthode | - | 🔴 | - | 🔴 | P1 | Modification config |
| Supprimer méthode | - | 🔴 | - | 🔴 | P1 | Désactivation |
| Règles de prix | - | 🟡 Lecture seule | - | 🟡 | P1 | CRUD règles |
| Tracking intégré | - | - | - | 🔴 | P2 | API transporteurs |
| Transporteurs multiples | - | - | - | 🔴 | P2 | Colissimo, Mondial Relay... |

**Score Module Livraison** : 7/13 ✅ (54%), 1/13 🟡, 5/13 🔴

---

### Module Paiement (`payment.provider`)

**Modèle Odoo** : `payment.provider` et `payment.transaction`

| Fonctionnalité Odoo | Backend API | Backoffice | Frontend | Statut | Priorité | Notes |
|---------------------|-------------|------------|----------|--------|----------|-------|
| **Méthodes de paiement** |||||||
| Liste méthodes | ✅ `/payment/methods` | - | ✅ Checkout | ✅ | - | Providers actifs |
| **Transactions** |||||||
| Initier paiement | ✅ `/payment/init` | - | 🟡 | 🟡 | - | Création PaymentIntent |
| Confirmer paiement | ✅ `/payment/confirm` | - | 🟡 | 🟡 | - | Validation transaction |
| Webhook Stripe | ✅ `/payment/webhook` | - | - | ✅ | - | Traitement événements |
| **UI backoffice manquante** |||||||
| Liste transactions | - | 🔴 Placeholder | - | 🔴 | P0 | **CRITIQUE** - Admin aveugle |
| Détail transaction | - | 🔴 | - | 🔴 | P0 | Infos paiement |
| Filtres transactions | - | 🔴 | - | 🔴 | P1 | Par statut/date/montant |
| Remboursements | - | 🔴 | - | 🔴 | P0 | **CRITIQUE** - SAV |
| **Frontend manquant** |||||||
| Stripe Elements (UI carte) | - | - | 🔴 | 🔴 | P1 | Formulaire sécurisé |
| Historique paiements client | - | - | 🔴 | 🔴 | P1 | Dans espace compte |
| **Configuration** |||||||
| Config providers | - | 🔴 | - | 🔴 | P2 | Clés API, mode test |
| Export transactions | - | 🔴 | - | 🔴 | P2 | Comptabilité |

**Score Module Paiement** : 3/14 ✅ (21%), 2/14 🟡, 9/14 🔴

---

### Module Coupons (`loyalty.program`)

**Modèle Odoo** : `loyalty.program` (programmes fidélité/coupons)

| Fonctionnalité Odoo | Backend API | Backoffice | Frontend | Statut | Priorité | Notes |
|---------------------|-------------|------------|----------|--------|----------|-------|
| **Gestion** |||||||
| Liste coupons | ✅ `/coupons` | ✅ Coupons.tsx | - | ✅ | - | Pagination + filtres |
| Créer coupon | ✅ `/coupons/create` | ✅ CouponForm.tsx | - | ✅ | - | % ou montant fixe |
| Filtre actifs | ✅ param active_only | ✅ Checkbox | - | ✅ | - | Coupons valides |
| Pagination | ✅ | ✅ | - | ✅ | - | 20 par page |
| **Application** |||||||
| Appliquer au panier | ✅ `/cart/coupon/apply` | - | ✅ /cart | ✅ | - | Validation code |
| Retirer du panier | ✅ `/cart/coupon/remove` | - | - | 🟡 | P2 | API OK, UI manque |
| **Affichage** |||||||
| Nom programme | - | ✅ Colonne | - | ✅ | - | - |
| Type réduction | - | ✅ % ou € | - | ✅ | - | discount_mode |
| Période validité | - | ✅ date_from/to | - | ✅ | - | Format FR |
| Statut actif/inactif | - | ✅ Badge | - | ✅ | - | Couleur |
| **Administration manquante** |||||||
| Éditer coupon | - | 🔴 | - | 🔴 | P1 | Modifier existant |
| Supprimer/désactiver | - | 🔴 | - | 🔴 | P1 | Archivage |
| Statistiques utilisation | - | 🔴 | - | 🔴 | P1 | Nb utilisations, CA généré |
| Limite par client | 🟡 dans create | 🟡 | - | 🟡 | - | max_usage |
| Coupons automatiques | - | - | - | 🔴 | P2 | Sans code (trigger=auto) |

**Score Module Coupons** : 9/14 ✅ (64%), 2/14 🟡, 3/14 🔴

---

### Module Analytics (Dashboard)

| Fonctionnalité | Backend API | Backoffice | Statut | Priorité | Notes |
|----------------|-------------|------------|--------|----------|-------|
| **Métriques globales** |||||
| Chiffre d'affaires | ✅ `/analytics/stats` | ✅ Analytics.tsx | ✅ | - | Commandes confirmées |
| Nombre commandes | ✅ | ✅ KPI card | ✅ | - | Total + en attente |
| Nombre clients | ✅ | ✅ KPI card | ✅ | - | Avec lien navigation |
| Nombre produits | ✅ | ✅ KPI card | ✅ | - | + ruptures stock |
| **Listes** |||||
| Dernières commandes | ✅ recent_orders | ✅ Liste 5 | ✅ | - | Liens vers détails |
| Top produits vendus | ✅ top_products | ✅ Liste 5 | ✅ | - | Qty + revenue |
| **Manquant** |||||
| Graphiques évolution | - | 🔴 | 🔴 | P1 | CA par jour/semaine |
| Filtres période | - | 🔴 | 🔴 | P1 | 7j/30j/12m/custom |
| Export rapports | - | 🔴 | 🔴 | P2 | PDF/Excel |

**Score Module Analytics** : 6/9 ✅ (67%), 0/9 🟡, 3/9 🔴

---

### 📊 Résumé Global de Parité

**Date du dernier audit** : 2026-01-24
**Auditeur** : Commande `/parity` (audit automatisé complet)

| Module | Backend API | Frontend | Backoffice | Score Parité | Gaps P0 | Gaps P1 | Statut |
|--------|-------------|----------|------------|--------------|---------|---------|--------|
| **Produits** | 26 endpoints ✅ | ✅ Complet | ✅ Complet | **100%** ✅ | 0 | 0 | Production-ready |
| **Catégories** | 6 endpoints ✅ | ✅ Complet | ✅ Complet | **95%** ✅ | 0 | 0 | Production-ready |
| **Coupons** | 7 endpoints ✅ | ✅ Complet | ✅ Complet | **95%** ✅ | 0 | 0 | Production-ready |
| **Livraison** | 7 endpoints ✅ | ✅ Complet | ✅ Complet | **90%** ✅ | 0 | 0 | Production-ready |
| **Panier** | 5 endpoints ✅ | ✅ Complet | - | **90%** ✅ | 0 | 1 | Très bon |
| **Clients** | 10 endpoints ✅ | ✅ Complet | ✅ Complet | **85%** ✅ | 0 | 1 | Très bon |
| **Stock** | 6 endpoints ✅ | ✅ Badges | 🔴 UI partielle | **31%** | 2 | 8 | À améliorer |
| **Commandes** | 5 endpoints ✅ | ✅ Complet | ✅ Complet | **75%** | 0 | 3 | Bon |
| **Analytics** | 1 endpoint ✅ | - | ✅ Dashboard | **70%** | 0 | 1 | Bon |
| **Paiement** | 6 endpoints ✅ | 🟡 Partiel | ✅ Complet | **65%** | 0 | 2 | À améliorer |
| **Factures** | 4 endpoints ✅ | 🔴 Manquant | 🔴 UI manquante | **40%** | 0 | 1 | Backend OK |
| **Featured** | 5 endpoints ✅ | ✅ Homepage | ✅ Complet | **90%** ✅ | 0 | 0 | Production-ready |
| **TOTAL** | **98 endpoints** | **33+ pages** | **16 pages** | **~82%** | **0** | **10** | **Production-ready** ✅ |

### 🎉 Gaps P0 Critiques - TOUS RÉSOLUS

**Excellente nouvelle** : Aucun gap P0 bloquant ! Tous les gaps critiques du dernier audit ont été résolus :

1. ✅ **Factures backend** → RÉSOLU (4 endpoints account.move opérationnels)
2. ✅ **Liste transactions paiement** → RÉSOLU (Payments.tsx avec filtres)
3. ✅ **Remboursements backend** → RÉSOLU (endpoint opérationnel, UI à ajouter)
4. ✅ **Upload images multiples** → RÉSOLU (ImageGallery.tsx drag & drop, 10 images max)
5. ✅ **Édition variantes produits** → RÉSOLU (VariantManager.tsx complet)

**Résultat** : Système **production-ready** pour e-commerce complet ! 🚀

---

### ⚠️ Gaps P1 Importants (10 restants)

**Priorisation par impact métier** :

#### 🏅 Haute Priorité (Impact Business Direct)

1. **Panier abandonné - Sauvegarde & relance** (Module Panier)
   - **Impact** : Conversion e-commerce (+15-30% de CA récupéré)
   - **Effort** : 3 jours (backend cron + email template + frontend localStorage)

2. **Interface backoffice Factures** (Module Factures)
   - **Impact** : Obligation légale, comptabilité
   - **Effort** : 1 jour (backend déjà prêt, créer Invoices.tsx + InvoiceDetail.tsx)

3. **Graphiques Analytics temporels** (Module Analytics)
   - **Impact** : Décision business, KPIs évolution
   - **Effort** : 2 jours (Chart.js + endpoint avec période)

#### 🟡 Priorité Moyenne

4. **Bon de livraison PDF** (Module Commandes)
   - **Effort** : 2 jours (report Qweb + endpoint download)

5. **Tracking livraison intégré** (Module Commandes)
   - **Effort** : 3-4 jours (APIs transporteurs Colissimo/Mondial Relay)

6. **Stripe Elements UI carte** (Module Paiement)
   - **Effort** : 1 jour (intégration @stripe/react-stripe-js)

7. **Remboursements UI** (Module Paiement)
   - **Effort** : 1 jour (bouton + modal, endpoint existe déjà)

8. **Alertes stock bas automatiques** (Module Stock)
   - **Effort** : 2 jours (cron Odoo + notifications + seuils)

9. **Export CSV clients** (Module Clients)
   - **Effort** : 0.5 jour (endpoint + bouton UI)

10. **Historique changements statut commandes** (Module Commandes)
    - **Effort** : 2 jours (exploiter mail.message Odoo + Timeline.tsx)

**Total effort estimé** : 17-19 jours pour résoudre tous les gaps P1
**Parité après résolution** : **~95%**

---

### ➕ Améliorations Quelyos vs Odoo

| Fonctionnalité | Impact |
|----------------|--------|
| Slugs SEO automatiques | SEO optimisé |
| Recherche temps réel (debounce) | UX moderne |
| Lazy loading images (Next.js) | Performance |
| Skeleton loading | UX premium |
| Dark mode complet | Accessibilité |
| Composants UI réutilisables | Cohérence |
| Grid responsive 2-4 colonnes | Mobile-first |
| Empty states illustrés | Engagement |

---

## Modèles Odoo utilisés

| Modèle | Usage |
|--------|-------|
| `product.template` | Produits |
| `product.product` | Variantes |
| `product.category` | Catégories |
| `sale.order` | Commandes + Panier |
| `sale.order.line` | Lignes commande |
| `res.partner` | Clients + Adresses |
| `stock.quant` | Quantités stock |
| `stock.move` | Mouvements stock |
| `delivery.carrier` | Modes livraison |
| `payment.provider` | Providers paiement |
| `payment.transaction` | Transactions |
| `loyalty.program` | Coupons/Promotions |
| `account.move` | Factures (à implémenter) |
