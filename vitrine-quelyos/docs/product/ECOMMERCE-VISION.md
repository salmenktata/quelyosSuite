# Quelyos E-Commerce — Vision Produit

> **Order Hub Omnicanal pour TPE/PME**  
> *"Transformez chaque conversation en commande. Sans site web. Depuis tous vos canaux."*

---

## 1. 🎯 Le Problème à Résoudre

### Constat Terrain

**75% des TPE/PME ne vendent pas via un site e-commerce classique.**

Leurs commandes arrivent par :
- 📱 **WhatsApp** (messages directs clients)
- 📸 **Instagram** (DMs après découverte d'un produit)
- 🎵 **TikTok** (commentaires viraux)
- 📘 **Facebook** (Messenger)
- 📧 **Email** (demandes de devis)
- 📞 **Téléphone** (commandes vocales)
- 🗒️ **Carnet papier** (notes manuscrites)

### Les Douleurs Actuelles

| Douleur | Impact Business |
|---------|-----------------|
| Commandes éparpillées | Oublis fréquents, clients insatisfaits |
| Pas de traçabilité | Impossible de savoir qui a commandé quoi |
| Facturation manuelle | Heures perdues en fin de mois |
| Stock approximatif | Ruptures ou surstocks |
| Pas de données client | Zéro fidélisation possible |
| Pas de connexion comptable | Ressaisie manuelle dans l'expert-comptable |

### Cibles Prioritaires

1. **Artisans** : Pâtissiers, traiteurs, fleuristes, bijoutiers
2. **Commerçants locaux** : Épiceries, cavistes, primeurs
3. **Services B2B** : Fournisseurs, grossistes locaux
4. **Créateurs/Makers** : Etsy-like sans site web

---

## 2. 💡 La Solution Quelyos E-Commerce

### Positionnement

> **"L'anti-Shopify pour ceux qui vendent sans site web."**

Un **Order Hub** qui centralise TOUTES les commandes, quel que soit le canal d'origine, et les transforme automatiquement en :
- ✅ Ligne dans le carnet de commandes
- ✅ Facture / Devis (→ Quelyos Finance)
- ✅ Fiche client enrichie (→ Quelyos Marketing)
- ✅ Mouvement de stock
- ✅ Encaissement (QR code, lien de paiement)

### La Promesse

> *"Toutes vos commandes au même endroit. Zéro site web. Facturation auto. Trésorerie à jour."*

**Avant Quelyos E-Commerce :**
```
WhatsApp → Carnet → Excel → Facture Word → Email client → Compta séparée
         (5 outils, 30 min/commande, erreurs fréquentes)
```

**Après Quelyos E-Commerce :**
```
WhatsApp → Quelyos E-Commerce → Facture auto → Compta sync
         (1 outil, 2 min/commande, zéro erreur)
```

---

## 3. 🔧 Fonctionnalités Clés

### 3.1 📥 Capture Omnicanale

| Canal | Intégration | Status |
|-------|-------------|--------|
| WhatsApp Business | API Cloud | Priorité 1 |
| Instagram DMs | Meta Graph API | Priorité 1 |
| Facebook Messenger | Meta Graph API | Priorité 1 |
| TikTok Shop | TikTok for Business API | Priorité 2 |
| Email | IMAP/Webhook | Priorité 2 |
| Téléphone | Transcription vocale (Whisper) | Priorité 3 |
| Saisie manuelle | Interface web/mobile | Priorité 1 |

**Fonctionnement :**
1. Client envoie un message "Je voudrais 2 gâteaux pour samedi"
2. L'IA détecte : **Intention d'achat** ✅
3. Extraction automatique : Produit, Quantité, Date souhaitée
4. Création de commande en 1 clic (ou automatique)

### 3.2 📋 Carnet de Commandes Intelligent

- **Liste unifiée** de toutes les commandes tous canaux
- **Statuts** : Nouvelle → Confirmée → En préparation → Prête → Livrée → Payée
- **Filtres** : Par canal, statut, client, date, montant
- **Vue Kanban** drag & drop pour suivi visuel
- **Alertes** : Commandes en attente > 24h, paiements en retard

### 3.3 🛒 Catalogue Produits/Services

- Création de fiches produit simples (nom, prix, photo, stock)
- **Variantes** : Tailles, couleurs, options
- **Prix dynamiques** : Par quantité, par client fidèle
- **Stock temps réel** : Alertes rupture, suggestions réapprovisionnement
- **QR Code produit** : Client scanne → ajoute au panier

### 3.4 👤 CRM Clients Intégré

- **Fiche client auto-générée** depuis conversations
- Historique complet : commandes, messages, paiements
- **Scoring client** : Fréquence, panier moyen, ancienneté
- **Segments automatiques** : Nouveaux, Fidèles, Dormants, VIP
- **Export vers Quelyos Marketing** pour campagnes ciblées

### 3.5 💳 Paiements & Encaissements

- **Liens de paiement** envoyables par WhatsApp/DM
- **QR Code** pour paiement en personne
- Intégration **Stripe** (CB) + **PayPal** + **Flouci** (Tunisie)
- **Échéancier** pour paiements fractionnés
- Statut paiement automatique sur la commande

### 3.6 📄 Facturation Automatique

- **Génération automatique** de devis/factures depuis commandes
- Templates personnalisables (logo, mentions légales)
- **Export PDF** + envoi direct par email/WhatsApp
- **Numérotation légale** (FRA-2025-0001)
- **Sync Quelyos Finance** : La facture devient un revenu prévu

### 3.7 📦 Gestion de Stock (Optionnelle)

- **Mouvements automatiques** : Commande = -stock
- Alertes seuils minimum
- **Multi-dépôts** (boutique, stock, fournisseur)
- Inventaire simplifié
- Valorisation stock en temps réel

---

## 4. 🔗 Synergies Suite Quelyos

### 4.1 → Quelyos Finance

| Donnée E-Commerce | Action Finance |
|-------------------|----------------|
| Commande confirmée | Création revenu prévu (date livraison) |
| Facture émise | Revenu catégorisé automatiquement |
| Paiement reçu | Transaction réelle enregistrée |
| Achat stock | Dépense fournisseur créée |

**Bénéfice :** Trésorerie à jour en temps réel, prévisions précises.

### 4.2 → Quelyos Marketing

| Donnée E-Commerce | Action Marketing |
|-------------------|------------------|
| Nouveau client | Fiche contact enrichie |
| Commande passée | Segment "Acheteurs" mis à jour |
| Client inactif 30j | Ajout au segment "Dormants" |
| VIP détecté | Tag automatique pour campagne spéciale |

**Bénéfice :** Campagnes ciblées basées sur comportement d'achat réel.

### 4.3 Bundle Suite Complète

| Plan | Finance | Marketing | E-Commerce | Bundle |
|------|---------|-----------|------------|--------|
| **Pro** | 29€ | 19€ | 19€ | **49€** (-18€) |
| **Expert** | 79€ | 49€ | 49€ | **129€** (-48€) |

---

## 5. 🎨 Expérience Utilisateur

### 5.1 Dashboard E-Commerce

```
┌─────────────────────────────────────────────────────────────────┐
│  Quelyos E-Commerce                        Aujourd'hui: 15 juin │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 Résumé du jour                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 12       │ │ 1 840 €  │ │ 3        │ │ 156 €    │           │
│  │ Commandes│ │ CA Jour  │ │ En attente│ │ P. Moyen │           │
│  │ +3 vs hier│ │ +22%     │ │ ⚠️       │ │ +5€      │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│  📥 Nouvelles commandes (3)              [Voir tout →]          │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ 📱 WhatsApp • Marie L. • 2x Gâteau fraise • 45€     │      │
│  │    il y a 5 min                        [Confirmer ▶]│      │
│  ├──────────────────────────────────────────────────────┤      │
│  │ 📸 Instagram • @julie_paris • Bouquet roses • 65€   │      │
│  │    il y a 12 min                       [Confirmer ▶]│      │
│  ├──────────────────────────────────────────────────────┤      │
│  │ 📧 Email • SAS Dupont • Devis 50 parts • 890€       │      │
│  │    il y a 1h                           [Voir devis] │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
│  📋 En préparation (5)                                          │
│  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░  50% complétées                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Capture WhatsApp (Mock)

```
┌─────────────────────────────────────────┐
│  💬 WhatsApp Business                   │
│  Nouveau message de Marie L.            │
├─────────────────────────────────────────┤
│                                         │
│  Marie L. : "Bonjour, je voudrais       │
│  commander 2 gâteaux aux fraises        │
│  pour samedi svp"                       │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  🤖 Détection IA:                       │
│  ┌─────────────────────────────────┐   │
│  │ Produit: Gâteau fraises         │   │
│  │ Quantité: 2                     │   │
│  │ Date: Samedi 17 juin            │   │
│  │ Prix unitaire: 22,50€           │   │
│  │ Total: 45,00€                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Créer commande] [Modifier] [Ignorer]  │
│                                         │
└─────────────────────────────────────────┘
```

### 5.3 Fiche Commande

```
┌─────────────────────────────────────────────────────────────────┐
│  Commande #2024-0156                           Créée il y a 2h  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Canal: 📱 WhatsApp        Statut: 🟡 En préparation           │
│                                                                 │
│  👤 Client                                                      │
│  Marie Lefebvre                                                 │
│  +33 6 12 34 56 78                                              │
│  5 commandes précédentes • Panier moyen: 52€                    │
│                                                                 │
│  📦 Articles                                                    │
│  ┌────────────────────────────────────────────────────┐        │
│  │ 2x Gâteau fraises (8 parts)          2 × 22,50€   │        │
│  │ 1x Macarons assortis (12 pcs)        1 × 18,00€   │        │
│  ├────────────────────────────────────────────────────┤        │
│  │ Sous-total                                63,00€   │        │
│  │ Livraison                                  5,00€   │        │
│  │ TOTAL                                     68,00€   │        │
│  └────────────────────────────────────────────────────┘        │
│                                                                 │
│  📅 Livraison: Samedi 17 juin 14h00                            │
│  📍 23 rue des Lilas, 75011 Paris                               │
│                                                                 │
│  💳 Paiement: ⏳ En attente                                     │
│  [Envoyer lien de paiement 💳]                                  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [← Précédente]  [Modifier] [Annuler] [Marquer prête]  [Suivante →] │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 🛣️ Roadmap MVP

### Phase 1 : Socle (Q1 2026) — 8 semaines

**Épic 1 : Authentification & Multi-tenant**
- US1.1 : Inscription/connexion (SSO Quelyos)
- US1.2 : Création entreprise + paramètres
- US1.3 : Gestion équipe & rôles

**Épic 2 : Catalogue Produits**
- US2.1 : CRUD produits/services
- US2.2 : Variantes & options
- US2.3 : Photos produits
- US2.4 : Prix & promotions

**Épic 3 : Carnet de Commandes**
- US3.1 : Création commande manuelle
- US3.2 : Liste commandes + filtres
- US3.3 : Statuts & workflow
- US3.4 : Vue Kanban

### Phase 2 : Canaux (Q2 2026) — 8 semaines

**Épic 4 : WhatsApp Business**
- US4.1 : Connexion compte WhatsApp Business
- US4.2 : Réception messages temps réel
- US4.3 : Détection intention d'achat (IA)
- US4.4 : Création commande depuis message

**Épic 5 : Instagram & Facebook**
- US5.1 : OAuth Meta (réutilisation Marketing)
- US5.2 : Sync DMs Instagram
- US5.3 : Sync Messenger Facebook
- US5.4 : Détection commandes cross-canal

**Épic 6 : Clients & CRM**
- US6.1 : Fiche client auto-générée
- US6.2 : Historique commandes
- US6.3 : Segments automatiques
- US6.4 : Export Marketing

### Phase 3 : Paiements & Finance (Q3 2026) — 6 semaines

**Épic 7 : Paiements**
- US7.1 : Intégration Stripe
- US7.2 : Liens de paiement
- US7.3 : QR Code paiement
- US7.4 : Statut auto sur commande

**Épic 8 : Facturation**
- US8.1 : Génération factures auto
- US8.2 : Templates personnalisables
- US8.3 : Export PDF + envoi
- US8.4 : Sync Quelyos Finance

**Épic 9 : Stock (Optionnel)**
- US9.1 : Mouvements automatiques
- US9.2 : Alertes seuils
- US9.3 : Inventaire simplifié

---

## 7. 🏗️ Architecture Technique

### Stack

| Layer | Technologie | Justification |
|-------|-------------|---------------|
| Frontend | Next.js 16 | Cohérence suite, SSR, App Router |
| Backend | Node.js + Express | Réutilisation socle Finance |
| Database | PostgreSQL + Prisma | Multi-tenant, schéma riche |
| Realtime | Socket.io | Messages temps réel |
| Queue | BullMQ + Redis | Traitement async canaux |
| AI | OpenAI GPT-4 | Extraction intentions/entités |
| Paiements | Stripe | Standard EU |
| WhatsApp | Meta Cloud API | Official partner |

### Schéma DB (Extrait)

```prisma
model Order {
  id            String      @id @default(uuid())
  orderNumber   String      @unique // ORD-2024-0001
  companyId     String
  company       Company     @relation(fields: [companyId], references: [id])
  customerId    String
  customer      Customer    @relation(fields: [customerId], references: [id])
  
  // Canal d'origine
  channel       Channel     // WHATSAPP, INSTAGRAM, FACEBOOK, EMAIL, MANUAL
  channelRef    String?     // ID message original
  
  // Statut workflow
  status        OrderStatus // PENDING, CONFIRMED, PREPARING, READY, DELIVERED, PAID, CANCELLED
  
  // Montants
  subtotal      Decimal
  shipping      Decimal     @default(0)
  discount      Decimal     @default(0)
  total         Decimal
  
  // Dates
  orderedAt     DateTime    @default(now())
  confirmedAt   DateTime?
  deliveryDate  DateTime?
  paidAt        DateTime?
  
  // Relations
  items         OrderItem[]
  payments      Payment[]
  invoices      Invoice[]
  
  // Sync Finance
  financeTransactionId String?
  
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model Customer {
  id            String      @id @default(uuid())
  companyId     String
  company       Company     @relation(fields: [companyId], references: [id])
  
  // Infos
  name          String
  phone         String?
  email         String?
  
  // Canaux connectés
  whatsappId    String?
  instagramId   String?
  facebookId    String?
  
  // Scoring
  totalOrders   Int         @default(0)
  totalSpent    Decimal     @default(0)
  averageBasket Decimal     @default(0)
  lastOrderAt   DateTime?
  segment       CustomerSegment @default(NEW)
  
  // Relations
  orders        Order[]
  conversations Conversation[]
  
  // Sync Marketing
  marketingContactId String?
  
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model Product {
  id            String      @id @default(uuid())
  companyId     String
  company       Company     @relation(fields: [companyId], references: [id])
  
  name          String
  description   String?
  price         Decimal
  sku           String?
  
  // Stock
  trackStock    Boolean     @default(false)
  stockQuantity Int         @default(0)
  lowStockAlert Int         @default(5)
  
  // Images
  images        String[]
  
  // Variantes
  variants      ProductVariant[]
  
  // Relations
  orderItems    OrderItem[]
  
  isActive      Boolean     @default(true)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

enum Channel {
  WHATSAPP
  INSTAGRAM
  FACEBOOK
  TIKTOK
  EMAIL
  PHONE
  MANUAL
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  READY
  DELIVERED
  PAID
  CANCELLED
}

enum CustomerSegment {
  NEW
  OCCASIONAL
  REGULAR
  LOYAL
  VIP
  DORMANT
  CHURNED
}
```

---

## 8. 📊 Métriques de Succès

### MVP (6 mois)

| Métrique | Cible | Mesure |
|----------|-------|--------|
| Utilisateurs pilotes | 30 | DB |
| Commandes traitées | 1 000 | DB |
| Volume transactionné | 50 000€ | Stripe |
| NPS | > 40 | Survey |
| Activation (1ère commande) | 70% | Analytics |
| Rétention M1 | 60% | Cohortes |

### Scale (12 mois)

| Métrique | Cible |
|----------|-------|
| Clients payants | 200 |
| ARR | 30 000€ |
| Commandes/mois | 5 000 |
| Volume transactionné | 500 000€ |

---

## 9. 🎯 Différenciateurs Clés

### vs Shopify / WooCommerce
| Critère | Eux | Nous |
|---------|-----|------|
| Nécessite site web | ✅ Oui | ❌ Non |
| Capture WhatsApp native | ❌ Non | ✅ Oui |
| Sync compta TPE | ❌ Non | ✅ Quelyos Finance |
| Complexité | 🔴 Élevée | 🟢 Simple |
| Prix | 29-299€/mois | 19-49€/mois |

### vs Notion / Excel
| Critère | Eux | Nous |
|---------|-----|------|
| Capture automatique | ❌ Manuel | ✅ Auto |
| Facturation intégrée | ❌ Non | ✅ Oui |
| Paiements | ❌ Non | ✅ Oui |
| Sync trésorerie | ❌ Non | ✅ Oui |

### vs Odoo / ERPs
| Critère | Eux | Nous |
|---------|-----|------|
| Setup | 🔴 Semaines | 🟢 Minutes |
| Prix | 🔴 100€+/mois | 🟢 19€/mois |
| Mobile-first | ❌ Non | ✅ Oui |
| Canaux sociaux | ❌ Non | ✅ Natif |

---

## 10. 🚀 Go-To-Market

### Cibles Initiales (France)

1. **Artisans food** : Pâtissiers, traiteurs, food trucks
2. **Fleuristes** : Commandes événementielles
3. **Créateurs Etsy** : Sans site propre
4. **Commerçants quartier** : Épiceries, caves

### Canaux d'Acquisition

1. **Content Marketing** : SEO "gérer commandes WhatsApp"
2. **Partenariats** : CCI, chambres des métiers
3. **Cross-sell** : Base clients Finance + Marketing
4. **Influence** : Témoignages artisans micro-influenceurs
5. **Ads** : Meta ciblé sur profils TPE

### Pricing

| Plan | Prix | Inclus |
|------|------|--------|
| **Starter** | 0€ | 20 commandes/mois, 1 canal |
| **Pro** | 19€/mois | Illimité, tous canaux, facturation |
| **Expert** | 49€/mois | + Stock, API, multi-users |

---

## 11. 📝 Prochaines Étapes

1. ✅ **Validation vision** avec le client
2. ⏳ **Ajouter page Coming Soon** sur quelyos.com
3. ⏳ **Landing page E-Commerce** pour recueillir emails waitlist
4. ⏳ **Interviews utilisateurs** (5-10 artisans)
5. ⏳ **MVP specs détaillées** (user stories Given/When/Then)
6. ⏳ **Démarrage développement** Q1 2026

---

**Document créé le :** 15 janvier 2025  
**Auteur :** Agent Orchestrateur Quelyos  
**Version :** 1.0  
**Status :** Vision initiale - En attente validation client
