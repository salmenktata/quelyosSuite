# Guide pratique — Super Admin Client

Ce guide explique **l’usage fonctionnel** et **le démarrage rapide** de `super-admin-client/`.  
Public visé : informaticien non‑expert souhaitant un aperçu clair et opérationnel.

---

## 1) Vue d’ensemble

Le super‑admin est une **interface SaaS** pour piloter la plateforme (tenants, abonnements, facturation, monitoring).

```
Navigateur ──> super-admin-client (5176) ──> /api/super-admin/* ──> odoo-backend (8069)
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
cd super-admin-client
pnpm install
```

---

## 4) Configuration (variables d’environnement)

Le fichier modèle : `super-admin-client/.env.example` (ou config dans `src/lib/config.ts`).

En dev (exemple) :

```
VITE_BACKEND_URL=http://localhost:8069
```

**À retenir :**
- `VITE_BACKEND_URL` → base API Odoo (super‑admin endpoints).

---

## 5) Lancer en développement

```bash
cd super-admin-client
pnpm dev
```

Accès : `http://localhost:5176`

> Le proxy Vite redirige `/api` vers `http://localhost:8069` (voir `super-admin-client/vite.config.ts`).

---

## 6) Pages principales

Les routes principales sont documentées dans `super-admin-client/README.md` :

- **Dashboard** (`/dashboard`) : KPIs globaux, MRR/ARR, tendances
- **Tenants** (`/tenants`) : liste, filtre, détails
- **Abonnements** (`/subscriptions`) : statuts, MRR breakdown, churn
- **Facturation** (`/billing`) : factures, transactions, résumés
- **Monitoring** (`/monitoring`) : provisioning jobs, health system

---

## 7) Endpoints API utilisés

Les endpoints sont dans :
`odoo-backend/addons/quelyos_api/controllers/super_admin.py`

Exemples :
- `GET /api/super-admin/dashboard/metrics`
- `GET /api/super-admin/tenants`
- `GET /api/super-admin/subscriptions`
- `GET /api/super-admin/invoices`
- `GET /api/super-admin/system/health`

---

## 8) Dépannage rapide

**L’interface ne charge pas**
1. Vérifier Odoo (`http://localhost:8069`)
2. Vérifier le port 5176 : `lsof -i:5176`
3. Vérifier `VITE_BACKEND_URL`

**API super‑admin en erreur**
- Vérifier que le compte Odoo a les droits **super‑admin** (groupe `base.group_system`)

---

## 9) Fichiers utiles

- `super-admin-client/vite.config.ts` → port + proxy
- `super-admin-client/src/lib/config.ts` → config API
- `odoo-backend/addons/quelyos_api/controllers/super_admin.py` → endpoints

---

**Guide pratique — version 1.0 (basée sur le code du repo)**  
