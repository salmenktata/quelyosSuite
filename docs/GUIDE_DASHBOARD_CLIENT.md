# Guide pratique — Dashboard Client (Backoffice)

Ce guide présente **l’usage fonctionnel** et **le démarrage rapide** du backoffice `dashboard-client/`.  
Public visé : informaticien non‑expert qui souhaite comprendre l’outil et l’utiliser efficacement.

---

## 1) Vue d’ensemble (simplifiée)

Le backoffice est une application **React + Vite** qui consomme l’API d’Odoo.

```
Navigateur ──> dashboard-client (5175) ──> /api/* ──> odoo-backend (8069) ──> PostgreSQL/Redis
```

---

## 2) Prérequis

- **Node.js 20+**
- **pnpm**
- **Odoo démarré** (`odoo-backend/` via Docker)

---

## 3) Installation

```bash
pnpm install
```

Ou localement dans l’app :

```bash
cd dashboard-client
pnpm install
```

---

## 4) Configuration (variables d’environnement)

Le fichier modèle est : `dashboard-client/.env.example`.

Exemple minimal en dev (`dashboard-client/.env.local`) :

```
VITE_API_URL=http://localhost:8069
VITE_BACKEND_URL=http://localhost:8069
VITE_SHOP_URL=http://localhost:3001
```

**À retenir :**
- `VITE_API_URL` → base API Odoo (requêtes JSON/API).
- `VITE_BACKEND_URL` → uploads/images/ressources.
- `VITE_SHOP_URL` → lien vers la boutique e‑commerce.

---

## 5) Lancer en développement

```bash
cd dashboard-client
pnpm dev
```

Accès : `http://localhost:5175`

> Le proxy Vite redirige `/api` vers `http://localhost:8069` (voir `dashboard-client/vite.config.ts`).

---

## 6) Build & Preview

```bash
cd dashboard-client
pnpm build
pnpm preview
```

---

## 7) Modules fonctionnels (ce que vous voyez dans le menu)

Le menu est défini dans `dashboard-client/src/config/modules.ts`.  
Principaux modules :

- **Accueil** : tableau de bord + analytics
- **Finance** : comptes, transactions, budgets, reporting, alertes
- **Boutique** : commandes, catalogue, promotions, contenu, thèmes
- **Stock** : inventaire, mouvements, entrepôts, réapprovisionnement
- **CRM** : pipeline, clients, factures, paiements
- **Marketing** : campagnes email/SMS, listes de contacts, paramètres
- **RH** : employés, présences, congés, contrats
- **POS** : caisse, sessions, rapports, paramètres

---

## 8) Opérations courantes (usage fonctionnel)

### Catalogue & ventes
- **Produits** : créer, modifier, images, variantes
- **Catégories / Collections** : organiser le catalogue
- **Commandes** : suivi, états, détails clients

### Promotions & contenu
- **Codes promo / Ventes flash / Bannières**
- **Hero Slides / Messages promo / Badges confiance**
- **Pages statiques / Menus / Blog**

### Stock & logistique
- **Inventaire** : niveaux, mouvements, transferts
- **Entrepôts** + **Emplacements** + **Règles de réappro**

### Finance
- **Budgets / Trésorerie / Rapports**
- **Fournisseurs / Plan comptable / Alertes**

---

## 9) Dépannage rapide

**Le backoffice ne démarre pas**
1. Vérifier Odoo (`http://localhost:8069`)
2. Vérifier dépendances : `pnpm install`
3. Vérifier le port 5175 : `lsof -i:5175`

**Les appels API échouent**
- Vérifier `VITE_API_URL`
- Vérifier le proxy dans `dashboard-client/vite.config.ts`

**Images / uploads cassés**
- Vérifier `VITE_BACKEND_URL`

---

## 10) Fichiers utiles

- `dashboard-client/src/config/modules.ts` → menu et modules
- `dashboard-client/vite.config.ts` → port + proxy API
- `dashboard-client/.env.example` → variables d’environnement
- `dashboard-client/src/lib/api.ts` → client API côté front
- `dashboard-client/src/contexts/TenantContext.tsx` → contexte tenant

---

## 11) À retenir

Le dashboard est une **interface fonctionnelle** qui pilote Odoo.  
Si un écran ne répond pas, **la première vérification est toujours Odoo**.

---

**Guide pratique — version 1.0 (basée sur le code du repo)**  
